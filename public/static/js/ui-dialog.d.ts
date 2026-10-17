export interface UiDialogOptions {
  labelledBy?: string;
  initialFocus?: string;
  onClose?: () => void;
  nested?: boolean;
  returnFocus?: HTMLElement;
}

export function openUiDialog(element: HTMLElement, options?: UiDialogOptions): void;
export function closeUiDialog(element?: HTMLElement): void;
