import { sql, type InferInsertModel } from "drizzle-orm";
import database, { DrizzleTransaction } from "../database";
import { pinVoteTable } from "../database/tables";

export default class PinVoteService {
  constructor(private readonly db: DrizzleTransaction) {}

  /**
   * Find the vote for a pin
   */
  async findPinVote(pinId: string, userId: string) {
    const pinVoter = await this.db
      .select()
      .from(pinVoteTable)
      .where(
        sql`${pinVoteTable.pinId} = ${pinId} AND ${pinVoteTable.userId} = ${userId}`,
      );

    return pinVoter[0] || null;
  }

  /**
   * Add a new vote to a pin
   *
   * @param newVote New pin data
   */
  async addPinVote(newVote: InferInsertModel<typeof pinVoteTable>) {
    const rows = await this.db.insert(pinVoteTable).values(newVote).returning();

    return rows[0];
  }

  /**
   * Delete a pin vote
   */
  async deletePinVote(pinId: string, userId: string) {
    await this.db
      .delete(pinVoteTable)
      .where(
        sql`${pinVoteTable.pinId} = ${pinId} AND ${pinVoteTable.userId} = ${userId}`,
      )
      .execute();
  }

  /**
   * Update a pin vote
   */
  async updatePinVote(pinId: string, userId: string, vote: number) {
    await this.db
      .update(pinVoteTable)
      .set({ vote })
      .where(
        sql`${pinVoteTable.pinId} = ${pinId} AND ${pinVoteTable.userId} = ${userId}`,
      )
      .execute();
  }

  /**
   * Get the total votes for a pin
   */
  async getPinVotes(pinId: string) {
    const upvotes = await this.db
      .select()
      .from(pinVoteTable)
      .where(sql`${pinVoteTable.pinId} = ${pinId} AND ${pinVoteTable.vote} = 1`)
      .execute();

    const downvotes = await this.db
      .select()
      .from(pinVoteTable)
      .where(
        sql`${pinVoteTable.pinId} = ${pinId} AND ${pinVoteTable.vote} = -1`,
      )
      .execute();

    return { upvotes: upvotes.length, downvotes: downvotes.length };
  }

  /**
   * Delete all votes for a pin
   */
  async deletePin(pinId: string) {
    await this.db
      .delete(pinVoteTable)
      .where(sql`${pinVoteTable.pinId} = ${pinId}`);
  }
}

export const pinVoteService = new PinVoteService(database);
