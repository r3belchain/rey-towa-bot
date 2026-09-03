
import { EmbedBuilder } from "discord.js";

export function buildShopCatalogEmbed(items: any[]) {
  const embed = new EmbedBuilder()
    .setColor("#FFAA00")
    .setTitle("🏪 TOWA Supermarket & Bengkel")
    .setDescription(
      "Selamat datang! Gunakan `/shop buy <id_item>` untuk membeli barang.\n\n",
    )
    .setFooter({ text: "TOWA Economy System • Shop" });

  if (items.length === 0) {
    embed.addFields({
      name: "Katalog Kosong",
      value: "Toko sedang tutup. Tidak ada barang yang dijual.",
    });
    return embed;
  }


  const categories: Record<string, any[]> = {};
  items.forEach((item) => {
    const cat = item.category || "LAINNYA";
    if (!categories[cat]) categories[cat] = [];
    categories[cat].push(item);
  });

  // field per kategori
  for (const [category, catItems] of Object.entries(categories)) {
    let listString = "";
    catItems.forEach((i) => {
   
      let reqText = "";
      if (i.requirements && i.requirements.req_ojek_count) {
        reqText = `\n*(🔒 Syarat: ${i.requirements.req_ojek_count}x Ngojek)*`;
      }

      listString +=
        `**${i.name}**\n` +
        `📝 ID: \`${i.id}\` | 💰 Beli: **${i.buy_price.toLocaleString("id-ID")} TC**` +
        reqText +
        `\n└ ${i.description}\n\n`;
    });

    embed.addFields({ name: `🛒 KATEGORI: ${category}`, value: listString });
  }

  return embed;
}
