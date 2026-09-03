// src/commands/jobs/ngojek.ts
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  EmbedBuilder,
  SlashCommandBuilder,
} from "discord.js";
import { CommandContext } from "../../structures/CommandContext.js";
import {
  executeNgojek,
  prepareNgojek,
} from "../../services/economy/jobService.js";
import { useItem } from "../../services/economy/useItemService.js"; 


// STORY POOL LIST 
const SAFE_SUCCESS_STORIES = [
  "Mengantar pesanan kopi dari TOWA Cafe tepat waktu, pelanggan puas dan kasih bintang 5!",
  "Narik penumpang mbak-mbak kantoran dari TOWA Station, perjalanan lancar tanpa macet!",
  "Nganterin tamu yang mau check-in ke TOWA Hotel & Resort, jalannya santai dan aman!",
  "Dapat penumpang bapak-bapak yang ngajak ngobrol seru soal anak perempuannya yang baru masuk TOWA University sepanjang jalan, pas turun bayar lebih!",
  "Mengantar ibu-ibu pulang dari TOWA Mall bawa belanjaan banyak, dikasih kembaliannya buat kamu!",
  "Dapat orderan antar dokumen penting ke Balai Distrik TOWA, bayarannya lumayan banget!",
  "Nganterin paket sepatu ke TOWA Resident, yang nerima ngasih tip gede!",
  "Perjalanan malam yang sepi, ngantar penumpang ke Tongkrongan TOWA dengan santai dan dibayar tunai!",
];

const SAFE_FAIL_STORIES = [
  "Ban motormu bocor kena paku di jalan raya. Penumpang ngomel dan pesan ojek lain. Kamu cuma dapat pengalaman pahit.",
  "Motor mendadak mogok di tengah jalan raya. Penumpang kapok dan memilih jalan kaki.",
  "Penumpang lupa bawa dompet dan janji mau transfer, tapi nomormu malah diblokir.",
  "Terjebak macet total karena ada event besar di Distrik TOWA, orderan akhirnya dibatalkan oleh penumpang.",
  "Udah nunggu 15 menit di titik jemput TOWA Station, eh ternyata dighosting!",
];

const RISK_SUCCESS_STORIES = [
  "Kamu mengantar mahasiswa ke TOWA University ngebut lewat jalan tikus sat-set, dapet tip ekstra!",
  "Dapat penumpang anak sekolah yang telat! Lewat jalan tikus dan nembus gang sempit, sampai tepat sebelum gerbang ditutup!",
  "Kamu nyelip jemuran warga, terbang ngelewatin 3 polisi tidur, dan berhasil memangkas waktu 20 menit! Penumpang kagum dan ngasih TIP JUMBO!",
  "Ngebut lewat jalan tikus sambil diiringi gonggongan anjing TOWA Resident. Berhasil sampai tujuan dengan selamat dan adrenalin tinggi!",
];

const RISK_FAIL_STORIES = [
  "💥 **NABRAK KANDANG AYAM!** Kamu ngebut di gang sempit dan malah nabrak kandang ayam Ketua RT. Penumpang kabur ketakutan dan kamu kena semprot warga!",
  "💥 **NYUNGSEP KE GOT!** Mencoba manuver miring di jalan tikus yang licin, kamu dan penumpang malah nyungsep ke got warga. Baju basah kuyup, orderan batal!",
  "Dikejar rombongan anjing kompleks saat lewat jalan tikus! Penumpang panik minta turun di tengah jalan dan gak mau bayar.",
  "Terjebak portal gang tikus yang mendadak dikunci warga. Penumpang ngomel karena malah jadi makin lama.",
];

function getRandomStory(stories: string[]): string {
  return stories[Math.floor(Math.random() * stories.length)];
}

export const data = new SlashCommandBuilder()
  .setName("ngojek")
  .setDescription(
    "Buka aplikasi TOWA Driver, ambil orderan, dan hadapi rintangannya!",
  );

