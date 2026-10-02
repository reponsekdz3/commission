"use client";
import Link from "next/link";
import {DropdownMenu,DropdownMenuTrigger,DropdownMenuContent,DropdownMenuItem} from "../ui";
import {signOut} from "../../lib/api";

export function UserMenu({user}:{user:{fullName?:string}|null}){
  const name=user?.fullName||"Account";
  return <DropdownMenu>
    <DropdownMenuTrigger asChild><button className="avatar" aria-label="Open user menu">{name.slice(0,1).toUpperCase()}</button></DropdownMenuTrigger>
    <DropdownMenuContent align="end">
      <DropdownMenuItem asChild><Link href="/workspace">Workspace</Link></DropdownMenuItem>
      <DropdownMenuItem asChild><Link href="/favorites">Saved</Link></DropdownMenuItem>
      <DropdownMenuItem onSelect={()=>{void signOut().finally(()=>{location.href="/"});}}>Sign out</DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
}
