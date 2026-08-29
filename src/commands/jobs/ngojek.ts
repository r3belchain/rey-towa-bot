import {
  ActionRowBuilder,
  AttachmentBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChatInputCommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
} from "discord.js";
import fs from "fs";
import path from "path";
import { supabase } from "../../database/supabase.js";

// STORY POOL
const SUCCESS_STORIES = [
  "Kamu mengantar mahasiswa ke TOWA University ngebut lewat jalan tikus, dapet tip ekstra!",
  "Mengantar pesanan kopi dari TOWA Cafe tepat waktu, pelanggan puas dan kasih bintang 5!",
  "Narik penumpang mbak-mbak kantoran dari TOWA Station, perjalanan lancar tanpa macet!",
  "Nganterin tamu yang mau check-in ke TOWA Hotel & Resort, jalannya sat-set tapi aman!",
  "Dapat penumpang bapak-bapak yang ngajak ngobrol seru soal anak perempuannya yang baru masuk TOWA University sepanjang jalan, pas turun bayar lebih!",
  "Mengantar ibu-ibu pulang dari TOWA Mall bawa belanjaan banyak, dikasih kembaliannya buat kamu!",
  "Dapat orderan antar dokumen penting ke Balai Kawasan TOWA, bayarannya lumayan banget!",
  "Dapat penumpang anak sekolah yang telat!",
  "Nganterin paket sepatu ke TOWA Resident, yang nerima ngasih tip gede!",
  "Perjalanan malam yang sepi, ngantar penumpang ke Tongkrongan TOWA dengan santai dan dibayar tunai!",
];

const FAIL_STORIES = [
  "Ban motormu bocor kena paku di jalan. Penumpang ngomel dan pesan ojek lain. Kamu cuma dapat pengalaman pahit.",
  "Motor mendadak mogok di tengah jalan raya. Penumpang kapok dan memilih jalan kaki.",
  "Penumpang lupa bawa dompet dan janji mau transfer, tapi nomormu malah diblokir.",
  "Terjebak macet total karena ada event di Kawasan TOWA, orderan akhirnya dibatalkan oleh penumpang.",
  "Udah nunggu 15 menit di titik jemput, eh ternyata dighosting!",
];

export const data = new SlashCommandBuilder()
  .setName("ngojek")
  .setDescription("Keliling kawasan TOWA untuk mencari penumpang dan T-Coin!");

export async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply();

  const userId = interaction.user.id;

  const { data: user, error } = await supabase
    .from("users")
    .select("t_coin, stamina, bensin, exp, last_ngojek")
    .eq("discord_id", userId)
    .maybeSingle();

  if (error || !user) {
    return interaction.editReply(
      "❌ Kamu belum terdaftar sebagai warga TOWA! Ketik `/getting-started`.",
    );
  }

  const currentBensin = user.bensin ?? 0;
  const currentStamina = user.stamina ?? 0;
  const currentTC = user.t_coin ?? 0;
  const currentExp = user.exp ?? 0;

  // Validasi Cooldown
  const COOLDOWN_MINUTES = 15;
  const now = new Date();

  if (user.last_ngojek) {
    const lastNarikTime = new Date(user.last_ngojek);
    const diffMs = now.getTime() - lastNarikTime.getTime();
    const diffMins = diffMs / (1000 * 60);

    if (diffMins < COOLDOWN_MINUTES) {
      const timeLeft = Math.ceil(COOLDOWN_MINUTES - diffMins);
      return interaction.editReply(
        `⏳ Mesin motormu masih terlalu panas! Istirahat dulu dan coba lagi dalam **${timeLeft} menit**.`,
      );
    }
  }

  // Validasi Stamina & Bensin
  if (currentBensin < 10) {
    return interaction.editReply(
      "⛽ **Bensin tidak cukup!** (Butuh 10%). Silakan isi bensin dulu.",
    );
  }
  if (currentStamina < 15) {
    return interaction.editReply(
      "⚡ **Stamina habis!** (Butuh 15). Ngopi dulu!",
    );
  }

  // Mekanik RNG
  const isSuccess = Math.random() < 0.7;
  const isDropItem = Math.random() < 0.05;

  let earnedTC = 0;
  let earnedExp = 0;
  let storyText = "";
  let color = 0x2b2d31;

  if (isSuccess) {
    earnedTC = Math.floor(Math.random() * (350 - 150 + 1)) + 150;
    earnedExp = 20;
    color = 0x57f287;

    storyText = `✅ **Ngojek Sukses!**\n${SUCCESS_STORIES[Math.floor(Math.random() * SUCCESS_STORIES.length)]}`;
  } else {
    earnedTC = 0;
    earnedExp = 5;
    color = 0xed4245;

    storyText = `💥 **MAMPUS!**\n${FAIL_STORIES[Math.floor(Math.random() * FAIL_STORIES.length)]}`;
  }

  let dropText = "";
  if (isDropItem) {
    dropText = `\n\n🎁 **Bonus Drop:** Anjayy! Kamu nemu **1x Oli Bekas** di pinggir jalan!`;
  }

  // Update Database
  const newBensin = currentBensin - 10;
  const newStamina = currentStamina - 15;

  const { error: updateError } = await supabase
    .from("users")
    .update({
      t_coin: currentTC + earnedTC,
      exp: currentExp + earnedExp,
      bensin: newBensin,
      stamina: newStamina,
      last_ngojek: now.toISOString(),
    })
    .eq("discord_id", userId);

  if (updateError) {
    return interaction.editReply(
      "❌ Gagal menyimpan data ke server. Coba lagi nanti.",
    );
  }

  // Visual Embed
  const embed = new EmbedBuilder()
    .setColor(color)
    .setAuthor({
      name: `${interaction.user.username} narik ojek!`,
      iconURL: interaction.user.displayAvatarURL(),
    })
    .setDescription(storyText + dropText)
    .setImage("attachment://gojek.jpg")
    .addFields(
      {
        name: "💰 Perolehan",
        value: `+${earnedTC} TC | +${earnedExp} EXP`,
        inline: true,
      },
      { name: "⚡ Sisa Stamina", value: `${newStamina}/100`, inline: true },
      { name: "⛽ Sisa Bensin", value: `${newBensin}%`, inline: true },
      { name: "⏳ Cooldown", value: "15 Menit", inline: true },
    )
    .setFooter({ text: "TOWA Economy System • Ngojek" });

  const imagePath = path.join(
    process.cwd(),
    "src",
    "assets",
    "images",
    "gojek.jpg",
  );

  const files: AttachmentBuilder[] = [];
  if (fs.existsSync(imagePath)) {
    files.push(new AttachmentBuilder(imagePath, { name: "gojek.jpg" }));
    embed.setImage("attachment://gojek.jpg");
  } else {
    console.warn(`⚠️ Peringatan: Gambar tidak ditemukan di path: ${imagePath}`);
  }

  // Interaktif Button
  const buttonRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId("btn_ngojek")
      .setLabel("Narik Lagi")
      .setEmoji("🛵")
      .setStyle(ButtonStyle.Primary)
      .setDisabled(true), // Disabled karena masih CD 15 menit
    new ButtonBuilder()
      .setCustomId("btn_warkop")
      .setLabel("Ke TOWA Cafe")
      .setEmoji("☕")
      .setStyle(ButtonStyle.Secondary),
  );

  await interaction.editReply({
    embeds: [embed],
    files: files,
    components: [buttonRow],
  });
}
