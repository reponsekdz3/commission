import type { Money, PaymentStatus } from "@imizi/types";
import { createHmac, randomUUID } from "crypto";

export interface PaymentChargeRequest {
  amount: Money;
  msisdn?: string;
  customerEmail?: string;
  customerName?: string;
  redirectUrl?: string;
  paymentOptions?: string;
  idempotencyKey: string;
  internalReference: string;
  description: string;
  metadata: Record<string, string>;
}

export interface ProviderChargeResult {
  provider: string;
  providerReference: string;
  status: PaymentStatus;
  checkoutUrl?: string;
  raw?: Record<string, unknown>;
}

export interface PaymentProvider {
  readonly name: string;
  charge(request: PaymentChargeRequest): Promise<ProviderChargeResult>;
  verifyWebhook(headers: Record<string, string | string[] | undefined>, rawBody: string): boolean;
  parseWebhook(rawBody: string): { providerReference: string; status: PaymentStatus };
  getStatus?(providerReference: string): Promise<PaymentStatus>;
  refund?(providerReference:string,amountMinor:number,currency:string,reason:string):Promise<{providerReference:string}>;
}

function normalizeMsisdn(value:string) {
  const digits=value.replace(/\D/g,"");
  if(digits.startsWith("250"))return digits;
  if(digits.startsWith("0"))return "250"+digits.slice(1);
  return digits;
}

export class MtnMoMoProvider implements PaymentProvider {
  readonly name="MTN_MOMO";
  constructor(private readonly config:{
    baseUrl:string;targetEnvironment:string;subscriptionKey?:string;apiUser?:string;apiKey?:string;callbackUrl?:string;
  }) {}

  private async accessToken() {
    if(!this.config.subscriptionKey||!this.config.apiUser||!this.config.apiKey) {
      throw new Error("MTN MoMo credentials are not configured");
    }
    const auth=Buffer.from(this.config.apiUser+":"+this.config.apiKey).toString("base64");
    const response=await fetch(this.config.baseUrl+"/collection/token/",{
      method:"POST",
      headers:{
        Authorization:"Basic "+auth,
        "Ocp-Apim-Subscription-Key":this.config.subscriptionKey,
        "Content-Type":"application/x-www-form-urlencoded",
        "X-Target-Environment":this.config.targetEnvironment,
      },
      body:"",
    });
    if(!response.ok)throw new Error("MTN access token request failed: "+response.status);
    const body=await response.json() as {access_token?:string};
    if(!body.access_token)throw new Error("MTN access token missing");
    return body.access_token;
  }

  async charge(request:PaymentChargeRequest):Promise<ProviderChargeResult>{
    if(!request.msisdn)throw new Error("MTN MoMo requires MSISDN");
    const reference=randomUUID();
    const token=await this.accessToken();
    const payload={
      amount:String(request.amount.amountMinor),
      currency:request.amount.currency,
      externalId:request.internalReference,
      payer:{partyIdType:"MSISDN",partyId:normalizeMsisdn(request.msisdn)},
      payerMessage:request.description.slice(0,160),
      payeeNote:request.description.slice(0,160),
    };
    const headers:Record<string,string>={
      Authorization:"Bearer "+token,
      "Ocp-Apim-Subscription-Key":this.config.subscriptionKey!,
      "Content-Type":"application/json",
      "X-Target-Environment":this.config.targetEnvironment,
      "X-Reference-Id":reference,
    };
    if(this.config.callbackUrl)headers["X-Callback-Url"]=this.config.callbackUrl;
    const response=await fetch(this.config.baseUrl+"/collection/v1_0/requesttopay",{
      method:"POST",headers,body:JSON.stringify(payload),
    });
    if(response.status!==202){
      const raw=await response.text();
      throw new Error("MTN RequestToPay failed: "+response.status+" "+raw.slice(0,500));
    }
    return {provider:this.name,providerReference:reference,status:"PENDING_PROVIDER",raw:payload};
  }

  async getStatus(providerReference:string):Promise<PaymentStatus>{
    const token=await this.accessToken();
    const response=await fetch(this.config.baseUrl+"/collection/v1_0/requesttopay/"+encodeURIComponent(providerReference),{
      headers:{
        Authorization:"Bearer "+token,
        "Ocp-Apim-Subscription-Key":this.config.subscriptionKey!,
        "X-Target-Environment":this.config.targetEnvironment,
      },
    });
    if(!response.ok)throw new Error("MTN status request failed: "+response.status);
    const body=await response.json() as {status?:string};
    const status=(body.status ?? "PENDING").toUpperCase();
    if(status==="SUCCESSFUL")return "SUCCEEDED";
    if(status==="FAILED")return "FAILED";
    return "PENDING_PROVIDER";
  }

  verifyWebhook(headers:Record<string,string|string[]|undefined>,rawBody:string){
    void rawBody;
    const configured=process.env.MTN_MOMO_CALLBACK_SECRET;
    if(!configured)return false;
    const value=headers["x-callback-secret"];
    return value===configured;
  }

  parseWebhook(rawBody:string){
    const body=JSON.parse(rawBody) as {referenceId?:string;status?:string;reference?:string;financialTransactionId?:string};
    const providerReference=body.referenceId ?? body.reference ?? body.financialTransactionId ?? "";
    const status=(body.status ?? "").toUpperCase();
    return {providerReference,status:status==="SUCCESSFUL"?"SUCCEEDED":status==="FAILED"?"FAILED":"PENDING_PROVIDER" as PaymentStatus};
  }
}

