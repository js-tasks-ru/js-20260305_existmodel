interface NavigationHistoryOptions {
  history?: "push" | "replace";
}

interface NavigationDestination {
  url: string;
}

interface NavigationInterceptOptions {
  handler?: () => void | Promise<void>;
}

interface NavigationNavigateEvent extends Event {
  canIntercept: boolean;
  destination: NavigationDestination;
  downloadRequest: string | null;
  hashChange: boolean;
  signal: AbortSignal;
  intercept(options?: NavigationInterceptOptions): void;
}

interface Navigation extends EventTarget {
  addEventListener(
    type: "navigate",
    listener: (event: NavigationNavigateEvent) => void,
    options?: boolean | AddEventListenerOptions,
  ): void;
  removeEventListener(
    type: "navigate",
    listener: (event: NavigationNavigateEvent) => void,
    options?: boolean | EventListenerOptions,
  ): void;
  navigate(url: string, options?: NavigationHistoryOptions): void;
}

interface Window {
  navigation?: Navigation;
}
