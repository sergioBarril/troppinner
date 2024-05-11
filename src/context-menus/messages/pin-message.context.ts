import {
  ApplicationCommandType,
  ContextMenuCommandBuilder,
  MessageContextMenuCommandInteraction,
  userMention,
  time,
  TimestampStyles,
} from "discord.js";
import { ContextMenu } from "../../interfaces/context-menu";

import GuildService from "../../services/guild.service";

import logger from "../../config/logger";
import GuildNotFoundError from "../../errors/guild-not-found.error";
import { pinService } from "../../services/pin.service";
import DuplicatePinError from "../../errors/duplicate-pin.error";
import GuildChannelError from "../../errors/guild-channel.error";
import PinChannelNotFoundError from "../../errors/pins-channel-not-found.error";
import { pinAttachmentService } from "../../services/pin-attachment.service";
import database from "../../database";

const guildService = new GuildService(database);

const data = new ContextMenuCommandBuilder()
  .setName("Pin Message")
  .setType(ApplicationCommandType.Message);

async function execute(interaction: MessageContextMenuCommandInteraction) {
  await interaction.deferReply();

  // Get the guild
  if (!interaction.inCachedGuild()) {
    logger.error(interaction, "Interaction is not in a guild");
    throw new Error("Interaction is not in a guild");
  }

  const { guildId, targetId, targetMessage } = interaction;

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

  if (oldPin) {
    logger.warn({ interaction, oldPin }, "Pin already exists");
    throw new DuplicatePinError();
  }

  // Get the channel for pinned messages
  const pinsChannel = await interaction.guild.channels.fetch(guild.channelId);

  if (!pinsChannel || !pinsChannel.isTextBased()) {
    logger.error(guild, "Pins channel not found");
    throw new PinChannelNotFoundError(guild.channelId);
  }

  // Send the clone message to the pins channel
  const { createdAt, author, content, attachments, channelId } = targetMessage;
  const pinnerId = interaction.user.id;

  const attachmentArray = Array.from(attachments.values());

  let cloneContent = `👤 ${userMention(author.id)}\n`;
  cloneContent += `🕒 ${time(createdAt, TimestampStyles.ShortDateTime)}\n`;
  cloneContent += `📌 ${userMention(pinnerId)}\n`;
  cloneContent += `📨 ${targetMessage.url}\n\n${content}`;

  const clonedMessage = await pinsChannel.send({
    content: cloneContent,
    files: attachmentArray,
    flags: "SuppressEmbeds",
  });

  // Prepare the pin data

  const pin = await pinService.createPin({
    guildId: guild.id,
    createdAt,
    content,
    channelId,
    pinChannelId: guild.channelId,
    authorId: author.id,
    messageId: targetId,
    discordId: clonedMessage.id,
    pinnedBy: pinnerId,
  });

  logger.info({ pin }, "Message pinned");

  // Store the attachments
  await Promise.all(
    attachmentArray.map(({ url }) =>
      pinAttachmentService.addPinAttachment({
        pinId: pin.id,
        attachmentUrl: url,
      }),
    ),
  ).catch((error) => {
    logger.error(error, "Error storing attachment");
  });

  await interaction.editReply({
    content: `Message pinned: ${clonedMessage.url}`,
  });
}

const pinMessage: ContextMenu = {
  data,
  execute,
};

export default pinMessage;
