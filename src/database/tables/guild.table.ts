/* eslint-disable import/prefer-default-export */
import { randomUUID } from "crypto";
import { text, sqliteTable, integer } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const guildTable = sqliteTable("guild", {
  id: text("id").primaryKey().$defaultFn(randomUUID),
  discordId: text("discord_id").notNull().unique(),
  createdAt: integer("created_at", { mode: "timestamp" }).default(
    sql`(unixepoch())`,
  ),
});
