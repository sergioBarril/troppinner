import { sql, type InferInsertModel } from "drizzle-orm";
import db from "../database";
import { pinAttachmentTable } from "../database/tables";

/**
 * Find all pin attachments for a pin
 */
export async function findPinAttachments(pinId: string) {
  return db
    .select()
    .from(pinAttachmentTable)
    .where(sql`${pinAttachmentTable.pinId} = ${pinId}`);
}

/**
 * Add a new attachment to a pin
 *
 * @param newPin New pin data
 * @returns
 */
export async function addPinAttachment(
  newAttachment: InferInsertModel<typeof pinAttachmentTable>,
) {
  const rows = await db
    .insert(pinAttachmentTable)
    .values(newAttachment)
    .returning();

  return rows[0];
}
