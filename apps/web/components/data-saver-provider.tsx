"use client";
import {useEffect} from "react";
export function DataSaverProvider(){useEffect(()=>{const connection=(navigator as any).connection as any;const update=()=>document.documentElement.toggleAttribute("data-data-saver",Boolean(connection?.saveData));update();connection?.addEventListener?.("change",update);return()=>connection?.removeEventListener?.("change",update)},[]);return null;}
