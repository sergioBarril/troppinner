import { sql, type InferInsertModel } from "drizzle-orm";
import db from "../database";
import { guildTable } from "../database/tables";

/**
 * Find all guilds
 */
export async function findGuilds() {
  return db.select().from(guildTable);
}

/**
 * Find a guild by ID
 *
 * @param guildId Guild ID
 * @returns The guild, or null if not found
 */
export async function findGuild(guildId: string) {
  const rows = await db
    .select()
    .from(guildTable)
    .where(sql`${guildTable.id} = ${guildId}`)
    .execute();

  return rows[0] || null;
}

/**
 * Find a guild by Discord ID
 *
 * @param discordId Guild Discord ID
 * @returns The guild, or null if not found
 */
export async function findGuildByDiscordId(discordId: string) {
  const rows = await db
    .select()
    .from(guildTable)
    .where(sql`${guildTable.discordId} = ${discordId}`)
    .execute();

  return rows[0] || null;
}

/**
 * Create a new guild
 *
 * @param newGuild New guild data
 * @returns
 */
export async function createGuild(
  newGuild: InferInsertModel<typeof guildTable>,
) {
  const rows = await db.insert(guildTable).values(newGuild).returning();

  return rows[0];
}
