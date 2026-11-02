/**
 * Utility to scroll strictly within an internal scroll container without bubbling
 * up to window or ancestor elements.
 *
 * Standard `element.scrollIntoView()` bubbles to all scrollable ancestors all the way to `window`,
 * displacing application header bars and workspace shells. This function computes the exact
 * relative coordinate within the designated scroll parent and calls `container.scrollTo()`.
 */
export function scrollToInternalElement(
  container: HTMLElement | string | null,
  target: HTMLElement | string | null,
  offset: number = 0,
  behavior: ScrollBehavior = 'smooth'
): void {
  if (typeof window === 'undefined') return;

  const containerEl =
    typeof container === 'string' ? document.getElementById(container) : container;
  const targetEl =
    typeof target === 'string' ? document.getElementById(target) : target;

  if (!containerEl || !targetEl) return;

  const containerRect = containerEl.getBoundingClientRect();
  const targetRect = targetEl.getBoundingClientRect();

  // Calculate relative top difference inside the container
  const relativeTop = targetRect.top - containerRect.top + containerEl.scrollTop - offset;

  containerEl.scrollTo({
    top: relativeTop,
    behavior,
  });
}
