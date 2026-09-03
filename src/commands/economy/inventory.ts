import { AutocompleteInteraction, SlashCommandBuilder } from "discord.js";
import {
  getSpecificItem,
  getUserInventory,
  transferItem,
} from "../../services/economy/inventoryService.js";
import { useItem } from "../../services/economy/useItemService.js";
import { CommandContext } from "../../structures/CommandContext.js";
import { buildInventoryListUI } from "../../utils/ui/inventoryUI.js";

export const data = new SlashCommandBuilder()
  .setName("inventory")
  .setDescription("Buka Warga Inventory atau kelola item kamu.")
  .addSubcommand((sub) =>
    sub.setName("view").setDescription("Lihat isi inventory kamu saat ini."),
  )
  .addSubcommand((sub) =>
    sub
      .setName("use")
      .setDescription("Gunakan item dari inventory kamu.")
      .addStringOption((opt) =>
        opt
          .setName("item_id")
          .setDescription("Pilih item yang ingin digunakan")
          .setRequired(true)
          .setAutocomplete(true),
      ),
  )
  .addSubcommand((sub) =>
    sub
      .setName("give")
      .setDescription("Berikan item ke warga lain.")
      .addUserOption((opt) =>
        opt
          .setName("target")
          .setDescription("Warga penerima")
          .setRequired(true),
      )
      .addStringOption((opt) =>
        opt
          .setName("item_id")
          .setDescription("Pilih item yang ingin diberikan")
          .setRequired(true)
          .setAutocomplete(true),
      )
      .addIntegerOption((opt) =>
        opt.setName("jumlah").setDescription("Jumlah item").setMinValue(1),
      ),
  );

export async function execute(ctx: CommandContext) {
  await ctx.defer();
  const subcommand = ctx.getSubcommand() || "view";

  switch (subcommand) {
    case "view":
      return handleView(ctx);
    case "use":
      return handleUse(ctx);
    case "give":
      return handleGive(ctx);
    default:
      return handleView(ctx);
  }
}

async function handleView(ctx: CommandContext) {
  const { data: inventory, error } = await getUserInventory(ctx.userId);

  if (error || !inventory) {
    return ctx.editReply(
      "❌ Gagal memuat tas kamu. Terjadi kesalahan database.",
    );
  }

  const uiElements = buildInventoryListUI(inventory, ctx.user);
  await ctx.editReply(uiElements);
}

async function handleGive(ctx: CommandContext) {
  let targetId: string | null = null;
  let itemId: string | null = null;
  let qty: number = 1;

  if (ctx.isInteraction && ctx.interaction) {
    const target = ctx.interaction.options.getUser("target");
    targetId = target ? target.id : null;
    itemId = ctx.interaction.options.getString("item_id");
    qty = ctx.interaction.options.getInteger("jumlah") || 1;
  } else if (ctx.message) {
    const args = ctx.message.content.trim().split(/ +/);
    const giveIndex = args.findIndex((arg) => arg.toLowerCase() === "give");

    if (giveIndex !== -1) {
      const mention = ctx.message.mentions.users.first();
      targetId = mention ? mention.id : null;
      const remainingArgs = args
        .slice(giveIndex + 1)
        .filter((arg) => !arg.startsWith("<@"));
      itemId = remainingArgs[0] || null;
      qty = parseInt(remainingArgs[1]) || 1;
    }
  }

  if (!targetId || !itemId)
    return ctx.editReply(
      "❌ **Format salah!** Gunakan mention dan ID item dengan benar.",
    );
  if (targetId === ctx.userId)
    return ctx.editReply("❌ Tidak bisa memberikan barang ke diri sendiri!");
  if (qty <= 0) return ctx.editReply("❌ Jumlah harus lebih dari 0!");

  const { data: itemInfo } = await getSpecificItem(ctx.userId, itemId);
  const masterData = itemInfo?.master_items as any;
  const itemName = masterData?.name || itemId;

  const response = await transferItem(ctx.userId, targetId, itemId, qty);

  if (response.success) {
    return ctx.editReply(
      `🤝 **Transaksi Sukses!**\nKamu memberikan **${qty}x \`${itemName}\`** kepada <@${targetId}>.`,
    );
  } else {
    return ctx.editReply(`⚠️ **Transfer Gagal:** ${response.message}`);
  }
}

async function handleUse(ctx: CommandContext) {
  let itemId: string | null = null;

  if (ctx.isInteraction && ctx.interaction) {
    itemId = ctx.interaction.options.getString("item_id");
  } else if (ctx.message) {
    const args = ctx.message.content.trim().split(/ +/);
    const useIndex = args.findIndex((arg) => arg.toLowerCase() === "use");
    if (useIndex !== -1) {
      itemId = args[useIndex + 1] || null;
    }
  }

  if (!itemId) {
    return ctx.editReply(
      "❌ Harap masukkan ID item! Contoh: `/inventory use item_id:item_air_sihir` atau `rinventory use item_air_sihir`.",
    );
  }

  const result = await useItem(ctx.userId, itemId.toLowerCase());

  if (result.success) {
    return ctx.editReply(`⚡ ${result.message}`);
  } else {
    return ctx.editReply(`⚠️ ${result.message}`);
  }
}

export async function handleAutocomplete(interaction: AutocompleteInteraction) {
  const focusedOption = interaction.options.getFocused(true);
  const userId = interaction.user.id;

  if (focusedOption.name === "item_id") {
    const { data: inventory } = await getUserInventory(userId);

    if (!inventory || inventory.length === 0) {
      return interaction.respond([]);
    }

    const filtered = inventory
      .filter((row) => {
        const item = row.master_items as any;
        if (!item) return false;
        return (
          item.name.toLowerCase().includes(focusedOption.value.toLowerCase()) ||
          item.id.toLowerCase().includes(focusedOption.value.toLowerCase())
        );
      })
      .slice(0, 25);

    await interaction.respond(
      filtered.map((row) => {
        const item = row.master_items as any;
        return {
          name: `${item.name} (${row.quantity}x)`,
          value: item.id,
        };
      }),
    );
  }
}
