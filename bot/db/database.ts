import { drizzle } from "../../index.ts";
import * as schema from "./schema.ts";

export const database = drizzle(process.env.POSTGRES!, { schema });
export const db = database.db;