export class FlutterwaveProvider implements PaymentProvider {
  readonly name="FLUTTERWAVE";
  constructor(private readonly secret?:string, private readonly defaultPaymentOptions?:string) {}
  private headers(){
    if(!this.secret)throw new Error("Flutterwave secret key is not configured");
    return {"Authorization":"Bearer "+this.secret,"Content-Type":"application/json"};
  }
  async charge(request:PaymentChargeRequest):Promise<ProviderChargeResult>{
    const txRef="IMZ_"+request.internalReference+"_"+randomUUID().slice(0,8);
    const response=await fetch("https://api.flutterwave.com/v3/payments",{
      method:"POST",
      headers:this.headers(),
      body:JSON.stringify({
        tx_ref:txRef,
        amount:String(request.amount.amountMinor),
        currency:request.amount.currency,
        redirect_url:request.redirectUrl,
        customer:{email:request.customerEmail||"customer@imizi.rw",name:request.customerName||"Imizi customer",phone_number:request.msisdn},
        customizations:{title:"Imizi payment",description:request.description},
        payment_options:request.paymentOptions||this.defaultPaymentOptions,
        meta:request.metadata,
      }),
    });
    const body=await response.json() as {status?:string;message?:string;data?:{link?:string;tx_ref?:string}};
    if(!response.ok||body.status!=="success"||!body.data?.link)throw new Error("Flutterwave checkout failed: "+(body.message||response.status));
    return {provider:this.name,providerReference:body.data.tx_ref||txRef,status:"PENDING_PROVIDER",checkoutUrl:body.data.link,raw:body as Record<string,unknown>};
  }
  async getStatus(providerReference:string):Promise<PaymentStatus>{
    const response=await fetch("https://api.flutterwave.com/v3/transactions/"+encodeURIComponent(providerReference)+"/verify",{headers:this.headers()});
    const body=await response.json() as {status?:string;data?:{status?:string}};
    if(!response.ok)throw new Error("Flutterwave verify failed: "+response.status);
    const state=(body.data?.status||body.status||"").toLowerCase();
    return state==="successful"?"SUCCEEDED":state==="failed"||state==="cancelled"?"FAILED":"PENDING_PROVIDER";
  }
  async refund(providerReference:string,amountMinor:number,currency:string,reason:string){
    const response=await fetch("https://api.flutterwave.com/v3/transactions/"+encodeURIComponent(providerReference)+"/refund",{method:"POST",headers:this.headers(),body:JSON.stringify({amount:amountMinor,currency,comments:reason})});
    const body=await response.json() as {status?:string;message?:string;data?:{id?:string}};
    if(!response.ok||body.status!=="success")throw new Error("Flutterwave refund failed: "+(body.message||response.status));
    return {providerReference:String(body.data?.id||providerReference)};
  }
  verifyWebhook(headers:Record<string,string|string[]|undefined>,rawBody:string){
    if(!this.secret)return false;
    const signature=headers["flutterwave-signature"];
    if(typeof signature==="string"){
      const digest=createHmac("sha256",this.secret).update(rawBody).digest("hex");
      if(digest===signature)return true;
    }
    const legacy=headers["verif-hash"];
    return typeof legacy==="string"&&legacy===this.secret;
  }
  parseWebhook(rawBody:string){
    const body=JSON.parse(rawBody) as {data?:{tx_ref?:string;status?:string;id?:number}};
    return {providerReference:body.data?.tx_ref||String(body.data?.id||""),status:body.data?.status==="successful"?"SUCCEEDED":"FAILED" as PaymentStatus};
  }
}

export class CardProvider implements PaymentProvider {
  readonly name="CARD";
  constructor(private readonly flutterwave:FlutterwaveProvider){}
  charge(request:PaymentChargeRequest){return this.flutterwave.charge({...request,paymentOptions:"card"});}
  verifyWebhook(headers:Record<string,string|string[]|undefined>,rawBody:string){return this.flutterwave.verifyWebhook(headers,rawBody);}
  parseWebhook(rawBody:string){return this.flutterwave.parseWebhook(rawBody);}
  getStatus(providerReference:string){return this.flutterwave.getStatus?.(providerReference);}
  refund(providerReference:string,amountMinor:number,currency:string,reason:string){return this.flutterwave.refund(providerReference,amountMinor,currency,reason);}
}

export class PaymentGateway {
  constructor(private readonly providers:Map<string,PaymentProvider>) {}
  resolve(name:string):PaymentProvider {
    const provider=this.providers.get(name);
    if(!provider)throw new Error("Unknown payment provider "+name);
    return provider;
  }
}

export function createPaymentGateway(env:Record<string,string|undefined>):PaymentGateway {
  return new PaymentGateway(new Map<string, PaymentProvider>([
    ["MTN_MOMO",new MtnMoMoProvider({
      baseUrl:env.MTN_MOMO_BASE_URL ?? "https://sandbox.momodeveloper.mtn.com",
      targetEnvironment:env.MTN_MOMO_TARGET_ENVIRONMENT ?? "sandbox",
      subscriptionKey:env.MTN_MOMO_SUBSCRIPTION_KEY,
      apiUser:env.MTN_MOMO_API_USER,
      apiKey:env.MTN_MOMO_API_KEY,
      callbackUrl:env.MTN_MOMO_CALLBACK_URL,
    })],
    ["FLUTTERWAVE",new FlutterwaveProvider(env.FLUTTERWAVE_SECRET_KEY,env.FLUTTERWAVE_PAYMENT_OPTIONS ?? "card,mobilemoneyrwanda")],
    ["CARD",new CardProvider(new FlutterwaveProvider(env.FLUTTERWAVE_SECRET_KEY,"card"))],
  ]));
}
