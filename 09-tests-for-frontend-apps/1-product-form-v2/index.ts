import { escapeHtml } from "../../shared/utils/escape-html";
import { fetchJson } from "../../shared/utils/fetch-json";
import { createElement } from "../../shared/utils/create-element";
import SortableList from "../2-sortable-list/index";

const IMGUR_CLIENT_ID = "28aaa2e823b03b1";
const BACKEND_URL = "https://course-js.javascript.ru";

interface ProductImage {
  url: string;
  source: string;
}

interface ImgurUploadResponse {
  data: {
    link: string;
  };
}

interface ProductSaveResponse {
  id: string;
}

interface Subcategory {
  id: string;
  title: string;
}

interface Category {
  id: string;
  title: string;
  subcategories: Subcategory[];
}

interface Product {
  id?: string;
  title?: string;
  description?: string;
  price?: number;
  discount?: number;
  quantity?: number;
  status?: number;
  subcategory?: string;
  images?: ProductImage[];
}

export default class ProductForm {
  public productId?: string;
  public element!: HTMLElement;

  private categories: Category[] = [];
  private productData?: Product;

  constructor(productId?: string) {
    this.productId = productId;
  }

  public async render(): Promise<HTMLElement | null> {
    try {
      await this.loadData();
      this.element = createElement(this.getTemplate());
      this.fillForm();
      this.addEventListeners();

      return this.element || null;
    } catch (error) {
      console.error("network error:", error);
      return null;
    }
  }

  private async loadData(): Promise<void> {
    this.categories = await fetchJson<Category[]>(
      `${BACKEND_URL}/api/rest/categories?_sort=weight&_refs=subcategory`,
    );
    if (this.productId) {
      const productArray = await fetchJson<Product[]>(
        `${BACKEND_URL}/api/rest/products?id=${this.productId}`,
      );
      this.productData = productArray[0];
    }
  }

  private getTemplate(): string {
    return `<div class="product-form"><form data-element="productForm" class="form-grid">
      <div class="form-group form-group__half_left">
        <fieldset>
          <label class="form-label">Название товара</label>
          <input required="" type="text" id="title" name="title" class="form-control" placeholder="Название товара">
        </fieldset>
      </div>
      <div class="form-group form-group__wide">
        <label class="form-label">Описание</label>
        <textarea required="" class="form-control" id="description" name="description" data-element="productDescription" placeholder="Описание товара"></textarea>
      </div>
      <div class="form-group form-group__wide" data-element="sortable-list-container">
        <label class="form-label">Фото</label>
        <div data-element="imageListContainer">
         <ul class="sortable-list"></ul>
        </div>
        <button type="button" name="uploadImage" class="button-primary-outline fit-content"><span>Загрузить</span></button>
      </div>
      <div class="form-group form-group__half_left">
        <label class="form-label">Категория</label>
        <select class="form-control" id="subcategory" name="subcategory"></select>
      </div>
      <div class="form-group form-group__half_left form-group__two-col">
        <fieldset>
          <label class="form-label">Цена ($)</label>
          <input required="" type="number" id="price" name="price" class="form-control" placeholder="100">
        </fieldset>
        <fieldset>
          <label class="form-label">Скидка ($)</label>
          <input required="" type="number" id="discount" name="discount" class="form-control" placeholder="0">
        </fieldset>
      </div>
      <div class="form-group form-group__part-half">
        <label class="form-label">Количество</label>
        <input required="" type="number" class="form-control" id="quantity" name="quantity" placeholder="1">
      </div>
      <div class="form-group form-group__part-half">
        <label class="form-label">Статус</label>
        <select class="form-control" name="status">
          <option value="1">Активен</option>
          <option value="0">Неактивен</option>
        </select>
      </div>
      <div class="form-buttons">
        <button type="submit" name="save" class="button-primary-outline">
          Сохранить товар
        </button>
      </div>
    </form></div>`;
  }

  private fillForm(): void {
    if (!this.element) return;
    const select = this.element.querySelector('[name="subcategory"]');

    if (select) {
      const options = this.categories.map((category) => {
        const subOptions = (category.subcategories || []).map(
          (sub: Subcategory) =>
            `<option value="${escapeHtml(sub.id)}">${escapeHtml(category.title)} > ${escapeHtml(sub.title)}</option>`,
        );
        return subOptions.join("");
      });

      select.innerHTML = options.join("");
    }
    if (this.productData) {
      for (const [field, value] of Object.entries(this.productData)) {
        const formField = this.element.querySelector(
          `[name="${field}"]`,
        ) as HTMLInputElement;
        if (formField) formField.value = String(value ?? "");
      }
      const imageListContainer = this.element.querySelector(
        '[data-element="imageListContainer"]',
      );

      if (!imageListContainer) return;

      const sortableList = new SortableList({
        items: (this.productData.images || []).map((image: ProductImage) =>
          this.createImageItem(image.url, image.source),
        ),
      });

      imageListContainer.innerHTML = "";
      imageListContainer.append(sortableList.element!);
    }
  }

