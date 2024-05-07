/* eslint-disable import/prefer-default-export */
import { text, sqliteTable, primaryKey } from "drizzle-orm/sqlite-core";
import { pinTable } from "./pin.table";

export const pinAttachmentTable = sqliteTable(
  "pin_attachment",
  {
    pinId: text("pin_id")
      .references(() => pinTable.id)
      .notNull(),
    attachmentUrl: text("attachment_url").notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.pinId, table.attachmentUrl] }),
  }),
);
