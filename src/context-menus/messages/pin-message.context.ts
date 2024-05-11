import {
  ApplicationCommandType,
  ContextMenuCommandBuilder,
  MessageContextMenuCommandInteraction,
  userMention,
  time,
  TimestampStyles,
  Message,
} from "discord.js";
import { ContextMenu } from "../../interfaces/context-menu";

import GuildService from "../../services/guild.service";

import logger from "../../config/logger";
import { pinService } from "../../services/pin.service";
import DuplicatePinError from "../../errors/duplicate-pin.error";
import GuildChannelError from "../../errors/guild-channel.error";
import PinChannelNotFoundError from "../../errors/pins-channel-not-found.error";
import { pinAttachmentService } from "../../services/pin-attachment.service";
import database from "../../database";
import { getDiscordGuild } from "../utils/context-menu.utils";

const guildService = new GuildService(database);

const MAX_PINNED_MESSAGES = 50;

const data = new ContextMenuCommandBuilder()
  .setName("Pin Message")
  .setType(ApplicationCommandType.Message);

function prepareCloneMessage(pinnerId: string, targetMessage: Message) {
  const { createdAt, author, content, attachments } = targetMessage;

  const attachmentArray = Array.from(attachments.values());

  let cloneContent = `👤 ${userMention(author.id)}\n`;
  cloneContent += `🕒 ${time(createdAt, TimestampStyles.ShortDateTime)}\n`;
  cloneContent += `📌 ${userMention(pinnerId)}\n`;
  cloneContent += `📨 ${targetMessage.url}\n\n${content}`;

  return {
    content: cloneContent,
    files: attachmentArray,
    flags: "SuppressEmbeds" as const,
  };
}

async function storeAttachments(attachments: string[], pinId: string) {
  return Promise.all(
    attachments.map((url) =>
      pinAttachmentService.addPinAttachment({
        pinId,
        attachmentUrl: url,
      }),
    ),
  ).catch((error) => {
    logger.error(error, "Error storing attachment");
  });
}

async function pinMessage(targetMessage: Message<boolean>) {
  const { channel, pinnable, pinned } = targetMessage;
  const channelPins = await channel.messages.fetchPinned();

  const shouldBePinned =
    channelPins.size < MAX_PINNED_MESSAGES && pinnable && !pinned;

  if (shouldBePinned) {
    await targetMessage.pin();
    logger.info({ targetMessage }, "Message truly pinned");
  } else {
    logger.warn({ targetMessage }, "Message not pinned");
  }

  return shouldBePinned;
}

/**
 * Pin a message to the pins channel
 */
async function execute(interaction: MessageContextMenuCommandInteraction) {
  await interaction.deferReply({ ephemeral: true });

  const discordGuild = getDiscordGuild(interaction);
  const guildId = discordGuild.id;

  const guild = await guildService.getGuildByDiscordId(guildId);
  if (!guild.channelId) {
    logger.error(guild, "Guild channel not assigned");
    throw new GuildChannelError();
  }

  // Check if the message is from pinned channel
  const { targetId, targetMessage } = interaction;

  if (guild.channelId === targetMessage.channelId) {
    logger.error({ interaction, targetMessage }, "Message already pinned");
    interaction.editReply({
      content: "Can't pin a message from the pins channel.",
    });
    return;
  }

  const oldPin = await pinService.findPinByMessageId(targetId);

  if (oldPin) {
    logger.warn({ interaction, oldPin }, "Pin already exists");
    throw new DuplicatePinError();
  }

  // Get the channel for pinned messages
  const pinsChannel = await discordGuild.channels.fetch(guild.channelId);

  if (!pinsChannel || !pinsChannel.isTextBased()) {
    logger.error(guild, "Pins channel not found");
    throw new PinChannelNotFoundError(guild.channelId);
  }

  // Send the clone message to the pins channel
  const pinnerId = interaction.user.id;
  const clonedMessage = await pinsChannel.send(
    prepareCloneMessage(pinnerId, targetMessage),
  );

  // Prepare the pin data
  const { createdAt, author, content, channelId } = targetMessage;
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
  const attachmentUrls = targetMessage.attachments.map(
    (attachment) => attachment.url,
  );
  await storeAttachments(attachmentUrls, pin.id);

  // Pin message for real
  await pinMessage(targetMessage);

  await interaction.editReply({
    content: `Message pinned: ${clonedMessage.url}`,
  });
}

const pinMessageCM: ContextMenu = {
  data,
  execute,
};

export default pinMessageCM;
