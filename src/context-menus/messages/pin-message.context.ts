import {
  ApplicationCommandType,
  ContextMenuCommandBuilder,
  MessageContextMenuCommandInteraction,
  userMention,
} from "discord.js";
import { ContextMenu } from "../../interfaces/context-menu";
import { findGuildByDiscordId } from "../../services/guild.service";
import logger from "../../config/logger";
import GuildNotFoundError from "../../errors/guild-not-found.error";
import { createPin, findPinByMessageId } from "../../services/pin.service";
import DuplicatePinError from "../../errors/duplicate-pin.error";
import GuildChannelError from "../../errors/guild-channel.error";
import PinChannelNotFoundError from "../../errors/pins-channel-not-found.error";

const data = new ContextMenuCommandBuilder()
  .setName("Pin Message")
  .setType(ApplicationCommandType.Message);

async function execute(interaction: MessageContextMenuCommandInteraction) {
  await interaction.deferReply({ ephemeral: true });

  // Get the guild

  if (!interaction.inCachedGuild()) {
    logger.error(interaction, "Interaction is not in a guild");
    throw new Error("Interaction is not in a guild");
  }

  const { guildId, targetId, targetMessage } = interaction;

  const guild = await findGuildByDiscordId(guildId);

  if (!guild) {
    logger.error(interaction, "Guild not found");
    throw new GuildNotFoundError(guildId);
  }

  if (!guild.channelId) {
    logger.error(guild, "Guild channel not assigned");
    throw new GuildChannelError();
  }

  // Check if the message is already pinned
  const oldPin = await findPinByMessageId(targetId);

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
  const { createdAt, author, content } = targetMessage;
  const pinnerId = interaction.user.id;

  let cloneContent = `👤 ${userMention(author.id)}\n`;
  cloneContent += `📌 ${userMention(pinnerId)}\n`;
  cloneContent += `📨 ${targetMessage.url}:\n\n${content}`;

  const clonedMessage = await pinsChannel.send({
    content: cloneContent,
    flags: "SuppressEmbeds",
  });

  // Prepare the pin data

  const pin = await createPin({
    guildId: guild.id,
    createdAt,
    content,
    channelId: guild.channelId,
    authorId: author.id,
    messageId: targetId,
    discordId: clonedMessage.id,
    pinnedBy: pinnerId,
  });

  logger.info({ pin, clonedMessage }, "Message pinned");

  await interaction.editReply("Message pinned");
}

const ping: ContextMenu = {
  data,
  execute,
};

export default ping;
