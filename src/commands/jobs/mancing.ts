import {
  ActionRowBuilder,
  AttachmentBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChatInputCommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
  StringSelectMenuBuilder,
} from "discord.js";
import { supabase } from "../../database/supabase.js";
import fs from "fs";
import path from "path";

// LOOT TABLE & HARGA
const COMMON_FISH = ["fish_lele", "fish_nila", "fish_mujair"];
const UNCOMMON_FISH = ["fish_gurame", "fish_kepiting", "fish_belut"];
const RARE_FISH = ["fish_gabus", "fish_togel"];
const TRASH_ITEMS = ["trash_sepatu", "trash_kresek", "item_senar_pancing"];

const QUICK_SELL_PRICES: Record<string, number> = {
  fish_lele: 15,
  fish_nila: 20,
  fish_mujair: 22,
  fish_gurame: 50,
  fish_kepiting: 65,
  fish_belut: 70,
};

// Map ID ke Nama untuk UI
const ITEM_NAMES: Record<string, string> = {
  fish_lele: "🐟 Ikan Lele",
  fish_nila: "🐟 Ikan Nila",
  fish_mujair: "🐟 Ikan Mujair",
  fish_gurame: "🐟 Ikan Gurame",
  fish_kepiting: "🦀 Kepiting Sawah",
  fish_belut: "🐍 Belut Sawah",
  fish_gabus: "🦈 Ikan Gabus",
  fish_togel: "🎰 Ikan Togel",
  trash_sepatu: "👢 Sepatu Bekas",
  trash_kresek: "🛍️ Plastik Kresek",
  item_senar_pancing: "🧵 Senar Pancing",
};

export const data = new SlashCommandBuilder()
  .setName("mancing")
  .setDescription("Lempar kail di TOWA Empang dan tunggu tangkapanmu!");

