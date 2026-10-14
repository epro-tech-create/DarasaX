import { requireStaff } from "@/lib/auth/require-staff";
import Workspace from "./workspace";

export default async function Layout({ children }: { children: React.ReactNode }) {
  await requireStaff("class_rep");
  return <Workspace>{children}</Workspace>;
}
