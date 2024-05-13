import { sql, type InferInsertModel } from "drizzle-orm";
import database, { DrizzleTransaction } from "../database";
import { pinVoterTable } from "../database/tables";

export default class PinVoterService {
  constructor(private readonly db: DrizzleTransaction) {}

  /**
   * Find the vote for a pin
   */
  async findPinVoter(pinId: string, userId: string) {
    const pinVoter = await this.db
      .select()
      .from(pinVoterTable)
      .where(
        sql`${pinVoterTable.pinId} = ${pinId} AND ${pinVoterTable.userId} = ${userId}`,
      );

    return pinVoter[0] || null;
  }

  /**
   * Add a new vote to a pin
   *
   * @param newVote New pin data
   */
  async addPinVote(newVote: InferInsertModel<typeof pinVoterTable>) {
    const rows = await this.db
      .insert(pinVoterTable)
      .values(newVote)
      .returning();

    return rows[0];
  }

  /**
   * Delete a pin vote
   */
  async deletePinVote(pinId: string, userId: string) {
    await this.db
      .delete(pinVoterTable)
      .where(
        sql`${pinVoterTable.pinId} = ${pinId} AND ${pinVoterTable.userId} = ${userId}`,
      )
      .execute();
  }

  /**
   * Update a pin vote
   */
  async updatePinVote(pinId: string, userId: string, vote: number) {
    await this.db
      .update(pinVoterTable)
      .set({ vote })
      .where(
        sql`${pinVoterTable.pinId} = ${pinId} AND ${pinVoterTable.userId} = ${userId}`,
      )
      .execute();
  }

  /**
   * Get the total votes for a pin
   */
  async getPinVotes(pinId: string) {
    const upvotes = await this.db
      .select()
      .from(pinVoterTable)
      .where(
        sql`${pinVoterTable.pinId} = ${pinId} AND ${pinVoterTable.vote} = 1`,
      )
      .execute();

    const downvotes = await this.db
      .select()
      .from(pinVoterTable)
      .where(
        sql`${pinVoterTable.pinId} = ${pinId} AND ${pinVoterTable.vote} = -1`,
      )
      .execute();

    return { upvotes: upvotes.length, downvotes: downvotes.length };
  }
}

export const pinVoterService = new PinVoterService(database);
