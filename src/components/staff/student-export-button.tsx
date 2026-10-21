"use client";
import { useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslate } from "@/components/providers/language-provider";
export function StudentExportButton({streamId}:{streamId?:string}){
 const t=useTranslate(),[busy,setBusy]=useState(false),[error,setError]=useState("");
 async function download(){
  if(busy)return;setBusy(true);setError("");
  try{
   const response=await fetch(`/api/students/export${streamId?`?class=${encodeURIComponent(streamId)}`:""}`,{cache:"no-store",credentials:"same-origin"});
   if(!response.ok || !response.headers.get("Content-Type")?.includes("application/pdf"))throw Error("Download failed");
   const blob=await response.blob(),url=URL.createObjectURL(blob),link=document.createElement("a");
   link.href=url;link.download=`DarasaX-${(streamId??"all-students").replace(/[^A-Za-z0-9_-]/g,"_")}-students.pdf`;document.body.appendChild(link);link.click();link.remove();
   setTimeout(()=>URL.revokeObjectURL(url),15000);
  }catch{setError("Could not download student details. Please try again.");}
  finally{setBusy(false);}
 }
 return <div className="space-y-1"><Button size="sm" variant="outline" disabled={busy} onClick={()=>void download()}><Download className="h-4 w-4" />{t(busy?"Downloading...":"Download students (PDF)")}</Button>{error&&<p role="alert" className="max-w-xs text-xs text-danger">{t(error)}</p>}</div>;
}
