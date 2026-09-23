"use client";

import { useCallback, useEffect, useState } from "react";
import type { ClassStreamId } from "@/types";

const ACTIVE_STREAM_KEY = "darasax_lecturer_active_stream";
const ACTIVE_EVENT = "darasax:lecturer-active-stream";

export function getActiveLecturerStream(): ClassStreamId | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(ACTIVE_STREAM_KEY);
    return (raw as ClassStreamId | null) || null;
  } catch {
    return null;
  }
}

export function setActiveLecturerStream(streamId: ClassStreamId) {
  sessionStorage.setItem(ACTIVE_STREAM_KEY, streamId);
  window.dispatchEvent(new Event(ACTIVE_EVENT));
}

export function clearActiveLecturerStream() {
  try {
    sessionStorage.removeItem(ACTIVE_STREAM_KEY);
  } catch {
    /* ignore */
  }
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(ACTIVE_EVENT));
  }
}

export function useActiveLecturerStream(
  allowed: ClassStreamId[] = [],
): {
  activeStreamId: ClassStreamId | null;
  setActive: (id: ClassStreamId) => void;
  ready: boolean;
} {
  const [activeStreamId, setActiveState] = useState<ClassStreamId | null>(null);
  const [ready, setReady] = useState(false);
  const allowedKey = allowed.join("|");

  const sync = useCallback(() => {
    const list = allowedKey
      ? (allowedKey.split("|") as ClassStreamId[])
      : [];
    const current = getActiveLecturerStream();
    if (current && list.length > 0 && !list.includes(current)) {
      clearActiveLecturerStream();
      setActiveState(null);
    } else if (list.length === 1) {
      const only = list[0];
      if (current !== only) setActiveLecturerStream(only);
      setActiveState(only);
    } else {
      setActiveState(current);
    }
    setReady(true);
  }, [allowedKey]);

  useEffect(() => {
    sync();
    window.addEventListener(ACTIVE_EVENT, sync);
    return () => window.removeEventListener(ACTIVE_EVENT, sync);
  }, [sync]);

  const setActive = useCallback((id: ClassStreamId) => {
    setActiveLecturerStream(id);
    setActiveState(id);
  }, []);

  return { activeStreamId, setActive, ready };
}
