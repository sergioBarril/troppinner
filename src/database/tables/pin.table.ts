/* eslint-disable import/prefer-default-export */
import { randomUUID } from "crypto";
import { text, sqliteTable, integer } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import { guildTable } from "./guild.table";

export const pinTable = sqliteTable("pin", {
  id: text("id").primaryKey().$defaultFn(randomUUID),
  discordId: text("discord_id").notNull().unique(),
  messageId: text("message_id").notNull().unique(),
  pinnedAt: integer("pinned_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  pinChannelId: text("pin_channel_id").notNull(),
  pinnedBy: text("pinned_by").notNull(),
  authorId: text("author_id").notNull(),
  channelId: text("channel_id").notNull(),
  content: text("content").notNull(),
  guildId: text("guild_id")
    .references(() => guildTable.id)
    .notNull(),
  createdAt: integer("created_at", {
    mode: "timestamp",
  }).notNull(),
});
