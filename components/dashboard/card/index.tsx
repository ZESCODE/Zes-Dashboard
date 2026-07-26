import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Bullet } from "@/components/ui/bullet";
import { cn } from "@/lib/utils";
import { frostMap, type FrostColor } from "@/lib/frost-tokens";

interface DashboardCardProps
  extends Omit<React.ComponentProps<typeof Card>, "title"> {
  title: string;
  addon?: React.ReactNode;
  intent?: "default" | "success";
  frost?: FrostColor;
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
  const tokens = frost ? frostMap[frost] : null;

  return (
    <Card
      className={cn(
        className,
        tokens?.cardClass
      )}
      {...props}
    >
      <CardHeader className="flex items-center justify-between">
        <CardTitle className={cn("flex items-center gap-2.5", tokens?.accent)}>
          <Bullet variant={intent} />
          {title}
        </CardTitle>
        {addon && <div>{addon}</div>}
      </CardHeader>

      <CardContent className="flex-1 relative">{children}</CardContent>
    </Card>
  );
}
