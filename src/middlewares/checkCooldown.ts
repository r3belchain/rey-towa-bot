import { Collection } from "discord.js";
import { CommandContext } from "../structures/CommandContext.js";

const cooldowns = new Collection<string, Collection<string, number>>();

/**
 * Middleware untuk mengecek cooldown in-memory
 * @param ctx Object CommandContext
 * @param defaultCooldown Seconds
 * @returns
 */
export async function checkCooldown(
  ctx: CommandContext,
  defaultCooldown: number = 3,
): Promise<boolean> {
  const userId = ctx.userId;

  let commandName = "unknown";
  let cmdPrefix = "/";

  if (ctx.isInteraction && ctx.interaction) {
    commandName = ctx.interaction.commandName;
  } else if (ctx.message) {
    cmdPrefix = "r";
    const args = ctx.message.content.slice(cmdPrefix.length).trim().split(/ +/);
    commandName = args.shift()?.toLowerCase() || "unknown";
  }

  if (!cooldowns.has(commandName)) {
    cooldowns.set(commandName, new Collection());
  }

  const now = Date.now();
  const timestamps = cooldowns.get(commandName)!;
  const cooldownAmount = defaultCooldown * 1000;

  if (timestamps.has(userId)) {
    const expirationTime = timestamps.get(userId)!;

    if (now < expirationTime) {
      const expiredTimestamp = Math.round(expirationTime / 1000);

      const errorMsg = `⏳ Pelan-pelan! Kamu bisa menggunakan perintah \`${cmdPrefix}${commandName}\` lagi <t:${expiredTimestamp}:R>.`;

      if (ctx.isInteraction && ctx.interaction) {
        await ctx.interaction.reply({
          content: errorMsg,
          flags: ["Ephemeral"], 
        });
      } else if (ctx.message) {
        await ctx.message.reply(errorMsg);
      }
      return false;
    }
  }

  timestamps.set(userId, now + cooldownAmount);

  setTimeout(() => timestamps.delete(userId), cooldownAmount);

  return true;
}
