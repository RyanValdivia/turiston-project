import type { Page } from "@playwright/test";

/** Registers a one-shot handler that accepts the next window.confirm()/alert(). */
export function acceptNextDialog(page: Page) {
  page.once("dialog", (dialog) => dialog.accept());
}