  private createImageItem(url: string, source: string): HTMLElement {
    const element = document.createElement("li");
    element.className = "products-edit__imagelist-item";
    element.innerHTML = `
      <input type="hidden" name="url" value="${escapeHtml(url)}">
      <input type="hidden" name="source" value="${escapeHtml(source)}">
      <span>
        <img src="/icon-grab.svg" data-grab-handle="" alt="grab">
        <img class="sortable-table__cell-img" alt="${escapeHtml(source)}" src="${escapeHtml(url)}">
        <span>${escapeHtml(source)}</span>
      </span>
      <button type="button">
        <img src="/icon-trash.svg" data-delete-handle="" alt="delete">
      </button>`;
    return element;
  }

  private addEventListeners(): void {
    this.element?.addEventListener("submit", this.save);
    this.element
      ?.querySelector('[name="uploadImage"]')
      ?.addEventListener("click", this.uploadImage);
  }

  private uploadImage = (event: Event): void => {
    const target = event.target as HTMLButtonElement;
    if (target.name === "uploadImage") {
      const fileInput = document.createElement("input");
      fileInput.type = "file";
      fileInput.accept = "image/*";

      fileInput.addEventListener("change", async () => {
        const file = fileInput.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append("image", file);
        try {
          const response = await fetch("https://api.imgur.com/3/image", {
            method: "POST",
            headers: {
              Authorization: `Client-ID ${IMGUR_CLIENT_ID}`,
            },
            body: formData,
          });
          if (!response.ok) throw new Error("Failed to upload image");
          const data = (await response.json()) as ImgurUploadResponse;
          const imageUrl = data.data.link;
          const imageSource = file.name;

          const imageListContainer = this.element?.querySelector(
            '[data-element="imageListContainer"]',
          );

          if (imageListContainer) {
            const newImageItem = this.createImageItem(imageUrl, imageSource);
            imageListContainer
              .querySelector(".sortable-list")
              ?.appendChild(newImageItem);
          }
        } catch (error) {
          console.error("Image upload error:", error);
        }
      });

      fileInput.click();
    }
  };

  public save = async (event?: Event): Promise<void> => {
    event?.preventDefault();

    const imageListContainer = this.element?.querySelector(
      '[data-element="imageListContainer"]',
    );
    let images: { url: string; source: string }[] = [];

    if (imageListContainer) {
      const items = Array.from(
        imageListContainer.querySelectorAll(".products-edit__imagelist-item"),
      );

      images = items.map((item) => {
        const urlInput = item.querySelector(
          'input[name="url"]',
        ) as HTMLInputElement;
        const sourceInput = item.querySelector(
          'input[name="source"]',
        ) as HTMLInputElement;
        return { url: urlInput.value, source: sourceInput.value };
      });
    }

    const form = this.element?.querySelector<HTMLFormElement>(
      '[data-element="productForm"]',
    );
    if (!form) return;

    const productData = {
      title: (form.elements.namedItem("title") as HTMLInputElement).value,
      description: (
        form.elements.namedItem("description") as HTMLTextAreaElement
      ).value,
      price: parseFloat(
        (form.elements.namedItem("price") as HTMLInputElement).value,
      ),
      discount: parseFloat(
        (form.elements.namedItem("discount") as HTMLInputElement).value,
      ),
      quantity: parseInt(
        (form.elements.namedItem("quantity") as HTMLInputElement).value,
        10,
      ),
      subcategory: (form.elements.namedItem("subcategory") as HTMLSelectElement)
        .value,
      status:
        (form.elements.namedItem("status") as HTMLSelectElement).value === "1"
          ? 1
          : 0,
      images,
      ...(this.productId ? { id: this.productId } : {}),
    };

    const method = this.productId ? "PATCH" : "PUT";
    const result = await fetchJson<ProductSaveResponse>(
      `${BACKEND_URL}/api/rest/products`,
      {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(productData),
      },
    );

    if (this.productId) {
      this.element?.dispatchEvent(
        new CustomEvent("product-updated", {
          detail: result.id,
          bubbles: true,
        }),
      );
    } else {
      this.element?.dispatchEvent(
        new CustomEvent("product-saved", { bubbles: true }),
      );
    }
  };

  public remove(): void {
    this.element?.remove();
  }

  public destroy(): void {
    this.element?.removeEventListener("submit", this.save);
    this.element
      ?.querySelector('[name="uploadImage"]')
      ?.removeEventListener("click", this.uploadImage);
    this.remove();
  }
}
