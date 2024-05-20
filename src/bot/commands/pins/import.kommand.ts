import {
  ChannelType,
  CommandInteraction,
  SlashCommandBuilder,
} from "discord.js";
import { Command } from "../../interfaces/command";
import { handlePinMessage } from "../../utils/pin.util";
import logger from "../../../common/logger";

const data = new SlashCommandBuilder()
  .setName("import")
  .setDescription("Import existing pins from a channel")
  .addChannelOption((option) =>
    option
      .setName("channel")
      .setDescription("The channel to import the pins from")
      .setRequired(true)
      .addChannelTypes(ChannelType.GuildText),
  );

async function execute(interaction: CommandInteraction) {
  await interaction.deferReply({ ephemeral: true });
  const channelId = interaction.options.get("channel", true).channel?.id;

  if (!interaction.inCachedGuild()) {
    interaction.editReply("Interaction is not in a guild");
    return;
  }

  if (!channelId) {
    interaction.editReply("Please provide a valid channel");
    return;
  }
  const { guild } = interaction;
  const channel = await guild.channels.fetch(channelId);

  if (!channel || !channel.isTextBased()) {
    interaction.editReply("Channel not found");
    return;
  }

  const pinnedMessages = await channel.messages.fetchPinned();

  logger.info(
    { pinnedMessages, channel },
    "Importing pinned messages from channel",
  );

  if (!pinnedMessages.size) {
    interaction.editReply("No pinned messages found in the channel");
    return;
  }

  const pinnerId = interaction.user.id;

  const results = await Promise.allSettled(
    pinnedMessages.map((message) => handlePinMessage(pinnerId, message)),
  );

  const successfulPins = results.filter(
    (result) => result.status === "fulfilled",
  );

  const failedPins = results.filter((result) => result.status === "rejected");

  let replyMessage = `Imported ${successfulPins.length} pins.`;

  if (failedPins.length) {
    replyMessage += `\nFailed to import ${failedPins.length} pins.`;
  }

  await interaction.editReply(replyMessage);
}

const ping: Command = {
  data,
  execute,
};

export default ping;
