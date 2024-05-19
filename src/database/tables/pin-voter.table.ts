import {
  text,
  sqliteTable,
  primaryKey,
  integer,
} from "drizzle-orm/sqlite-core";
import { pinTable } from "./pin.table";
import { userTable } from "./user.table";

export const pinVoterTable = sqliteTable(
  "pin_voter",
  {
    pinId: text("pin_id")
      .references(() => pinTable.id, { onDelete: "cascade" })
      .notNull(),
    userId: text("user_id")
      .references(() => userTable.id, { onDelete: "cascade" })
      .notNull(),
    vote: integer("vote").notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.pinId, table.userId] }),
  }),
);
