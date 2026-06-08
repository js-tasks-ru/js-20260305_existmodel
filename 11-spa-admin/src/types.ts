export interface Page {
  render(): HTMLElement | null | Promise<HTMLElement | null>;
  destroy?(): void;
}

export interface PageContext<TRouter> {
  path: string;
  router: TRouter;
  // Нужно добавить params в PageContext — чтобы страница могла получить { id: "abc123" } от роутера.
  params: Record<string, string>; // { id: "abc123" } для динамических маршрутов
  //   Record<string, string> — это просто тип для объекта где и ключи и значения строки. Для обычных страниц без параметров
  // (/products, /categories) params будет пустым объектом {}.
}

export type PageConstructor<TRouter> = new (
  context: PageContext<TRouter>,
) => Page;

export interface RouteDefinition<TRouter> {
  path: string;
  title: string;
  component: () => Promise<PageConstructor<TRouter>>;
}
