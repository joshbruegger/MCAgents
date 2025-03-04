/**
 * Base Module for PIANO Architecture
 *
 * This module defines the base Module class that all PIANO modules inherit from.
 * It provides common functionality and interfaces for all modules.
 */

import { getLogger } from "@logtape/logtape";
import { assert } from "@std/assert/assert";
import { AgentConfig } from "../../utils/config.ts";
import { AgentState } from "../agent_state.ts";
import { CognitiveController, Decision } from "../cognitive_controller.ts";

const logger = getLogger(["MCAgents", "Module"]);

/**
 * This abstract class defines the common interface and functionality for all
 * modules in the PIANO architecture. All modules must inherit from this class
 * and implement the required methods.
 */
export abstract class Module {
  /** Name of the module */
  protected _name: string;

  protected _config: AgentConfig;

  protected _agentState: AgentState;

  protected _cognitiveController: CognitiveController | null = null;

  protected _running: boolean = false;

  /** Interval between module updates in seconds */
  protected _updateInterval: number;

  /** Promise that resolves when the module loop stops */
  private _stopPromise: Promise<void> | null = null;
  private _stopResolve: (() => void) | null = null;
  private _intervalId: number | null = null;

  /**
   * Initialize the module.
   *
   * @param name - Name of the module
   * @param config - Module configuration
   */
  constructor(
    name: string,
    config: AgentConfig,
    agentState: AgentState,
  ) {
    this._name = name;
    this._config = config;
    this._agentState = agentState;

    assert(
      config.modules[this._name as keyof typeof config.modules],
      `Module ${this._name} not found in config`,
    );
    this._updateInterval =
      config.modules[this._name as keyof typeof config.modules].update_interval;
  }

  public get name(): string {
    return this._name;
  }

  public get updateInterval(): number {
    return this._updateInterval;
  }

  public get running(): boolean {
    return this._running;
  }

  /**
   * Register the Cognitive Controller with this module.
   *
   * @param cognitiveController - Reference to the Cognitive Controller
   */
  public registerCognitiveController(
    cognitiveController: CognitiveController,
  ): void {
    this._cognitiveController = cognitiveController;
    logger.debug(
      `Registered Cognitive Controller with module: ${this._name}`,
    );
  }

  /** Start the module */
  public start(): void {
    if (this._running) {
      logger.warn(
        `Tried to start module ${this._name} but it is already running`,
      );
      return;
    }

    logger.debug(`Starting module: ${this._name}`);
    this._running = true;

    // Create a new stop promise
    this._stopPromise = new Promise<void>((resolve) => {
      this._stopResolve = resolve;
    });

    // Start the module's main loop
    this._intervalId = setInterval(
      () => this._moduleLoop(),
      this._updateInterval,
    );
  }

  /** Stop the module and wait for the loop to complete */
  public async stop(): Promise<void> {
    if (!this._running) {
      logger.warn(`Tried to stop module ${this._name} but it is not running`);
      return;
    }

    logger.debug(`Stopping module: ${this._name}...`);

    this._running = false;
    await this._stopPromise;

    logger.debug(`Module ${this._name} stopped`);
  }

  /** Main loop for the module. Called every updateInterval milliseconds */
  private async _moduleLoop() {
    if (!this._running) {
      logger.debug(`Module ${this._name} loop stopped`);
      clearInterval(this._intervalId!);
      this._intervalId = null;
      this._stopResolve!();
      return;
    }

    try {
      await this.update();
    } catch (e) {
      logger.error(`Error in module ${this._name}: ${e}`);
    }
  }

  /**
   * Update the module.
   *
   * This method is called periodically by the module's main loop.
   * It should implement the module's main functionality.
   */
  abstract update(): Promise<void>;

  /**
   * Handle a new decision from the Cognitive Controller.
   *
   * @param decision - Decision from the Cognitive Controller
   */
  abstract onDecision(decision: Decision): Promise<void>;
}
