"use client";
import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
export function ActivityTracker() {
  useEffect(() => {
    const record = () => {
      if (document.visibilityState === "visible")
        void createClient()
          .rpc("record_student_activity")
          .then(() => {});
    };
    record();
    const timer = setInterval(record, 30 * 60 * 1000);
    document.addEventListener("visibilitychange", record);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", record);
    };
  }, []);
  return null;
}
