import { cn } from "@/shared/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import { type ReactNode, type HTMLAttributes } from "react";

/* ═══════════════════════════════════════════════════════════════════
   Badge Component — Arkham-Inspired Design
   Status indicators, labels, counts
   ═══════════════════════════════════════════════════════════════════ */

const badgeVariants = cva(
  "inline-flex items-center font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "bg-[var(--color-bg-overlay)] text-[var(--color-text-secondary)]",
        success: "bg-[var(--color-positive-muted)] text-[var(--color-positive)]",
        warning: "bg-[var(--color-warning-muted)] text-[var(--color-warning)]",
        danger: "bg-[var(--color-negative-muted)] text-[var(--color-negative)]",
        info: "bg-[var(--color-info-muted)] text-[var(--color-info)]",
        outline: "bg-transparent border border-[var(--color-border-default)] text-[var(--color-text-secondary)]",
        ens: "bg-gradient-to-r from-[var(--color-ens-blue)]/20 to-[var(--color-ens-purple)]/20 text-[var(--color-ens-blue)]",
      },
      size: {
        sm: "px-1.5 py-0.5 text-[10px] rounded",
        md: "px-2 py-0.5 text-[11px] rounded",
        lg: "px-2.5 py-1 text-xs rounded-md",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
);

interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  children: ReactNode;
  /** Optional dot indicator before text */
  dot?: boolean;
  /** Dot color (defaults to variant color) */
  dotColor?: string;
}

export function Badge({
  children,
  variant,
  size,
  className,
  dot,
  dotColor,
  ...props
}: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant, size }), className)} {...props}>
      {dot && (
        <span
          className="w-1.5 h-1.5 rounded-full mr-1.5"
          style={{
            backgroundColor: dotColor || "currentColor",
          }}
        />
      )}
      {children}
    </span>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Status Badge — Semantic status indicator
   ═══════════════════════════════════════════════════════════════════ */

type Status = "active" | "pending" | "success" | "error" | "warning" | "info" | "neutral";

const statusConfig: Record<Status, { variant: BadgeProps["variant"]; label: string }> = {
  active: { variant: "info", label: "Active" },
  pending: { variant: "warning", label: "Pending" },
  success: { variant: "success", label: "Success" },
  error: { variant: "danger", label: "Error" },
  warning: { variant: "warning", label: "Warning" },
  info: { variant: "info", label: "Info" },
  neutral: { variant: "default", label: "—" },
};

interface StatusBadgeProps extends Omit<BadgeProps, "variant" | "children"> {
  status: Status;
  label?: string;
  showDot?: boolean;
}

export function StatusBadge({ status, label, showDot = true, ...props }: StatusBadgeProps) {
  const config = statusConfig[status];
  return (
    <Badge variant={config.variant} dot={showDot} {...props}>
      {label || config.label}
    </Badge>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Count Badge — Numeric indicator
   ═══════════════════════════════════════════════════════════════════ */

interface CountBadgeProps extends Omit<BadgeProps, "children"> {
  count: number;
  max?: number;
}

export function CountBadge({ count, max = 99, ...props }: CountBadgeProps) {
  const displayCount = count > max ? `${max}+` : count.toString();
  return (
    <Badge variant="outline" size="sm" {...props}>
      {displayCount}
    </Badge>
  );
}
