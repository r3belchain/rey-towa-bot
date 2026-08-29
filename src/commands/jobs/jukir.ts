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

// --- STORY POOL JUKIR ---
const SUCCESS_STORIES = [
  "Kamu memarkirkan 3 motor ibu-ibu cerewet di depan TOWA Mall dan dibayar tunai!",
  "Menyeberangkan Honda Beat knalpot brong di depan TOWA Cafe, dikasih uang pas!",
  "Bantu balikin Vespa matic yang keparkir miring, dapet tip lumayan dari warga TOWA!",
  "Merapikan barisan motor di parkiran TOWA University sampai rapi presisi, pelanggan puas!",
  "Semprit-semprit sigap di alun-alun Kawasan TOWA, dikasih koin kembalian!",
  "Bantu mobil pick-up mundur di tengah kemacetan, supirnya lempar uang parkir!",
  "Ngasih aba-aba 'teruuuss... yakk op!' ke mobil bapak-bapak yang parkir di depan lobby TOWA Hotel & Resort, dikasih koin tanpa minta kembalian!",
  "Markirin 5 motor warga cewek yang lagi nongkrong di TOWA Cafe, dapet uang parkir plus senyuman genit!",
  "Membantu emak-emak TOWA Resident sein kiri belok kanan untuk parkir dengan selamat!",
  "Parkiran TOWA Station penuh sesak, tapi kamu berhasil selipin 1 motor terakhir dengan sempurna!",
];

const FAIL_STORIES = [
  "Apes! Saat mau menagih uang parkir, lapakmu direbut oleh Jukir Senior. Kamu pulang dengan tangan kosong.",
  "Pengendara motor pura-pura tidak lihat kamu niup peluit lalu tancap gas gitu aja!",
  "Ada penertiban Satpol PP! Kamu terpaksa kabur sembunyi dan kehilangan potensi lapak.",
  "Pengendara beralasan 'cuma nempel sebentar 5 detik' lalu langsung ngacir.",
  "Baru mau narik uang parkir, hujan deras mendadak turun dan semua pengendara pada kabur!",
];

export const data = new SlashCommandBuilder()
  .setName("jukir")
  .setDescription("Shift parkir di Kawasan TOWA menggunakan Peluit Parkir!");

