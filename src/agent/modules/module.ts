/**
 * Base Module for PIANO Architecture
 *
 * This module defines the base Module class that all PIANO modules inherit from.
 * It provides common functionality and interfaces for all modules.
 */

import { assert } from "@std/assert/assert";
import { AgentConfig } from "../../utils/config.ts";
import { AgentState } from "../agent_state.ts";
import { CognitiveController, Decision } from "../cognitive_controller.ts";

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

    console.debug(`Initialized module: ${this._name}`);
  }

  public get name(): string {
    return this._name;
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
    console.debug(
      `Registered Cognitive Controller with module: ${this._name}`,
    );
  }

  /** Start the module */
  public start(): void {
    if (this._running) {
      console.warn(`Module ${this._name} is already running`);
      return;
    }

    this._running = true;
    console.debug(`Starting module: ${this._name}`);

    // Create a new stop promise
    this._stopPromise = new Promise<void>((resolve) => {
      this._stopResolve = resolve;
    });

    // Start the module's main loop
    this._moduleLoop();
  }

  /** Stop the module and wait for the loop to complete */
  public async stop(): Promise<void> {
    if (!this._running) {
      console.warn(`Module ${this._name} is not running`);
      return;
    }

    console.debug(`Stopping module: ${this._name}`);
    this._running = false;

    // Wait for the module loop to complete
    if (this._stopPromise) {
      await this._stopPromise;
      this._stopPromise = null;
      this._stopResolve = null;
    }

    console.debug(`Stopped module: ${this._name}`);
  }

  /** Main loop for the module */
  private async _moduleLoop(): Promise<void> {
    console.debug(`Module loop started: ${this._name}`);

    while (this._running) {
      try {
        // Run the module's update method
        await this.update();

        // Sleep for the update interval
        await new Promise((resolve) =>
          setTimeout(resolve, this._updateInterval * 1000)
        );
      } catch (e) {
        console.error(`Error in module ${this._name}: ${e}`);
        // Continue running despite errors
      }
    }

    // Resolve the stop promise when the loop exits
    if (this._stopResolve) {
      this._stopResolve();
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
