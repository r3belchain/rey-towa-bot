import {
  ChatInputCommandInteraction,
  InteractionEditReplyOptions,
  Message,
  MessagePayload,
  User,
} from "discord.js";

export class CommandContext {
  public isInteraction: boolean;
  public interaction?: ChatInputCommandInteraction;
  public message?: Message;
  public user: User;
  public userId: string;

  constructor(target: ChatInputCommandInteraction | Message) {
    if (target instanceof ChatInputCommandInteraction) {
      this.isInteraction = true;
      this.interaction = target;
      this.user = target.user;
      this.userId = target.user.id;
    } else {
      this.isInteraction = false;
      this.message = target;
      this.user = target.author;
      this.userId = target.author.id;
    }
  }

  async defer(ephemeral: boolean = false) {
    if (this.isInteraction && this.interaction) {
      await this.interaction.deferReply({ ephemeral });
    } else if (this.message) {
      if ("sendTyping" in this.message.channel) {
        await this.message.channel.sendTyping();
      }
    }
  }

  async editReply(
    options: string | MessagePayload | InteractionEditReplyOptions,
  ) {
    if (this.isInteraction && this.interaction) {
      return await this.interaction.editReply(options);
    } else if (this.message) {
      return await this.message.reply(options as any);
    }
  }

  public getSubcommand(): string | null {
    if (this.isInteraction && this.interaction) {
      return this.interaction.options.getSubcommand(false);
    } else if (this.message) {
      const args = this.message.content.trim().split(/ +/);
      return args[1]?.toLowerCase() || null;
    }
    return null;
  }
}
