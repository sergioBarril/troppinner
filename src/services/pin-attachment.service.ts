import { sql, type InferInsertModel } from "drizzle-orm";
import database, { DrizzleTransaction } from "../database";
import { pinAttachmentTable } from "../database/tables";

export default class PinAttachmentService {
  constructor(private readonly db: DrizzleTransaction) {}

  /**
   * Find all pin attachments for a pin
   */
  async findPinAttachments(pinId: string) {
    return this.db
      .select()
      .from(pinAttachmentTable)
      .where(sql`${pinAttachmentTable.pinId} = ${pinId}`);
  }

  /**
   * Add a new attachment to a pin
   *
   * @param newPin New pin data
   */
  async addPinAttachment(
    newAttachment: InferInsertModel<typeof pinAttachmentTable>,
  ) {
    const rows = await this.db
      .insert(pinAttachmentTable)
      .values(newAttachment)
      .returning();

    return rows[0];
  }
}

export const pinAttachmentService = new PinAttachmentService(database);
