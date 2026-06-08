import { fetchJson } from "../../shared/utils/fetch-json";
import { createElement } from "../../shared/utils/create-element";

const BACKEND_URL = "https://course-js.javascript.ru";

interface Options {
  url?: string;
  range?: { from: Date; to: Date };
  label?: string;
  link?: string;
  formatHeading?: (value: number) => string;
}

export default class ColumnChart {
  public chartHeight = 50;
  private url: string;
  private label: string;
  private link: string;

  private formatHeading?: (value: number) => string;

  public element: HTMLElement;
  private bodyElement: Element | null = null;
  constructor({
    url,
    range,
    label = "",
    link = "",
    formatHeading,
  }: Options = {}) {
    this.url = url ?? "";
    this.label = label;
    this.link = link;
    this.formatHeading = formatHeading;

    this.element = this.render();

    if (range) {
      this.update(range.from, range.to);
    }
  }

  public async update(from: Date, to: Date) {
    const url = new URL(this.url, BACKEND_URL);
    url.searchParams.set("from", from.toISOString());
    url.searchParams.set("to", to.toISOString());
    let dataObject = await fetchJson<Record<string, number>>(url.toString());
    const data = Object.values(dataObject);

    this.updateLoadingState(data);
    if (this.bodyElement) {
      this.bodyElement.innerHTML = this.getColumnBody(data);
    }
    return dataObject;
  }

  private render(): HTMLElement {
    const link = this.link
      ? `<a href="${this.link}" class="column-chart__link">View all</a>`
      : "";

    const element = createElement(`
    <div class="column-chart column-chart_loading" style="--chart-height: ${this.chartHeight}">
      <div class="column-chart__title">Total
        ${this.label}
        ${link}
      </div>
      <div class="column-chart__container">
        <div data-element="header" class="column-chart__header"></div>
        <div data-element="body" class="column-chart__chart"></div>
      </div>
    </div>
  `);

    this.bodyElement = element.querySelector('[data-element="body"]');

    return element;
  }

  private getColumnBody(data: number[]): string {
    const normalizedData = data.map((item) => Math.max(0, item));
    const maxValue = Math.max(...normalizedData);

    if (!normalizedData.length || maxValue === 0) {
      return "";
    }

    const scale = this.chartHeight / maxValue;

    return normalizedData
      .map((item) => {
        const value = Math.floor(item * scale);
        const percent = ((item / maxValue) * 100).toFixed(0) + "%";
        return `<div style="--value: ${value}" data-tooltip="${percent}"></div>`;
      })
      .join("");
  }

  private updateLoadingState(data: number[]) {
    if (!data.length) {
      this.element.classList.add("column-chart_loading");
    } else {
      this.element.classList.remove("column-chart_loading");
    }
  }

  private remove() {
    this.element.remove();
  }

  public destroy() {
    this.remove();
  }
}
