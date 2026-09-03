  // src/commands/economy/use.ts
  import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
  import { CommandContext } from "../../structures/CommandContext.js";
  import { useItem } from "../../services/economy/useItemService.js";

  export const data = new SlashCommandBuilder()
    .setName("use")
    .setDescription(
      "Gunakan consumable item dari tas kamu (Makan/Minum/Isi Bensin)",
    )
    .addStringOption((option) =>
      option
        .setName("item")
        .setDescription("Pilih item yang ingin dipakai")
        .setRequired(true)
        .addChoices(
          { name: "🍳 Nasi Telur (+50 Stamina)", value: "item_nasitelur" },
          { name: "⛽ Pertalite (+50% Bensin)", value: "item_bensin" },
          { name: "🚬 Rokok Sebat (Buff CD -20% 1x)", value: "item_rokok" },
          {
            name: "☕ Kopi Susu (Buff CD -30% 30 Menit)",
            value: "item_kopisusu",
          },
        ),
    );

  export async function execute(ctx: CommandContext) {
    await ctx.defer();

    if (!ctx.interaction) {
      return ctx.editReply({
        content: "❌ Perintah ini hanya bisa digunakan melalui Slash Command.",
      });
    }

    const itemId = ctx.interaction.options.getString("item", true);

  
    const result = await useItem(ctx.userId, itemId);

    if (!result.success) {
      return ctx.editReply({ content: result.message });
    }

    // Visual
    const embed = new EmbedBuilder()
      .setColor("#57F287")
      .setAuthor({
        name: `Inventory TOWA | ${ctx.user.username}`,
        iconURL: ctx.user.displayAvatarURL(),
      })
      .setDescription(`✅ ${result.message}`);

    await ctx.editReply({ embeds: [embed] });
  }
