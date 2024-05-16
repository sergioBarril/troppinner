import { ButtonInteraction } from "discord.js";
import { pinService } from "../../services/pin.service";
import { pinVoterService } from "../../services/pin-voter.service";

import PinNotFoundError from "../../errors/pin-not-found.error";
import { pinButtons, toggleVote } from "./voting.utils";
import { guildService } from "../../services/guild.service";
import GuildNotFoundError from "../../errors/guild-not-found.error";
import { handleUnpinMessage } from "../../utils/unpin.util";
import logger from "../../config/logger";

export default {
  data: { name: "downvote_pin" },
  async execute(interaction: ButtonInteraction) {
    await interaction.deferUpdate();

    if (!interaction.inCachedGuild())
      throw new Error("Interaction is not in a guild");

    const { message, guild } = interaction;

    const pin = await pinService.findPinByDiscordId(message.id);
    if (!pin) throw new PinNotFoundError(message.id);

    const userId = interaction.user.id;

    if (pin.pinnedBy === userId) {
      interaction.followUp({
        ephemeral: true,
        content: `You can't downvote your own pin!`,
      });
      return;
    }

    const existingVote = await pinVoterService.findPinVoter(pin.id, userId);

    const willBeDownvoted = existingVote?.vote !== -1;

    await toggleVote(pin.id, userId, -1, existingVote?.vote || 0);

    const { upvotes, downvotes } = await pinVoterService.getPinVotes(pin.id);

    const guildData = await guildService.findGuildByDiscordId(guild.id);
    if (!guildData) throw new GuildNotFoundError(guild.id);

    const pinScore = upvotes - downvotes;

    if (guildData.maxDownvotes && pinScore <= -guildData.maxDownvotes) {
      const { originalMessage } = await handleUnpinMessage(message);
      logger.info(
        {
          pinId: pin.id,
          upvotes,
          downvotes,
          maxDownvotes: guildData.maxDownvotes,
        },
        "Pin removed due to too many downvotes",
      );

      await originalMessage?.reply({
        content: `This pin was removed due to too many downvotes!`,
        allowedMentions: { repliedUser: false },
      });
      return;
    }

    const newButtons = pinButtons({ upvotes, downvotes });

    if (!willBeDownvoted)
      await interaction.followUp({
        ephemeral: true,
        content: `Downvote removed!`,
      });

    await interaction.editReply({ components: [newButtons] });
  },
};
