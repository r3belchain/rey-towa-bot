import { Interaction, InteractionReplyOptions } from "discord.js";
import { SlashCommand } from "../config/client.js";
import { handleInventoryComponents } from "../handlers/components/inventoryHandler.js";
import { handleRegistrationComponents } from "../handlers/components/registrationHandler.js";
import { checkChannel } from "../middlewares/checkChannel.js";
import { checkCooldown } from "../middlewares/checkCooldown.js";
import { checkRegistration } from "../middlewares/checkRegistration.js";
import { CommandContext } from "../structures/CommandContext.js";

export async function handleInteraction(
  interaction: Interaction,
  commandsMap: Map<string, SlashCommand>,
) {
  // ROUTING MODAL SUBMIT
  if (interaction.isModalSubmit()) {
    if (interaction.customId.startsWith("modal_register_")) {
      return handleRegistrationComponents(interaction);
    }
    return;
  }

  // ROUTING COMPONENT 
  if (interaction.isStringSelectMenu() || interaction.isButton()) {
    const customId = interaction.customId;

    if (customId.startsWith("inv_")) {
      
      return handleInventoryComponents(interaction);
    }


    if (customId.startsWith("path_") && interaction.isButton()) {
      return handleRegistrationComponents(interaction);
    }

    return;
  }

  if (interaction.isAutocomplete()) {
    const command = commandsMap.get(interaction.commandName);

    if (command && typeof command.autocomplete === "function") {
      try {
        return await command.autocomplete(interaction);
      } catch (error) {
        console.error(
          `[Error] Autocomplete gagal pada command ${interaction.commandName}:`,
          error,
        );
      }
    }
  
    else if (interaction.commandName === "inventory") {
      const { handleAutocomplete } =
        await import("../commands/economy/inventory.js");
      return handleAutocomplete(interaction);
    }

    return; 
  }

  // ROUTING SLASH COMMAND
  if (!interaction.isChatInputCommand()) return;

  const command = commandsMap.get(interaction.commandName);
  if (!command) return;

  const ctx = new CommandContext(interaction);

  const isAllowedChannel = await checkChannel(ctx);
  if (!isAllowedChannel) return;

  if (interaction.commandName !== "getting-started") {
    const isRegistered = await checkRegistration(ctx);
    if (!isRegistered) return;
  }

  const isCooledDown = await checkCooldown(ctx, 3);
  if (!isCooledDown) return;

  try {
    await command.execute(ctx);
  } catch (error) {
    console.error(`Error pada command ${interaction.commandName}:`, error);

    const replyOptions: InteractionReplyOptions = {
      content: "❌ Terjadi kesalahan sistem saat memproses perintah ini!",
      flags: ["Ephemeral"],
    };

    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(replyOptions);
    } else {
      await interaction.reply(replyOptions);
    }
  }
}