export async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply();

  const userId = interaction.user.id; //  Discord ID

  const { data: user, error: userError } = await supabase
    .from("users")
    .select("t_coin, exp, total_jukir_count, last_jukir, badges")
    .eq("discord_id", userId)
    .maybeSingle();

  if (userError || !user) {
    return interaction.editReply(
      "❌ Kamu belum terdaftar sebagai warga TOWA! Ketik `/getting-started`.",
    );
  }

  // Cooldown Check
  const COOLDOWN_MINUTES = 3;
  const now = new Date();

  if (user.last_jukir) {
    const lastMarkirTime = new Date(user.last_jukir);
    const diffMs = now.getTime() - lastMarkirTime.getTime();
    const diffMins = diffMs / (1000 * 60);

    if (diffMins < COOLDOWN_MINUTES) {
      const timeLeft = Math.ceil(COOLDOWN_MINUTES - diffMins);
      return interaction.editReply(
        `⏳ Sabar, bos! Kendaraannya belum ada yang keluar. Coba lagi dalam **${timeLeft} menit**.`,
      );
    }
  }

  // Peluit Parkir user_inventory
  const { data: itemGear, error: itemError } = await supabase
    .from("user_inventory")
    .select("id, item_id, durability")
    .eq("user_id", userId)
    .eq("item_id", "item_peluit_parkir")
    .gt("durability", 0)
    .maybeSingle();

  if (itemError || !itemGear) {
    return interaction.editReply(
      "⚠️ **Kamu tidak punya Peluit Parkir yang bisa dipakai!**\nPeriksa `user_inventory` milikmu. Peluitmu mungkin rusak (`item_peluit_rusak`) dan butuh di-`/repair`, atau kamu perlu membeli peluit baru di Toko.",
    );
  }

  const { data: roster } = await supabase
    .from("user_roster")
    .select("roster_id")
    .eq("user_id", userId)
    .eq("roster_id", "rt_01_nona")
    .maybeSingle();

  const hasNonaBuff = !!roster;
  const tcMultiplier = hasNonaBuff ? 1.15 : 1.0;

  // RNG Roll Result
  const isSuccess = Math.random() < 0.9;

  let baseTC = 0;
  let earnedTC = 0;
  let earnedExp = 0;
  let storyText = "";

  if (isSuccess) {
    baseTC = Math.floor(Math.random() * (50 - 20 + 1)) + 20; // 20 - 50 TC
    earnedTC = Math.floor(baseTC * tcMultiplier);
    earnedExp = 1;
    // Panggil array secara acak untuk deskripsi sukses
    storyText =
      SUCCESS_STORIES[Math.floor(Math.random() * SUCCESS_STORIES.length)];
  } else {
    earnedTC = 0;
    earnedExp = 0;
    // Panggil array secara acak untuk deskripsi gagal
    storyText = FAIL_STORIES[Math.floor(Math.random() * FAIL_STORIES.length)];
  }

  // Update Durabilitas Gear & Status Item
  const newDurability = (itemGear.durability ?? 100) - 1;
  if (newDurability <= 0) {
    await supabase
      .from("user_inventory")
      .update({
        item_id: "item_peluit_rusak",
        durability: 0,
        updated_at: now.toISOString(),
      })
      .eq("id", itemGear.id);
  } else {
    await supabase
      .from("user_inventory")
      .update({ durability: newDurability, updated_at: now.toISOString() })
      .eq("id", itemGear.id);
  }

  // Stat Tracker & Badge System
  const currentJukirCount = (user.total_jukir_count ?? 0) + 1;
  const userBadges: string[] = user.badges ?? [];
  let badgeUnlocked = false;

  if (currentJukirCount >= 500 && !userBadges.includes("Jukir Legend")) {
    userBadges.push("Jukir Legend");
    badgeUnlocked = true;
  }

  // Update Data User Supabase
  await supabase
    .from("users")
    .update({
      t_coin: (user.t_coin ?? 0) + earnedTC,
      exp: (user.exp ?? 0) + earnedExp,
      total_jukir_count: currentJukirCount,
      last_jukir: now.toISOString(),
      badges: userBadges,
    })
    .eq("discord_id", userId);

  // Render Visual Embed
  const embed = new EmbedBuilder()
    .setColor(0xf1c40f)
    .setTitle("🅿️ Shift Parkir Kawasan TOWA")
    .setDescription(
      `${storyText}${hasNonaBuff ? "\n✨ *Buff RT 01 Nona Aktif (+15% TC)*" : ""}${
        badgeUnlocked
          ? "\n🏆 **SELAMAT! Kamu membuka Badge: Jukir Legend!**"
          : ""
      }`,
    )
    .addFields(
      {
        name: "💰 Perolehan",
        value: `+${earnedTC} TC | +${earnedExp} EXP`,
        inline: true,
      },
      {
        name: "📣 Peluit Parkir",
        value: `${newDurability}/100`,
        inline: true,
      },
      { name: "⏳ Cooldown", value: "3 Menit", inline: true },
    )
    .setFooter({ text: "TOWA Economy System • Jukir" });

  // Safe Image Attachment
  const imagePath = path.join(
    process.cwd(),
    "src",
    "assets",
    "images",
    "jukir.jpg",
  );
  const files: AttachmentBuilder[] = [];

  if (fs.existsSync(imagePath)) {
    files.push(new AttachmentBuilder(imagePath, { name: "jukir.jpg" }));
    embed.setImage("attachment://jukir.jpg");
  }

  // Interactive UI Components
  const buttonRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId("parkir_again")
      .setLabel("Parkir Lagi")
      .setEmoji("🅿️")
      .setStyle(ButtonStyle.Primary)
      .setDisabled(true),
    new ButtonBuilder()
      .setCustomId("check_wallet_quick")
      .setLabel("Cek Dompet")
      .setEmoji("💳")
      .setStyle(ButtonStyle.Secondary),
  );

  const responseMessage = await interaction.editReply({
    embeds: [embed],
    files: files,
    components: [buttonRow],
  });

  // Collector khusus check dompet
  const collector = responseMessage.createMessageComponentCollector({
    time: 60_000,
  });

  collector.on("collect", async (btnInteraction) => {
    if (btnInteraction.customId === "check_wallet_quick") {
      const { data: latestUserData } = await supabase
        .from("users")
        .select("t_coin")
        .eq("discord_id", btnInteraction.user.id)
        .maybeSingle();

      await btnInteraction.reply({
        content: `💳 Saldo T-Coin kamu saat ini: **${latestUserData?.t_coin ?? 0} TC**`,
        ephemeral: true,
      });
    }
  });
}
