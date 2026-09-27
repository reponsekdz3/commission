import type {Metadata} from "next";
import {Sora,Plus_Jakarta_Sans,JetBrains_Mono} from "next/font/google";
import "./globals.css";
import {Nav} from "../components/nav";
import {Providers} from "../components/providers";
const display=Sora({subsets:["latin"],weight:["600","700","800"],variable:"--font-display",display:"swap"});
const sans=Plus_Jakarta_Sans({subsets:["latin"],weight:["400","500","600","700"],variable:"--font-sans",display:"swap"});
const mono=JetBrains_Mono({subsets:["latin"],weight:["400","500"],variable:"--font-mono",display:"swap"});
export const metadata:Metadata={metadataBase:new URL(process.env.NEXT_PUBLIC_SITE_URL??"http://localhost:3000"),title:{default:"Imizi — Rwanda property marketplace",template:"%s · Imizi"},description:"Verified property discovery, viewings, booking, payments and property operations across Rwanda.",openGraph:{title:"Imizi — Rwanda property marketplace",description:"Discover, compare and transact on verified Rwanda property.",type:"website"}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en" suppressHydrationWarning className={`${display.variable} ${sans.variable} ${mono.variable}`}><head><script dangerouslySetInnerHTML={{__html:`try{var t=localStorage.getItem('theme');if(t==='dark'||(!t&&matchMedia('(prefers-color-scheme: dark)').matches))document.documentElement.classList.add('dark')}catch(e){}`}}/></head><body><a className="skip-link" href="#main-content">Skip to content</a><Providers><Nav/><div id="main-content">{children}</div></Providers></body></html>}