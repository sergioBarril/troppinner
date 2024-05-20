import { ButtonInteraction } from "discord.js";
import { pinService } from "../../../api/services/pin.service";
import PinNotFoundError from "../../../errors/pin-not-found.error";
import { pinVoteService } from "../../../api/services/pin-voter.service";
import { pinButtons, toggleVote } from "./voting.utils";
import { userService } from "../../../api/services/user.service";

export default {
  data: { name: "upvote_pin" },
  async execute(interaction: ButtonInteraction) {
    await interaction.deferUpdate();

    const { message, user: discordUser } = interaction;
    const userDiscordId = discordUser.id;

    const pin = await pinService.findPinByDiscordId(message.id);
    if (!pin) throw new PinNotFoundError(message.id);

    const { id: userId } = await userService.getOrCreateUser(userDiscordId);

    if (pin.pinnedBy === userId) {
      interaction.followUp({
        ephemeral: true,
        content: `You can't upvote your own pin!`,
      });
      return;
    }

    const existingVote = await pinVoteService.findPinVote(pin.id, userId);

    await toggleVote(pin.id, userId, +1, existingVote?.vote || 0);

    const willBeUpvoted = existingVote?.vote !== 1;

    const { upvotes, downvotes } = await pinVoteService.getPinVotes(pin.id);
    const newButtons = pinButtons({ upvotes, downvotes });

    if (!willBeUpvoted)
      await interaction.followUp({
        ephemeral: true,
        content: `Upvote removed!`,
      });

    await interaction.editReply({ components: [newButtons] });
  },
};
