import { ChatInputCommandInteraction, Collection } from "discord.js";


const cooldowns = new Collection<string, Collection<string, number>>();

/**
 * Middleware untuk mengecek cooldown in-memory 
 * @param interaction Object interaksi Discord
 * @param defaultCooldown Seconds (default: 3 detik)
 * @returns `true` jika bebas cooldown, `false` jika masih cooldown.
 */
export async function checkCooldown(
  interaction: ChatInputCommandInteraction,
  defaultCooldown: number = 3,
): Promise<boolean> {
  const { commandName, user } = interaction;

  if (!cooldowns.has(commandName)) {
    cooldowns.set(commandName, new Collection());
  }

  const now = Date.now();
  const timestamps = cooldowns.get(commandName)!;
  const cooldownAmount = defaultCooldown * 1000; 

  if (timestamps.has(user.id)) {
    const expirationTime = timestamps.get(user.id)!;

    if (now < expirationTime) {
      const expiredTimestamp = Math.round(expirationTime / 1000);

      await interaction.reply({
        content: `⏳ Pelan-pelan! Kamu bisa menggunakan perintah \`/${commandName}\` lagi <t:${expiredTimestamp}:R>.`,
        ephemeral: true,
      });
      return false;
    }
  }

+
  timestamps.set(user.id, now + cooldownAmount);


  setTimeout(() => timestamps.delete(user.id), cooldownAmount);

  return true;
}
