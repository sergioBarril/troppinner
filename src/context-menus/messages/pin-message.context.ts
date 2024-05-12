import {
  ApplicationCommandType,
  ContextMenuCommandBuilder,
  MessageContextMenuCommandInteraction,
} from "discord.js";
import { ContextMenu } from "../../interfaces/context-menu";
import { handlePinMessage } from "../../utils/pin.util";

const data = new ContextMenuCommandBuilder()
  .setName("Pin Message")
  .setType(ApplicationCommandType.Message);

/**
 * Pin a message to the pins channel
 */
async function execute(interaction: MessageContextMenuCommandInteraction) {
  await interaction.deferReply({ ephemeral: true });

  const clonedMessage = await handlePinMessage(
    interaction.user.id,
    interaction.targetMessage,
  );

  await interaction.editReply({
    content: `Message pinned: ${clonedMessage.url}`,
  });
}

const pinMessageCM: ContextMenu = {
  data,
  execute,
};

export default pinMessageCM;
