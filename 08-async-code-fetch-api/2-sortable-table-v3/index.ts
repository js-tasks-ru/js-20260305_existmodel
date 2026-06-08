import { fetchJson } from "../../shared/utils/fetch-json";

const BACKEND_URL = "https://course-js.javascript.ru";

type SortOrder = "asc" | "desc";

type SortableTableData = Record<string, unknown>;

type SortableTableSort = {
  id: string;
  order: SortOrder;
};

interface SortableTableHeader {
  id: string;
  title: string;
  sortable?: boolean;
  sortType?: "string" | "number" | "custom";
  template?: (value: unknown) => string;
  customSorting?: (a: SortableTableData, b: SortableTableData) => number;
}

interface Options {
  url?: string;
  sorted?: SortableTableSort;
  isSortLocally?: boolean;
  step?: number;
  start?: number;
  end?: number;
}

export default class SortableTable {
  private headersConfig: SortableTableHeader[];
  private data: any[] = [];
  private sorted?: SortableTableSort;
  private isSortLocally: boolean;
  private url: string;
  private step?: number;
  private start?: number;
  private end?: number;
  private observer!: IntersectionObserver;

  public element: HTMLElement;

  constructor(
    headersConfig: SortableTableHeader[] = [],
    { url, sorted, isSortLocally = false, step, start, end }: Options = {},
  ) {
    this.headersConfig = headersConfig;
    this.sorted = sorted;
    this.isSortLocally = isSortLocally;
    this.url = url ?? "";
    this.step = step;
    this.start = start;
    this.end = end;
    this.element = this.renderElement();
    this.initListeners();
    this.render();
  }

  public async render() {
    if (this.sorted) {
      if (this.isSortLocally) {
        await this.loadData();
        this.sortOnClient(this.sorted.id, this.sorted.order);
      } else {
        await this.sortOnServer(this.sorted.id, this.sorted.order);
      }
    } else {
      await this.loadData();
      this.element.querySelector('[data-element="body"]')?.remove();
      const sentinel = this.element.querySelector('[data-element="sentinel"]');
      this.element.insertBefore(this.renderBody(), sentinel);
    }
  }

  private renderElement(): HTMLElement {
    const wrapper = document.createElement("div");
    wrapper.classList.add("sortable-table");

    const header = document.createElement("div");
    header.setAttribute("data-element", "header");
    header.classList.add("sortable-table__header", "sortable-table__row");

    const sentinel = document.createElement("div");
    sentinel.setAttribute("data-element", "sentinel");

    header.innerHTML = this.headersConfig
      .map(
        ({ id, title, sortable }) => `
      <div class="sortable-table__cell" data-id="${id}" data-sortable="${sortable}">
        <span>${title}</span>
        <span data-element="arrow" class="sortable-table__sort-arrow">
          <span class="sort-arrow"></span>
        </span>
      </div>
    `,
      )
      .join("");

    const loading = document.createElement("div");
    loading.setAttribute("data-element", "loading");
    loading.classList.add("loading-line", "sortable-table__loading-line");

    const emptyPlaceholder = document.createElement("div");
    emptyPlaceholder.setAttribute("data-element", "emptyPlaceholder");
    emptyPlaceholder.classList.add("sortable-table__empty-placeholder");
    emptyPlaceholder.innerHTML = `<div><p>No products satisfies your filter criteria</p><button type="button" class="button-primary-outline">Reset all filters</button></div>`;

    wrapper.append(header);
    wrapper.append(this.renderBody());
    wrapper.append(loading);
    wrapper.append(emptyPlaceholder);
    wrapper.append(sentinel);

    return wrapper;
  }

  private renderRows(data: any[]): string {
    return data
      .map((row) => {
        const cells = this.headersConfig
          .map(({ id, template }) => {
            const cellValue = row[id];
            return template
              ? template(cellValue)
              : `<div class="sortable-table__cell">${cellValue}</div>`;
          })
          .join("");
        return `<a href="/products/${row.id}" class="sortable-table__row">${cells}</a>`;
      })
      .join("");
  }

