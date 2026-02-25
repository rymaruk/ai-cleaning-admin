/**
 * Fallback when @types/react or node_modules aren't resolved (e.g. Yarn PnP before SDK).
 * Provides JSX.IntrinsicElements and react/jsx-runtime so JSX compiles.
 */
declare namespace JSX {
  interface IntrinsicElements {
    [elemName: string]: Record<string, unknown>;
  }
}

declare module "react" {
  export type ReactNode = unknown;
  export interface ReactElement {}
  export interface RefObject<T> {
    readonly current: T | null;
  }
  export interface Context<T> {
    Provider: (props: { value: T; children?: ReactNode }) => ReactElement | null;
    Consumer: unknown;
  }
  export type Ref<T> = RefObject<T> | ((instance: T | null) => void) | null;
  export type ComponentProps<T extends keyof JSX.IntrinsicElements> =
    JSX.IntrinsicElements[T] extends { ref?: infer R } ? Record<string, unknown> & { ref?: R } : Record<string, unknown>;
  export interface ButtonHTMLAttributes<T> extends HTMLAttributes<T> {
    disabled?: boolean;
    type?: "button" | "submit" | "reset";
  }
  export interface HTMLAttributes<T> {
    className?: string;
    children?: ReactNode;
    ref?: Ref<T>;
    [key: string]: unknown;
  }
  export interface KeyboardEvent<T = Element> {
    key: string;
    metaKey: boolean;
    ctrlKey: boolean;
    preventDefault(): void;
  }
  export interface ChangeEvent<T = Element> {
    target: T & { value: string };
  }
  export function useState<T>(initial: T | (() => T)): [T, (value: T | ((prev: T) => T)) => void];
  export function useCallback<T extends (...args: any[]) => any>(fn: T, deps: unknown[]): T;
  export function useMemo<T>(factory: () => T, deps: unknown[]): T;
  export function useContext<T>(context: Context<T | null>): T | null;
  export function createContext<T>(initialValue: T | null): Context<T | null>;
  export function useRef<T>(initialValue: T | null): RefObject<T>;
  export function useEffect(effect: () => void | (() => void), deps?: unknown[]): void;
  export function forwardRef<T, P = object>(
    render: (props: P, ref: Ref<T>) => ReactElement | null
  ): (props: P & { ref?: Ref<T> }) => ReactElement | null;
  export type ComponentRef<T> = RefObject<unknown>;
  export type ComponentPropsWithoutRef<T> = Record<string, unknown>;
  export type FC<P = object> = (props: P) => ReactElement | null;
}

declare module "react/jsx-runtime" {
  import type { ReactElement } from "react";
  export function jsx(
    type: unknown,
    props: unknown,
    key?: string | number
  ): ReactElement;
  export function jsxs(
    type: unknown,
    props: unknown,
    key?: string | number
  ): ReactElement;
  export const Fragment: unknown;
}
