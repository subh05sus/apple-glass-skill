// apple-glass kit: copied verbatim from sparkmentor/frontend/components/ui/search-field.tsx on 2026-10-06. The live file wins; re-copy it when it changes.
"use client";

import { Search, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useTranslations } from "next-intl";
import * as React from "react";
import { GlassSurface } from "@/components/ui/glass";
import { EASE_EXIT, PRESS_SCALE_ICON, SPRING_SNAPPY } from "@/lib/motion";
import { cn } from "@/lib/utils";

export interface SearchFieldProps
  extends Omit<
    React.ComponentProps<"input">,
    "value" | "onChange" | "type" | "size" | "ref"
  > {
  value: string;
  onValueChange: (value: string) => void;
  /**
   * `tinted` (default): a soft fill, for search sitting on a page.
   * `glass`: milky glass, for search floating over content -- toolbars,
   * sheets, anything content scrolls under.
   */
  variant?: "tinted" | "glass";
  /** Accessible name. Defaults to the placeholder. */
  label?: string;
  /** The clear button's accessible name. Defaults to "Clear search". */
  clearLabel?: string;
  /** After the clear button (or Escape) empties the field. */
  onClear?: () => void;
  /** Inside the capsule after the field, e.g. a sort menu button. */
  trailing?: React.ReactNode;
  /** Classes for the capsule. */
  className?: string;
  /** Classes for the <input>. */
  inputClassName?: string;
}

/**
 * The app's search field: a capsule with a magnifier, the input and a clear
 * button that springs in once there is a query (28px, 44pt to a finger) and
 * puts the focus back in the field. Escape clears a query too.
 *
 * 40px tall with a pointer, 44pt on touch screens, where the text is 16px so
 * iOS does not zoom in on focus. The ref is the <input>.
 */
export const SearchField = React.forwardRef<HTMLInputElement, SearchFieldProps>(
  function SearchField(
    {
      value,
      onValueChange,
      variant = "tinted",
      label,
      clearLabel,
      onClear,
      trailing,
      className,
      inputClassName,
      placeholder,
      onKeyDown,
      ...props
    },
    ref,
  ) {
    const t = useTranslations("common");
    const inputRef = React.useRef<HTMLInputElement>(null);
    React.useImperativeHandle(ref, () => inputRef.current as HTMLInputElement);

    const clear = () => {
      onValueChange("");
      onClear?.();
      inputRef.current?.focus();
    };

    const body = (
      <>
        <Search
          aria-hidden="true"
          className="size-4 shrink-0 text-muted-foreground"
        />
        <input
          ref={inputRef}
          type="search"
          value={value}
          onChange={(event) => onValueChange(event.target.value)}
          onKeyDown={(event) => {
            onKeyDown?.(event);
            if (event.defaultPrevented) return;
            if (event.key === "Escape" && value) {
              event.preventDefault();
              clear();
            }
          }}
          placeholder={placeholder}
          aria-label={label ?? placeholder}
          enterKeyHint="search"
          autoComplete="off"
          spellCheck={false}
          className={cn(
            "h-full min-w-0 flex-1 bg-transparent px-1.5 text-sm outline-none placeholder:text-muted-foreground pointer-coarse:text-base [&::-webkit-search-cancel-button]:hidden",
            inputClassName,
          )}
          {...props}
        />
        <AnimatePresence initial={false}>
          {value && (
            <motion.button
              key="clear"
              type="button"
              aria-label={clearLabel ?? t("clearSearch")}
              onClick={clear}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5, transition: EASE_EXIT }}
              whileTap={{ scale: PRESS_SCALE_ICON }}
              transition={SPRING_SNAPPY}
              className="relative flex size-7 shrink-0 items-center justify-center rounded-full bg-foreground/10 text-muted-foreground outline-none after:absolute after:-inset-2 after:content-[''] hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50"
            >
              <X className="size-3.5" />
            </motion.button>
          )}
        </AnimatePresence>
        {trailing}
      </>
    );

    const capsule =
      "relative flex min-w-0 items-center gap-1 rounded-full ps-3.5 pe-1.5";

    if (variant === "glass") {
      return (
        <GlassSurface
          refract={false}
          // An outline, not a ring: the glass draws its rim with box-shadow.
          className={cn(
            capsule,
            "liquid-glass-milky h-11 outline-offset-0 focus-within:outline-2 focus-within:outline-ring/40",
            className,
          )}
        >
          {body}
        </GlassSurface>
      );
    }
    return (
      <div
        className={cn(
          capsule,
          "h-10 bg-foreground/[0.05] transition-shadow focus-within:ring-2 focus-within:ring-ring/40 pointer-coarse:h-11 dark:bg-foreground/[0.08]",
          className,
        )}
      >
        {body}
      </div>
    );
  },
);
