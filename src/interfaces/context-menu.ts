import {
  ContextMenuCommandBuilder,
  MessageContextMenuCommandInteraction,
} from "discord.js";

export interface ContextMenu {
  data: ContextMenuCommandBuilder;
  execute: (interaction: MessageContextMenuCommandInteraction) => Promise<void>;
}
