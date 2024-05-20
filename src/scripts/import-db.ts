import { guildService } from "../api/services/guild.service";

import guilds from "../api/database/dev/dump2/guild.json";
import pins from "../api/database/dev/dump2/pin.json";
import pinAttachments from "../api/database/dev/dump2/pin_attachment.json";
import pinVotes from "../api/database/dev/dump2/pin_voter.json";
import { userService } from "../api/services/user.service";
import { pinService } from "../api/services/pin.service";
import { pinAttachmentService } from "../api/services/pin-attachment.service";
import { pinVoteService } from "../api/services/pin-voter.service";

function parseDate(date: number) {
  return new Date(date * 1000);
}

async function importGuilds() {
  const results = await Promise.all(
    guilds.map(async (guild) => {
      const camelCaseGuild = {
        id: guild.id,
        discordId: guild.discord_id,
        channelId: guild.channel_id,
        createdAt: parseDate(guild.created_at),
        maxDownvotes: guild.max_downvotes,
      };

      await guildService.createGuild(camelCaseGuild);
    }),
  );

  console.log("Imported guilds", results.length);
}

async function importUsers() {
  const uniqueUsers = new Set<string>();

  pins.forEach((pin) => {
    uniqueUsers.add(pin.pinned_by);
    uniqueUsers.add(pin.author_id);
  });

  pinVotes.forEach((voter) => {
    uniqueUsers.add(voter.user_id);
  });

  const users = await Promise.all(
    Array.from(uniqueUsers).map((userId) =>
      userService.getOrCreateUser(userId),
    ),
  );

  console.log("Imported users", uniqueUsers.size);
  return users;
}

async function importPins(users: Awaited<ReturnType<typeof importUsers>>) {
  const results = await Promise.all(
    pins.map(async (pin) => {
      const authorId = users.find(
        (user) => user.discordId === pin.author_id,
      )?.id;

      const pinnedBy = users.find(
        (user) => user.discordId === pin.pinned_by,
      )?.id;

      if (!authorId || !pinnedBy) {
        console.error("Author or pinnedBy not found", pin);
        return;
      }

      const camelCasePin = {
        id: pin.id,
        discordId: pin.discord_id,
        messageId: pin.message_id,
        authorId,
        pinnedBy,
        createdAt: parseDate(pin.created_at),
        pinnedAt: parseDate(pin.pinned_at),
        pinChannelId: pin.pin_channel_id,
        content: pin.content,
        channelId: pin.channel_id,
        guildId: pin.guild_id,
      };

      await pinService.createPin(camelCasePin);
    }),
  );

  console.log("Imported pins", results.length);
}

async function importPinAttachments() {
  await Promise.all(
    pinAttachments.map(async (attachment) => {
      const camelCaseAttachment = {
        pinId: attachment.pin_id,
        attachmentUrl: attachment.attachment_url,
      };

      await pinAttachmentService.addPinAttachment(camelCaseAttachment);
    }),
  );

  console.log("Imported pin attachments", pinAttachments.length);
}

async function importPinVotes(users: Awaited<ReturnType<typeof importUsers>>) {
  await Promise.all(
    pinVotes.map(async (vote) => {
      const userId = users.find((user) => user.discordId === vote.user_id)?.id;

      if (!userId) {
        console.error("User not found", vote);
        return;
      }

      const camelCaseVoter = {
        pinId: vote.pin_id,
        userId,
        vote: vote.vote,
      };

      await pinVoteService.addPinVote(camelCaseVoter);
    }),
  );

  console.log("Imported pin votes", pinVotes.length);
}

async function main() {
  await importGuilds();
  const users = await importUsers();
  await importPins(users);
  await importPinAttachments();
  await importPinVotes(users);
}

main();
