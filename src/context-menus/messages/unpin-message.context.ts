import {
  ApplicationCommandType,
  ContextMenuCommandBuilder,
  MessageContextMenuCommandInteraction,
  bold,
} from "discord.js";
import { ContextMenu } from "../../interfaces/context-menu";

import logger from "../../config/logger";

import { handleUnpinMessage } from "../../utils/unpin.util";

const data = new ContextMenuCommandBuilder()
  .setName("Unpin Message")
  .setType(ApplicationCommandType.Message);

async function execute(interaction: MessageContextMenuCommandInteraction) {
  await interaction.deferReply({ ephemeral: true });

  logger.info(
    { userId: interaction.user.id, targetId: interaction.targetId },
    "Unpin message context menu interaction",
  );

  const { targetMessage } = interaction;
  const { originalMessage } = await handleUnpinMessage(targetMessage);

  await originalMessage?.reply({
    content: `@${bold(interaction.user.displayName)} unpinned this message.`,
    allowedMentions: {
      repliedUser: false,
    },
  });

  await interaction.editReply({
    content: `Message unpinned.`,
  });
}

const unpinMessageCM: ContextMenu = {
  data,
  execute,
};

export default unpinMessageCM;
