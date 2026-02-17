import { cn } from "@/shared/lib/utils";
import { type ReactNode, forwardRef, type HTMLAttributes } from "react";

/* ═══════════════════════════════════════════════════════════════════
   Widget Component — Base container for dashboard widgets
   Inspired by Arkham Intelligence's custom dashboard system
   ═══════════════════════════════════════════════════════════════════ */

interface WidgetProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  /** Column span (1-4) */
  colSpan?: 1 | 2 | 3 | 4;
  /** Row span (1-3) */
  rowSpan?: 1 | 2 | 3;
}

const colSpanStyles = {
  1: "col-span-1",
  2: "col-span-2",
  3: "col-span-3",
  4: "col-span-4",
};

const rowSpanStyles = {
  1: "row-span-1",
  2: "row-span-2",
  3: "row-span-3",
};

export const Widget = forwardRef<HTMLDivElement, WidgetProps>(
  ({ children, className, colSpan = 1, rowSpan = 1, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "bg-[var(--color-bg-raised)] border border-[var(--color-border-default)]",
          "rounded-lg overflow-hidden flex flex-col",
          "card-depth",
          colSpanStyles[colSpan],
          rowSpanStyles[rowSpan],
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
Widget.displayName = "Widget";

/* ═══════════════════════════════════════════════════════════════════
   Widget Header
   ═══════════════════════════════════════════════════════════════════ */

interface WidgetHeaderProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function WidgetHeader({ children, className, ...props }: WidgetHeaderProps) {
  return (
    <div
      className={cn(
        "px-4 py-3 border-b border-[var(--color-border-default)]",
        "flex items-center justify-between",
        "widget-header-accent",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Widget Title (Uppercase label style)
   ═══════════════════════════════════════════════════════════════════ */

interface WidgetTitleProps extends HTMLAttributes<HTMLSpanElement> {
  children: ReactNode;
  icon?: ReactNode;
}

export function WidgetTitle({ children, className, icon, ...props }: WidgetTitleProps) {
  return (
    <span
      className={cn(
        "widget-title flex items-center gap-2",
        className
      )}
      {...props}
    >
      {icon}
      {children}
    </span>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Widget Content
   ═══════════════════════════════════════════════════════════════════ */

interface WidgetContentProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  padding?: "none" | "sm" | "md" | "lg";
}

const paddingStyles = {
  none: "p-0",
  sm: "p-2",
  md: "p-3",
  lg: "p-4",
};

export function WidgetContent({
  children,
  className,
  padding = "md",
  ...props
}: WidgetContentProps) {
  return (
    <div
      className={cn("flex-1 overflow-auto", paddingStyles[padding], className)}
      {...props}
    >
      {children}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Widget Footer
   ═══════════════════════════════════════════════════════════════════ */

interface WidgetFooterProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function WidgetFooter({ children, className, ...props }: WidgetFooterProps) {
  return (
    <div
      className={cn(
        "px-4 py-2 border-t border-[var(--color-border-subtle)]",
        "flex items-center justify-between",
        "text-[var(--color-text-tertiary)] text-xs",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Empty Widget Cell (for adding new widgets)
   ═══════════════════════════════════════════════════════════════════ */

interface EmptyWidgetCellProps extends HTMLAttributes<HTMLButtonElement> {
  colSpan?: 1 | 2 | 3 | 4;
  rowSpan?: 1 | 2 | 3;
}

export function EmptyWidgetCell({
  className,
  colSpan = 1,
  rowSpan = 1,
  ...props
}: EmptyWidgetCellProps) {
  return (
    <button
      className={cn(
        "bg-transparent border border-dashed border-[var(--color-border-subtle)]",
        "rounded-lg flex items-center justify-center min-h-[120px]",
        "cursor-pointer transition-all duration-150",
        "hover:bg-[var(--color-bg-raised)] hover:border-[var(--color-border-default)]",
        "group",
        colSpanStyles[colSpan],
        rowSpanStyles[rowSpan],
        className
      )}
      {...props}
    >
      <svg
        className="w-6 h-6 text-[var(--color-text-tertiary)] group-hover:text-[var(--color-text-secondary)] transition-colors"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
      </svg>
    </button>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Widget Actions (top-right controls)
   ═══════════════════════════════════════════════════════════════════ */

interface WidgetActionsProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function WidgetActions({ children, className, ...props }: WidgetActionsProps) {
  return (
    <div className={cn("flex items-center gap-1", className)} {...props}>
      {children}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Widget Action Button
   ═══════════════════════════════════════════════════════════════════ */

interface WidgetActionButtonProps extends HTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
}

export function WidgetActionButton({
  children,
  className,
  ...props
}: WidgetActionButtonProps) {
  return (
    <button
      className={cn(
        "p-1 rounded text-[var(--color-text-tertiary)]",
        "hover:text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-overlay)]",
        "transition-colors",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
