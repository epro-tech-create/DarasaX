import { Suspense } from "react";
import { JoinClass } from "@/components/auth/join-class";
export const metadata = {title:"Join your class · DarasaX",robots:{index:false,follow:false}};
export default function JoinPage() {return <Suspense><JoinClass /></Suspense>;}
