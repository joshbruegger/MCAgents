import * as path from "jsr:@std/path";
import { stringify } from "yaml";
import { z } from "zod";
import { loadConfig } from "zod-config";
import { yamlAdapter } from "zod-config/yaml-adapter";

const configSchema = z.object({
  root_dir: z.string().default("output"),
  modules: z.object({
    cognitive_controller: z.object({
      update_interval: z.number(),
      llm: z.object({
        model: z.string().default("gpt-4o"),
      }),
    }),
    memory: z.object({
      update_interval: z.number().default(0.2),
      working_memory_size: z.number().default(10),
      short_term_memory_size: z.number().default(10),
      long_term_memory_size: z.number().default(10),
    }),
    action_awareness: z.object({
      update_interval: z.number().default(0.2),
    }),
    goal_generation: z.object({
      update_interval: z.number().default(0.2),
    }),
    social_awareness: z.object({
      update_interval: z.number().default(0.2),
    }),
    talking: z.object({
      update_interval: z.number().default(0.2),
    }),
    skill_execution: z.object({
      update_interval: z.number().default(0.1),
    }),
  }),
  mc: z.object({
    host: z.string().default("localhost"),
    port: z.number().default(25565),
    username: z.string().default("MCAgent"),
    version: z.string().default("1.20.4"),
    viewing_server_port: z.number().default(3000),
  }),
});

export type AgentConfig = z.infer<typeof configSchema>;

const CONFIG_DIR = path.join(path.dirname(Deno.cwd()), "config");
const DEFAULT_CONFIG_PATH = path.join(CONFIG_DIR, "default.yml");

export async function getDefaultConfig() {
  const config = await loadConfig({
    schema: configSchema,
    adapters: yamlAdapter({ path: DEFAULT_CONFIG_PATH }),
  });
  return config;
}

export async function getConfig(config_path: string) {
  const config = await loadConfig({
    schema: configSchema,
    adapters: yamlAdapter({ path: config_path }),
  });
  return config;
}

export async function saveConfig(config: AgentConfig) {
  const config_path = path.join(config.root_dir, "config.yml");
  const config_dir = path.dirname(config_path);
  if (!Deno.statSync(config_dir).isDirectory) {
    Deno.mkdirSync(config_dir, { recursive: true });
  }
  await Deno.writeTextFile(config_path, stringify(config));
}
