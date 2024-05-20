import {
  ButtonInteraction,
  ChatInputCommandInteraction,
  Events,
  Interaction,
  MessageContextMenuCommandInteraction,
} from "discord.js";
import CustomClient from "../config/custom-client";
import { Event } from "../interfaces/event";
import ApiError from "../../errors/api-error.error";
import logger from "../../common/logger";

async function errorHandler(interaction: Interaction, error: Error) {
  const isAcceptedInteraction =
    interaction.isChatInputCommand() ||
    interaction.isButton() ||
    interaction.isMessageContextMenuCommand();

  if (!isAcceptedInteraction) {
    logger.error(
      error,
      `An interaction of type ${interaction.type} was not handled by the error handler.`,
    );
    return;
  }

  let content = "There was an error while executing this command!";
  if (error instanceof ApiError && error.statusCode < 500) {
    logger.warn(error, error.message);
    content = error.message;
  } else logger.error(error);

  const response = { content, ephemeral: true };
  try {
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(response);
    } else {
      await interaction.reply(response);
    }
  } catch (err) {
    logger.error(err, "An error occurred while sending an error response.");
  }
}

async function commandHandler(interaction: ChatInputCommandInteraction) {
  const command = (interaction.client as CustomClient).commands.get(
    interaction.commandName,
  );

  if (!command)
    throw new Error(
      `No command matching ${interaction.commandName} was found.`,
    );

  await command.execute(interaction);
}

async function buttonHandler(interaction: ButtonInteraction) {
  const button = (interaction.client as CustomClient).buttons.get(
    interaction.customId,
  );

  if (!button) {
    throw new Error(`No button matching ${interaction.customId} was found.`);
  }

  await button.execute(interaction);
}

async function contextMenuHandler(
  interaction: MessageContextMenuCommandInteraction,
) {
  const contextMenu = (interaction.client as CustomClient).contextMenus.get(
    interaction.commandName,
  );

  if (!contextMenu)
    throw new Error(
      `No context menu command matching ${interaction.commandName} was found.`,
    );

  await contextMenu.execute(interaction);
}

async function execute(interaction: Interaction) {
  try {
    if (interaction.isButton()) await buttonHandler(interaction);
    else if (interaction.isMessageContextMenuCommand())
      await contextMenuHandler(interaction);
    else if (interaction.isChatInputCommand())
      await commandHandler(interaction);
  } catch (error) {
    await errorHandler(interaction, error as Error);
  }
}

const onInteractionCreate: Event = {
  name: Events.InteractionCreate,
  once: false,
  execute,
};

export default onInteractionCreate;
