// src/hooks/useSlidingIndicator.js
// Moves an absolutely-positioned indicator onto the active child of a
// container (sidebar nav, segmented controls). Writes styles directly — no
// re-renders — and re-measures on resize (sidebar collapse, font load).
import { useLayoutEffect } from "react";

export function useSlidingIndicator(containerRef, indicatorRef, activeSelector, deps = []) {
  useLayoutEffect(() => {
    const box = containerRef.current, ind = indicatorRef.current;
    if (!box || !ind) return;
    let first = !ind.dataset.ready;
    const place = () => {
      const el = box.querySelector(activeSelector);
      if (!el) { ind.style.opacity = "0"; return; }
      if (first) ind.style.transition = "none";          // no slide on first paint
      ind.style.opacity = "1";
      ind.style.width  = `${el.offsetWidth}px`;
      ind.style.height = `${el.offsetHeight}px`;
      ind.style.transform = `translate(${el.offsetLeft}px, ${el.offsetTop}px)`;
      if (first) {
        ind.getBoundingClientRect();                     // commit position before re-enabling transitions
        ind.style.transition = "";
        ind.dataset.ready = "1";
        first = false;
      }
    };
    place();
    const ro = new ResizeObserver(place);
    ro.observe(box);
    box.querySelectorAll(":scope > *, :scope > * > *").forEach(n => ro.observe(n));
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
