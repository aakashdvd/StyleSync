"use client";

import { useEffect } from "react";

/**
 * Minimal keyboard shortcut hook. Handles a single key combo, ignores
 * keypresses while the user is typing into an input/textarea/contenteditable.
 */
export function useKeyboardShortcut(
  combo: string,
  handler: (event: KeyboardEvent) => void,
  options: { allowInInput?: boolean } = {},
) {
  useEffect(() => {
    const parts = combo.toLowerCase().split("+");
    const key = parts.pop()!;
    const needMeta = parts.includes("meta") || parts.includes("mod");
    const needCtrl = parts.includes("ctrl") || parts.includes("mod");
    const needShift = parts.includes("shift");
    const needAlt = parts.includes("alt");

    function onKeyDown(e: KeyboardEvent) {
      if (!options.allowInInput) {
        const target = e.target as HTMLElement | null;
        if (
          target?.tagName === "INPUT" ||
          target?.tagName === "TEXTAREA" ||
          target?.isContentEditable
        ) {
          return;
        }
      }
      if (e.key.toLowerCase() !== key) return;
      if (needShift && !e.shiftKey) return;
      if (needAlt && !e.altKey) return;
      if (needCtrl && !(e.ctrlKey || e.metaKey)) return;
      if (needMeta && !(e.metaKey || e.ctrlKey)) return;
      handler(e);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [combo, handler, options.allowInInput]);
}
