import { randomUUID } from "crypto";
import { text, sqliteTable, integer } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const guildTable = sqliteTable("guild", {
  id: text("id").primaryKey().$defaultFn(randomUUID),
  discordId: text("discord_id").notNull().unique(),
  channelId: text("channel_id"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  maxDownvotes: integer("max_downvotes"),
});
