import {
  ApplicationCommandType,
  ContextMenuCommandBuilder,
  MessageContextMenuCommandInteraction,
  bold,
} from "discord.js";
import { ContextMenu } from "../../interfaces/context-menu";
import { handlePinMessage } from "../../utils/pin.util";
import logger from "../../config/logger";

const data = new ContextMenuCommandBuilder()
  .setName("Pin Message")
  .setType(ApplicationCommandType.Message);

/**
 * Pin a message to the pins channel
 */
async function execute(interaction: MessageContextMenuCommandInteraction) {
  await interaction.deferReply({ ephemeral: true });

  const { user, targetMessage } = interaction;
  const userId = user.id;

  logger.info(
    { userId, targetId: targetMessage.id },
    "Pin message context menu interaction",
  );

  const { clonedMessage } = await handlePinMessage(userId, targetMessage);

  await interaction.editReply({
    content: `Message pinned.`,
  });

  await targetMessage
    .reply({
      content: `@${bold(user.displayName)} pinned this message: ${clonedMessage.url}`,
      allowedMentions: { repliedUser: false },
    })
    .catch((error) => {
      logger.error(error, "Failed to send message");
    });
}

const pinMessageCM: ContextMenu = {
  data,
  execute,
};

export default pinMessageCM;
