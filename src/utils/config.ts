import * as path from "jsr:@std/path";
import { stringify } from "yaml";
import { z } from "zod";
import { loadConfig } from "zod-config";
import { yamlAdapter } from "zod-config/yaml-adapter";

const configSchema = z.object({
  root_dir: z.string().default("output"),
  modules: z.object({
    cognitive_controller: z.object({
      update_interval: z.number().default(200),
      llm: z.object({
        model: z.string().default("gpt-4o"),
      }),
    }),
    memory: z.object({
      update_interval: z.number().default(200),
      working_memory_size: z.number().default(10),
      short_term_memory_size: z.number().default(10),
      long_term_memory_size: z.number().default(10),
    }),
    action_awareness: z.object({
      update_interval: z.number().default(200),
    }),
    goal_generation: z.object({
      update_interval: z.number().default(200),
    }),
    social_awareness: z.object({
      update_interval: z.number().default(200),
    }),
    talking: z.object({
      update_interval: z.number().default(200),
    }),
    skill_execution: z.object({
      update_interval: z.number().default(100),
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

// Define a recursive DeepPartial type for nested objects
export type DeepPartial<T> = T extends object ? {
    [P in keyof T]?: DeepPartial<T[P]>;
  }
  : T;

/**
 * AgentConfig Constructor that allows partial config
 *
 * @param config - Partial config
 * @returns AgentConfig
 */
export function AgentConfig(
  config?: DeepPartial<AgentConfig>,
): AgentConfig {
  const defaultConfig = getDefaultConfig();
  if (config) {
    return deepMerge(defaultConfig, config) as AgentConfig;
  }
  return defaultConfig;
}

// const CONFIG_DIR = path.join(path.dirname(Deno.cwd()), "config");
// const DEFAULT_CONFIG_PATH = path.join(CONFIG_DIR, "default.yml");

function getDefaults<Schema extends z.AnyZodObject>(
  schema: Schema,
  // deno-lint-ignore no-explicit-any
): Record<string, any> {
  return Object.fromEntries(
    Object.entries(schema.shape).map(([key, value]) => {
      if (value instanceof z.ZodDefault) {
        return [key, value._def.defaultValue()];
      } else if (value instanceof z.ZodObject) {
        // Recursively get defaults for nested objects
        return [key, getDefaults(value)];
      }
      return [key, undefined];
    }),
  );
}

export function getDefaultConfig(): AgentConfig {
  return getDefaults(configSchema) as AgentConfig;
}

/**
 * Deep merge utility function for nested objects
 */
function deepMerge(
  // deno-lint-ignore no-explicit-any
  target: Record<string, any>,
  // deno-lint-ignore no-explicit-any
  source: Record<string, any>,
  // deno-lint-ignore no-explicit-any
): Record<string, any> {
  const output = { ...target };

  for (const key in source) {
    if (
      source[key] instanceof Object && key in target &&
      target[key] instanceof Object
    ) {
      output[key] = deepMerge(target[key], source[key]);
    } else {
      output[key] = source[key];
    }
  }

  return output;
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
