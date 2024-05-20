import { sql, type InferInsertModel } from "drizzle-orm";
import type { DrizzleTransaction } from "../database";
import { userTable } from "../database/tables";
import database from "../database";
import UserNotFoundError from "../../errors/user-not-found.error";

export default class UserService {
  constructor(private readonly db: DrizzleTransaction) {}

  /**
   * Find all users
   */
  async findUsers() {
    return this.db.select().from(userTable);
  }

  /**
   * Find a user by ID
   *
   * @param userId User ID
   * @returns The user, or null if not found
   */
  async findUser(userId: string) {
    const rows = await this.db
      .select()
      .from(userTable)
      .where(sql`${userTable.id} = ${userId}`)
      .execute();

    return rows[0] || null;
  }

  /**
   * Find a user by Discord ID
   *
   * @param discordId User Discord ID
   * @returns The user, or null if not found
   */
  async findUserByDiscordId(discordId: string) {
    const rows = await this.db
      .select()
      .from(userTable)
      .where(sql`${userTable.discordId} = ${discordId}`)
      .execute();

    return rows[0] || null;
  }

  /**
   * Get a user by Discord ID
   *
   * @param discordId - Discord ID of the user
   * @throws {UserNotFoundError} If the user is not found
   */
  async getUserByDiscordId(discordId: string) {
    const user = await this.findUserByDiscordId(discordId);

    if (!user) {
      throw new UserNotFoundError(discordId);
    }

    return user;
  }

  /**
   * Create a new user
   *
   * @param newUser New user data
   */
  async createUser(newUser: InferInsertModel<typeof userTable>) {
    const rows = await this.db.insert(userTable).values(newUser).returning();

    return rows[0]!;
  }

  async getOrCreateUser(discordId: string) {
    let user = await this.findUserByDiscordId(discordId);

    if (!user) {
      user = await this.createUser({ discordId });
    }

    return user;
  }
}

export const userService = new UserService(database);
