const dialogs = [];

export function closeUiDialog(element) {
  const index = element ? dialogs.findIndex(dialog => dialog.element === element) : dialogs.length - 1;
  if (index < 0) return;
  while (dialogs.length > index) {
    const { element: dialog, trigger, inertElements, wasInert, overflow, controller, onClose } = dialogs.pop();
    controller.abort();
    dialog.classList.add('hidden');
    if (wasInert) dialog.setAttribute('inert', '');
    for (const node of inertElements) node.removeAttribute('inert');
    document.body.style.overflow = overflow;
    onClose?.();
    if (trigger?.isConnected && !trigger.closest('[inert]')) trigger.focus();
  }
}

export function openUiDialog(element, { labelledBy, initialFocus, onClose, nested = false, returnFocus } = {}) {
  if (!element) return;
  if (dialogs.some(dialog => dialog.element === element)) return;
  if (!nested) while (dialogs.length) closeUiDialog();
  const trigger = returnFocus || document.activeElement;
  const wasInert = element.hasAttribute('inert');
  element.removeAttribute('inert');
  const inertElements = [];
  for (let branch = element; branch?.parentElement; branch = branch.parentElement) {
    for (const sibling of branch.parentElement.children) {
      if (sibling !== branch && !sibling.hasAttribute('inert') && !sibling.matches('script, style, link')) {
        sibling.setAttribute('inert', '');
        inertElements.push(sibling);
      }
    }
    if (branch.parentElement === document.body) break;
  }
  const controller = new AbortController();
  dialogs.push({ element, trigger, inertElements, wasInert, overflow: document.body.style.overflow, controller, onClose });
  document.body.style.overflow = 'hidden';
  element.classList.remove('hidden');
  element.setAttribute('role', 'dialog');
  element.setAttribute('aria-modal', 'true');
  if (labelledBy) element.setAttribute('aria-labelledby', labelledBy);
  element.tabIndex = -1;
  const focusable = () => [...element.querySelectorAll('button:not(:disabled), input:not(:disabled):not([type="hidden"]), select:not(:disabled), textarea:not(:disabled), a[href], summary, [tabindex="0"]')]
    .filter(node => !node.closest('.hidden, [hidden], [inert]') && !node.closest('details:not([open]) > :not(summary)') && getComputedStyle(node).display !== 'none' && getComputedStyle(node).visibility !== 'hidden');
  document.addEventListener('keydown', event => {
    if (dialogs.at(-1)?.element !== element) return;
    if (event.key === 'Escape') { event.preventDefault(); event.stopImmediatePropagation(); closeUiDialog(element); }
    if (event.key !== 'Tab') return;
    const nodes = focusable();
    const first = nodes[0], last = nodes.at(-1);
    if (!nodes.length) { event.preventDefault(); element.focus(); }
    else if (event.shiftKey && (document.activeElement === first || document.activeElement === element || !element.contains(document.activeElement))) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && (document.activeElement === last || document.activeElement === element || !element.contains(document.activeElement))) { event.preventDefault(); first.focus(); }
  }, { capture: true, signal: controller.signal });
  (element.querySelector(initialFocus || '[autofocus]') || focusable()[0] || element).focus();
}
