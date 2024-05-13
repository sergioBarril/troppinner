import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Message,
  TimestampStyles,
  time,
  userMention,
} from "discord.js";
import { pinAttachmentService } from "../services/pin-attachment.service";

import logger from "../config/logger";
import { guildService } from "../services/guild.service";
import GuildChannelError from "../errors/guild-channel.error";
import ApiError from "../errors/api-error.error";
import { pinService } from "../services/pin.service";
import DuplicatePinError from "../errors/duplicate-pin.error";
import PinChannelNotFoundError from "../errors/pins-channel-not-found.error";

const MAX_PINNED_MESSAGES = 50;

function pinButtons() {
  const upvoteButton = new ButtonBuilder()
    .setCustomId("upvote_pin")
    .setLabel("Upvote")
    .setEmoji("👍")
    .setStyle(ButtonStyle.Success);

  const downvoteButton = new ButtonBuilder()
    .setCustomId("downvote_pin")
    .setLabel("Downvote")
    .setEmoji("👎")
    .setStyle(ButtonStyle.Danger);

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents([
    upvoteButton,
    downvoteButton,
  ]);

  return row;
}

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
    components: [pinButtons()],
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
  } else if (!pinned) {
    logger.warn(
      { currentPins: channelPins.size, targetMessage },
      "Message not pinned",
    );
  }

  return shouldBePinned;
}

export async function handlePinMessage(
  pinnerId: string,
  targetMessage: Message<boolean>,
) {
  if (!targetMessage.inGuild()) {
    throw new Error("Message is not in a guild");
  }

  const { guildId, guild: discordGuild } = targetMessage;

  const guild = await guildService.getGuildByDiscordId(guildId);

  if (!guild.channelId) {
    logger.error(guild, "Guild channel not assigned");
    throw new GuildChannelError();
  }

  // Check if the message is from pinned channel

  const { id: targetId } = targetMessage;

  if (guild.channelId === targetMessage.channelId) {
    throw new ApiError({
      message: "Can't pin a message from the pins channel.",
      statusCode: 400,
    });
  }

  const oldPin = await pinService.findPinByMessageId(targetId);

  if (oldPin) {
    logger.warn({ oldPin }, "Pin already exists");
    throw new DuplicatePinError();
  }

  // Get the channel for pinned messages
  const pinsChannel = await discordGuild.channels.fetch(guild.channelId);

  if (!pinsChannel || !pinsChannel.isTextBased()) {
    logger.error(guild, "Pins channel not found");
    throw new PinChannelNotFoundError(guild.channelId);
  }

  // Send the clone message to the pins channel
  const clonedMessage = await pinsChannel
    .send(prepareCloneMessage(pinnerId, targetMessage))
    .catch((error) => {
      logger.error(
        { targetMessage: targetMessage.id, pinnerId, error: error.message },
        "Error sending cloned message",
      );
      throw new ApiError({
        message: "Error sending cloned message",
        statusCode: 500,
      });
    });

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

  // Store the attachments
  const attachmentUrls = targetMessage.attachments.map(
    (attachment) => attachment.url,
  );
  await storeAttachments(attachmentUrls, pin.id);

  // Pin message for real
  await pinMessage(targetMessage);

  logger.info({ pin }, "Message pinned");

  return clonedMessage;
}
