import {
  ApplicationCommandType,
  ContextMenuCommandBuilder,
  Guild,
  MessageContextMenuCommandInteraction,
} from "discord.js";
import { ContextMenu } from "../../interfaces/context-menu";

import PinAttachmentService from "../../services/pin-attachment.service";
import PinService, { pinService } from "../../services/pin.service";

import database from "../../database";

import logger from "../../config/logger";

import PinNotFoundError from "../../errors/pin-not-found.error";
import { getDiscordGuild } from "../utils/context-menu.utils";

const data = new ContextMenuCommandBuilder()
  .setName("Unpin Message")
  .setType(ApplicationCommandType.Message);

async function getPin(targetId: string) {
  const pinByMessage = await pinService.findPinByMessageId(targetId);
  const pinByDiscord = await pinService.findPinByDiscordId(targetId);

  const pin = pinByMessage || pinByDiscord;

  if (!pin) {
    logger.error({ targetId }, "The message isn't pinned");
    throw new PinNotFoundError(targetId);
  }

  return pin;
}

async function deleteCloneMessage(
  discordGuild: Guild,
  pinnedMessageId: string,
  pinChannelId: string,
) {
  // Get the channel that the message was pinned to
  const pinsChannel = await discordGuild.channels.fetch(pinChannelId);

  if (!pinsChannel?.isTextBased()) {
    logger.error(
      { discordGuild: discordGuild.id, pinChannelId },
      "Pins channel not found",
    );

    return false;
  }

  // Fetch and delete cloned message
  const clonedMessage = await pinsChannel.messages
    .fetch(pinnedMessageId)
    .catch((error) => logger.warn(error, "Failed to fetch pinned message"));
  await clonedMessage?.delete();

  return true;
}

async function execute(interaction: MessageContextMenuCommandInteraction) {
  await interaction.deferReply({ ephemeral: true });

  // Check if the message is pinned
  const { targetId } = interaction;
  const pin = await getPin(targetId);

  const discordGuild = getDiscordGuild(interaction);

  if (pin.pinChannelId) {
    await deleteCloneMessage(
      discordGuild,
      pin.discordId,
      pin.pinChannelId,
    ).catch((error) => {
      logger.error(error, "Failed to delete cloned message");
    });
  }

  // Delete the pin
  const transactionResult = await database.transaction(async (tx) => {
    const txPinService = new PinService(tx);
    const txPinAttachmentService = new PinAttachmentService(tx);

    try {
      await txPinAttachmentService.deletePinAttachments(pin.id);
      await txPinService.deletePin(pin.id);

      logger.info({ oldPin: pin }, "Message unpinned");
      return true;
    } catch (error) {
      logger.error(error, "Failed to unpin message");
      throw error;
    }
  });

  // Unpin the message
  const getOriginalMessage = async () => {
    if (targetId === pin.messageId) return interaction.targetMessage;

    const originalChannel = await discordGuild.channels.fetch(pin.channelId);
    if (!originalChannel?.isTextBased()) return null;

    const originalMessage = await originalChannel.messages.fetch(pin.messageId);
    return originalMessage;
  };

  const originalMessage = await getOriginalMessage();
  await originalMessage?.unpin().catch(() => {});

  logger.info({ transactionResult, oldPin: pin }, "Message unpinned");

  await interaction.editReply({
    content: `Message unpinned.`,
  });
}

const unpinMessageCM: ContextMenu = {
  data,
  execute,
};

export default unpinMessageCM;
