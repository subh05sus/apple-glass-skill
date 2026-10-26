// apple-glass kit: copied verbatim from sparkmentor/frontend/components/ui/save-switch.tsx on 2026-10-06. The live file wins; re-copy it when it changes.
"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { Switch } from "@/components/ui/switch";
import { haptic } from "@/lib/motion";
import { cn } from "@/lib/utils";

/**
 * A switch that saves the moment it's flipped (iOS Settings behaviour).
 *
 * It moves immediately; while the save is in flight it stays where the user
 * put it. On success a quiet "Saved ✓" fades in beside it, then out. On
 * failure it slides back and says so inline -- no toast, no Save button.
 */
export function SaveSwitch({
  checked,
  onSave,
  id,
  label,
  savedLabel = "Saved",
  failedLabel = "Couldn't save",
  disabled,
  className,
}: {
  checked: boolean;
  /** Persist the new value. Throw (or reject) to revert. */
  onSave: (next: boolean) => Promise<unknown> | unknown;
  id?: string;
  /** Accessible name when no visible <label htmlFor> points at it. */
  label?: string;
  savedLabel?: string;
  failedLabel?: string;
  disabled?: boolean;
  className?: string;
}) {
  const [value, setValue] = useState(checked);
  const [status, setStatus] = useState<"idle" | "saved" | "failed">("idle");
  const saving = useRef(false);
  const timer = useRef<number | undefined>(undefined);

  // Follow the source of truth when it changes from elsewhere.
  useEffect(() => {
    if (!saving.current) setValue(checked);
  }, [checked]);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const flash = (next: "saved" | "failed") => {
    setStatus(next);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(
      () => setStatus("idle"),
      next === "saved" ? 1400 : 2600,
    );
  };

  const change = async (next: boolean) => {
    if (saving.current) return;
    saving.current = true;
    setValue(next);
    haptic("tick");
    try {
      await onSave(next);
      flash("saved");
    } catch {
      setValue(!next);
      haptic("warning");
      flash("failed");
    } finally {
      saving.current = false;
    }
  };

  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span aria-live="polite" className="text-xs text-muted-foreground">
        <AnimatePresence mode="wait" initial={false}>
          {status !== "idle" && (
            <motion.span
              key={status}
              initial={{ opacity: 0, x: 4 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, transition: { duration: 0.15 } }}
              className={cn(
                "inline-block whitespace-nowrap",
                status === "failed" && "text-destructive",
              )}
            >
              {status === "saved" ? `${savedLabel} ✓` : failedLabel}
            </motion.span>
          )}
        </AnimatePresence>
      </span>
      <Switch
        id={id}
        aria-label={label}
        checked={value}
        disabled={disabled}
        onCheckedChange={(next) => void change(next)}
      />
    </span>
  );
}
