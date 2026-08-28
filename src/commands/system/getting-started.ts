import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChatInputCommandInteraction,
  ComponentType,
  EmbedBuilder,
  MessageFlags,
  ModalBuilder,
  SlashCommandBuilder,
  TextInputBuilder,
  TextInputStyle,
} from "discord.js";
import { supabase } from "../../database/supabase.js";

export const data = new SlashCommandBuilder()
  .setName("getting-started")
  .setDescription("Daftar menjadi warga TOWA dan dapatkan Starter Pack!");

export async function execute(interaction: ChatInputCommandInteraction) {
  const userId = interaction.user.id;

  // cek user
  const { data: existingUser } = await supabase
    .from("users")
    .select("discord_id")
    .eq("discord_id", userId)
    .maybeSingle();

  if (existingUser) {
    return interaction.reply({
      content:
        "❌ Kamu sudah terdaftar sebagai warga TOWA! Ketik `/profile` untuk melihat statusmu.",
      flags: MessageFlags.Ephemeral,
    });
  }

  //  Embed Perkenalan
  const embed = new EmbedBuilder()
    .setColor("#5865F2")
    .setTitle("🌟 Selamat Datang di Kawasan TOWA!")
    .setDescription(
      "Untuk membuka seluruh fitur ekonomi di Kawasan TOWA, kamu wajib menyelesaikan pendaftaran warga.\n\n" +
        "Pilih salah satu **Starter Path** di bawah ini untuk memulai karirmu. Setiap path akan memberikan perlengkapan awal yang berbeda!\n\n" +
        "🎁 **Modal Dasar (Semua Path):** 500 T-Coin & 100 Stamina.",
    )
    .setFooter({ text: "Rey | TOWA Official v1.0" });

  // tombol profesi
  const btnOjek = new ButtonBuilder()
    .setCustomId("path_ojek")
    .setLabel("Driver Ojek")
    .setEmoji("🛵")
    .setStyle(ButtonStyle.Primary);

  const btnJukir = new ButtonBuilder()
    .setCustomId("path_jukir")
    .setLabel("Jukir Pemula")
    .setEmoji("🅿️")
    .setStyle(ButtonStyle.Success);

  const btnMancing = new ButtonBuilder()
    .setCustomId("path_mancing")
    .setLabel("Pemancing")
    .setEmoji("🎣")
    .setStyle(ButtonStyle.Secondary);

  const buttonRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    btnOjek,
    btnJukir,
    btnMancing,
  );

  //  pesan pendaftaran
  const response = await interaction.reply({
    embeds: [embed],
    components: [buttonRow],
    flags: MessageFlags.Ephemeral,
  });

  // Collector  menangkap klik tombol
  const collector = response.createMessageComponentCollector({
    componentType: ComponentType.Button,
    time: 60000,
  });

  collector.on("collect", async (buttonInteraction) => {
    if (buttonInteraction.user.id !== userId) return;

    const chosenPath = buttonInteraction.customId; //

    // modal form nama warga
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

    // modal to user tampilan
    await buttonInteraction.showModal(modal);

    try {
      const modalSubmit = await buttonInteraction.awaitModalSubmit({
        time: 120000,
        filter: (i) =>
          i.user.id === userId && i.customId === `modal_register_${chosenPath}`,
      });

      const username = modalSubmit.fields.getTextInputValue("input_username");

      // EKSEKUSI DATABASE
      // Insert tabel users
      const { error: userError } = await supabase.from("users").insert({
        discord_id: userId,
        username: username,
        t_coin: 500,
        stamina: 100,
        pity_count: 0,
        bensin: 100,
        exp: 0,
      });

      if (userError) {
        console.error("Gagal insert user:", userError);
        return modalSubmit.reply({
          content: "❌ Terjadi kesalahan saat menyimpan datamu ke database.",
          flags: MessageFlags.Ephemeral,
        });
      }

      // Setup Starter Pack
      const starterItems = [];
      let packDescription = "";

      if (chosenPath === "path_ojek") {
        starterItems.push({
          user_id: userId,
          item_id: "item_helm_bogo",
          quantity: 1,
        });
        starterItems.push({
          user_id: userId,
          item_id: "item_bensin",
          quantity: 10,
        });
        packDescription = "🪖 1x Helm Bogo & ⛽ 10x Pertalite";
      } else if (chosenPath === "path_jukir") {
        starterItems.push({
          user_id: userId,
          item_id: "item_peluit_parkir",
          quantity: 1,
        });
        starterItems.push({
          user_id: userId,
          item_id: "item_esteh",
          quantity: 2,
        });
        packDescription = "🎺 1x Peluit Parkir & 🥤 2x Es Teh Manis";
      } else if (chosenPath === "path_mancing") {
        starterItems.push({
          user_id: userId,
          item_id: "item_kail_bambu",
          quantity: 1,
        });
        starterItems.push({
          user_id: userId,
          item_id: "item_umpan",
          quantity: 5,
        });
        packDescription = "🎣 1x Kail Bambu & 🪱 5x Umpan Cacing";
      }

      // Insert item user_inventory
      const { error: invError } = await supabase
        .from("user_inventory")
        .insert(starterItems);

      if (invError) {
        console.error("Gagal insert inventory:", invError);
      }

      //  Sukses
      await modalSubmit.reply({
        content: `🎉 **Akun Unlocked!** Selamat datang di Kawasan TOWA, **${username}**!\n\n🎒 **Starter Pack kamu:**\n- 🪙 500 T-Coin\n- ⚡ 100 Stamina\n- ${packDescription}\n\nKetik \`/profile\` untuk melihat status karaktermu!`,
        flags: MessageFlags.Ephemeral,
      });
    } catch (err) {
      console.log(`User ${userId} tidak menyelesaikan modal pendaftaran.`);
    }
  });
}
