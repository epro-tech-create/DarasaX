"use client";
import { createContext } from "react";
import type { StaffSession } from "@/lib/staff-auth";
export const StaffSessionContext = createContext<{ session: StaffSession | null; ready: boolean; refresh: () => Promise<void> } | null>(null);
