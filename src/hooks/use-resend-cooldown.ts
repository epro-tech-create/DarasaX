"use client";

import { useEffect, useState } from "react";

export function useResendCooldown(initialSeconds = 60) {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (seconds <= 0) return;
    const id = window.setInterval(() => {
      setSeconds((s) => (s <= 1 ? 0 : s - 1));
    }, 1000);
    return () => window.clearInterval(id);
  }, [seconds]);

  function start(next = initialSeconds) {
    setSeconds(next);
  }

  const label =
    seconds > 0
      ? `Resend code in ${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(
          seconds % 60,
        ).padStart(2, "0")}`
      : "Resend code";

  return {
    seconds,
    canResend: seconds === 0,
    label,
    start,
  };
}
