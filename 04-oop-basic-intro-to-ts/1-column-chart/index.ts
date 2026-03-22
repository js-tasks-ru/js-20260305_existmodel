import { createElement } from "../../shared/utils/create-element";

interface Options {
  data?: number[];
  label?: string;
  value?: number;
  link?: string;

  formatHeading?: (value: number) => string;
}

export default class ColumnChart {
  public chartHeight = 50;
  private data: number[];
  private label: string;
  private value: number;
  private link: string;

  private formatHeading?: (value: number) => string;

  public element: HTMLElement;
  private bodyElement: Element | null = null;

  constructor({
    data = [],
    label = "",
    value = 0,
    link = "",
    formatHeading,
  }: Options = {}) {
    this.data = data;
    this.label = label;
    this.value = value;
    this.link = link;
    this.formatHeading = formatHeading;

    this.element = this.render();

    this.updateLoadingState(data);
  }

  public update(data: number[]) {
    this.data = data;
    this.updateLoadingState(data);

    if (this.bodyElement) {
      this.bodyElement.innerHTML = this.getColumnBody(data);
    }
  }

  private render(): HTMLElement {
    const columns = this.getColumnBody(this.data);

    const heading = this.formatHeading
      ? this.formatHeading(this.value)
      : String(this.value);

    const link = this.link
      ? `<a href="${this.link}" class="column-chart__link">View all</a>`
      : "";

    const element = createElement(`
    <div class="column-chart" style="--chart-height: ${this.chartHeight}">
      <div class="column-chart__title">
        ${this.label}
        ${link}
      </div>
      <div class="column-chart__container">
        <div data-element="header" class="column-chart__header">${heading}</div>
        <div data-element="body" class="column-chart__chart">${columns}</div>
      </div>
    </div>
  `);

    this.bodyElement = element.querySelector('[data-element="body"]');

    return element;
  }

  private getColumnBody(data: number[]): string {
    const maxValue = Math.max(...data);

    if (!data.length || maxValue === 0) {
      return "";
    }

    const scale = this.chartHeight / maxValue;

    return data
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

  public remove() {
    this.element.remove();
  }

  public destroy() {
    this.remove();
  }
}
