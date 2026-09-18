import { PageHeader } from "@/components/layout/page-header";
import { UploadWorkspace } from "@/components/staff/upload-workspace";
import { classRepUser } from "@/data/staff-mock";

export default function ClassRepUploadsPage() {
  return (
    <div className="space-y-5">
      <PageHeader
        title="Upload"
        description={`Files go straight to ${classRepUser.streamId} students.`}
      />
      <UploadWorkspace
        title="Share with your class"
        description="Lecture notes and slides publish into the student library in one step."
        defaultKind="notes"
        showStream={false}
        lockedStream={classRepUser.streamId}
        uploadedBy={classRepUser.name}
        role="class_rep"
      />
    </div>
  );
}
