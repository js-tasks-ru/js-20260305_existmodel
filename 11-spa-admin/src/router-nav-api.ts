import type { Page, RouteDefinition } from "./types";

interface RouterNavApiOptions {
  routes: RouteDefinition<RouterNavApi>[];
  rootSelector: string;
}

interface NavigateOptions {
  replace?: boolean;
}

export class RouterNavApi {
  currentPage: Page | null = null;

  readonly #routes: RouteDefinition<RouterNavApi>[];
  readonly #root: HTMLElement;
  readonly #notFoundRoute: RouteDefinition<RouterNavApi> | null;
  readonly #navigation: Navigation;

  constructor({ routes, rootSelector }: RouterNavApiOptions) {
    const navigation = window.navigation;
    if (!navigation) {
      throw new Error("Navigation API is not supported in this browser");
    }

    this.#routes = routes;
    this.#root = this.#getRootElement(rootSelector);
    this.#notFoundRoute = routes.find((route) => route.path === "*") ?? null;
    this.#navigation = navigation;
  }

  init(): void {
    this.#navigation.addEventListener("navigate", this.#handleNavigate);
    void this.render(window.location.pathname + window.location.search);
  }

  destroy(): void {
    this.#navigation.removeEventListener("navigate", this.#handleNavigate);
    this.#destroyCurrentPage();
  }

  navigate(path: string, { replace = false }: NavigateOptions = {}): void {
    this.#navigation.navigate(path, {
      history: replace ? "replace" : "push",
    });
  }

  //render() ищет маршрут: routes.find(r => r.path === "/products")
  async render(path: string): Promise<void> {
    //Шаг 1 — роутер получает pathname из браузера:
    //const { pathname } = this.#parsePath(path);
    //path = "/products/abc123"  →  pathname = "/products/abc123"

    const { pathname } = this.#parsePath(path);

    let matchedParams: Record<string, string> = {};

    // перебираем все маршруты и ищем тот который совпадает с текущим URL
    // Шаг 2 — перебирает маршруты и ищет совпадение через #matchPath:
    const route =
      this.#routes.find((candidate) => {
        // #matchPath сравнивает шаблон "/products/:id" с реальным pathname "/products/abc123"
        // возвращает { id: "abc123" } если совпало, или null если нет
        //  пробует "/products/:id" против "/products/abc123"
        //  #matchPath возвращает { id: "abc123" }
        const params = this.#matchPath(candidate.path, pathname);
        if (params !== null) {
          // маршрут найден — сохраняем параметры чтобы передать в страницу
          matchedParams = params;
          return true;
        }
        return false;
      }) ?? this.#notFoundRoute; // если ни один не подошёл — берём маршрут "*"

    if (!route) {
      return;
    }

    this.#destroyCurrentPage();

    // lazy import: загружаем класс страницы только когда он нужен
    // Шаг 3 — загружает класс страницы (lazy import):

    //     Смотри в main.ts — там каждый маршрут имеет поле component:

    // {
    //   path: "/products/:id",
    //   component: () => import("./pages/product-edit-page").then(m => m.ProductEditPage)
    //         ↑ это функция которая возвращает Promise
    // }
    // route.component — это та самая функция. Она не запускается автоматически при старте приложения.
    // route.component() — вызываем её. Она делает import(...) — загружает файл с сервера только сейчас.
    // await route.component() — ждём пока файл загрузится и получаем сам класс ProductEditPage.
    // Это называется lazy loading (ленивая загрузка). Зачем:

    // Без lazy:  браузер загружает ВСЕ страницы при старте
    // С lazy:    браузер загружает страницу ТОЛЬКО когда пользователь на неё переходит
    // После await в переменной Component лежит не экземпляр, а сам класс. Поэтому следующая строка — new Component(...) — создаёт экземпляр.
    const Component = await route.component();

    // создаём экземпляр страницы и передаём контекст:
    // path — текущий URL pathname
    // router — сам роутер (страница может вызвать router.navigate())
    // params — параметры из URL, например { id: "abc123" } для /products/:id
    this.currentPage = new Component({
      path: pathname,
      router: this,
      params: matchedParams,
    });

    const element = await this.currentPage.render();
    if (element) {
      this.#root.replaceChildren(element);
    }
    this.#updateNav(pathname);
    this.#updateTitle(route.title);
  }

  #getRootElement(selector: string): HTMLElement {
    const root = document.querySelector<HTMLElement>(selector);
    if (!root) {
      throw new Error(`Router root element not found: ${selector}`);
    }

    return root;
  }

  #parsePath(path: string): Pick<URL, "pathname" | "search"> {
    const url = new URL(path, window.location.origin);
    return {
      pathname: url.pathname,
      search: url.search,
    };
  }

  #destroyCurrentPage(): void {
    this.currentPage?.destroy?.();
    this.currentPage = null;
  }

  #updateNav(pathname: string): void {
    const links =
      document.querySelectorAll<HTMLAnchorElement>("[data-nav-link]");

    links.forEach((link) => {
      const href = link.getAttribute("href");
      if (!href) {
        return;
      }

      const url = new URL(href, window.location.origin);
      const isActive = url.pathname === pathname;

      link.classList.toggle("is-active", isActive);

      if (isActive) {
        link.setAttribute("aria-current", "page");
      } else {
        link.removeAttribute("aria-current");
      }
    });
  }

  #updateTitle(title: string): void {
    document.title = title ? `${title} | Vanilla SPA` : "Vanilla SPA";
  }

  //#handleNavigate перехватывает событие браузера
  // Проверяет: можно ли перехватить? Это не якорь? Не другой сайт?
  #handleNavigate = (event: NavigationNavigateEvent): void => {
    // canIntercept — браузер сам говорит, можно ли перехватить эту навигацию.
    // Например, нельзя перехватить переход на file:// или между origin'ами на уровне браузера.
    // hashChange — переход по якорю (#section), нам не нужно рендерить страницу заново.
    // downloadRequest — пользователь скачивает файл, не трогаем.
    if (!event.canIntercept || event.hashChange || event.downloadRequest) {
      return;
    }

    // Парсим URL назначения из события — куда хочет перейти пользователь.
    const url = new URL(event.destination.url);
    // Если переход на другой сайт — отпускаем, пусть браузер делает обычный переход.
    if (url.origin !== window.location.origin) {
      return;
    }

    // intercept() говорит браузеру: "я беру управление этой навигацией на себя".
    // Браузер остановит стандартный переход и будет ждать, пока handler завершится.
    // Пока handler работает — браузер показывает состояние загрузки (спиннер в табе).
    event.intercept({
      handler: async () => {
        // signal.aborted — пользователь успел нажать "Стоп" или начал новую навигацию
        // пока мы ещё не закончили рендер предыдущей. Прерываем, чтобы не рендерить устаревшую страницу.
        if (event.signal.aborted) {
          return;
        }

        // Запускаем наш рендер: lazy-загрузка компонента + отрисовка страницы.
        await this.render(url.pathname + url.search);
      },
    });
  };

  // Проверяет совпадает ли шаблон маршрута с реальным URL.
  // pattern  = "/products/:id"   ← шаблон из конфига routes
  // pathname = "/products/abc123" ← реальный URL из браузера
  // Возвращает { id: "abc123" } если совпало, или null если нет
  #matchPath(pattern: string, pathname: string): Record<string, string> | null {
    // разбиваем по "/" на сегменты:
    // "/products/:id"    → ["", "products", ":id"]
    // "/products/abc123" → ["", "products", "abc123"]
    const patternParts = pattern.split("/");
    const pathParts = pathname.split("/");

    // разная длина — точно не совпадает
    if (patternParts.length !== pathParts.length) return null;

    const params: Record<string, string> = {};

    for (let i = 0; i < patternParts.length; i++) {
      if (patternParts[i].startsWith(":")) {
        // сегмент с ":" — это параметр, подходит любое значение
        // ":id".slice(1) = "id" — имя параметра
        // pathParts[i] = "abc123" — значение из URL
        params[patternParts[i].slice(1)] = pathParts[i];
      } else if (patternParts[i] !== pathParts[i]) {
        // обычный сегмент не совпал → маршрут не подходит
        return null;
      }
    }

    // все сегменты прошли → возвращаем параметры, например { id: "abc123" }
    return params;
  }
}

