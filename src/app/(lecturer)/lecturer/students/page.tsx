"use client";
import { useTranslate } from "@/components/providers/language-provider";
import { StudentExportButton } from "@/components/staff/student-export-button";
import { PageHeader } from "@/components/layout/page-header";
import { StaffSection } from "@/components/staff/staff-ui";
import { useStaffSession } from "@/lib/staff-auth";
import { useActiveLecturerStream } from "@/lib/lecturer-context";
import { useAdminPeopleStore } from "@/lib/admin-people-store";
export default function LecturerStudentsPage(){
 const t=useTranslate(),{session}=useStaffSession();
 const {activeStreamId}=useActiveLecturerStream(session?.streamIds??[]);
 const stream=activeStreamId && session?.streamIds.includes(activeStreamId) ? activeStreamId : session?.streamIds[0];
 const {students,ready,error}=useAdminPeopleStore({rosterOnly:true});
 const rows=students.filter(student=>student.streamId===stream);
 return <div className="space-y-5"><PageHeader title={t("Students")} description={t("Student details for your assigned classes.")} actions={<StudentExportButton streamId={stream} />} />
  {error&&<p role="alert" className="text-sm text-danger">{t(error)}</p>}
  <StaffSection title={stream??t("Students")} description={t(`${rows.length} students`)}>
   <div className="overflow-x-auto"><table className="w-full min-w-[640px] text-left text-xs"><thead><tr className="border-b border-border text-muted-foreground">
    {["Student","Registration number","Class","Year"].map(label=><th key={label} className="pb-3 pr-4 font-medium">{t(label)}</th>)}
   </tr></thead><tbody>{rows.map(student=><tr key={student.id} className="border-b border-border/60 last:border-0">
    <td className="py-3 pr-4"><p className="font-semibold">{student.name}</p><p className="text-muted-foreground">{student.email}</p></td>
    <td className="py-3 pr-4 font-mono">{student.registrationNumber||t("Not provided")}</td><td className="py-3 pr-4">{student.streamId}</td><td className="py-3 pr-4">{student.year}</td>
   </tr>)}</tbody></table></div>
   {!ready&&<p className="py-4 text-sm text-muted-foreground">{t("Loading...")}</p>}
   {ready&&!error&&!rows.length&&<p className="py-4 text-sm text-muted-foreground">{t("No students in this class yet.")}</p>}
  </StaffSection></div>;
}
