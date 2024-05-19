import { Guild, Message } from "discord.js";
import logger from "../config/logger";
import { pinService } from "../services/pin.service";

async function deleteCloneMessage(
  discordGuild: Guild,
  pinnedMessageId: string,
  pinChannelId: string,
) {
  // Get the channel that the message was pinned to
  const pinsChannel = await discordGuild.channels.fetch(pinChannelId);

  if (!pinsChannel?.isTextBased()) {
    logger.error(
      { discordGuild: discordGuild.id, pinChannelId },
      "Pins channel not found",
    );

    return false;
  }

  // Fetch and delete cloned message
  const clonedMessage = await pinsChannel.messages
    .fetch(pinnedMessageId)
    .catch((error) => logger.warn(error, "Failed to fetch pinned message"));
  await clonedMessage?.delete();

  return true;
}

/**
 * Unpin a message
 *
 * @param targetMessage Either the original message or the cloned message
 * @returns The original message if it was pinned, otherwise null
 */
export async function handleUnpinMessage(targetMessage: Message<boolean>) {
  // Check if the message is pinned
  const targetId = targetMessage.id;

  if (!targetMessage.inGuild())
    throw new Error("Interaction is not in a guild");
  const discordGuild = targetMessage.guild;

  const pin = await pinService.getPin(targetId);

  // Delete the pin
  await pinService.deletePin(pin.id);

  if (pin.pinChannelId && pin.discordId) {
    await deleteCloneMessage(
      discordGuild,
      pin.discordId,
      pin.pinChannelId,
    ).catch((error) => {
      logger.error(error, "Failed to delete cloned message");
    });
  }

  // Unpin the message
  const getOriginalMessage = async () => {
    if (targetId === pin.messageId) return targetMessage;

    const originalChannel = await discordGuild.channels.fetch(pin.channelId);
    if (!originalChannel?.isTextBased()) return null;

    const originalMessage = await originalChannel.messages.fetch(pin.messageId);
    return originalMessage;
  };

  const originalMessage = await getOriginalMessage().catch(() => {});
  await originalMessage?.unpin().catch(() => {});

  return { originalMessage };
}
