import type { JQueryStatic } from 'jquery';

export interface FabEditBoxJQueryPlugin {
  dataKey: string;
  eventNamespace: string;
  events: string[];
  getInstance(element: Element): unknown;
  parse(context?: ParentNode): JQuery;
  destroy(element: Element): void;
}

export declare function toFabEditBoxJQueryEventName(value: string): string;
export declare function parseFabEditBoxDataOptions(value: string): object;
export declare function isFabEditBoxPublicMethod(
  instance: unknown,
  name: string
): boolean;
export declare function createFabEditBoxJQuery(
  $: JQueryStatic,
  fabui: {
    EditBox: new (element: Element, options?: object) => unknown;
  }
): FabEditBoxJQueryPlugin;
export default createFabEditBoxJQuery;

declare global {
  interface JQuery {
    fabeditbox(options?: object): this;
    fabeditbox(command: 'instance'): unknown;
    fabeditbox(command: 'option', name: string): unknown;
    fabeditbox(command: 'option', name: string, value: unknown): this;
    fabeditbox(command: 'option', options: object): this;
    fabeditbox(command: 'destroy'): this;
    fabeditbox(command: string, ...args: unknown[]): unknown;
  }
}
