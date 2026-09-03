import { supabase } from "../database/supabase.js";
import { CommandContext } from "../structures/CommandContext.js";

/**
 * Middleware untuk memeriksa apakah user sudah terdaftar di database Supabase.
 * 
 * @param ctx Object CommandContext
 * @returns
 */
export async function checkRegistration(ctx: CommandContext): Promise<boolean> {
  const userId = ctx.userId;

  try {
    const { data: user, error } = await supabase
      .from("users")
      .select("discord_id")
      .eq("discord_id", userId)
      .maybeSingle();

    if (error) {
      console.error("❌ Error Supabase pada checkRegistration:", error.message);
      const errorMsg =
        "⚠️ Terjadi kesalahan database saat memverifikasi status akunmu.";

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

    if (!user) {
      const unregMsg =
        "📜 Kamu belum terdaftar!\n" +
        "Silakan gunakan perintah `/getting-started` terlebih dahulu untuk membuat profil dan memulai petualanganmu.";

      if (ctx.isInteraction && ctx.interaction) {
        await ctx.interaction.reply({
          content: unregMsg,
          flags: ["Ephemeral"], 
        });
      } else if (ctx.message) {
        await ctx.message.reply(unregMsg);
      }
      return false;
    }

    return true;
  } catch (err) {
    console.error("❌ Unexpected Error checkRegistration:", err);
    return false;
  }
}
