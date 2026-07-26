/**
 * Shows the full text of ellipsis-truncated labels on hover or keyboard focus.
 *
 * Mark any element that clips its text with `data-tip="<full text>"`. A single
 * fixed-position tooltip is reused for all of them: table cells live inside
 * horizontal scroll containers, so an absolutely positioned tooltip would be
 * clipped by the container's overflow.
 *
 * Delegated listeners are used so the tooltip works in both hydrated islands
 * and server-rendered markup.
 */

const SELECTOR = "[data-tip]";
const SHOW_DELAY_MS = 180;
const GAP = 6;
const VIEWPORT_EDGE = 8;

let tooltip: HTMLElement | null = null;
let visibleFor: HTMLElement | null = null;
let pendingFor: HTMLElement | null = null;
let timer: number | undefined;

function getTooltip(): HTMLElement {
  if (tooltip) return tooltip;
  const node = document.createElement("div");
  node.className = "truncation-tip";
  node.setAttribute("role", "tooltip");
  node.hidden = true;
  document.body.appendChild(node);
  tooltip = node;
  return node;
}

/** Sub-pixel layout rounding can inflate scrollWidth by a fraction. */
function isClipped(el: HTMLElement): boolean {
  return el.scrollWidth - el.clientWidth > 1;
}

function place(el: HTMLElement, node: HTMLElement) {
  const anchor = el.getBoundingClientRect();
  const { width, height } = node.getBoundingClientRect();

  let top = anchor.top - height - GAP;
  if (top < VIEWPORT_EDGE) top = anchor.bottom + GAP;

  const maxLeft = window.innerWidth - width - VIEWPORT_EDGE;
  const left = Math.max(VIEWPORT_EDGE, Math.min(anchor.left, maxLeft));

  node.style.top = `${Math.round(top)}px`;
  node.style.left = `${Math.round(left)}px`;
}

function open(el: HTMLElement) {
  const text = el.dataset.tip;
  if (!text || !isClipped(el)) return;

  const node = getTooltip();
  node.textContent = text;
  // Unhide before measuring; the browser paints only after this call stack.
  node.hidden = false;
  place(el, node);
  visibleFor = el;
}

function close() {
  window.clearTimeout(timer);
  timer = undefined;
  pendingFor = null;
  visibleFor = null;
  if (tooltip) tooltip.hidden = true;
}

function scheduleOpen(el: HTMLElement) {
  if (el === visibleFor || el === pendingFor) return;
  close();
  pendingFor = el;
  timer = window.setTimeout(() => {
    pendingFor = null;
    open(el);
  }, SHOW_DELAY_MS);
}

function targetFrom(event: Event): HTMLElement | null {
  const node = event.target;
  return node instanceof Element ? node.closest<HTMLElement>(SELECTOR) : null;
}

document.addEventListener("mouseover", (event) => {
  const el = targetFrom(event);
  if (el) scheduleOpen(el);
  else close();
});

document.addEventListener("focusin", (event) => {
  const el = targetFrom(event);
  if (el) {
    close();
    open(el);
  } else {
    close();
  }
});

document.addEventListener("focusout", close);
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") close();
});
// Capture phase: also catches scrolling inside the table's overflow container.
window.addEventListener("scroll", close, true);
window.addEventListener("resize", close);
