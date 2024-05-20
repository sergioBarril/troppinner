import { randomUUID } from "crypto";
import { text, sqliteTable, integer } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import { guildTable } from "./guild.table";
import { userTable } from "./user.table";

export const pinTable = sqliteTable("pin", {
  id: text("id").primaryKey().$defaultFn(randomUUID),
  // Pin information
  discordId: text("discord_id").unique(),
  pinnedAt: integer("pinned_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  pinChannelId: text("pin_channel_id"),
  pinnedBy: text("pinned_by")
    .references(() => userTable.id, { onDelete: "set null" })
    .notNull(),

  // Original message information
  messageId: text("message_id").notNull().unique(),
  authorId: text("author_id")
    .references(() => userTable.id, { onDelete: "set null" })
    .notNull(),
  createdAt: integer("created_at", {
    mode: "timestamp",
  }).notNull(),
  channelId: text("channel_id").notNull(),
  content: text("content").notNull(),
  guildId: text("guild_id")
    .references(() => guildTable.id, { onDelete: "cascade" })
    .notNull(),
});
