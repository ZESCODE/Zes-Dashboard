import * as React from "react";

import { cn } from "@/lib/utils";

export type FrostVariant = "green" | "blue" | "orange" | "red" | "none";

const frostCardMap: Record<FrostVariant, string> = {
  green: "glass-frost-green",
  blue:  "glass-frost-blue",
  orange: "glass-frost-orange",
  red:   "glass-frost-red",
  none:  "",
};

const frostContentMap: Record<FrostVariant, string> = {
  green: "!bg-emerald-500/8 border-t border-emerald-500/15",
  blue:  "!bg-blue-500/8 border-t border-blue-500/15",
  orange: "!bg-orange-500/8 border-t border-orange-500/15",
  red:   "!bg-red-500/8 border-t border-red-500/15",
  none:  "",
};

interface CardProps extends React.ComponentProps<"div"> {
  frost?: FrostVariant;
}

function Card({ className, frost = "none", ...props }: CardProps) {
  return (
    <div
      data-slot="card"
      className={cn(
        "text-card-foreground flex flex-col gap-2 rounded-lg p-1.5",
        frost === "none" ? "bg-pop" : frostCardMap[frost],
        className
      )}
      {...props}
    />
  );
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "@container/card-header h-9 grid auto-rows-min grid-rows-[auto_auto] items-start gap-1.5 pl-1 pr-1.5 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6",
        className
      )}
      {...props}
    />
  );
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn("leading-none font-medium text-sm", className)}
      {...props}
    />
  );
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  );
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        className
      )}
      {...props}
    />
  );
}

interface CardContentProps extends React.ComponentProps<"div"> {
  frost?: FrostVariant;
}

function CardContent({ className, frost = "none", ...props }: CardContentProps) {
  return (
    <div
      data-slot="card-content"
      className={cn(
        "p-3 py-2 rounded bg-card",
        frost !== "none" && frostContentMap[frost],
        className
      )}
      {...props}
    />
  );
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn("flex items-center px-6 [.border-t]:pt-6", className)}
      {...props}
    />
  );
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
};
