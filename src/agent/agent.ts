import { AgentState, createAgentState } from "./agent_state.ts";
import { CognitiveController } from "./cognitive_controller.ts";
import { Environment } from "./environment.ts";
import { Module } from "./modules/module.ts";
import { SkillExecutionModule } from "./modules/skill_execution.ts";
import { AgentConfig } from "./utils/config.ts";

/**
 * This class implements the core PIANO architecture, which consists of multiple
 * concurrent modules with a central Cognitive Controller that acts as an information
 * bottleneck.
 */
export class Agent {
  protected _config: AgentConfig;

  /** Environment instance */
  protected _environment: Environment;

  /** Shared agent state across modules */
  protected _agentState: AgentState;

  protected _modules: Module[] = [];

  /** Cognitive Controller that orchestrates all modules */
  protected _cognitiveController: CognitiveController;

  /** Whether the agent process is running */
  protected _running: boolean = false;

  constructor(config: AgentConfig, environment: Environment) {
    this._config = config;

    this._agentState = createAgentState();

    this._environment = environment;

    this._cognitiveController = new CognitiveController(
      this._config,
      this._agentState,
    );

    this.initializeModules();
  }

  public get config(): AgentConfig {
    return this._config;
  }

  public get running(): boolean {
    return this._running;
  }

  /** Initializes all modules and connects them to the cognitive controller */
  private initializeModules() {
    this._modules = [
      new SkillExecutionModule(this.config, this._agentState),
      // "memory": new MemoryModule(this.config),
      // "action_awareness": new ActionAwarenessModule(this.config),
      // "goal_generation": new GoalGenerationModule(this.config),
      // "social_awareness": new SocialAwarenessModule(this.config),
      // "talking": new TalkingModule(this.config),
    ];

    for (const module of this._modules) {
      module.registerCognitiveController(this._cognitiveController);
    }

    this._cognitiveController.registerModules(this._modules);
  }

  async start() {
    if (this._running) {
      console.warn("Agent is already running");
      return;
    }
    console.info(`Starting agent ${this._config.name}`);

    this._running = true;

    console.info("Starting cognitive controller");
    this._cognitiveController.start();

    for (const module of Object.values(this._modules)) {
      console.info(`Starting module ${module.name}`);
      module.start();
    }

    console.info(`Agent ${this._config.name} started`);
  }

  async stop() {
    if (!this._running) {
      console.warn("Agent is not running");
      return;
    }
    console.info(`Stopping agent ${this._config.name}`);

    this._running = false;

    await Promise.all(
      Object.values(this._modules).map((module) => {
        console.info(`Stopping module ${module.name}`);
        module.stop();
      }),
    );

    console.info("Stopping cognitive controller");
    this._cognitiveController.stop();

    console.info(`Agent ${this._config.name} stopped`);
  }
}
