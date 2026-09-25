import type { Money, PaymentStatus } from "@imizi/types";
import { randomUUID } from "crypto";

export interface PaymentChargeRequest {
  amount: Money;
  msisdn?: string;
  customerEmail?: string;
  idempotencyKey: string;
  internalReference: string;
  description: string;
  metadata: Record<string, string>;
}

export interface ProviderChargeResult {
  provider: string;
  providerReference: string;
  status: PaymentStatus;
  raw?: Record<string, unknown>;
}

export interface PaymentProvider {
  readonly name: string;
  charge(request: PaymentChargeRequest): Promise<ProviderChargeResult>;
  verifyWebhook(headers: Record<string, string | string[] | undefined>, rawBody: string): boolean;
  parseWebhook(rawBody: string): { providerReference: string; status: PaymentStatus };
  getStatus?(providerReference: string): Promise<PaymentStatus>;
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
    if(!configured)return true;
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
  constructor(private readonly secret?:string) {}
  async charge():Promise<ProviderChargeResult>{
    throw new Error("Flutterwave live charge adapter is not enabled yet; use MTN MoMo for Rwanda collections");
  }
  verifyWebhook(headers:Record<string,string|string[]|undefined>){
    const hash=headers["verif-hash"];
    return Boolean(this.secret&&hash===this.secret);
  }
  parseWebhook(rawBody:string){
    const body=JSON.parse(rawBody) as {data?:{tx_ref?:string;status?:string}};
    const ok=body.data?.status==="successful";
    return {providerReference:body.data?.tx_ref ?? "",status:ok?"SUCCEEDED":"FAILED" as PaymentStatus};
  }
}

export class CardProvider implements PaymentProvider {
  readonly name="CARD";
  async charge():Promise<ProviderChargeResult>{
    throw new Error("Card provider requires a configured PCI-compliant gateway adapter");
  }
  verifyWebhook(){return false;}
  parseWebhook(){return {providerReference:"",status:"FAILED" as PaymentStatus};}
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
  return new PaymentGateway(new Map([
    ["MTN_MOMO",new MtnMoMoProvider({
      baseUrl:env.MTN_MOMO_BASE_URL ?? "https://sandbox.momodeveloper.mtn.com",
      targetEnvironment:env.MTN_MOMO_TARGET_ENVIRONMENT ?? "sandbox",
      subscriptionKey:env.MTN_MOMO_SUBSCRIPTION_KEY,
      apiUser:env.MTN_MOMO_API_USER,
      apiKey:env.MTN_MOMO_API_KEY,
      callbackUrl:env.MTN_MOMO_CALLBACK_URL,
    })],
    ["FLUTTERWAVE",new FlutterwaveProvider(env.FLUTTERWAVE_WEBHOOK_HASH)],
    ["CARD",new CardProvider()],
  ]));
}
