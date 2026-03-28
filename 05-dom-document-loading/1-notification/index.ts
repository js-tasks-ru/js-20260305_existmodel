import { createElement } from "../../shared/utils/create-element";

interface Options {
  duration?: number;
  type?: "success" | "error";
}

export default class NotificationMessage {
  public static activeMessage: NotificationMessage | null = null;
  public element: HTMLElement;

  private message: string;
  private duration: number;
  private timeoutId: number | null = null;
  private type: "success" | "error";

  constructor(
    message: string,
    { duration = 2000, type = "success" }: Options = {},
  ) {
    this.message = message;
    this.duration = duration;
    this.type = type;
    this.element = this.render();
    if (NotificationMessage.activeMessage) {
      NotificationMessage.activeMessage.remove();
    }
    NotificationMessage.activeMessage = this;
  }

  public show(target: HTMLElement = document.body) {
    target.append(this.element);

    if (this.timeoutId !== null) {
      clearTimeout(this.timeoutId);
    }

    this.timeoutId = setTimeout(() => {
      this.remove();
    }, this.duration);
  }

  public remove() {
    if (this.element) {
      this.element.remove();
    }
  }

  public destroy() {
    if (this.timeoutId !== null) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    this.remove();
  }

  private render(): HTMLElement {
    const duration = this.duration / 1000;
    const element = createElement(`
      <div class="notification ${this.type}" style="--value:${duration}s">
        <div class="timer"></div>
        <div class="inner-wrapper">
          <div class="notification-header">${this.type}</div>
          <div class="notification-body">
            ${this.message}
          </div>
        </div>
      </div>
    `);

    return element;
  }
}
