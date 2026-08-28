import {
  Client,
  GatewayIntentBits,
  Collection,
  ChatInputCommandInteraction,
  SharedSlashCommand,
} from "discord.js";


export interface SlashCommand {
  data: SharedSlashCommand | any; 
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
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
