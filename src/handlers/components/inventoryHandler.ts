
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  EmbedBuilder,
  StringSelectMenuInteraction,
} from "discord.js";
import {
  getSpecificItem,
  getUserInventory,
} from "../../services/economy/inventoryService.js";
import { useItem } from "../../services/economy/useItemService.js"; 
import { buildInventoryListUI } from "../../utils/ui/inventoryUI.js";

export async function handleInventoryComponents(
  interaction: StringSelectMenuInteraction | ButtonInteraction,
) {
  await interaction.deferUpdate();
  const userId = interaction.user.id;


  // HANDLERSELECT MENU 
  if (
    interaction.isStringSelectMenu() &&
    interaction.customId === "inv_select_item"
  ) {
    const itemId = interaction.values[0];
    const { data: itemInfo, error } = await getSpecificItem(userId, itemId);

    if (error || !itemInfo) {
      return interaction.followUp({
        content:
          "❌ Gagal memuat data item. Mungkin item sudah habis/terhapus.",
        flags: ["Ephemeral"],
      });
    }

    const master = itemInfo.master_items as any;
    const category = (master.category || "UNKNOWN").toUpperCase();

    const detailEmbed = new EmbedBuilder()
      .setTitle(`🔍 Detail Item — ${master.name}`)
      .setColor("#2E86C1")
      .setDescription(
        master.description || "Tidak ada deskripsi untuk item ini.",
      )
      .addFields(
        { name: "Kategori", value: `\`${category}\``, inline: true },
        {
          name: category === "EQUIPMENT" ? "Durability" : "Jumlah",
          value:
            category === "EQUIPMENT"
              ? `**${itemInfo.durability !== null ? itemInfo.durability : 100}/100**`
              : `**${itemInfo.quantity}x**`,
          inline: true,
        },
        {
          name: "Bisa Ditransfer?",
          value: master.is_tradeable ? "✅ Ya" : "❌ Tidak",
          inline: true,
        },
      )
      .setFooter({ text: "Gunakan tombol di bawah untuk interaksi" });

    const actionButtons = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(`inv_use_${itemId}`)
        .setLabel("Gunakan")
        .setEmoji("⚡")
        .setStyle(ButtonStyle.Success)
        .setDisabled(category === "EQUIPMENT"),

      new ButtonBuilder()
        .setCustomId(`inv_give_init_${itemId}`)
        .setLabel("Berikan")
        .setEmoji("🎁")
        .setStyle(ButtonStyle.Primary)
        .setDisabled(!master.is_tradeable),

      new ButtonBuilder()
        .setCustomId("inv_back")
        .setLabel("Kembali ke Inventory")
        .setEmoji("⬅️")
        .setStyle(ButtonStyle.Secondary),
    );

    return interaction.editReply({
      embeds: [detailEmbed],
      components: [actionButtons],
    });
  }

  // HANDLER: DIKLIK
  if (interaction.isButton()) {
    const customId = interaction.customId;

   
    if (customId === "inv_back") {
      const { data: inventory, error } = await getUserInventory(userId);
      if (error || !inventory) {
        return interaction.followUp({
          content: "❌ Gagal memuat tas kamu.",
          flags: ["Ephemeral"],
        });
      }
      const uiElements = buildInventoryListUI(inventory, interaction.user);
      return interaction.editReply(uiElements);
    }


    if (customId.startsWith("inv_page_")) {
      const targetPage = parseInt(customId.replace("inv_page_", "")) || 1;
      const { data: inventory, error } = await getUserInventory(userId);
      if (error || !inventory) {
        return interaction.followUp({
          content: "❌ Gagal memuat tas kamu.",
          flags: ["Ephemeral"],
        });
      }
      const uiElements = buildInventoryListUI(
        inventory,
        interaction.user,
        targetPage,
      );
      return interaction.editReply(uiElements);
    }

  
    if (customId.startsWith("inv_use_")) {
      const itemId = customId.replace("inv_use_", "");

  
      const result = await useItem(userId, itemId);

      if (result.success) {
   
        await interaction.followUp({
          content: `✅ ${result.message}`,
        });

   
        const { data: inventory } = await getUserInventory(userId);
        if (inventory) {
          const uiElements = buildInventoryListUI(inventory, interaction.user);
          return interaction.editReply(uiElements);
        }
        return;
      } else {
    
        return interaction.followUp({
          content: `⚠️ **Gagal:** ${result.message}`,
          flags: ["Ephemeral"],
        });
      }
    }

    //GIVE
    if (customId.startsWith("inv_give_init_")) {
      const itemId = customId.replace("inv_give_init_", "");
      const { data: itemInfo } = await getSpecificItem(
        interaction.user.id,
        itemId,
      );
      const masterData = itemInfo?.master_items as any;
      const itemName = masterData?.name || itemId;

      return interaction.followUp({
        content: `💡 **Fitur Transfer Cepat:**\nUntuk memberikan **${itemName}** kepada warga lain, silakan ketik command ini di chat:\n\n👉 \`/inventory give target:@NamaTeman item_id:${itemId}\`\natau via prefix:\n👉 \`rinventory give @NamaTeman ${itemId} 1\``,
        flags: ["Ephemeral"],
      });
    }
  }
}
