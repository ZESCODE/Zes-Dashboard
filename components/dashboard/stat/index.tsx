import React, { useState, useEffect } from "react";
import NumberFlow from "@number-flow/react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bullet } from "@/components/ui/bullet";
import { cn } from "@/lib/utils";
import { frostMap, type FrostColor } from "@/lib/frost-tokens";

interface DashboardStatProps {
  label: string;
  value: string;
  description?: string;
  tag?: string;
  icon: React.ElementType;
  intent?: "positive" | "negative" | "neutral";
  direction?: "up" | "down";
  frost?: FrostColor;
}

export default function DashboardStat({
  label,
  value,
  description,
  icon,
  tag,
  intent,
  direction,
  frost,
}: DashboardStatProps) {
  const Icon = icon;
  const tokens = frost ? frostMap[frost] : null;

  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  // Extract prefix, numeric value, and suffix from the value string
  const parseValue = (val: string) => {
    const match = val.match(/^([^\d.-]*)([+-]?\d*\.?\d+)([^\d]*)$/);

    if (match) {
      const [, prefix, numStr, suffix] = match;
      return {
        prefix: prefix || "",
        numericValue: parseFloat(numStr),
        suffix: suffix || "",
        isNumeric: !isNaN(parseFloat(numStr)),
      };
    }

    return {
      prefix: "",
      numericValue: 0,
      suffix: val,
      isNumeric: false,
    };
  };

  const getIntentClassName = () => {
    if (intent === "positive") return "text-success";
    if (intent === "negative") return "text-destructive";
    return "text-muted-foreground";
  };

  const { prefix, numericValue, suffix, isNumeric } = parseValue(value);

  return (
    <Card className={cn("relative overflow-hidden", tokens?.cardClass)}>
      <CardHeader className="flex items-center justify-between">
        <CardTitle className={cn("flex items-center gap-2.5", tokens?.accent)}>
          <Bullet />
          {label}
        </CardTitle>
        <div className={cn("size-4", tokens?.accent)}>
          <Icon className="size-4" />
        </div>
      </CardHeader>

      <CardContent className="flex-1 pt-2 md:pt-6 overflow-clip relative">
        <div className="flex items-center">
          <span className={cn("text-4xl md:text-5xl font-display", tokens?.accent)}>
            {isNumeric && mounted ? (
              <NumberFlow value={numericValue} prefix={prefix} suffix={suffix} />
            ) : (
              <span>{prefix}{numericValue}{suffix}</span>
            )}
          </span>
          {tag && (
            <Badge variant="default" className="uppercase ml-3">
              {tag}
            </Badge>
          )}
        </div>

        {description && (
          <div className="justify-between">
            <p className="text-xs md:text-sm font-medium text-muted-foreground tracking-wide">
              {description}
            </p>
          </div>
        )}

        {/* Marquee Animation */}
        {direction && (
          <div className="absolute top-0 right-0 w-14 h-full pointer-events-none overflow-hidden group">
            <div
              className={cn(
                "flex flex-col transition-all duration-500",
                "group-hover:scale-105 group-hover:brightness-110",
                getIntentClassName(),
                direction === "up"
                  ? "animate-marquee-up"
                  : "animate-marquee-down"
              )}
            >
              <div
                className={cn(
                  "flex",
                  direction === "up" ? "flex-col-reverse" : "flex-col"
                )}
              >
                {Array.from({ length: 6 }, (_, i) => (
                  <Arrow key={i} direction={direction} index={i} />
                ))}
              </div>
              <div
                className={cn(
                  "flex",
                  direction === "up" ? "flex-col-reverse" : "flex-col"
                )}
              >
                {Array.from({ length: 6 }, (_, i) => (
                  <Arrow key={i} direction={direction} index={i} />
                ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface ArrowProps {
  direction: "up" | "down";
  index: number;
}

const Arrow = ({ direction, index }: ArrowProps) => {
  const staggerDelay = index * 0.15;
  const phaseDelay = (index % 3) * 0.8;

  return (
    <span
      style={{
        animationDelay: `${staggerDelay + phaseDelay}s`,
        animationDuration: "3s",
        animationTimingFunction: "cubic-bezier(0.4, 0.0, 0.2, 1)",
      }}
      className={cn(
        "text-center text-5xl size-14 font-display leading-none block",
        "transition-all duration-700 ease-out",
        "animate-marquee-pulse",
        "will-change-transform"
      )}
    >
      {direction === "up" ? "↑" : "↓"}
    </span>
  );
};
