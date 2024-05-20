import { sql, type InferInsertModel } from "drizzle-orm";
import database, { DrizzleTransaction } from "../database";
import { pinTable } from "../database/tables";
import logger from "../../common/logger";
import PinNotFoundError from "../../errors/pin-not-found.error";

export default class PinService {
  constructor(private readonly db: DrizzleTransaction) {}

  /**
   * Find all pins
   */
  async findPins() {
    return this.db.select().from(pinTable);
  }

  /**
   * Find a pin by ID
   *
   * @param pinId
   * @returns The pin, or null if not found
   */
  async findPin(pinId: string) {
    const rows = await this.db
      .select()
      .from(pinTable)
      .where(sql`${pinTable.id} = ${pinId}`)
      .execute();

    return rows[0] || null;
  }

  /**
   * Find a pin by Discord ID
   *
   * @param discordId Pin Discord ID
   * @returns The pin, or null if not found
   */
  async findPinByDiscordId(discordId: string) {
    const rows = await this.db
      .select()
      .from(pinTable)
      .where(sql`${pinTable.discordId} = ${discordId}`)
      .execute();

    return rows[0] || null;
  }

  async findPinByMessageId(messageId: string) {
    const rows = await this.db
      .select()
      .from(pinTable)
      .where(sql`${pinTable.messageId} = ${messageId}`)
      .execute();

    return rows[0] || null;
  }

  async getPin(targetId: string) {
    const pinByMessage = await this.findPinByMessageId(targetId);
    const pinByDiscord = await this.findPinByDiscordId(targetId);

    const pin = pinByMessage || pinByDiscord;

    if (!pin) {
      logger.error({ targetId }, "The message isn't pinned");
      throw new PinNotFoundError(targetId);
    }

    return pin;
  }

  /**
   * Create a new pin
   *
   * @param newPin New pin data
   */
  async createPin(newPin: InferInsertModel<typeof pinTable>) {
    const rows = await this.db.insert(pinTable).values(newPin).returning();

    return rows[0]!;
  }

  async deletePin(pinId: string) {
    await this.db.delete(pinTable).where(sql`${pinTable.id} = ${pinId}`);
  }

  async updatePin(
    pinId: string,
    updatedPin: Partial<InferInsertModel<typeof pinTable>>,
  ) {
    const rows = await this.db
      .update(pinTable)
      .set(updatedPin)
      .where(sql`${pinTable.id} = ${pinId}`)
      .returning();

    return rows[0]!;
  }
}

export const pinService = new PinService(database);
