"use client";

import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button, type ButtonProps } from "@/components/ui/button";

export function AuthSubmitButton({
  loading,
  loadingText,
  children,
  className,
  disabled,
  ...props
}: ButtonProps & { loading?: boolean; loadingText?: string }) {
  return (
    <Button
      type="submit"
      className={cn("h-9 w-full text-[13px]", className)}
      disabled={loading || disabled}
      {...props}
    >
      {loading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          {loadingText || "Please wait..."}
        </>
      ) : (
        children
      )}
    </Button>
  );
}
