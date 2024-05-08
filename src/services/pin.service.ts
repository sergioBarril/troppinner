import { sql, type InferInsertModel } from "drizzle-orm";
import db from "../database";
import { pinTable } from "../database/tables";

/**
 * Find all pins
 */
export async function findPins() {
  return db.select().from(pinTable);
}

/**
 * Find a pin by ID
 *
 * @param pinId
 * @returns The pin, or null if not found
 */
export async function findPin(pinId: string) {
  const rows = await db
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
export async function findPinByDiscordId(discordId: string) {
  const rows = await db
    .select()
    .from(pinTable)
    .where(sql`${pinTable.discordId} = ${discordId}`)
    .execute();

  return rows[0] || null;
}

export async function findPinByMessageId(messageId: string) {
  const rows = await db
    .select()
    .from(pinTable)
    .where(sql`${pinTable.messageId} = ${messageId}`)
    .execute();

  return rows[0] || null;
}

/**
 * Create a new pin
 *
 * @param newPin New pin data
 * @returns
 */
export async function createPin(newPin: InferInsertModel<typeof pinTable>) {
  const rows = await db.insert(pinTable).values(newPin).returning();

  return rows[0];
}
