import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} from "discord.js";

export function buildWelcomeUI() {
  const embed = new EmbedBuilder()
    .setColor("#5865F2")
    .setTitle("🌟 Selamat Datang di TOWA District!")
    .setDescription(
      "Untuk membuka seluruh fitur ekonomi di TOWA District, kamu wajib menyelesaikan pendaftaran warga.\n\n" +
        "Pilih salah satu **Starter Path** di bawah ini untuk memulai karirmu. Setiap path akan memberikan perlengkapan awal yang berbeda!\n\n" +
        "🎁 **Modal Dasar (Semua Path):** 500 T-Coin & 100 Stamina.",
    )
    .setFooter({ text: "TOWA Disctrict System • Registration" });

  const buttonRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId("path_ojek")
      .setLabel("TOWA Driver")
      .setEmoji("🛵")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId("path_jukir")
      .setLabel("Jukir Pemula")
      .setEmoji("🅿️")
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId("path_mancing")
      .setLabel("Pemancing")
      .setEmoji("🎣")
      .setStyle(ButtonStyle.Secondary),
  );

  return { embeds: [embed], components: [buttonRow] };
}

export function buildRegistrationModal(chosenPath: string) {
  const modal = new ModalBuilder()
    .setCustomId(`modal_register_${chosenPath}`)
    .setTitle("🚀 Isi Lembar Warga");

  const nameInput = new TextInputBuilder()
    .setCustomId("input_username")
    .setLabel("Nama Panggilan Warga")
    .setPlaceholder("Masukkan nama atau panggilanmu...")
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setMaxLength(20);

  const modalRow = new ActionRowBuilder<TextInputBuilder>().addComponents(
    nameInput,
  );
  modal.addComponents(modalRow);

  return modal;
}
