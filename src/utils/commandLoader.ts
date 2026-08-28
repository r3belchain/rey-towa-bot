import { Collection } from "discord.js";
import fs from "fs";
import path from "path";
import { pathToFileURL } from "url";
import { SlashCommand } from "../config/client.js";

export async function loadCommands() {
  const commandsMap = new Collection<string, SlashCommand>();
  const commandsData: any[] = [];

  const commandsPath = path.join(__dirname, "../commands");
  if (!fs.existsSync(commandsPath)) return { commandsMap, commandsData };

  const categories = fs.readdirSync(commandsPath);

  for (const category of categories) {
    const categoryPath = path.join(commandsPath, category);
    if (!fs.statSync(categoryPath).isDirectory()) continue;

    const files = fs
      .readdirSync(categoryPath)
      .filter((file) => file.endsWith(".ts") || file.endsWith(".js"));

    for (const file of files) {
      const filePath = path.join(categoryPath, file);
      const fileUrl = pathToFileURL(filePath).href;
      const command = await import(fileUrl);

      if (command.data && command.execute) {
        commandsMap.set(command.data.name, command);
        commandsData.push(command.data.toJSON());
        console.log(`📦 Command terload: [${category}] /${command.data.name}`);
      }
    }
  }

  return { commandsMap, commandsData };
}
