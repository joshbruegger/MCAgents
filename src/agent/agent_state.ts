import { Decision } from "./cognitive_controller.ts";

export type AgentState = {
  inventory: Record<string, number>;
  location: { x: number; y: number; z: number };
  memory: Record<string, any>;
  social: Record<string, any>;
  actionAwareness: Record<string, any>;
  decisions: Decision[];
};

export function createAgentState(): AgentState {
  return {
    inventory: {},
    location: { x: 0, y: 0, z: 0 },
    memory: {},
    social: {},
    actionAwareness: {},
    decisions: [],
  };
}
