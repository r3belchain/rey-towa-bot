import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  SlashCommandBuilder,
} from "discord.js";
import { supabase } from "../../database/supabase.js";
import { CommandContext } from "../../structures/CommandContext.js"; 

// STORY POOL JUKIR
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
  "Saat mau menagih uang parkir, lapakmu direbut oleh Jukir Senior. Kamu pulang dengan tangan kosong.",
  "Pengendara motor pura-pura tidak lihat kamu niup peluit lalu tancap gas gitu aja!",
  "Ada penertiban Satpol PP! Kamu terpaksa kabur sembunyi dan kehilangan potensi lapak.",
  "Pengendara beralasan 'cuma nempel sebentar 5 detik' lalu langsung ngacir.",
  "Baru mau narik uang parkir, hujan deras mendadak turun dan semua pengendara pada kabur!",
];

export const data = new SlashCommandBuilder()
  .setName("jukir")
  .setDescription("Shift parkir di TOWA District menggunakan Peluit Parkir!");


export async function execute(ctx: CommandContext) {
  await ctx.defer();

  const userId = ctx.userId; 

  const { data: user, error: userError } = await supabase
    .from("users")
    .select("t_coin, exp, total_jukir_count, last_jukir, badges")
    .eq("discord_id", userId)
    .maybeSingle();

  if (userError || !user) {
    return ctx.editReply(
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
      return ctx.editReply(
        `⏳ Sabar, bos! Kendaraannya belum ada yang keluar. Coba lagi dalam **${timeLeft} menit**.`,
      );
    }
  }

  // Peluit Parkir user_inventory
  const { data: itemGear, error: itemError } = await supabase
    .from("user_inventory")
    .select("id, item_id, durability")
    .eq("discord_id", userId)
    .eq("item_id", "item_peluit_parkir")
    .gt("durability", 0)
    .maybeSingle();

  if (itemError || !itemGear) {
    return ctx.editReply(
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
    baseTC = Math.floor(Math.random() * (50 - 20 + 1)) + 20;
    earnedTC = Math.floor(baseTC * tcMultiplier);
    earnedExp = 1;
    storyText =
      SUCCESS_STORIES[Math.floor(Math.random() * SUCCESS_STORIES.length)];
  } else {
    earnedTC = 0;
    earnedExp = 0;
    storyText = FAIL_STORIES[Math.floor(Math.random() * FAIL_STORIES.length)];
  }

  // Update Durabilitas Gear
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

  // Stat Tracker & Badge
  const currentJukirCount = (user.total_jukir_count ?? 0) + 1;
  const userBadges: string[] = user.badges ?? [];
  let badgeUnlocked = false;

  if (currentJukirCount >= 500 && !userBadges.includes("Jukir Legend")) {
    userBadges.push("Jukir Legend");
    badgeUnlocked = true;
  }

  // Update Data User
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

  // Render Visual
  let finalDescription = isSuccess
    ? `✅ **Shift Selesai!**\n${storyText}`
    : `💥 **Apes!**\n${storyText}`;

  if (hasNonaBuff) {
    finalDescription += `\n\n✨ *Buff RT 01 Nona Aktif (+15% TC)*`;
  }

  if (badgeUnlocked) {
    finalDescription += `\n\n🏆 **SELAMAT! Kamu membuka Badge: Jukir Legend!**`;
  }

  const embed = new EmbedBuilder()
    .setColor(isSuccess ? 0xf1c40f : 0xed4245)
    .setAuthor({
      name: `${ctx.user.username} ngejukir!`, 
      iconURL: ctx.user.displayAvatarURL(), 
    })
    .setDescription(finalDescription)
    .setImage(
      "https://cdn.discordapp.com/attachments/1543360295894777856/1543368932348399647/jukir.jpg?ex=6a949dd3&is=6a934c53&hm=7da5e6159af38bfff857493bae50017dcebdc927a49a840181f5716af18a76bb&",
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


  const responseMessage = await ctx.editReply({
    embeds: [embed],
    components: [buttonRow],
  });

  // Collector 
  if (responseMessage && "createMessageComponentCollector" in responseMessage) {
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
}
