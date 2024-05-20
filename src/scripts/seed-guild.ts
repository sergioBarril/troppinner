import * as dotenv from "dotenv";

import { guildService } from "../api/services/guild.service";

dotenv.config();

async function seedGuild() {
  await guildService.createGuild({
    discordId: process.env.GUILD_ID!,
    channelId: process.env.PIN_CHANNEL_ID!,
  });
}

seedGuild().then(() => {
  console.log("Guild seeded");
  process.exit(0);
});
