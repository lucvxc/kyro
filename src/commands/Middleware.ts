import type { Context } from "./Context.ts";

export type Next = () => Promise<void>;
export type Middleware = (ctx: Context, next: Next) => void | Promise<void>;
