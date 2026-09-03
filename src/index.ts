import dotenv from "dotenv";
import { client } from "./config/client.js";
import { supabase } from "./database/supabase.js";
import { loadCommands } from "./utils/commandLoader.js";
import { registerCommands } from "./utils/deployCommands.js";
import { loadAllowedChannelsCache } from "./middlewares/checkChannel.js";
import { handleInteraction } from "./events/interactionCreate.js";
import { handleMessage } from "./events/messageCreate.js";
import { loadFonts } from "./utils/fontLoader.js";

dotenv.config();

async function bootstrap() {
  console.log("🔄 Memeriksa koneksi ke Supabase...");

  loadFonts();
  const { error } = await supabase.from("master_items").select("id").limit(1);
  if (error) {
    console.error("❌ Gagal terhubung ke Supabase:", error.message);
    return;
  }
  console.log("✅ Supabase Terhubung!");

  const { commandsMap, commandsData } = await loadCommands();

  await registerCommands(commandsData);

  await loadAllowedChannelsCache();

  client.once("clientReady", () => {
    console.log(`🤖 Bot Berhasil Online sebagai: ${client.user?.tag}`);
  });

  client.on("interactionCreate", (interaction) => {
    handleInteraction(interaction, commandsMap);
  });

  client.on("messageCreate", (message) => {
    handleMessage(message, commandsMap);
  });

  await client.login(process.env.DISCORD_TOKEN);
}

bootstrap();
