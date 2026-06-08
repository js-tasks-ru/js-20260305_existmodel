import ColumnChart from "../../08-async-code-fetch-api/1-column-chart/index";
import SortableTable from "../../08-async-code-fetch-api/2-sortable-table-v3/index";
import RangePicker from "../../07-forms-fetch-api/2-range-picker/index";

import header from "./bestsellers-header";
import { createElement } from "../../shared/utils/create-element";

const BACKEND_URL = "https://course-js.javascript.ru/";

type PageComponents = {
  sortableTable: SortableTable;
  ordersChart: ColumnChart;
  salesChart: ColumnChart;
  customersChart: ColumnChart;
  rangePicker: RangePicker;
};

export default class Page {
  public element!: HTMLElement;

  private components: Partial<PageComponents> = {};

  private from: Date;
  private to: Date;

  constructor() {
    const now = new Date(); // сегодня
    this.to = now;
    this.from = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
  }

  public async render(): Promise<HTMLElement | null> {
    this.element = createElement(this.getTemplate());

    this.components.sortableTable = new SortableTable(header, {
      url: "api/dashboard/bestsellers",
      sorted: { id: "createdAt", order: "desc" },
    });
    this.components.rangePicker = new RangePicker({
      from: this.from,
      to: this.to,
    });

    this.components.ordersChart = new ColumnChart({
      url: "api/dashboard/orders",
      range: { from: this.from, to: this.to },
      label: "orders",
    });

    this.components.salesChart = new ColumnChart({
      url: "api/dashboard/sales",
      range: { from: this.from, to: this.to },
      label: "sales",
      formatHeading: (value) => `$${value}`,
    });

    this.components.customersChart = new ColumnChart({
      url: "api/dashboard/customers",
      range: { from: this.from, to: this.to },
      label: "customers",
    });

    this.element
      .querySelector('[data-element="rangePicker"]')!
      .append(this.components.rangePicker.element);

    this.element
      .querySelector('[data-element="sortableTable"]')!
      .append(this.components.sortableTable.element);

    this.element
      .querySelector('[data-element="ordersChart"]')!
      .append(this.components.ordersChart.element);

    this.element
      .querySelector('[data-element="salesChart"]')!
      .append(this.components.salesChart.element);

    this.element
      .querySelector('[data-element="customersChart"]')!
      .append(this.components.customersChart.element);

    this.addEventListeners();
    document.querySelector(".main")?.classList.remove("is-loading");
    return this.element;
  }

  private getTemplate(): string {
    return `<div class="dashboard">
      <div class="content__top-panel">
        <h2 class="page-title">Dashboard</h2>
        <div data-element="rangePicker"></div>
      </div>
      <div data-element="chartsRoot" class="dashboard__charts">
        <div data-element="ordersChart" class="dashboard__chart_orders"></div>
        <div data-element="salesChart" class="dashboard__chart_sales"></div>
        <div data-element="customersChart" class="dashboard__chart_customers"></div>
      </div>

      <h3 class="block-title">Best sellers</h3>
      <div data-element="sortableTable">
      </div>
    </div>`;
  }

  private addEventListeners(): void {
    this.components.rangePicker?.element?.addEventListener(
      "date-select",
      this.handleDateSelect,
    );
  }

  public remove(): void {
    this.element?.remove();
  }

  private handleDateSelect = (event: Event) => {
    const { from, to } = (event as CustomEvent<{ from: Date; to: Date }>)
      .detail;

    this.components.ordersChart?.update(from, to);
    this.components.salesChart?.update(from, to);
    this.components.customersChart?.update(from, to);

    this.components.sortableTable?.destroy();
    this.components.sortableTable = new SortableTable(header, {
      url: `api/dashboard/bestsellers?from=${from.toISOString()}&to=${to.toISOString()}`,
      sorted: { id: "createdAt", order: "desc" },
    });
    if (this.element) {
      this.element
        .querySelector('[data-element="sortableTable"]')!
        .append(this.components.sortableTable.element);
    }
  };

  public destroy(): void {
    this.components.rangePicker?.element?.removeEventListener(
      "date-select",
      this.handleDateSelect,
    );
    this.remove();

    this.components.ordersChart?.destroy();
    this.components.rangePicker?.destroy();
    this.components.sortableTable?.destroy();
    this.components.salesChart?.destroy();
    this.components.customersChart?.destroy();
  }
}
