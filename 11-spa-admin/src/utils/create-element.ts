export function createElement<TElement extends HTMLElement>(
  html: string,
): TElement {
  const template = document.createElement("template");
  template.innerHTML = html.trim();

  const element = template.content.firstElementChild;
  if (!(element instanceof HTMLElement)) {
    throw new Error("Expected HTML markup with a root HTMLElement");
  }

  return element as TElement;
}
