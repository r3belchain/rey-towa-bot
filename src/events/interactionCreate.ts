import { Interaction } from "discord.js";
import { checkChannel } from "../middlewares/checkChannel.js";
import { checkRegistration } from "../middlewares/checkRegistration.js";
import { checkCooldown } from "../middlewares/checkCooldown.js";
import { SlashCommand } from "../config/client.js";

export async function handleInteraction(
  interaction: Interaction,
  commandsMap: Map<string, SlashCommand>, 
) {
  if (!interaction.isChatInputCommand()) return;

  const command = commandsMap.get(interaction.commandName);
  if (!command) return;

  // Cek Kunci Channel 
  const isAllowedChannel = await checkChannel(interaction);
  if (!isAllowedChannel) return;

  // Cek Registrasi Akun ecuali command /getting-started
  if (interaction.commandName !== "getting-started") {
    const isRegistered = await checkRegistration(interaction);
    if (!isRegistered) return;
  }

  //  Cek Cooldown Anti-Spam 
  const isCooledDown = await checkCooldown(interaction, 3);
  if (!isCooledDown) return;

  // Eksekusi Command
  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(`Error pada command ${interaction.commandName}:`, error);
    const replyOptions = {
      content: "❌ Terjadi kesalahan sistem saat memproses perintah ini!",
      ephemeral: true,
    };
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(replyOptions);
    } else {
      await interaction.reply(replyOptions);
    }
  }
}
