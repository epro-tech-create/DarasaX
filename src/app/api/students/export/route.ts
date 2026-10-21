import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStaffProfile } from "@/lib/auth/staff-profile";
import { studentDirectoryRows } from "@/lib/student-directory";
import { studentDetailsPdf } from "@/lib/student-pdf";
import { adminEmailVerified } from "@/lib/auth/admin-security";
export const runtime="nodejs";
export const dynamic="force-dynamic";
const fail=(error:string,status:number)=>NextResponse.json({error},{status,headers:{"Cache-Control":"private, no-store"}});
export async function GET(request:Request){
 try {
  const client=await createClient();
  const {data:{user},error:authError}=await client.auth.getUser();
  if(authError || !user)return fail("Sign in to download student details.",401);
  const staff=await getStaffProfile(client,user.id);
  if(staff?.status!=="active" || !["admin","class_rep","lecturer"].includes(staff.role))return fail("Active staff access required.",403);
  if(staff.role==="admin" && !await adminEmailVerified(client))return fail("Administrator email verification required.",403);
  const requested=new URL(request.url).searchParams.get("class");
  if(requested && !/^[A-Za-z0-9_-]{1,100}$/.test(requested))return fail("Invalid class.",400);
  const allowed=staff.role==="class_rep" ? (staff.stream_id?[staff.stream_id]:[]) : (staff.stream_ids?.length?staff.stream_ids:staff.stream_id?[staff.stream_id]:[]);
  if(staff.role!=="admin" && (allowed.length===0 || (requested && !allowed.includes(requested))))return fail("You cannot export this class.",403);
  const {data,error}=await client.rpc("list_staff_students");
  if(error)throw error;
  // The RPC enforces scope; filter again so URL parameters can only narrow it.
  const rows=studentDirectoryRows(data).filter(row=>(staff.role==="admin" || allowed.includes(row.stream_id)) && (!requested || row.stream_id===requested));
  const name=(requested??(staff.role==="class_rep"?staff.stream_id:"all-students")??"students").replace(/[^A-Za-z0-9_-]/g,"_");
  const pdf=await studentDetailsPdf(rows,requested??(staff.role==="class_rep"?staff.stream_id:"All assigned classes")??"Students");
  return new NextResponse(new Uint8Array(pdf),{headers:{"Content-Type":"application/pdf","Content-Disposition":`attachment; filename="DarasaX-${name}-students.pdf"`,"Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff"}});
 }catch{return fail("Could not download student details. Please try again.",500);}
}
