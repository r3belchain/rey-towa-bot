// src/commands/economy/shop.ts
import { SlashCommandBuilder, AutocompleteInteraction } from "discord.js";
import {
  buyItem,
  getShopCatalog,
  sellItem,
} from "../../services/economy/shopService.js";
import { CommandContext } from "../../structures/CommandContext.js";
import { buildShopCatalogEmbed } from "../../utils/ui/shopUI.js";

export const data = new SlashCommandBuilder()
  .setName("shop")
  .setDescription("Akses toko TOWA (Beli, Jual, Lihat Katalog)")
  .addSubcommand((sub) =>
    sub
      .setName("list")
      .setDescription("Lihat katalog barang yang dijual di toko"),
  )
  .addSubcommand((sub) =>
    sub
      .setName("buy")
      .setDescription("Beli barang dari toko")
      .addStringOption((opt) =>
        opt
          .setName("item_id")
          .setDescription("Ketik nama barang...")
          .setRequired(true)
          .setAutocomplete(true),
      ) 
      .addIntegerOption((opt) =>
        opt
          .setName("jumlah")
          .setDescription("Jumlah barang (Default 1)")
          .setMinValue(1),
      ),
  )
  .addSubcommand((sub) =>
    sub
      .setName("sell")
      .setDescription("Jual barang ke toko")
      .addStringOption((opt) =>
        opt
          .setName("item_id")
          .setDescription("Ketik nama barang...")
          .setRequired(true)
          .setAutocomplete(true),
      ) 
      .addIntegerOption((opt) =>
        opt
          .setName("jumlah")
          .setDescription("Jumlah barang (Default 1)")
          .setMinValue(1),
      ),
  );

  export async function autocomplete(interaction: AutocompleteInteraction) {
    const focusedValue = interaction.options.getFocused().toLowerCase();
    const subCommand = interaction.options.getSubcommand();


    const items = await getShopCatalog();

   
    const filtered = items.filter(
      (item) =>
        item.name.toLowerCase().includes(focusedValue) ||
        item.id.toLowerCase().includes(focusedValue),
    );
// Kirim balik ke Discord UI (Maksimal 25 pilihan)
    await interaction.respond(
      filtered.slice(0, 25).map((item) => ({
        name: `${item.name} — 💰 ${item.buy_price} TC`, 
        value: item.id, 
      })),
    );
  }

export async function execute(ctx: CommandContext) {
  await ctx.defer();


  const action = ctx.getSubcommand() || "list";
  let itemId = "";
  let qty = 1;

  // PARSING ARGUMEN HYBRI
  if (ctx.isInteraction && ctx.interaction) {
    if (action === "buy" || action === "sell") {
      itemId = ctx.interaction.options.getString("item_id", true);
      qty = ctx.interaction.options.getInteger("jumlah") || 1;
    }
  } else if (ctx.message) {

    const args = ctx.message.content.trim().split(/ +/);

    if (action === "buy" || action === "sell") {
      itemId = args[2];
      if (!itemId) {
        return ctx.editReply({
          content:
            "❌ Perintah toko tidak dikenali. Coba: `rshop list`, `rshop buy`, atau `rshop sell`.",
        });
      }
      qty = parseInt(args[3]) || 1;
    }
  }

  // ROUTER EKSEKUSI BERDASARKAN ACTION
  if (action === "list") {
    const items = await getShopCatalog();
    const embed = buildShopCatalogEmbed(items);
    return ctx.editReply({ embeds: [embed] });
  }

  if (action === "buy") {
    const result = await buyItem(ctx.userId, itemId, qty);
    return ctx.editReply({ content: result.message });
  }

  if (action === "sell") {
    const result = await sellItem(ctx.userId, itemId, qty);
    return ctx.editReply({ content: result.message });
  }


  return ctx.editReply({
    content:
      "❌ Perintah toko tidak dikenali. Coba: `list`, `buy`, atau `sell`.",
  });
}
