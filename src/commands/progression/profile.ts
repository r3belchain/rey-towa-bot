import { SlashCommandBuilder } from "discord.js";
import { supabase } from "../../database/supabase.js";
import { CommandContext } from "../../structures/CommandContext.js";
import { buildProfileCard } from "../../utils/ui/profileUI.js"; 

export const data = new SlashCommandBuilder()
  .setName("profile")
  .setDescription("Tampilkan Kartu Tanda Warga TOWA");

export async function execute(ctx: CommandContext) {
  await ctx.defer();

  const userId = ctx.userId;

  const { data: user } = await supabase
    .from("users")
    .select(
      "username, job, t_coin, stamina, bensin, exp, pity_count, total_jukir_count, total_ojek_count, total_mancing_count, bg_url",
    )
    .eq("discord_id", userId)
    .maybeSingle();

  if (!user) {
    return ctx.editReply({
      content:
        "❌ Kamu belum terdaftar sebagai warga TOWA! Jalankan `/getting-started` terlebih dahulu.",
    });
  }

  try {
    const attachment = await buildProfileCard(user, ctx.user);

    await ctx.editReply({ files: [attachment] });
  } catch (error) {
    console.error("Gagal merender profil Canvas:", error);
    await ctx.editReply({
      content: "❌ Terjadi kesalahan saat mencetak Kartu Tanda Warga TOWA.",
    });
  }
}
