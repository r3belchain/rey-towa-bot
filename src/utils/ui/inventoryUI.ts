// src/utils/ui/inventoryUI.ts
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  User,
} from "discord.js";

const ITEMS_PER_PAGE = 5;

/**
 * Fungsi utilitas untuk merakit Embed + Select Menu + Navigasi Halaman Inventory
 */
export function buildInventoryListUI(
  inventory: any[],
  user: User,
  page: number = 1,
) {
  const usedSlots = inventory.length;
  const maxSlots = 20; 
  const totalPages = Math.ceil(usedSlots / ITEMS_PER_PAGE) || 1;
  const currentPage = Math.max(1, Math.min(page, totalPages));

  const embed = new EmbedBuilder()
    .setTitle(`🎒 Warga Inventory — ${user.username}`)
    .setColor("#34495E")
    .setDescription(`Kapasitas Inventory: **${usedSlots} / ${maxSlots} Slot**`)
    .setFooter({ text: "TOWA Economy System • Inventory" });


  if (usedSlots === 0) {
    embed.addFields({
      name: "Inventory Kosong",
      value: "Kamu belum memiliki barang apa pun di dalam tasmu.",
    });
    return { embeds: [embed], components: [] };
  }

  // Pagination
  const start = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedItems = inventory.slice(start, start + ITEMS_PER_PAGE);

  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId("inv_select_item")
    .setPlaceholder("🔍 Pilih item untuk melihat detail");

  let inventoryText = "";

  paginatedItems.forEach((row) => {
    const itemData = row.master_items as any;

    if (!itemData) return;

    const category = (itemData.category || "UNKNOWN").toUpperCase();

    inventoryText += `**${itemData.name}** \`${category}\`\n`;
    inventoryText +=
      category === "EQUIPMENT"
        ? `└ ⚙️ Durability: **${row.durability !== null ? row.durability : 100}/100**\n\n`
        : `└ 📦 Jumlah: **${row.quantity}x**\n\n`;

    selectMenu.addOptions(
      new StringSelectMenuOptionBuilder()
        .setLabel(itemData.name.replace(/^[^\w\s]+/, "").trim())
        .setValue(itemData.id)
        .setDescription(`Kategori: ${category} | Jumlah: ${row.quantity}x`),
    );
  });

  embed.addFields({
    name: `Daftar Item Halaman ${currentPage}/${totalPages}`,
    value: inventoryText || "Terjadi kesalahan saat memuat daftar item.",
  });

  const selectRow =
    new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);


  if (totalPages > 1) {
    const navRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(`inv_page_${currentPage - 1}`)
        .setEmoji("◀️")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(currentPage === 1),

      new ButtonBuilder()
        .setCustomId("inv_page_indicator")
        .setLabel(`${currentPage} / ${totalPages}`)
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(true),

      new ButtonBuilder()
        .setCustomId(`inv_page_${currentPage + 1}`)
        .setEmoji("▶️")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(currentPage === totalPages),
    );

    return { embeds: [embed], components: [selectRow, navRow] };
  }

  return { embeds: [embed], components: [selectRow] };
}
