import pg from "postgres";
import {
  drizzle as makeDB,
  type PostgresJsDatabase,
} from "drizzle-orm/postgres-js";

export interface DrizzleOptions<
  TSchema extends Record<string, unknown> = Record<string, never>,
> {
  schema?: TSchema;
  postgres?: Parameters<typeof pg>[1];
}

export class DrizzleDB<
  TSchema extends Record<string, unknown> = Record<string, never>,
> {
  public readonly db: PostgresJsDatabase<TSchema>;
  readonly #sql: ReturnType<typeof pg>;

  public constructor(url: string, options?: DrizzleOptions<TSchema>) {
    if (!url?.trim()) throw new TypeError("Drizzle requires a connection URL.");
    this.#sql = pg(url, options?.postgres);
    this.db = makeDB({ client: this.#sql, schema: options?.schema });
  }

  public async close(): Promise<void> {
    await this.#sql.end();
  }
}

export function drizzle<
  TSchema extends Record<string, unknown> = Record<string, never>,
>(url: string, options?: DrizzleOptions<TSchema>): DrizzleDB<TSchema> {
  return new DrizzleDB(url, options);
}
