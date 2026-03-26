type SortOrder = "asc" | "desc";

type SortableTableData = Record<string, string | number>;

interface SortableTableHeader {
  id: string;
  title: string;

  sortable?: boolean;
  sortType?: "string" | "number";
  template?: (value: string | number) => string;
}

export default class SortableTable {
  public element: HTMLElement;

  private data: SortableTableData[];
  private headersConfig: SortableTableHeader[];

  constructor(
    headersConfig: SortableTableHeader[] = [],
    data: SortableTableData[] = [],
  ) {
    this.headersConfig = headersConfig;
    this.data = data;
    this.element = this.render();
  }

  private render(): HTMLElement {
    const wrapper = document.createElement("div");
    wrapper.classList.add("sortable-table");

    const header = document.createElement("div");
    header.setAttribute("data-element", "header");
    header.classList.add("sortable-table__header", "sortable-table__row");

    header.innerHTML = this.headersConfig
      .map(
        ({ id, title, sortable }) => `
      <div class="sortable-table__cell" data-id="${id}" data-sortable="${sortable}">
        <span>${title}</span>
      </div>
    `,
      )
      .join("");

    wrapper.append(header);
    wrapper.append(this.renderBody());

    return wrapper;
  }

  private renderBody(): HTMLElement {
    const body = document.createElement("div");
    body.setAttribute("data-element", "body");
    body.classList.add("sortable-table__body");

    const rows = this.data
      .map((row) => {
        const cells = this.headersConfig
          .map(({ id, template }) => {
            const cellValue = row[id];
            return template
              ? template(cellValue)
              : `<div class="sortable-table__cell">${cellValue}</div>`;
          })
          .join("");
        return `<div class="sortable-table__row">${cells}</div>`;
      })
      .join("");

    body.innerHTML = rows;
    return body;
  }

  public sort(field: string, order: SortOrder) {
    const sortColumnConfig = this.headersConfig.find((col) => col.id === field);

    const type = sortColumnConfig?.sortType;
    if (!sortColumnConfig || !sortColumnConfig.sortable) {
      return;
    }
    const directions = { asc: 1, desc: -1 };

    if (type === "string") {
      this.data = [...this.data].sort(
        (a, b) =>
          directions[order] *
          String(a[field]).localeCompare(String(b[field]), ["ru", "en"], {
            caseFirst: "upper",
            sensitivity: "variant",
          }),
      );
    } else if (type === "number") {
      this.data = [...this.data].sort(
        (a, b) => directions[order] * (Number(a[field]) - Number(b[field])),
      );
    }

    const allCells = this.element.querySelectorAll("[data-id]");
    allCells.forEach((cell) => cell.removeAttribute("data-order"));

    const activeCell = this.element.querySelector(`[data-id="${field}"]`);

    activeCell?.setAttribute("data-order", order);

    this.element.querySelector('[data-element="body"]')?.remove();
    this.element.append(this.renderBody());
  }

  remove() {
    if (this.element) {
      this.element.remove();
    }
  }

  destroy() {
    this.remove();
  }
}
