import { createElement } from "../utils/create-element";

export class NotFoundPage {
  element: HTMLElement | null = null;

  render(): HTMLElement {
    this.element = createElement(`<div class="not-found">
      <h2 class="page-title">Page not found</h2>
    </div>`);

    return this.element;
  }

  destroy(): void {
    this.element?.remove();
    this.element = null;
  }
}
