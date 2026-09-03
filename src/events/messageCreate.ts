import { Message } from "discord.js";
import { SlashCommand } from "../config/client.js";
import { CommandContext } from "../structures/CommandContext.js";

import { checkChannel } from "../middlewares/checkChannel.js";
import { checkRegistration } from "../middlewares/checkRegistration.js";
import { checkCooldown } from "../middlewares/checkCooldown.js";

export async function handleMessage(
  message: Message,
  commandsMap: Map<string, SlashCommand>,
) {
  if (message.author.bot) return;

  const prefix = "r";

  if (!message.content.toLowerCase().startsWith(prefix)) return;

  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const commandName = args.shift()?.toLowerCase();

  if (!commandName) return;

  const command = commandsMap.get(commandName);
  if (!command) return;

  const ctx = new CommandContext(message);



  // Cek Channel
  const isAllowedChannel = await checkChannel(ctx);
  if (!isAllowedChannel) return;

  // Cek Registrasi 
  if (commandName !== "getting-started") {
    const isRegistered = await checkRegistration(ctx);
    if (!isRegistered) return;
  }

  // Cek Cooldown 
  const isCooledDown = await checkCooldown(ctx, 3);
  if (!isCooledDown) return;

  try {
    await command.execute(ctx);
  } catch (error) {
    console.error(`Error pada prefix command ${commandName}:`, error);
    await ctx.editReply({
      content: "❌ Terjadi kesalahan sistem saat memproses perintah ini!",
    });
  }
}
