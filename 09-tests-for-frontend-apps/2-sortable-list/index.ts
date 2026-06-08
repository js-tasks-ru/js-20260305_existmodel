export default class SortableList {
  //!! изначальное состояние
  initialState = {
    isDragging: false,
    draggingElement: null as HTMLElement | null,
    placeholder: null as HTMLElement | null,
    offsetX: 0,
    offsetY: 0,
  };
  state = { ...this.initialState };

  private items: HTMLElement[];
  public element?: HTMLElement;

  constructor({ items = [] }: { items?: HTMLElement[] } = {}) {
    this.items = items;
    this.render();
    this.initListeners();
  }

  private render() {
    const list = document.createElement("ul");
    list.className = "sortable-list";

    this.items.forEach((item) => {
      item.classList.add("sortable-list__item");
      list.append(item);
    });
    this.element = list;
  }

  private initListeners(): void {
    document.addEventListener("pointerdown", this.onPointerDown);
    document.addEventListener("pointermove", this.onPointerMove);
    document.addEventListener("pointerup", this.onPointerUp);
  }

  private onPointerDown = (event: PointerEvent) => {
    const deleteHandle = (event.target as Element).closest(
      "[data-delete-handle]",
    );
    const grabHandle = (event.target as Element).closest("[data-grab-handle]");

    if (deleteHandle) {
      const li = deleteHandle.closest("li");
      li?.remove();
      return;
    }

    if (grabHandle) {
      event.preventDefault();
      const draggingElement = grabHandle.closest("li");

      if (draggingElement && this.element?.contains(draggingElement)) {
        const { left, top, width, height } =
          draggingElement.getBoundingClientRect();

        const placeholder = document.createElement("div");
        placeholder.className = "sortable-list__placeholder";
        placeholder.style.width = width + "px";
        placeholder.style.height = height + "px";

        this.element?.insertBefore(placeholder, draggingElement);

        draggingElement.classList.add("sortable-list__item_dragging");
        draggingElement.style.left = left + "px";
        draggingElement.style.top = top + "px";
        draggingElement.style.width = width + "px";
        draggingElement.style.height = height + "px";

        this.state = {
          isDragging: true,
          draggingElement: draggingElement,
          placeholder: placeholder,
          offsetX: event.clientX - left,
          offsetY: event.clientY - top,
        };
      }
    }
  };

  private onPointerMove = (event: PointerEvent) => {
    event.preventDefault();
    if (!this.state.isDragging) {
      return;
    }

    if (!this.state.draggingElement) return;

    this.state.draggingElement.style.left =
      event.clientX - this.state.offsetX + "px";
    this.state.draggingElement.style.top =
      event.clientY - this.state.offsetY + "px";
    this.state.draggingElement.style.visibility = "hidden";
    const elementUnder = document.elementFromPoint(
      event.clientX,
      event.clientY,
    );
    this.state.draggingElement.style.visibility = "visible";

    if (!this.state.placeholder) return;

    if (elementUnder) {
      const li = elementUnder.closest("li");

      if (li && li !== this.state.draggingElement) {
        const { top, height } = li.getBoundingClientRect();

        if (event.clientY < top + height / 2) {
          li.before(this.state.placeholder);
        } else {
          li.after(this.state.placeholder);
        }
      }
    }
  };

  private onPointerUp = () => {
    if (!this.state.isDragging) {
      return;
    }
    if (!this.state.placeholder || !this.state.draggingElement) return;

    this.state.placeholder.replaceWith(this.state.draggingElement);

    this.state.draggingElement.classList.remove("sortable-list__item_dragging");
    this.state.draggingElement.style.cssText = "";
    this.resetState();

    dispatchEvent(new CustomEvent("sortable-list-reorder", { bubbles: true }));
  };

  private resetState() {
    this.state = { ...this.initialState };
  }

  public remove() {
    this.element?.remove();
    document.removeEventListener("pointerdown", this.onPointerDown);
    document.removeEventListener("pointermove", this.onPointerMove);
    document.removeEventListener("pointerup", this.onPointerUp);
  }
  public destroy() {
    this.remove();
    this.element = undefined;
  }
}
