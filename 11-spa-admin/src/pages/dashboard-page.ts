import Page from "../../../10-routes-browser-history-api/1-dashboard-page/index";

export class DashboardPage {
  private page = new Page();

  render() {
    return this.page.render();
  }

  destroy() {
    this.page.destroy();
  }
}

// Это просто обёртка — DashboardPage делегирует всю работу готовому классу из задания 10.
// Никакого дублирования кода.
