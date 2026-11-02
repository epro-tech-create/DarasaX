"use client";
import { PageHeader } from "@/components/layout/page-header";
import { LibraryUploadButton } from "@/components/staff/library-upload-button";
import { MaterialsLibrary } from "@/components/staff/materials-library";
export default function Page() {
  return <div className="space-y-5"><PageHeader title="Class library" description="Browse class files — open, download, edit, or remove." actions={<LibraryUploadButton />} /><MaterialsLibrary title="Published for all classes" /></div>;
}
