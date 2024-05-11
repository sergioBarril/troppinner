import {
  ApplicationCommandType,
  ContextMenuCommandBuilder,
  MessageContextMenuCommandInteraction,
} from "discord.js";
import { ContextMenu } from "../../interfaces/context-menu";

import { guildService } from "../../services/guild.service";
import PinAttachmentService from "../../services/pin-attachment.service";
import PinService, { pinService } from "../../services/pin.service";

import database from "../../database";

import logger from "../../config/logger";

import GuildNotFoundError from "../../errors/guild-not-found.error";
import GuildChannelError from "../../errors/guild-channel.error";
import PinChannelNotFoundError from "../../errors/pins-channel-not-found.error";
import PinNotFoundError from "../../errors/pin-not-found.error";

const data = new ContextMenuCommandBuilder()
  .setName("Unpin Message")
  .setType(ApplicationCommandType.Message);

async function execute(interaction: MessageContextMenuCommandInteraction) {
  await interaction.deferReply();

  // Get the guild
  if (!interaction.inCachedGuild()) {
    logger.error(interaction, "Interaction is not in a guild");
    throw new Error("Interaction is not in a guild");
  }

  const { guildId, targetId } = interaction;

  const guild = await guildService.findGuildByDiscordId(guildId);

  if (!guild) {
    logger.error(interaction, "Guild not found");
    throw new GuildNotFoundError(guildId);
  }

  if (!guild.channelId) {
    logger.error(guild, "Guild channel not assigned");
    throw new GuildChannelError();
  }

  // Check if the message is already pinned
  const oldPin = await pinService.findPinByMessageId(targetId);

  if (!oldPin) {
    logger.warn({ targetId }, "The message isn't pinned");
    throw new PinNotFoundError(targetId);
  }

  // Get the channel for pinned messages
  const pinsChannel = await interaction.guild.channels.fetch(guild.channelId);

  if (!pinsChannel || !pinsChannel.isTextBased()) {
    logger.error(guild, "Pins channel not found");
    throw new PinChannelNotFoundError(guild.channelId);
  }

  // Fetch and delete cloned message
  const clonedMessage = await pinsChannel.messages.fetch(oldPin.discordId);

  // Delete the pin
  const transactionResult = await database.transaction(async (tx) => {
    const txPinService = new PinService(tx);
    const txPinAttachmentService = new PinAttachmentService(tx);

    try {
      await txPinAttachmentService.deletePinAttachments(oldPin.id);
      await txPinService.deletePin(oldPin.id);
      await clonedMessage.delete();

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

const ping: ContextMenu = {
  data,
  execute,
};

export default ping;
