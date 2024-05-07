import { sql, type InferInsertModel } from "drizzle-orm";
import db from "../database";
import { pinTable } from "../database/tables";

/**
 * Get all pins
 */
export async function getPins() {
  return db.select().from(pinTable);
}

/**
 * Get a pin by ID
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
 * Create a new pin
 *
 * @param newPin New pin data
 * @returns
 */
export async function createGuild(newPin: InferInsertModel<typeof pinTable>) {
  const rows = await db.insert(pinTable).values(newPin).returning();

  return rows[0];
}
