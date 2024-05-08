import * as dotenv from "dotenv";

import { createGuild } from "../services/guild.service";

dotenv.config();

async function seedGuild() {
  await createGuild({
    discordId: process.env.GUILD_ID!,
    channelId: process.env.PIN_CHANNEL_ID!,
  });
}

seedGuild().then(() => {
  console.log("Guild seeded");
  process.exit(0);
});