export async function execute(ctx: CommandContext) {
  await ctx.defer();


  // VALIDASI PERSYARATAN (SERVICE)

  const prep = await prepareNgojek(ctx.userId);

  if (!prep.success || !prep.rank || !prep.env) {
    // CONTEXTUAL ACTION BUTTONS
    if (prep.reason === "LOW_BENSIN" || prep.reason === "LOW_STAMINA") {
      const isBensin = prep.reason === "LOW_BENSIN";
      const itemId = isBensin ? "item_bensin" : "item_nasitelur";
      const itemName = isBensin ? "Pertalite" : "Nasi Telur";
      const itemEmoji = isBensin ? "⛽" : "🍳";

      const itemCount = isBensin
        ? prep.inventoryContext?.bensinCount || 0
        : prep.inventoryContext?.nasiTelurCount || 0;

      const row = new ActionRowBuilder<ButtonBuilder>();

      if (itemCount > 0) {
        row.addComponents(
          new ButtonBuilder()
            .setCustomId(`use_ctx_${itemId}`)
            .setLabel(`Pakai ${itemName} (Sisa: ${itemCount})`)
            .setEmoji(itemEmoji)
            .setStyle(ButtonStyle.Success),
        );
      } else {

        row.addComponents(
          new ButtonBuilder()
            .setCustomId("empty_item")
            .setLabel(`${itemName} Habis! Beli di Shop.`)
            .setEmoji("🛒")
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(true),
        );
      }

      const errResponse = await ctx.editReply({
        content: prep.message,
        components: [row],
      });

    
      if (itemCount > 0 && errResponse) {
        try {
          const btnInteraction = await errResponse.awaitMessageComponent({
            filter: (i) =>
              i.user.id === ctx.userId && i.customId === `use_ctx_${itemId}`,
            time: 15000,
            componentType: ComponentType.Button,
          });

          await btnInteraction.deferUpdate();

       
          const useResult = await useItem(ctx.userId, itemId);

          if (useResult.success) {
            return ctx.editReply({
              content: `${useResult.message}\n\n✅ **Siap narik lagi! Silakan ketik \`/ngojek\` kembali.**`,
              components: [],
            });
          } else {
            return ctx.editReply({
              content: `❌ Gagal memakai item: ${useResult.message}`,
              components: [],
            });
          }
        } catch {
     
          return ctx.editReply({ content: prep.message, components: [] });
        }
      }
      return; 
    }

    // Default error 
    return ctx.editReply({ content: prep.message });
  }

  const { rank, env, hasDrag } = prep;
  const rankName = rank.title;


  // NCOUNTER INTERAKTIF 
  const encounterEmbed = new EmbedBuilder()
    .setColor("#F1C40F")
    .setAuthor({
      name: `TOWA Driver 🛵 | ${ctx.user.username} (${rankName})`,
      iconURL: ctx.user.displayAvatarURL(),
    })
    .setTitle("📱 ORDERAN MASUK!")
    .setDescription(
      `**Kondisi Cuaca:** ${env.emoji} **${env.weatherName}**\n` +
        `*${env.storyModifier}*\n\n` +
        "Ada warga minta diantar ke tujuan secepatnya.\n\nNamun rute utama di depan sedang macet total karena ada perbaikan jalan.\n\n**Kamu mau ambil rute yang mana?**",
    )
    .addFields(
      {
        name: "🪖 Equipment Active",
        value: hasDrag ? "Helm Drag (CD -50%)" : "Helm Bogo Standard",
        inline: true,
      },
      {
        name: "📊 Surge Price Multiplier",
        value: `**${env.coinMultiplier}x T-Coin**`,
        inline: true,
      },
    )
    .setFooter({ text: "Waktu memilih: 15 detik" });

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId("rute_aman")
      .setLabel("Jalan Raya")
      .setEmoji("🛣️")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId("rute_berisiko")
      .setLabel("Gang Tikus")
      .setEmoji("🏘️")
      .setStyle(ButtonStyle.Danger),
  );

  const response = await ctx.editReply({
    embeds: [encounterEmbed],
    components: [row],
  });

  if (!response) return;


  // COLLECTOR
  try {
    const confirmation = await response.awaitMessageComponent({
      filter: (i) => i.user.id === ctx.userId,
      time: 15000,
      componentType: ComponentType.Button,
    });

    await confirmation.deferUpdate();


    // FRANDOM STORY & CALCULATE RNG
    let isSuccess = false;
    let routeMultiplier = 1.0;
    let storyText = "";

    const baseSafeRate = 0.85;
    const baseRiskRate = 0.55 - env.failRiskBonus;

    if (confirmation.customId === "rute_aman") {
      isSuccess = Math.random() < baseSafeRate;
      routeMultiplier = 1.0;
      storyText = isSuccess
        ? `✅ **Ngojek Sukses!**\n${getRandomStory(SAFE_SUCCESS_STORIES)}`
        : `💥 **Apes Banget!**\n${getRandomStory(SAFE_FAIL_STORIES)}`;
    } else if (confirmation.customId === "rute_berisiko") {
      isSuccess = Math.random() < Math.max(0.2, baseRiskRate);
      routeMultiplier = 1.7;
      storyText = isSuccess
        ? `🔥 **Aksi Berhasil!**\n${getRandomStory(RISK_SUCCESS_STORIES)}`
        : `💥 **AKSI Gagal!**\n${getRandomStory(RISK_FAIL_STORIES)}`;
    }


    // Ssave to database
    const result = await executeNgojek(
      ctx.userId,
      isSuccess,
      routeMultiplier,
      env.coinMultiplier,
    );

    if (!result.success) {
      return ctx.editReply({
        content: result.message,
        embeds: [],
        components: [],
      });
    }

    let dropMessage = "";
    if (result.droppedItem) {
      dropMessage = `\n\n🎁 **BONUS DROP:** Mantap! Kamu nemu **${result.droppedItem.name}** di pinggir jalan!`;
    }


    // TAMPILKAN HASIL AKHIR

    const finalEmbed = new EmbedBuilder()
      .setColor(isSuccess ? "#57F287" : "#ED4245")
      .setAuthor({
        name: `TOWA Driver 🛵 | ${ctx.user.username}`,
        iconURL: ctx.user.displayAvatarURL(),
      })
      .setDescription(storyText + dropMessage)
      .addFields(
        {
          name: "💰 Pendapatan",
          value: `**+${result.earnedTC} TC** | +${result.earnedExp} EXP`,
          inline: true,
        },
        {
          name: "⛽ Bensin",
          value: `${result.newBensin}%`,
          inline: true,
        },
        {
          name: "⚡ Stamina",
          value: `${result.newStamina}/100`,
          inline: true,
        },
        {
          name: "🏆 Total Narik",
          value: `${result.newTotalOjek}x (${result.rankName})`,
          inline: false,
        },
      )
      .setFooter({ text: `TOWA Economy System • Ngojek` });

    await ctx.editReply({ embeds: [finalEmbed], components: [] });
  } catch (e) {
    await ctx.editReply({
      content:
        "⏳ **Waktu Habis!** Kamu terlalu lama melamun ngeliatin HP. Warga keburu pesan ojek lain.",
      embeds: [],
      components: [],
    });
  }
}
