"use client";
import Link,{type LinkProps} from "next/link";
import {useRouter} from "next/navigation";
import type {MouseEvent,ReactNode} from "react";
export function TransitionLink({children,href,...props}:{children:ReactNode;href:LinkProps["href"]}&Omit<React.ComponentProps<typeof Link>,"href"|"children">){
 const router=useRouter();
 const onClick=(e:MouseEvent<HTMLAnchorElement>)=>{props.onClick?.(e);if(e.defaultPrevented||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey||e.button!==0)return;e.preventDefault();const go=()=>router.push(String(href));const d=document as Document&{startViewTransition?: (cb:()=>void)=>void};d.startViewTransition?d.startViewTransition(go):go();};
 return <Link href={href} {...props} onClick={onClick}>{children}</Link>;
}