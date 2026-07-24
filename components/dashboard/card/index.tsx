import React from "react";
import { Card, CardHeader, CardTitle, CardContent, type FrostVariant } from "@/components/ui/card";
import { Bullet } from "@/components/ui/bullet";

interface DashboardCardProps
  extends Omit<React.ComponentProps<typeof Card>, "title"> {
  title: string;
  addon?: React.ReactNode;
  intent?: "default" | "success";
  frost?: FrostVariant;
  children: React.ReactNode;
}

export default function DashboardCard({
  title,
  addon,
  intent = "default",
  frost = "none",
  children,
  className,
  ...props
}: DashboardCardProps) {
  const bulletVariant =
    frost === "green" ? "success" :
    frost === "red" ? "destructive" :
    frost === "orange" ? "warning" :
    frost === "blue" ? "default" :
    intent === "success" ? "success" : "default";

  return (
    <Card className={className} frost={frost} {...props}>
      <CardHeader className="flex items-center justify-between">
        <CardTitle className="flex items-center gap-2.5">
          <Bullet variant={bulletVariant} />
          {title}
        </CardTitle>
        {addon && <div>{addon}</div>}
      </CardHeader>

      <CardContent frost={frost} className="flex-1 relative">{children}</CardContent>
    </Card>
  );
}
