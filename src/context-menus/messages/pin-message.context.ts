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

  const { pinnedForReal, clonedMessage } = await handlePinMessage(
    userId,
    targetMessage,
  );

  await interaction.editReply({
    content: `Message pinned.`,
  });

  if (!pinnedForReal) {
    await interaction.followUp({
      content: `@${bold(user.displayName)} pinned a message: ${clonedMessage.url}`,
    });
  }
}

const pinMessageCM: ContextMenu = {
  data,
  execute,
};

export default pinMessageCM;
