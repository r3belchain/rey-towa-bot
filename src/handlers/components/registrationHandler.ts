import { ButtonInteraction, ModalSubmitInteraction } from "discord.js";
import { buildRegistrationModal } from "../../utils/ui/registrationUI.js";
import { registerNewUser } from "../../services/system/registrationService.js";

export async function handleRegistrationComponents(
  interaction: ButtonInteraction | ModalSubmitInteraction,
) {

  if (interaction.isButton() && interaction.customId.startsWith("path_")) {
    const chosenPath = interaction.customId;
    const modal = buildRegistrationModal(chosenPath);
    return interaction.showModal(modal);
  }


  if (
    interaction.isModalSubmit() &&
    interaction.customId.startsWith("modal_register_")
  ) {
    await interaction.deferReply();

    const userId = interaction.user.id;
    const chosenPath = interaction.customId.replace("modal_register_", "");
    const username = interaction.fields.getTextInputValue("input_username");

    const result = await registerNewUser(userId, username, chosenPath);

    if (result.success) {
      return interaction.editReply({
        content: `🎉 **Warga Baru Telah Tiba!** Selamat bergabung di TOWA District, **${username}** (<@${userId}>)!\n\n🎒 **Starter Pack Terambil:**\n- 🪙 500 T-Coin\n- ⚡ 100 Stamina\n- ${result.packDescription}\n\nKetik \`/inventory\` untuk mengecek inventorymu!`,
      });
    } else {
      return interaction.editReply(
        `❌ **Pendaftaran Gagal:** ${result.message}`,
      );
    }
  }
}
