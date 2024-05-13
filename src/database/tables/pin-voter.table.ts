import {
  text,
  sqliteTable,
  primaryKey,
  integer,
} from "drizzle-orm/sqlite-core";
import { pinTable } from "./pin.table";

export const pinVoterTable = sqliteTable(
  "pin_voter",
  {
    pinId: text("pin_id")
      .references(() => pinTable.id)
      .notNull(),
    userId: text("user_id").notNull(),
    vote: integer("vote").notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.pinId, table.userId] }),
  }),
);
