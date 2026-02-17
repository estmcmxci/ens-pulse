import { cn } from "@/shared/lib/utils";
import { type ReactNode, forwardRef, type HTMLAttributes } from "react";

/* ═══════════════════════════════════════════════════════════════════
   Card Component — Arkham-Inspired Design
   ═══════════════════════════════════════════════════════════════════ */

type CardVariant = "default" | "elevated" | "interactive" | "empty" | "highlight";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
  variant?: CardVariant;
  padding?: "none" | "sm" | "md" | "lg";
}

const variantStyles: Record<CardVariant, string> = {
  default: "bg-[var(--color-bg-raised)] border-[var(--color-border-subtle)] card-depth",
  elevated: "bg-[var(--color-bg-elevated)] border-[var(--color-border-default)] card-depth",
  interactive: [
    "bg-[var(--color-bg-raised)] border-[var(--color-border-subtle)]",
    "cursor-pointer card-depth",
    "hover:bg-[var(--color-bg-elevated)] hover:border-[var(--color-border-default)]",
  ].join(" "),
  empty: [
    "bg-transparent border-dashed border-[var(--color-border-subtle)]",
    "cursor-pointer transition-all duration-[var(--transition-fast)]",
    "hover:bg-[var(--color-bg-raised)] hover:border-[var(--color-border-default)]",
    "flex items-center justify-center min-h-[120px]",
  ].join(" "),
  highlight: [
    "bg-[var(--color-bg-raised)] border-transparent",
    "bg-gradient-to-r from-[var(--color-ens-blue)]/10 to-[var(--color-ens-purple)]/10",
    "ring-1 ring-[var(--color-ens-blue)]/20 card-depth-hero",
  ].join(" "),
};

const paddingStyles = {
  none: "p-0",
  sm: "p-3",
  md: "p-4",
  lg: "p-6",
};

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ children, className, variant = "default", padding = "lg", ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "rounded-lg border",
          variantStyles[variant],
          paddingStyles[padding],
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
Card.displayName = "Card";

/* ═══════════════════════════════════════════════════════════════════
   Card Header
   ═══════════════════════════════════════════════════════════════════ */

interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  border?: boolean;
}

export function CardHeader({ children, className, border = false, ...props }: CardHeaderProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between mb-4",
        border && "pb-4 border-b border-[var(--color-border-subtle)]",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Card Title
   ═══════════════════════════════════════════════════════════════════ */

interface CardTitleProps extends HTMLAttributes<HTMLHeadingElement> {
  children: ReactNode;
  as?: "h1" | "h2" | "h3" | "h4";
  size?: "sm" | "md" | "lg";
}

const titleSizeStyles = {
  sm: "text-sm font-semibold",
  md: "text-base font-semibold",
  lg: "text-lg font-semibold",
};

export function CardTitle({
  children,
  className,
  as: Component = "h3",
  size = "md",
  ...props
}: CardTitleProps) {
  return (
    <Component
      className={cn(
        titleSizeStyles[size],
        "text-[var(--color-text-primary)]",
        className
      )}
      {...props}
    >
      {children}
    </Component>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Card Label (Uppercase metadata style)
   ═══════════════════════════════════════════════════════════════════ */

interface CardLabelProps extends HTMLAttributes<HTMLSpanElement> {
  children: ReactNode;
}

export function CardLabel({ children, className, ...props }: CardLabelProps) {
  return (
    <span
      className={cn("label", className)}
      {...props}
    >
      {children}
    </span>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Card Content
   ═══════════════════════════════════════════════════════════════════ */

interface CardContentProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function CardContent({ children, className, ...props }: CardContentProps) {
  return (
    <div className={cn("", className)} {...props}>
      {children}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Card Description
   ═══════════════════════════════════════════════════════════════════ */

interface CardDescriptionProps extends HTMLAttributes<HTMLParagraphElement> {
  children: ReactNode;
}

export function CardDescription({ children, className, ...props }: CardDescriptionProps) {
  return (
    <p
      className={cn("text-sm text-[var(--color-text-secondary)]", className)}
      {...props}
    >
      {children}
    </p>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Card Footer
   ═══════════════════════════════════════════════════════════════════ */

interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  border?: boolean;
}

export function CardFooter({ children, className, border = false, ...props }: CardFooterProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between mt-4",
        border && "pt-4 border-t border-[var(--color-border-subtle)]",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Card Value (Large data display)
   ═══════════════════════════════════════════════════════════════════ */

interface CardValueProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  size?: "sm" | "md" | "lg";
  trend?: "up" | "down" | "neutral";
}

const valueSizeStyles = {
  sm: "text-lg font-medium",
  md: "text-2xl data-value",
  lg: "text-3xl hero-value",
};

const trendColorStyles = {
  up: "text-[var(--color-positive)]",
  down: "text-[var(--color-negative)]",
  neutral: "text-[var(--color-text-primary)]",
};

export function CardValue({
  children,
  className,
  size = "md",
  trend = "neutral",
  ...props
}: CardValueProps) {
  return (
    <div
      className={cn(
        valueSizeStyles[size],
        trendColorStyles[trend],
        "tabular-nums tracking-tight",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Card Skeleton (Loading state)
   ═══════════════════════════════════════════════════════════════════ */

interface CardSkeletonProps {
  lines?: number;
  className?: string;
}

export function CardSkeleton({ lines = 3, className }: CardSkeletonProps) {
  return (
    <Card className={className}>
      <div className="space-y-3">
        <div className="skeleton h-4 w-1/3" />
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className="skeleton h-3"
            style={{ width: `${100 - i * 15}%` }}
          />
        ))}
      </div>
    </Card>
  );
}
