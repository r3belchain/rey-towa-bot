// src/config/client.ts
import {
  Client,
  GatewayIntentBits,
  Collection,
  SharedSlashCommand,
  AutocompleteInteraction, 
} from "discord.js";

import { CommandContext } from "../structures/CommandContext.js";

export interface SlashCommand {
  data: SharedSlashCommand | any;
  execute: (ctx: CommandContext) => Promise<void>;
  autocomplete?: (interaction: AutocompleteInteraction) => Promise<void>;
}

export class CustomClient extends Client {
  public commands: Collection<string, SlashCommand>;

  constructor() {
    super({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
      ],
    });

    this.commands = new Collection<string, SlashCommand>();
  }
}

export const client = new CustomClient();
