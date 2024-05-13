import { ButtonInteraction } from "discord.js";
import { pinService } from "../../services/pin.service";
import { pinVoterService } from "../../services/pin-voter.service";

import PinNotFoundError from "../../errors/pin-not-found.error";
import { pinButtons, toggleVote } from "./voting.utils";

export default {
  data: { name: "downvote_pin" },
  async execute(interaction: ButtonInteraction) {
    await interaction.deferReply({ ephemeral: true });

    const { message } = interaction;

    const pin = await pinService.findPinByDiscordId(message.id);
    if (!pin) throw new PinNotFoundError(message.id);

    const existingVote = await pinVoterService.findPinVoter(
      pin.id,
      interaction.user.id,
    );

    const willBeDownvoted = existingVote?.vote !== -1;

    await toggleVote(pin.id, interaction.user.id, -1, existingVote?.vote || 0);

    const { upvotes, downvotes } = await pinVoterService.getPinVotes(pin.id);
    const newButtons = pinButtons({ upvotes, downvotes });

    const replyMessage = willBeDownvoted ? "Downvoted!" : "Downvote removed!";

    await interaction.editReply({ content: replyMessage });
    await message.edit({ components: [newButtons] });
  },
};
