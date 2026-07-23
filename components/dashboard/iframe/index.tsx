"use client";

import React, { useState, useEffect, useRef } from "react";
import { ExternalLink, Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface IFramePageProps {
  url: string;
  title?: string;
}

export default function IFramePage({ url, title }: IFramePageProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    // Check if the target service is reachable before loading iframe
    const checkService = async () => {
      setLoading(true);
      setError(false);
      try {
        // Use the server-side proxy to avoid CORS issues
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);
        const res = await fetch(`/api/service-check?url=${encodeURIComponent(url)}`, {
          signal: controller.signal,
        });
        clearTimeout(timeout);
        if (res.ok) {
          const data = await res.json();
          setError(data.status !== "online");
        } else {
          setError(true);
        }
      } catch {
        // If the proxy itself fails, let the iframe try anyway
        setError(false);
      }
      setLoading(false);
    };
    checkService();
  }, [url, retryCount]);

  const handleIframeError = () => {
    setError(true);
    setLoading(false);
  };

  const handleIframeLoad = () => {
    setLoading(false);
    setError(false);
  };

  const handleRetry = () => {
    setRetryCount((c) => c + 1);
    if (iframeRef.current) {
      iframeRef.current.src = url;
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-16rem)] -mx-3 md:-mx-6 -mb-6 rounded-lg overflow-hidden border border-border/50">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-accent/30 border-b border-border/40 text-xs text-muted-foreground shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          {loading && <Loader2 className="h-3 w-3 animate-spin shrink-0" />}
          {error && <AlertCircle className="h-3 w-3 text-destructive shrink-0" />}
          <span className="truncate font-mono text-[10px]">{url}</span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={handleRetry}
            title="Retry"
          >
            <RefreshCw className="h-3 w-3" />
          </Button>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 hover:text-foreground transition-colors"
          >
            <ExternalLink className="h-3 w-3" />
            <span>Open</span>
          </a>
        </div>
      </div>

      {/* Content */}
      <div className="relative flex-1 bg-[#0a0a0f]">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center z-10 bg-[#0a0a0f]/80">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Connecting to {url}...</span>
            </div>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex items-center justify-center z-10 bg-[#0a0a0f]/90">
            <div className="flex flex-col items-center gap-3 text-center px-6">
              <AlertCircle className="h-8 w-8 text-destructive" />
              <div>
                <p className="text-sm font-medium text-foreground mb-1">Service Unreachable</p>
                <p className="text-xs text-muted-foreground max-w-xs">
                  Could not connect to <code className="text-[10px] font-mono bg-accent/30 px-1 rounded">{url}</code>
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="default" size="sm" onClick={handleRetry}>
                  <RefreshCw className="h-3 w-3 mr-1" /> Retry
                </Button>
                <a href={url} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="sm">
                    <ExternalLink className="h-3 w-3 mr-1" /> Open Directly
                  </Button>
                </a>
              </div>
            </div>
          </div>
        )}

        <iframe
          ref={iframeRef}
          src={url}
          title={title || url}
          className={cn(
            "w-full h-full border-0 transition-opacity duration-300",
            (loading || error) ? "opacity-0" : "opacity-100"
          )}
          style={{ background: "#0a0a0f" }}
          onLoad={handleIframeLoad}
          onError={handleIframeError}
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
        />
      </div>
    </div>
  );
}
