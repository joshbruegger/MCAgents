import { getLogger } from "@logtape/logtape";
import { assert } from "jsr:@std/assert/assert";
import { assertSpyCalls, spy } from "jsr:@std/testing/mock";
import { FakeTime } from "jsr:@std/testing/time";
import { configureTestLogger } from "../shared/test_logger.ts";
import { createAgentState } from "./agent_state.ts";
import { CognitiveController, Decision } from "./cognitive_controller.ts";
import { Module } from "./modules/module.ts";
import { AgentConfig } from "./utils/config.ts";

// Test implementation of the Module class
class TestModule extends Module {
  public updateCallCount = 0;
  public lastDecision: Decision | null = null;
  public shouldThrowError = false;

  logger = getLogger(["MCAgents", "TestModule"]);

  // deno-lint-ignore require-await
  async update(): Promise<void> {
    this.updateCallCount++;
    if (this.shouldThrowError) {
      throw new Error("Test error in update");
    }
    this.logger.debug(`update called ${this.updateCallCount} times`);
  }

  // deno-lint-ignore require-await
  async onDecision(decision: Decision): Promise<void> {
    this.lastDecision = decision;
  }
}

// Mock config for testing
const mockConfig: AgentConfig = AgentConfig({
  modules: {
    cognitive_controller: {
      update_interval: 100,
    },
  },
});

// Mock agent state using factory function
const mockAgentState = createAgentState();

Deno.test("Cognitive Controller", async (t) => {
  // Setup spies for console methods
  configureTestLogger();
  const logger = getLogger(["MCAgents", "CognitiveController"]);
  using warnSpy = spy(logger, "warn");
  using errorSpy = spy(logger, "error");

  await t.step("constructor initializes correctly", () => {
    const controller = new CognitiveController(mockConfig, mockAgentState);
    assert(controller instanceof CognitiveController);
  });

  await t.step("registerModules registers modules correctly", () => {
    const controller = new CognitiveController(mockConfig, mockAgentState);
    const module1 = new TestModule(
      "skill_execution",
      mockConfig,
      mockAgentState,
    );
    const module2 = new TestModule("memory", mockConfig, mockAgentState);

    controller.registerModules([module1, module2]);
  });

  await t.step("start and stop lifecycle", async () => {
    const controller = new CognitiveController(mockConfig, mockAgentState);
    const module = new TestModule(
      "skill_execution",
      mockConfig,
      mockAgentState,
    );
    controller.registerModules([module]);

    // Start controller
    await controller.start();
    assert(controller.running);

    // Try starting again
    await controller.start();
    assertSpyCalls(warnSpy, 1); // Expect warning for starting already started controller

    // Stop controller
    await controller.stop();
    assert(!controller.running);

    // Try stopping again
    await controller.stop();
    assertSpyCalls(warnSpy, 2); // Expect warning for stopping already stopped controller
  });

  await t.step("controller loop respects update interval", async () => {
    using time = new FakeTime();

    const controller = new CognitiveController(mockConfig, mockAgentState);
    const module = new TestModule(
      "skill_execution",
      mockConfig,
      mockAgentState,
    );
    controller.registerModules([module]);
    await controller.start();

    // Advance time by update interval
    await time.tickAsync(100);
    await time.runMicrotasks();

    // Advance again
    await time.tickAsync(100);
    await time.runMicrotasks();

    await controller.stop();
    await time.runAllAsync();
  });

  await t.step("broadcasts decisions to all modules", async () => {
    const controller = new CognitiveController(mockConfig, mockAgentState);
    const module1 = new TestModule(
      "skill_execution",
      mockConfig,
      mockAgentState,
    );
    const module2 = new TestModule("memory", mockConfig, mockAgentState);
    controller.registerModules([module1, module2]);

    const testDecision: Decision = {
      action: "test_action",
      parameters: { test: true },
      reasoning: "Test decision",
      timestamp: Date.now() / 1000,
    };

    // @ts-ignore - accessing private method for testing
    await controller._broadcastDecision(testDecision);

    assert(module1.lastDecision === testDecision);
    assert(module2.lastDecision === testDecision);
  });

  await t.step("creates bottlenecked state correctly", () => {
    const controller = new CognitiveController(mockConfig, mockAgentState);
    const testState = createAgentState();
    testState.inventory = { "diamond": 1, "iron": 2 };
    testState.location = { x: 10, y: 20, z: 30 };
    testState.memory = { relevantMemories: ["test memory"] };
    testState.actionAwareness = { actionFeedback: ["test feedback"] };

    // @ts-ignore - accessing private method for testing
    const bottleneckedState = controller._createBottleneckedState(testState);

    assert(bottleneckedState.inventory?.diamond === 1);
    assert(bottleneckedState.inventory?.iron === 2);
    assert(bottleneckedState.location?.x === 10);
    assert(bottleneckedState.location?.y === 20);
    assert(bottleneckedState.location?.z === 30);
    assert(bottleneckedState.memory?.length === 1);
    assert(bottleneckedState.actionAwareness?.length === 1);
  });

  await t.step("handles errors gracefully in update loop", async () => {
    using time = new FakeTime();

    const controller = new CognitiveController(mockConfig, mockAgentState);
    const module = new TestModule(
      "skill_execution",
      mockConfig,
      mockAgentState,
    );
    module.shouldThrowError = true;
    controller.registerModules([module]);
    await controller.start();

    // Advance time to trigger error
    await time.tickAsync(100);
    await time.runMicrotasks();
    assertSpyCalls(errorSpy, 1); // Expect error log

    // Controller should still be running
    assert(controller.running);

    await controller.stop();
    await time.runAllAsync();
  });
});
