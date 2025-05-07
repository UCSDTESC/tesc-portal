import { useEffect, useRef, RefObject } from "react";

/**
 * Like the single‑ref version but works with several refs.
 *
 * @typeParam T – HTMLElement subtype shared by all protected nodes.
 */
export function useOutsideClicks<T extends HTMLElement>(
  refs: Array<RefObject<T|null>>,
  onOutside: (e: PointerEvent) => void
): void {
  /** Keep the latest callback without re‑attaching listeners */
  const latest = useRef(onOutside);
  useEffect(() => {
    latest.current = onOutside;
  }, [onOutside]);

  useEffect(() => {
    const listener = (e: PointerEvent) => {
      // If the event target lives inside *any* protected element, ignore it
      const clickedInsideSomeRef = refs.some(
        (r) => r.current && r.current.contains(e.target as Node)
      );
      if (clickedInsideSomeRef) return;

      latest.current(e);
    };

    document.addEventListener("pointerdown", listener);
    return () => {
      document.removeEventListener("pointerdown", listener);
    };

  }, [ refs]);
}