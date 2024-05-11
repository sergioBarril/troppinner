import { MessageContextMenuCommandInteraction } from "discord.js";
import logger from "../../config/logger";

export function getDiscordGuild(
  interaction: MessageContextMenuCommandInteraction,
) {
  if (!interaction.inCachedGuild()) {
    logger.error(interaction, "Interaction is not in a guild");
    throw new Error("Interaction is not in a guild");
  }

  return interaction.guild;
}
