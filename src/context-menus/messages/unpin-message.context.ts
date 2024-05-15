import {
  ApplicationCommandType,
  ContextMenuCommandBuilder,
  Guild,
  MessageContextMenuCommandInteraction,
  bold,
} from "discord.js";
import { ContextMenu } from "../../interfaces/context-menu";

import PinAttachmentService from "../../services/pin-attachment.service";
import PinService, { pinService } from "../../services/pin.service";

import database from "../../database";

import logger from "../../config/logger";

import PinNotFoundError from "../../errors/pin-not-found.error";
import { getDiscordGuild } from "../utils/context-menu.utils";
import PinVoterService from "../../services/pin-voter.service";

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

  logger.info(
    { userId: interaction.user.id, targetId: interaction.targetId },
    "Unpin message context menu interaction",
  );

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
    const txPinVoterService = new PinVoterService(tx);

    try {
      await txPinVoterService.deletePin(pin.id);
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

  const originalMessage = await getOriginalMessage().catch(() => {});
  await originalMessage?.unpin().catch(() => {});

  await originalMessage?.reply({
    content: `@${bold(interaction.user.displayName)} unpinned this message.`,
    allowedMentions: {
      repliedUser: false,
    },
  });

  logger.info(
    { transactionResult, oldPin: pin },
    "Message unpin process complete successfully",
  );

  await interaction.editReply({
    content: `Message unpinned.`,
  });
}

const unpinMessageCM: ContextMenu = {
  data,
  execute,
};

export default unpinMessageCM;
