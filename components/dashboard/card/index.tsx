import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Bullet } from "@/components/ui/bullet";
import { cn } from "@/lib/utils";

interface DashboardCardProps
  extends Omit<React.ComponentProps<typeof Card>, "title"> {
  title: string;
  addon?: React.ReactNode;
  intent?: "default" | "success";
  frost?: "green" | "blue" | "orange" | "red";
  children: React.ReactNode;
}

export default function DashboardCard({
  title,
  addon,
  intent = "default",
  frost,
  children,
  className,
  ...props
}: DashboardCardProps) {
  return (
    <Card className={cn(className, frost && `glass-frost-${frost} border-${frost === "green" ? "emerald" : frost === "blue" ? "blue" : frost === "orange" ? "orange" : "red"}-500/20`)} {...props}>
      <CardHeader className="flex items-center justify-between">
        <CardTitle className="flex items-center gap-2.5">
          <Bullet variant={intent} />
          {title}
        </CardTitle>
        {addon && <div>{addon}</div>}
      </CardHeader>

      <CardContent className="flex-1 relative">{children}</CardContent>
    </Card>
  );
}
