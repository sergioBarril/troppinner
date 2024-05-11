import {
  ApplicationCommandType,
  ContextMenuCommandBuilder,
  MessageContextMenuCommandInteraction,
} from "discord.js";
import { ContextMenu } from "../../interfaces/context-menu";

import PinAttachmentService from "../../services/pin-attachment.service";
import PinService, { pinService } from "../../services/pin.service";

import database from "../../database";

import logger from "../../config/logger";

import PinChannelNotFoundError from "../../errors/pins-channel-not-found.error";
import PinNotFoundError from "../../errors/pin-not-found.error";
import { getDiscordGuild } from "../utils/context-menu.utils";

const data = new ContextMenuCommandBuilder()
  .setName("Unpin Message")
  .setType(ApplicationCommandType.Message);

async function execute(interaction: MessageContextMenuCommandInteraction) {
  await interaction.deferReply({ ephemeral: true });

  // Check if the message is pinned
  const { targetId } = interaction;
  const oldPinByMessage = await pinService.findPinByMessageId(targetId);
  const oldPinByDiscord = await pinService.findPinByDiscordId(targetId);

  const oldPin = oldPinByMessage || oldPinByDiscord;

  if (!oldPin) {
    logger.warn({ targetId }, "The message isn't pinned");
    throw new PinNotFoundError(targetId);
  }

  // Get the channel that the message was pinned to
  const discordGuild = getDiscordGuild(interaction);
  const pinsChannel = await discordGuild.channels.fetch(oldPin.pinChannelId);

  if (!pinsChannel || !pinsChannel.isTextBased()) {
    logger.error({ oldPin }, "Pins channel not found");
    throw new PinChannelNotFoundError(oldPin.pinChannelId);
  }

  // Fetch and delete cloned message
  const clonedMessage = await pinsChannel.messages
    .fetch(oldPin.discordId)
    .catch((error) => logger.warn(error, "Failed to fetch pinned message"));

  // Delete the pin
  const transactionResult = await database.transaction(async (tx) => {
    const txPinService = new PinService(tx);
    const txPinAttachmentService = new PinAttachmentService(tx);

    try {
      await txPinAttachmentService.deletePinAttachments(oldPin.id);
      await txPinService.deletePin(oldPin.id);
      await clonedMessage?.delete();

      logger.info({ oldPin }, "Message unpinned");
      return true;
    } catch (error) {
      logger.error(error, "Failed to unpin message");
      throw error;
    }
  });

  logger.info({ transactionResult, oldPin }, "Message unpinned");

  await interaction.editReply({
    content: `Message unpinned.`,
  });
}

const unpinMessage: ContextMenu = {
  data,
  execute,
};

export default unpinMessage;
