import { ButtonInteraction } from "discord.js";
import { pinService } from "../../services/pin.service";
import { pinVoterService } from "../../services/pin-voter.service";

import PinNotFoundError from "../../errors/pin-not-found.error";
import { pinButtons, toggleVote } from "./voting.utils";

export default {
  data: { name: "downvote_pin" },
  async execute(interaction: ButtonInteraction) {
    await interaction.deferUpdate();

    const { message } = interaction;

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
    const newButtons = pinButtons({ upvotes, downvotes });

    if (!willBeDownvoted)
      await interaction.followUp({
        ephemeral: true,
        content: `Downvote removed!`,
      });

    await interaction.editReply({ components: [newButtons] });
  },
};
