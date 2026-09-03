import { SlashCommandBuilder } from "discord.js";
import { checkExistingUser } from "../../services/system/registrationService.js";
import { buildWelcomeUI } from "../../utils/ui/registrationUI.js";
import { CommandContext } from "../../structures/CommandContext.js";

export const data = new SlashCommandBuilder()
  .setName("getting-started")
  .setDescription("Daftar menjadi warga TOWA dan dapatkan Starter Pack!");

export async function execute(ctx: CommandContext) {
 
  await ctx.defer();

  const { isRegistered, error } = await checkExistingUser(ctx.userId);

  if (error) return ctx.editReply("❌ Terjadi kesalahan saat mengecek data.");

  if (isRegistered) {
    return ctx.editReply(
      "❌ Kamu sudah terdaftar sebagai warga TOWA! Ketik `/profile` atau `/inventory`.",
    );
  }

  // Panggil pabrik UI
  const uiElements = buildWelcomeUI();
  await ctx.editReply(uiElements);
}
