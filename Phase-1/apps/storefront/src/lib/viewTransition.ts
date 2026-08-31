export function withViewTransition(update: () => void) {
  const doc = document as Document & {
    startViewTransition?: (cb: () => void) => { finished: Promise<void> };
  };
  if (typeof doc.startViewTransition === "function") {
    doc.startViewTransition(update);
    return;
  }
  update();
}

export function tapPulse() {
  try {
    navigator.vibrate?.(12);
  } catch {
    /* desktop */
  }
}