export async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply();
  const userId = interaction.user.id;

  // Get Data Warga
  const { data: user, error: userError } = await supabase
    .from("users")
    .select("t_coin, exp, last_mancing")
    .eq("discord_id", userId)
    .maybeSingle();

  if (userError || !user) {
    return interaction.editReply("❌ Kamu belum terdaftar sebagai warga TOWA!");
  }

  // Cooldown Check
  const COOLDOWN_MINUTES = 5;
  const now = new Date();
  if (user.last_mancing) {
    const lastTime = new Date(user.last_mancing);
    const diffMins = (now.getTime() - lastTime.getTime()) / (1000 * 60);
    if (diffMins < COOLDOWN_MINUTES) {
      const timeLeft = Math.ceil(COOLDOWN_MINUTES - diffMins);
      return interaction.editReply(
        `⏳ Sabar, ikan belum ngumpul! Tunggu **${timeLeft} menit** lagi.`,
      );
    }
  }

  // 3. Gear Check: Kail Bambu & Umpan
  const { data: inventory, error: invError } = await supabase
    .from("user_inventory")
    .select("id, item_id, durability, quantity")
    .eq("user_id", userId)
    .in("item_id", ["item_kail_bambu", "item_umpan"]);

  const kail = inventory?.find(
    (i) => i.item_id === "item_kail_bambu" && (i.durability ?? 0) > 0,
  );
  const umpan = inventory?.find(
    (i) => i.item_id === "item_umpan" && (i.quantity ?? 0) > 0,
  );

  if (!kail)
    return interaction.editReply(
      "⚠️ **Kail tidak ditemukan atau sudah rusak!** Beli/Repair dulu.",
    );
  if (!umpan)
    return interaction.editReply(
      "🐛 **Kamu kehabisan umpan!** Beli umpan di toko dulu.",
    );

  // 4. Kalkulasi Buff (RT 02 Ternak Lele -> +20% Rare Chance)
  const { data: roster } = await supabase
    .from("user_roster")
    .select("roster_id")
    .eq("user_id", userId)
    .eq("roster_id", "rt_02_ternak_lele")
    .maybeSingle();

  const hasLeleBuff = !!roster;

  // 5. RNG Mekanik (Main Catch & Bycatch)
  let caughtItems: Record<string, number> = {};
  let kailPatah = false;

  // --- TARIKAN UTAMA (Slot 1) ---
  const mainRoll = Math.floor(Math.random() * 100) + 1;
  const rareThreshold = hasLeleBuff ? 10 + 2 : 10; // Base 8% + (jika ada buff, hitungan threshold geser)

  if (mainRoll <= 2) {
    kailPatah = true; // 2% Disaster
  } else if (mainRoll <= rareThreshold) {
    const item = RARE_FISH[Math.floor(Math.random() * RARE_FISH.length)];
    caughtItems[item] = 1;
  } else if (mainRoll <= rareThreshold + 10) {
    const item = TRASH_ITEMS[Math.floor(Math.random() * TRASH_ITEMS.length)];
    caughtItems[item] = 1;
  } else if (mainRoll <= rareThreshold + 10 + 30) {
    const item =
      UNCOMMON_FISH[Math.floor(Math.random() * UNCOMMON_FISH.length)];
    caughtItems[item] = 1;
  } else {
    const item = COMMON_FISH[Math.floor(Math.random() * COMMON_FISH.length)];
    caughtItems[item] = 1;
  }

  // --- TARIKAN TAMBAHAN (Slot 2 & 3) (Hanya jika kail tidak patah) ---
  if (!kailPatah) {
    const bycatchPool = [...COMMON_FISH, ...UNCOMMON_FISH, ...TRASH_ITEMS];
    // Peluang Slot 2 (40%)
    if (Math.random() < 0.4) {
      const item = bycatchPool[Math.floor(Math.random() * bycatchPool.length)];
      caughtItems[item] = (caughtItems[item] || 0) + 1;
    }
    // Peluang Slot 3 (15%)
    if (Math.random() < 0.15) {
      const item = bycatchPool[Math.floor(Math.random() * bycatchPool.length)];
      caughtItems[item] = (caughtItems[item] || 0) + 1;
    }
  }

  // 6. Update Database (Potong Umpan & Durability)
  const newUmpanQty = (umpan.quantity ?? 1) - 1;
  await supabase
    .from("user_inventory")
    .update({ quantity: newUmpanQty })
    .eq("id", umpan.id);

  let newDurability = kailPatah ? 0 : (kail.durability ?? 100) - 1;
  if (newDurability <= 0) {
    await supabase
      .from("user_inventory")
      .update({ item_id: "item_kail_rusak", durability: 0 })
      .eq("id", kail.id);
  } else {
    await supabase
      .from("user_inventory")
      .update({ durability: newDurability })
      .eq("id", kail.id);
  }

  // 7. Simpan Ikan ke Inventory
  if (!kailPatah) {
    for (const [itemId, qty] of Object.entries(caughtItems)) {
      const { data: existingItem } = await supabase
        .from("user_inventory")
        .select("id, quantity")
        .eq("user_id", userId)
        .eq("item_id", itemId)
        .maybeSingle();

      if (existingItem) {
        await supabase
          .from("user_inventory")
          .update({ quantity: (existingItem.quantity ?? 0) + qty })
          .eq("id", existingItem.id);
      } else {
        await supabase.from("user_inventory").insert({
          user_id: userId,
          item_id: itemId,
          quantity: qty,
          durability: 0,
        });
      }
    }
  }

  // Update EXP & Cooldown
  await supabase
    .from("users")
    .update({ exp: (user.exp ?? 0) + 10, last_mancing: now.toISOString() })
    .eq("discord_id", userId);

  // 8. Visual UI Embed (DIROMBAK SESUAI STYLE NGOJEK)
  let resultText = "";
  if (kailPatah) {
    resultText =
      "💥 **MAMPUS!**\nKailmu ditarik monster empang sampai patah! Umpan hilang, ikan kabur.";
  } else {
    resultText =
      "✅ **Strike!**\nKamu berhasil menarik kail dan mendapatkan:\n\n";
    for (const [itemId, qty] of Object.entries(caughtItems)) {
      resultText += `> ${ITEM_NAMES[itemId] ?? itemId} **x${qty}**\n`;
    }
  }

  if (hasLeleBuff) {
    resultText += `\n🔰 *Buff RT 02 Ternak Lele Aktif!*`;
  }

  const embed = new EmbedBuilder()
    .setColor(kailPatah ? 0xed4245 : 0x3498db)
    .setAuthor({
      name: `${interaction.user.username} memancing di Empang!`,
      iconURL: interaction.user.displayAvatarURL(),
    })
    .setDescription(resultText)
    .addFields(
      {
        name: "✨ Perolehan",
        value: kailPatah ? "+0 EXP" : "+10 EXP",
        inline: true,
      },
      { name: "🐛 Sisa Umpan", value: `${newUmpanQty}`, inline: true },
      { name: "🎣 Kondisi Kail", value: `${newDurability}/100`, inline: true },
      { name: "⏳ Cooldown", value: "5 Menit", inline: true },
    )
    .setFooter({ text: "TOWA Economy System • Mancing" });

  // Safe Image Attachment
  const imagePath = path.join(
    process.cwd(),
    "src",
    "assets",
    "images",
    "mancing.gif",
  );
  const files: AttachmentBuilder[] = [];

  if (fs.existsSync(imagePath)) {
    files.push(new AttachmentBuilder(imagePath, { name: "mancing.gif" }));
    embed.setImage("attachment://mancing.gif");
  }

  // 9. Interactive UI Components
  const spotSelect =
    new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId("select_fishing_spot")
        .setPlaceholder("📍 Pilih Spot Mancing")
        .addOptions([
          { 
            label: "TOWA Fish Pond",
            description: "Spot mancing warga lokal. Rate stabil.",
            value: "spot_empang",
            default: true,
          },
          {
            label: "Kali Brantas",
            description: "[LOCKED] Arus deras, butuh kail kuat.",
            value: "spot_kali",
            emoji: "🌊",
          },
          {
            label: "Laut Selatan",
            description: "[LOCKED] Mitos Nyi Roro Kidul.",
            value: "spot_laut",
            emoji: "🦈",
          },
        ])
        .setDisabled(true), // Placeholder, matikan dulu
    );

  const buttonRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId("btn_mancing_lagi")
      .setLabel("Lempar Kail")
      .setEmoji("🎣")
      .setStyle(ButtonStyle.Primary)
      .setDisabled(true), // Disabled default (CD 5 min)
    new ButtonBuilder()
      .setCustomId("sell_fish_npc")
      .setLabel("Jual Cepat (Common & Uncommon)")
      .setEmoji("📦")
      .setStyle(ButtonStyle.Success),
  );

  const responseMessage = await interaction.editReply({
    embeds: [embed],
    files: files, // MEMASUKKAN GAMBAR KE DALAM REPLY
    components: [spotSelect, buttonRow as any],
  });

  // 10. Collector Tombol Jual Cepat
  const collector = responseMessage.createMessageComponentCollector({
    time: 60_000,
  });
  collector.on("collect", async (btnInteraction) => {
    if (btnInteraction.customId === "sell_fish_npc") {
      if (btnInteraction.user.id !== interaction.user.id) return;

      const { data: currentInv } = await supabase
        .from("user_inventory")
        .select("id, item_id, quantity")
        .eq("user_id", userId)
        .gt("quantity", 0);

      if (!currentInv)
        return btnInteraction.reply({
          content: "Kamu tidak punya ikan untuk dijual.",
          ephemeral: true,
        });

      let totalEarned = 0;
      let soldDetails = "";

      for (const item of currentInv) {
        if (QUICK_SELL_PRICES[item.item_id]) {
          const qty = item.quantity ?? 0;
          const price = QUICK_SELL_PRICES[item.item_id] * qty;
          totalEarned += price;
          soldDetails += `${ITEM_NAMES[item.item_id]} x${qty} = **${price} TC**\n`;

          // Set quantity 0
          await supabase
            .from("user_inventory")
            .update({ quantity: 0 })
            .eq("id", item.id);
        }
      }

      if (totalEarned === 0) {
        return btnInteraction.reply({
          content:
            "⚠️ Tidak ada ikan Common/Uncommon di keranjangmu yang bisa dijual cepat.",
          ephemeral: true,
        });
      }

      // Tambah TC ke User
      const { data: latestUser } = await supabase
        .from("users")
        .select("t_coin")
        .eq("discord_id", userId)
        .single();
      await supabase
        .from("users")
        .update({ t_coin: (latestUser?.t_coin ?? 0) + totalEarned })
        .eq("discord_id", userId);

      await btnInteraction.reply({
        content: `📦 **Jual Cepat Sukses!**\n\n${soldDetails}\n💰 **Total Pendapatan: +${totalEarned} TC**`,
        ephemeral: true,
      });
    }
  });
}
