"use client";
import { useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslate } from "@/components/providers/language-provider";
export function StudentExportButton({streamId}:{streamId?:string}){
 const t=useTranslate(),[busy,setBusy]=useState<"pdf"|"xlsx"|null>(null),[error,setError]=useState("");
 async function download(format:"pdf"|"xlsx"){
  if(busy)return;setBusy(format);setError("");
  try{
   const params=new URLSearchParams({format});if(streamId)params.set("class",streamId);
   const response=await fetch(`/api/students/export?${params}`,{cache:"no-store",credentials:"same-origin"});
   const expected=format==="pdf"?"application/pdf":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
   if(!response.ok || !response.headers.get("Content-Type")?.includes(expected))throw Error("Download failed");
   const blob=await response.blob(),url=URL.createObjectURL(blob),link=document.createElement("a");
   link.href=url;link.download=`DarasaX-${(streamId??"all-students").replace(/[^A-Za-z0-9_-]/g,"_")}-students.${format}`;document.body.appendChild(link);link.click();link.remove();
   setTimeout(()=>URL.revokeObjectURL(url),15000);
  }catch{setError("Could not download student details. Please try again.");}
  finally{setBusy(null);}
 }
 return <div className="space-y-1"><div className="flex flex-wrap gap-2"><Button size="sm" variant="outline" disabled={!!busy} onClick={()=>void download("pdf")}><Download className="h-4 w-4" />{t(busy==="pdf"?"Downloading...":"Download PDF")}</Button><Button size="sm" variant="outline" disabled={!!busy} onClick={()=>void download("xlsx")}><Download className="h-4 w-4" />{t(busy==="xlsx"?"Downloading...":"Download Excel")}</Button></div>{error&&<p role="alert" className="max-w-xs text-xs text-danger">{t(error)}</p>}</div>;
}