  private renderBody(): HTMLElement {
    const body = document.createElement("div");
    body.setAttribute("data-element", "body");
    body.classList.add("sortable-table__body");
    body.innerHTML = this.renderRows(this.data);
    return body;
  }

  private updateDOM(field: string, order: SortOrder) {
    this.element
      .querySelectorAll("[data-id]")
      .forEach((cell) => cell.removeAttribute("data-order"));
    this.element
      .querySelector(`[data-id="${field}"]`)
      ?.setAttribute("data-order", order);
    this.element.querySelector('[data-element="body"]')?.remove();
    const sentinel = this.element.querySelector('[data-element="sentinel"]');
    this.element.insertBefore(this.renderBody(), sentinel);
  }

  public sort(field: string, order: SortOrder) {
    if (this.isSortLocally) {
      this.sortOnClient(field, order);
    } else {
      this.sortOnServer(field, order);
    }
  }

  public sortOnClient(field: string, order: SortOrder) {
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
    } else if (type === "custom" && sortColumnConfig.customSorting) {
      const customSorting = sortColumnConfig.customSorting;
      this.data = [...this.data].sort((a, b) => {
        return directions[order] * customSorting(a, b);
      });
    }

    this.updateDOM(field, order);
  }

  public async sortOnServer(field: string, order: SortOrder) {
    this.sorted = { id: field, order: order };
    this.start = 0;
    this.end = this.step;

    await this.loadData();
    this.updateDOM(field, order);
  }

  private initListeners(): void {
    this.element.addEventListener("pointerdown", this.clickOnHeader);

    const options = {
      root: null,
      rootMargin: "0px",
      threshold: 1.0,
    };

    if (typeof IntersectionObserver !== "undefined") {
      this.observer = new IntersectionObserver(this.onIntersection, options);
      const sentinel = this.element.querySelector('[data-element="sentinel"]');
      if (sentinel) this.observer.observe(sentinel);
    } else {
      console.warn("IntersectionObserver is not supported in this environment");
    }
  }

  private async loadData() {
    this.element.classList.add("sortable-table_loading");

    const url = new URL(this.url, BACKEND_URL);

    if (this.sorted) {
      url.searchParams.set("_sort", this.sorted.id);
      url.searchParams.set("_order", this.sorted.order);
    }
    url.searchParams.set("_start", String(this.start ?? 0));
    url.searchParams.set("_end", String(this.end ?? this.step ?? 30));

    try {
      const data = await fetchJson<any[]>(url.toString());
      this.data = data;

      if (data.length === 0) {
        this.element.classList.add("sortable-table_empty");
      } else {
        this.element.classList.remove("sortable-table_empty");
      }

      this.element.classList.remove("sortable-table_loading");
      return data;
    } catch (err) {
      console.error("Failed to load data:", err);
      this.element.classList.add("sortable-table_empty");
      return [];
    } finally {
      this.element.classList.remove("sortable-table_loading");
    }
  }

  private clickOnHeader = (event: PointerEvent) => {
    const cell = (event.target as HTMLElement).closest<HTMLElement>(
      "[data-id]",
    );

    if (!cell) {
      return;
    }

    const field = cell.dataset.id;
    const currentOrder = cell.dataset.order;
    const newOrder = currentOrder === "desc" ? "asc" : "desc";
    if (!field) return;
    this.sort(field, newOrder);
  };

  private onIntersection = async (entries: IntersectionObserverEntry[]) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        this.start = this.end;
        this.end = (this.end ?? 0) + (this.step ?? 30);

        const newData = await this.loadData();

        const body = this.element.querySelector('[data-element="body"]');
        if (body && newData?.length) {
          body.insertAdjacentHTML("beforeend", this.renderRows(newData));
        }
      }
    }
  };

  public destroy() {
    if (!this.element) {
      return;
    }
    this.element.removeEventListener("pointerdown", this.clickOnHeader);
    if (this.observer) this.observer.disconnect();
    this.element.remove();
  }
}
