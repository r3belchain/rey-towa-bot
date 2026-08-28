import { ChatInputCommandInteraction } from "discord.js";
import { supabase } from "../database/supabase.js";


export let allowedChannelsCache: string[] = [];

/**
 * Memuat allowed channels dari Supabase ke memory 
 */
export async function loadAllowedChannelsCache(): Promise<void> {
  try {
    const { data, error } = await supabase
      .from("guild_settings")
      .select("allowed_channel_id")
      .maybeSingle();

    if (!error && data?.allowed_channel_id) {
      if (Array.isArray(data.allowed_channel_id)) {
        allowedChannelsCache = data.allowed_channel_id;
      } else if (typeof data.allowed_channel_id === "string") {
        allowedChannelsCache = data.allowed_channel_id
          .split(",")
          .map((id) => id.trim())
          .filter(Boolean);
      }
      console.log(
        `✅ Loaded ${allowedChannelsCache.length} allowed channels into cache.`,
      );
    }
  } catch (err) {
    console.error("❌ Gagal load channel cache:", err);
  }
}

/**
 * Middleware pengecekan channel eksekusi command
 */
export async function checkChannel(
  interaction: ChatInputCommandInteraction,
): Promise<boolean> {
  const { channelId } = interaction;

  // jika kosong, maka semua channel diizinkan
  if (allowedChannelsCache.length === 0) {
    return true;
  }

  // Cek langsung dari Memory Cache
  const isAllowed = allowedChannelsCache.includes(channelId);

  if (!isAllowed) {
    const channelMentions = allowedChannelsCache
      .map((id) => `<#${id}>`)
      .join(", ");
    await interaction.reply({
      content: `❌ Perintah ini tidak bisa digunakan di channel ini!\nSilakan gunakan di channel: ${channelMentions}`,
      ephemeral: true,
    });
    return false;
  }

  return true;
}
