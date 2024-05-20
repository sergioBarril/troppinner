import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import { pinVoteService } from "../../../api/services/pin-voter.service";

type PinButtonsProps = {
  upvotes: number;
  downvotes: number;
};

export function pinButtons({ upvotes, downvotes }: PinButtonsProps) {
  const upvoteLabel = upvotes ? `Upvotes (${upvotes})` : `Upvote`;
  const downvoteLabel = downvotes ? `Downvotes (${downvotes})` : `Downvote`;

  const upvoteButton = new ButtonBuilder()
    .setCustomId("upvote_pin")
    .setLabel(upvoteLabel)
    .setEmoji("👍")
    .setStyle(ButtonStyle.Success);

  const downvoteButton = new ButtonBuilder()
    .setCustomId("downvote_pin")
    .setLabel(downvoteLabel)
    .setEmoji("👎")
    .setStyle(ButtonStyle.Danger);

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents([
    upvoteButton,
    downvoteButton,
  ]);

  return row;
}

export async function toggleVote(
  pinId: string,
  userId: string,
  vote: number,
  existingVote: number,
) {
  if (!existingVote) {
    return pinVoteService.addPinVote({ pinId, userId, vote });
  }

  if (existingVote === vote) {
    return pinVoteService.deletePinVote(pinId, userId);
  }

  return pinVoteService.updatePinVote(pinId, userId, vote);
}
