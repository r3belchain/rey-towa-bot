import {
  REST,
  Routes,
  RESTPostAPIChatInputApplicationCommandsJSONBody,
} from "discord.js";
import dotenv from "dotenv";

dotenv.config();

export async function registerCommands(
  commandsData: RESTPostAPIChatInputApplicationCommandsJSONBody[],
) {
  const token = process.env.DISCORD_TOKEN;
  const clientId = process.env.DISCORD_CLIENT_ID;
  const guildId = process.env.DISCORD_GUILD_ID;

  if (!token || !clientId) {
    console.error(
      "❌ DISCORD_TOKEN atau DISCORD_CLIENT_ID belum diatur di .env!",
    );
    return;
  }

  const rest = new REST({ version: "10" }).setToken(token);

  try {
    console.log("🔄 Memulai sinkronisasi Slash Commands ke Discord...");

    if (guildId) {
   
      await rest.put(Routes.applicationGuildCommands(clientId, guildId), {
        body: commandsData,
      });
      console.log(
        `✅ Slash Commands berhasil didaftarkan secara INSTAN ke server (Guild ID: ${guildId})!`,
      );
    } else {
      await rest.put(Routes.applicationCommands(clientId), {
        body: commandsData,
      });
      console.log("✅ Slash Commands berhasil didaftarkan secara GLOBAL!");
    }
  } catch (error) {
    console.error("❌ Gagal mendaftarkan Slash Commands:", error);
  }
}
