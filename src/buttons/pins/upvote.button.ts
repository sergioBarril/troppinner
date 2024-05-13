import { ButtonInteraction } from "discord.js";

export default {
  data: { name: "upvote_pin" },
  async execute(interaction: ButtonInteraction) {
    await interaction.reply({ content: "Upvoted!", ephemeral: true });
  },
};
