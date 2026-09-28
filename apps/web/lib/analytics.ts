export type AnalyticsProperties=Record<string,string|number|boolean|undefined>;

export function trackEvent(name:string,properties:AnalyticsProperties={}){
  if(typeof window==="undefined"||!process.env.NEXT_PUBLIC_POSTHOG_KEY)return;
  void import("posthog-js").then(({default:posthog})=>posthog.capture(name,properties));
}