/*
Да, именно так. Роутер — это инфраструктура, он ничего не знает об админке. Ему всё равно какие страницы — он просто:

Смотрит на URL
Находит совпадение в routes
Загружает компонент и вызывает render()
Всё что специфично для твоего проекта — в main.ts (список маршрутов) и в папке pages/.

Единственное что нужно будет доработать в роутере — поддержка динамических маршрутов. Сейчас он делает только точное совпадение:


// работает
path: "/products"   →  URL /products  ✓

// не работает пока
path: "/products/:id"  →  URL /products/abc123  ✗
Это понадобится для страницы редактирования товара (/products/edit/abc123). Но это задача на потом — сначала сделаем страницы без динамических маршрутов.*/

//? Пользователь кликает на ссылку /products
//         ↓
// #handleNavigate перехватывает событие браузера
//         ↓
// Проверяет: можно ли перехватить? Это не якорь? Не другой сайт?
//         ↓
// event.intercept({ handler }) — говорит браузеру "я беру управление"
//         ↓
// вызывает render("/products")
//         ↓
// render() ищет маршрут: routes.find(r => r.path === "/products")
//         ↓
// нашёл → уничтожает текущую страницу
//         ↓
// lazy import: await route.component() → загружает ProductsPage
//         ↓
// new ProductsPage() → page.render() → вставляет в #content
