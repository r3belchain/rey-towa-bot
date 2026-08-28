import { ChatInputCommandInteraction } from "discord.js";
import { supabase } from "../database/supabase.js";

/**
 * Middleware untuk memeriksa apakah user sudah terdaftar di database Supabase.
 * @param interaction Object interaksi dari Discord.js
 * @returns `true` jika user sudah terdaftar, `false` jika belum (dan mengirim balasan ephemeral).
 */
export async function checkRegistration(
  interaction: ChatInputCommandInteraction,
): Promise<boolean> {
  const userId = interaction.user.id;

  try {
    const { data: user, error } = await supabase
      .from("users")
      .select("discord_id")
      .eq("discord_id", userId)
      .maybeSingle();

    if (error) {
      console.error("❌ Error Supabase pada checkRegistration:", error.message);
      await interaction.reply({
        content:
          "⚠️ Terjadi kesalahan database saat memverifikasi status akunmu.",
        ephemeral: true,
      });
      return false;
    }

   
    if (!user) {
      await interaction.reply({
        content:
          "📜 Kamu belum terdaftar!\n" +
          "Silakan gunakan perintah `/getting-started` terlebih dahulu untuk membuat profil dan memulai petualanganmu.",
        ephemeral: true,
      });
      return false;
    }

    return true;
  } catch (err) {
    console.error("❌ Unexpected Error checkRegistration:", err);
    return false;
  }
}
