import dotenv from "dotenv";
import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";

import * as schema from "./tables";

dotenv.config();

const client = createClient({
  url: process.env.DATABASE_URL!,
  authToken: process.env.DATABASE_AUTH_TOKEN,
});

const database = drizzle(client, { schema });

type DrizzleConnection = typeof database;

export type DrizzleTransaction =
  | DrizzleConnection
  | Parameters<Parameters<DrizzleConnection["transaction"]>[0]>[0];

export default database;
