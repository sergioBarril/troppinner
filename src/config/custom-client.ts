import { Client, Collection } from "discord.js";
import { Command } from "../interfaces/command";
import { Button } from "../interfaces/button";
import { ContextMenu } from "../interfaces/context-menu";

export default class CustomClient extends Client {
  public commands: Collection<string, Command>;

  public contextMenus: Collection<string, ContextMenu>;

  public buttons: Collection<string, Button>;
}
