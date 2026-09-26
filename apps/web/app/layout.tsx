import type {Metadata} from "next";import "./globals.css";import {Nav} from "../components/nav";
export const metadata:Metadata={title:"Imizi — Rwanda property marketplace",description:"Verified property discovery, viewings, booking, payments and property operations."};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body><Nav/>{children}</body></html>}
