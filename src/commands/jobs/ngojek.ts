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
    storyText = `✅ **Narik Sukses!**\nKamu mengantar penumpang ke Alun ALun Batu dan dibayar **${earnedTC} TC**!`;
  } else {
    earnedTC = 0;
    earnedExp = 5;
    color = 0xed4245;
    storyText = `💥 **MAMPUS!**\nBan motormu bocor kena paku di jalan. Penumpang ngomel dan pesan ojek lain. Kamu cuma dapat **5 EXP** pengalaman pahit.`;
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

  //  Visual Embed
  const embed = new EmbedBuilder()
    .setColor(color)
    .setAuthor({
      name: `${interaction.user.username} narik ojek!`,
      iconURL: interaction.user.displayAvatarURL(),
    })
    .setDescription(storyText + dropText)
    .setImage("attachment://gojek.jpg")
    .addFields(
      { name: "⚡ Sisa Stamina", value: `${newStamina}/100`, inline: true },
      { name: "⛽ Sisa Bensin", value: `${newBensin}%`, inline: true },
    )
    .setFooter({ text: "TOWA Economy System • Cooldown: 15 Menit" });

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

  //  Interaktif Button
  const buttonRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId("btn_ngojek")
      .setLabel("Narik Lagi")
      .setEmoji("🛵")
      .setStyle(ButtonStyle.Primary)
      .setDisabled(true), // Disabled karena masih CD 15 menit, ini sekadar showcase UI
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
