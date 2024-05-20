import { sql, type InferInsertModel } from "drizzle-orm";
import type { DrizzleTransaction } from "../database";
import { guildTable } from "../database/tables";
import database from "../database";
import GuildNotFoundError from "../../errors/guild-not-found.error";

export default class GuildService {
  constructor(private readonly db: DrizzleTransaction) {}

  /**
   * Find all guilds
   */
  async findGuilds() {
    return this.db.select().from(guildTable);
  }

  /**
   * Find a guild by ID
   *
   * @param guildId Guild ID
   * @returns The guild, or null if not found
   */
  async findGuild(guildId: string) {
    const rows = await this.db
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
  async findGuildByDiscordId(discordId: string) {
    const rows = await this.db
      .select()
      .from(guildTable)
      .where(sql`${guildTable.discordId} = ${discordId}`)
      .execute();

    return rows[0] || null;
  }

  /**
   * Get a guild by Discord ID
   *
   * @param discordId - Discord ID of the guild
   * @throws {GuildNotFoundError} If the guild is not found
   */
  async getGuildByDiscordId(discordId: string) {
    const guild = await this.findGuildByDiscordId(discordId);

    if (!guild) {
      throw new GuildNotFoundError(discordId);
    }

    return guild;
  }

  /**
   * Create a new guild
   *
   * @param newGuild New guild data
   */
  async createGuild(newGuild: InferInsertModel<typeof guildTable>) {
    const rows = await this.db.insert(guildTable).values(newGuild).returning();

    return rows[0];
  }
}

export const guildService = new GuildService(database);
