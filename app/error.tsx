"use client";

import React from "react";
import DashboardPageLayout from "@/components/dashboard/layout";
import DashboardCard from "@/components/dashboard/card";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <DashboardPageLayout
      header={{
        title: "Something went wrong",
        description: "An unexpected error occurred",
        icon: null,
      }}
    >
      <div className="flex flex-col items-center justify-center gap-6 py-20">
        <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
          <AlertTriangle className="h-8 w-8 text-destructive" />
        </div>

        <div className="text-center max-w-md">
          <h2 className="text-lg font-semibold mb-2">Application Error</h2>
          <p className="text-sm text-muted-foreground mb-4">
            {error.message || "The dashboard encountered an unexpected error."}
          </p>
          {error.digest && (
            <p className="text-xs text-muted-foreground/50 font-mono">
              Error ID: {error.digest}
            </p>
          )}
        </div>

        <button
          onClick={reset}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm"
        >
          <RefreshCw className="h-4 w-4" />
          Try again
        </button>
      </div>
    </DashboardPageLayout>
  );
}
