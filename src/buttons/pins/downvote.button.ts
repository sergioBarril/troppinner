import { ButtonInteraction } from "discord.js";

export default {
  data: { name: "downvote_pin" },
  async execute(interaction: ButtonInteraction) {
    await interaction.reply({ content: "Downvoted!", ephemeral: true });
  },
};
