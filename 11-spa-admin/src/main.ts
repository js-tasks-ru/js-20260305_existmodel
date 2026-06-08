import "./styles.css";

import { RouterNavApi } from "./router-nav-api";
import type { RouteDefinition } from "./types";

const routes = [
  {
    path: "/",
    title: "Dashboard",
    component: () =>
      import("./pages/dashboard-page").then((m) => m.DashboardPage),
  },
  {
    path: "/products",
    title: "Products",
    component: () =>
      import("./pages/products-page").then((m) => m.ProductsPage),
  },
  // /products/add — точный маршрут, стоит ПЕРЕД /:id
  // иначе роутер поймает "add" как id товара
  {
    path: "/products/add",
    title: "Add Product",
    component: () =>
      import("./pages/product-edit-page").then((m) => m.ProductEditPage),
  },
  // /products/:id — динамический маршрут
  // :id подойдёт под любое значение: /products/abc123, /products/42 и т.д.
  // роутер передаст { id: "abc123" } в context.params
  {
    path: "/products/:id",
    title: "Edit Product",
    component: () =>
      import("./pages/product-edit-page").then((m) => m.ProductEditPage),
  },
  {
    path: "/categories",
    title: "Categories",
    component: () =>
      import("./pages/categories-page").then((m) => m.CategoriesPage),
  },
  {
    path: "/sales",
    title: "Sales",
    component: () => import("./pages/sales-page").then((m) => m.SalesPage),
  },
  {
    path: "*",
    title: "Not Found",
    component: () =>
      import("./pages/not-found-page").then((m) => m.NotFoundPage),
  },
] satisfies RouteDefinition<RouterNavApi>[];

const router = new RouterNavApi({
  routes,
  rootSelector: "#content",
});

router.init();

document.querySelector(".sidebar__toggler")?.addEventListener("click", () => {
  document.body.classList.toggle("is-collapsed-sidebar");
});
