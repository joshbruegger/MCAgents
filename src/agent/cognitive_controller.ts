import { AgentState } from "./agent_state.ts";
import { Module } from "./modules/module.ts";
import { AgentConfig } from "./utils/config.ts";

/**
 * Type for decision object
 */
export type Decision = {
  action: string;
  parameters: Record<string, any>;
  reasoning: string;
  timestamp: number;
};

/**
 * The Cognitive Controller acts as an information bottleneck in the PIANO architecture.
 * It receives information from all other modules, makes high-level decisions, and
 * broadcasts these decisions back to the modules.
 */
export class CognitiveController {
  protected _config: AgentConfig;

  protected _modules: Module[] = [];

  protected _running: boolean = false;
  protected _updateInterval: number;

  protected _agentState: AgentState;

  /**
   * Initialize the Cognitive Controller.
   *
   * @param config - Configuration dictionary
   * @param agentState - Shared agent state
   */
  constructor(config: AgentConfig, agentState: AgentState) {
    this._config = config;
    this._updateInterval = config.modules.cognitive_controller.update_interval;
    this._agentState = agentState;

    // const llmConfig = config.llm as LLMConfig || {};
    // this.llmClient = new LLMClient(llmConfig);
  }

  /**
   * Register modules with the Cognitive Controller.
   *
   * @param modules - Record of modules
   */
  registerModules(modules: Module[]): void {
    this._modules = modules;

    // Register this controller with each module
    modules.forEach((module) => {
      module.registerCognitiveController(this);
    });

    console.debug(
      `Registered ${modules.length} modules with Cognitive Controller`,
    );
  }

  /** Start the Cognitive Controller */
  async start(): Promise<void> {
    if (this._running) {
      console.warn(`Cognitive Controller is already running`);
      return;
    }

    this._running = true;
    console.debug(`Starting Cognitive Controller`);

    // Start the module's main loop
    this._moduleLoop();
  }

  /** Stop the Cognitive Controller */
  async stop(): Promise<void> {
    if (!this._running) {
      console.warn(`Cognitive Controller is not running`);
      return;
    }

    this._running = false;
    console.debug(`Stopped Cognitive Controller`);
  }

  /** Main loop for the Cognitive Controller */
  private async _moduleLoop(): Promise<void> {
    console.debug(`Cognitive Controller loop started`);

    while (this._running) {
      try {
        // Run the module's update method
        await this.update();

        // Sleep for the update interval
        await new Promise((resolve) =>
          setTimeout(resolve, this._updateInterval * 1000)
        );
      } catch (e) {
        console.error(`Error in Cognitive Controller: ${e}`);
        // Continue running despite errors
      }
    }

    console.debug(`Cognitive Controller loop stopped`);
  }

  /**
   * Update method required by the Module base class.
   * This is called periodically by the module's main loop.
   */
  async update(): Promise<void> {
    try {
      // Make a decision
      const decision = await this._makeDecision();

      // Broadcast the decision to all modules
      await this._broadcastDecision(decision);
    } catch (e) {
      console.error(`Error in Cognitive Controller update: ${e}`);
    }
  }

  /**
   * Make a high-level decision based on the current agent state.
   *
   * @returns Decision dictionary
   */
  private async _makeDecision(): Promise<Decision> {
    // Create a bottlenecked representation of the agent state
    const bottleneckedState = this._createBottleneckedState(this._agentState);

    // Use the LLM to make a decision TODO: Implement this
    // const decision = await this._generateDecision(bottleneckedState);
    const decision = {
      action: "idle",
      parameters: {},
      reasoning: "No decision made",
      timestamp: Date.now() / 1000,
    };

    // Add the decision to the agent state
    if (!this._agentState.decisions) {
      this._agentState.decisions = [];
    }
    (this._agentState.decisions as Decision[]).push(decision);

    return decision;
  }

  /**
   * Create a bottlenecked representation of the agent state.
   *
   * This method implements the information bottleneck by selecting only
   * the most relevant information from the agent state and module states.
   *
   * @param moduleStates - States of all modules
   * @returns Bottlenecked state
   */
  private _createBottleneckedState(
    agentState: AgentState,
  ): Partial<AgentState> {
    // Extract relevant information from the agent state
    const bottleneckedState: Partial<AgentState> = {
      inventory: (agentState.inventory as Record<string, number>) || {},
      location: (agentState.location as { x: number; y: number; z: number }) ||
        { x: 0, y: 0, z: 0 },
    };

    // Add relevant information from module states
    if (agentState.memory) {
      bottleneckedState.memory = agentState.memory.relevantMemories as any[] ||
        [];
    }

    if (agentState.actionAwareness) {
      bottleneckedState.actionAwareness =
        agentState.actionAwareness.actionFeedback as any[] || [];
    }

    return bottleneckedState;
  }

  /**
   * Parse the LLM response into a decision dictionary.
   *
   * @param response - LLM response
   * @returns Decision dictionary
   */
  private _parseDecisionResponse(response: string): Decision {
    // Default decision if parsing fails
    const defaultDecision: Decision = {
      action: "idle",
      parameters: {},
      reasoning: "Failed to parse LLM response",
      timestamp: Date.now() / 1000,
    };

    try {
      // Try to extract a JSON object from the response
      const jsonMatch = response.match(/\{.*\}/s);

      if (jsonMatch) {
        const jsonStr = jsonMatch[0];
        const decision = JSON.parse(jsonStr) as Partial<Decision>;

        // Ensure required fields are present
        return {
          action: decision.action || "idle",
          parameters: decision.parameters || {},
          reasoning: decision.reasoning || "No reasoning provided",
          timestamp: Date.now() / 1000,
        };
      } else {
        console.warn("No JSON found in LLM response");
        return defaultDecision;
      }
    } catch (e) {
      console.error(`Error parsing LLM response: ${e}`);
      return defaultDecision;
    }
  }

  /**
   * Broadcast a decision to all modules.
   *
   * @param decision - Decision to broadcast
   */
  private async _broadcastDecision(decision: Decision): Promise<void> {
    // Notify all modules of the new decision
    for (const [name, module] of Object.entries(this._modules)) {
      try {
        await module.onDecision(decision);
      } catch (e) {
        console.error(`Error broadcasting decision to module ${name}: ${e}`);
      }
    }
  }
}
