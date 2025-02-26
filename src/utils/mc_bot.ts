import { createBot } from "mineflayer";
import { loader as autoEat } from "mineflayer-auto-eat";
import { plugin as collectblock } from "mineflayer-collectblock";
import { pathfinder } from "mineflayer-pathfinder";
import { plugin as pvp } from "mineflayer-pvp";
import { mineflayer as mineflayerViewer } from "prismarine-viewer";
import { AgentConfig } from "./config.ts";

/** Initializes the mineflayer bot instance with plugins */
export function initializeBot(config: AgentConfig) {
  console.info("Initializing bot for user", config.mc.username);

  const bot = createBot({
    username: config.mc.username,
    host: config.mc.host,
    port: config.mc.port,
    version: config.mc.version,
    auth: "offline",
  });

  bot.loadPlugin(pathfinder);
  bot.loadPlugin(pvp);
  bot.loadPlugin(collectblock);
  bot.loadPlugin(autoEat);

  bot.once("resourcePack", () => {
    bot.acceptResourcePack();
  });

  bot.once("spawn", () => {
    console.info(`${config.mc.username} spawned`);
    mineflayerViewer(bot, {
      firstPerson: true,
      port: config.mc.viewing_server_port,
    });
  });

  bot.on("kicked", (reason) => {
    console.error(`${config.mc.username} kicked from server:`, reason);
  });

  bot.on("error", (error) => {
    console.error(`${config.mc.username} error:`, error);
  });

  return bot;
}
