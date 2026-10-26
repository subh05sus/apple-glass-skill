// apple-glass kit: copied verbatim from sparkmentor/frontend/components/ui/responsive-sheet.tsx on 2026-10-06. The live file wins; re-copy it when it changes.
"use client";

import { AlertTriangle } from "lucide-react";
import { type ReactNode, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { useIsPhone } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";

const DIALOG_WIDTH = {
  sm: "max-w-sm",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
} as const;

export type ResponsiveSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  /** Pinned under the scrolling body (actions). Safe-area aware on phones. */
  footer?: ReactNode;
  size?: keyof typeof DIALOG_WIDTH;
  /**
   * False while something must finish (an upload, a create): no swipe-down,
   * no outside click, no Escape, no close button.
   */
  dismissible?: boolean;
  /** Keep the title for screen readers but don't show it. */
  hideHeader?: boolean;
  className?: string;
  bodyClassName?: string;
};

/**
 * One component, two presentations: a bottom sheet on phones (grab handle,
 * swipe down to close, keyboard-aware, scrolls inside) and a centred dialog
 * on larger screens (width by `size`, capped height, scrolls inside).
 *
 * Forms, previews and pickers use this instead of a bare Dialog, so nothing
 * opens as a cramped modal pinned to a phone's edges.
 */
export function ResponsiveSheet({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  size = "md",
  dismissible = true,
  hideHeader = false,
  className,
  bodyClassName,
}: ResponsiveSheetProps) {
  const phone = useIsPhone();

  if (phone) {
    return (
      <Drawer
        open={open}
        onOpenChange={onOpenChange}
        dismissible={dismissible}
        repositionInputs
      >
        <DrawerContent className={cn("max-h-[92dvh]", className)}>
          <DrawerHeader
            className={cn(
              "px-5 pt-3 pb-2 text-left md:text-left",
              hideHeader && "sr-only",
            )}
          >
            <DrawerTitle className="text-17 leading-snug">{title}</DrawerTitle>
            {description && (
              <DrawerDescription className="text-13">
                {description}
              </DrawerDescription>
            )}
          </DrawerHeader>
          {children ? (
            <div
              className={cn(
                "min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-4",
                !footer && "pb-[max(1rem,env(safe-area-inset-bottom))]",
                bodyClassName,
              )}
            >
              {children}
            </div>
          ) : null}
          {footer && (
            <div className="border-t border-border/60 px-5 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
              {footer}
            </div>
          )}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={dismissible}
        onInteractOutside={dismissible ? undefined : (e) => e.preventDefault()}
        onEscapeKeyDown={dismissible ? undefined : (e) => e.preventDefault()}
        className={cn(
          DIALOG_WIDTH[size],
          "flex max-h-[min(85dvh,52rem)] flex-col gap-0 overflow-hidden p-0",
          className,
        )}
      >
        <DialogHeader
          className={cn("px-6 pt-6 pb-3 text-left", hideHeader && "sr-only")}
        >
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        {children ? (
          <div
            className={cn(
              "min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 pb-6",
              bodyClassName,
            )}
          >
            {children}
          </div>
        ) : null}
        {footer && (
          <div className="border-t border-border/60 px-6 py-4">{footer}</div>
        )}
      </DialogContent>
    </Dialog>
  );
}

/**
 * Confirmation for consequential actions (cancel a plan, disconnect an
 * integration, revoke a session). States the consequence, runs the action
 * with a spinner on the confirm button, closes on success and stays open with
 * the error on failure. Double taps can't fire twice.
 */
export function ConfirmSheet({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  cancelLabel = "Cancel",
  destructive = false,
  onConfirm,
  errorFallback = "That didn't work. Please try again.",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => Promise<unknown> | unknown;
  errorFallback?: string;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) setError(null);
  }, [open]);

  const confirm = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await onConfirm();
      onOpenChange(false);
    } catch (err) {
      setError(
        err instanceof Error && err.message ? err.message : errorFallback,
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <ResponsiveSheet
      open={open}
      onOpenChange={(next) => {
        if (!busy) onOpenChange(next);
      }}
      title={title}
      description={description}
      size="sm"
      dismissible={!busy}
      footer={
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={busy}
            className="h-11 rounded-full sm:h-9"
          >
            {cancelLabel}
          </Button>
          <Button
            variant={destructive ? "destructive" : "default"}
            onClick={confirm}
            loading={busy}
            className="h-11 rounded-full sm:h-9"
          >
            {confirmLabel}
          </Button>
        </div>
      }
    >
      {error && (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-xl bg-destructive/8 px-3 py-2.5 text-sm text-destructive"
        >
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          {error}
        </p>
      )}
    </ResponsiveSheet>
  );
}
