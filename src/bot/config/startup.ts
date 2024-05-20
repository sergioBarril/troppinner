/* eslint-disable global-require */
/* eslint-disable import/no-dynamic-require */
import { readdirSync } from "fs";
import path from "path";
import { Command } from "../interfaces/command";
import { Event } from "../interfaces/event";
import { Button } from "../interfaces/button";
import { ContextMenu } from "../interfaces/context-menu";

/**
 * Get all the commands in the commands folder
 * @returns An array of commands
 */
export function loadCommands() {
  const commandsPath = path.join(__dirname, "..", "commands");
  const commandFolders = readdirSync(commandsPath);

  const commandUrls: string[] = [];

  for (const folder of commandFolders) {
    const folderPath = path.join(commandsPath, folder);

    const commandFiles = readdirSync(folderPath).filter(
      (file) => file.endsWith(".command.ts") || file.endsWith(".command.js"),
    );

    for (const file of commandFiles) {
      const filePath = path.join(folderPath, file);
      commandUrls.push(filePath);
    }
  }

  const commands: Command[] = commandUrls
    .map((commandPath) => require(commandPath))
    .flat()
    .map((module) => module.default);

  return commands;
}

/**
 * Get all the context menus in the context-menus folder
 * @returns An array of context menu functions
 */
export function loadContextMenus() {
  const contextMenuPath = path.join(__dirname, "..", "context-menus");
  const contextMenuFolders = readdirSync(contextMenuPath);

  const contextMenuUrls: string[] = [];

  for (const folder of contextMenuFolders) {
    const folderPath = path.join(contextMenuPath, folder);

    const contextMenuFiles = readdirSync(folderPath).filter(
      (file) => file.endsWith(".context.ts") || file.endsWith(".context.js"),
    );

    for (const file of contextMenuFiles) {
      const filePath = path.join(folderPath, file);
      contextMenuUrls.push(filePath);
    }
  }

  const contextMenus: ContextMenu[] = contextMenuUrls
    .map((commandPath) => require(commandPath))
    .flat()
    .map((module) => module.default);

  return contextMenus;
}

/**
 * Get all the buttons in the buttons folder
 * @returns An array of buttons
 */
export function loadButtons() {
  const buttonsPath = path.join(__dirname, "..", "buttons");
  const buttonsFolders = readdirSync(buttonsPath);

  const buttonUrls: string[] = [];

  for (const folder of buttonsFolders) {
    const folderPath = path.join(buttonsPath, folder);

    const buttonFiles = readdirSync(folderPath).filter(
      (file) => file.endsWith(".button.ts") || file.endsWith(".button.js"),
    );

    for (const file of buttonFiles) {
      const filePath = path.join(folderPath, file);
      buttonUrls.push(filePath);
    }
  }

  const buttons: Button[] = buttonUrls
    .map((buttonPath) => require(buttonPath))
    .flat()
    .map((module) => module.default);

  return buttons;
}

/**
 * Get all the events in the events folder
 * @returns An array of Events
 */
export function loadEvents(): Event[] {
  const eventsFolder = path.join(__dirname, "..", "events");
  const eventFiles = readdirSync(eventsFolder);

  return eventFiles.map((file) => {
    const filePath = path.join(eventsFolder, file);
    return require(filePath).default;
  });
}
