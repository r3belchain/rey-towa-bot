import { supabase } from "../database/supabase.js";
import { CommandContext } from "../structures/CommandContext.js";

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
export async function checkChannel(ctx: CommandContext): Promise<boolean> {
  const channelId = ctx.isInteraction
    ? ctx.interaction?.channelId
    : ctx.message?.channelId;

  if (!channelId) return false;

  if (allowedChannelsCache.length === 0) {
    return true;
  }

  // Cek Memory Cache
  const isAllowed = allowedChannelsCache.includes(channelId);

  if (!isAllowed) {
    const channelMentions = allowedChannelsCache
      .map((id) => `<#${id}>`)
      .join(", ");

    const errorMessage = `❌ Perintah ini tidak bisa digunakan di channel ini!\nSilakan gunakan di channel: ${channelMentions}`;


    if (ctx.isInteraction && ctx.interaction) {
      await ctx.interaction.reply({
        content: errorMessage,
        flags: ["Ephemeral"], 
      });
    } else if (ctx.message) {
      await ctx.message.reply({
        content: errorMessage,
      });
    }

    return false;
  }

  return true;
}
