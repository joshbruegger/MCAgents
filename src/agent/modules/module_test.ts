import { getLogger } from "@logtape/logtape";
import { assertThrows } from "@std/assert/throws";
import { assert } from "jsr:@std/assert/assert";
import { assertSpyCalls, spy } from "jsr:@std/testing/mock";
import { FakeTime } from "jsr:@std/testing/time";
import { AgentConfig } from "../../utils/config.ts";
import { configureTestLogger } from "../../utils/test_logger.ts";
import { createAgentState } from "../agent_state.ts";
import { CognitiveController, Decision } from "../cognitive_controller.ts";
import { Module } from "./module.ts";

// Test implementation of the abstract Module class
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
    skill_execution: {
      update_interval: 100,
    },
  },
});

// Mock agent state using factory function
const mockAgentState = createAgentState();

Deno.test("Base Module", async (t) => {
  // Setup spies for console methods

  configureTestLogger();
  const logger = getLogger(["MCAgents", "Module"]);
  using warnSpy = spy(logger, "warn");
  using errorSpy = spy(logger, "error");

  await t.step("constructor validates config", () => {
    const module = new TestModule(
      "skill_execution",
      mockConfig,
      mockAgentState,
    );
    assert(module.name === "skill_execution");
  });

  await t.step("constructor throws on invalid config", () => {
    const invalidConfig = { modules: {} } as AgentConfig;
    assertThrows(
      () =>
        Promise.resolve(
          new TestModule("invalid", invalidConfig, mockAgentState),
        ),
      Error,
      "Module invalid not found in config",
    );
  });

  await t.step("registerCognitiveController", () => {
    const module = new TestModule(
      "skill_execution",
      mockConfig,
      mockAgentState,
    );
    const cognitiveController = {} as CognitiveController;
    module.registerCognitiveController(cognitiveController);
  });

  await t.step("start and stop lifecycle", async () => {
    const module = new TestModule(
      "skill_execution",
      mockConfig,
      mockAgentState,
    );

    // Start module
    module.start();
    assert(module.running);

    // Try starting again
    module.start();
    assertSpyCalls(warnSpy, 1); // Expect warning for starting already started module

    // Stop module
    await module.stop();
    assert(!module.running);

    // Try stopping again
    await module.stop();
    assertSpyCalls(warnSpy, 2); // Expect warning for stopping already stopped module
  });

  await t.step("module loop respects update interval", async () => {
    using time = new FakeTime();

    const module = new TestModule(
      "skill_execution",
      mockConfig,
      mockAgentState,
    );
    module.start();

    // Advance time by update interval
    await time.tickAsync(100);
    await time.runMicrotasks();
    assert(module.updateCallCount as number === 1);

    // Advance again
    await time.tickAsync(100);
    await time.runMicrotasks();
    assert(module.updateCallCount as number === 2);

    module.stop();
    await time.runAllAsync();
  });

  await t.step("module loop handles errors gracefully", async () => {
    using time = new FakeTime();

    const module = new TestModule(
      "skill_execution",
      mockConfig,
      mockAgentState,
    );
    module.shouldThrowError = true;
    module.start();

    // Advance time to trigger error
    await time.tickAsync(100);
    await time.runMicrotasks();
    assertSpyCalls(errorSpy, 1); // Expect error log

    // Module should still be running
    assert(module.running);

    module.stop();
    await time.runAllAsync();
  });

  await t.step("processes decisions from cognitive controller", async () => {
    const module = new TestModule(
      "skill_execution",
      mockConfig,
      mockAgentState,
    );
    const testDecision: Decision = {
      action: "test_action",
      parameters: { test: true },
      reasoning: "Test decision",
      timestamp: Date.now() / 1000,
    };

    await module.onDecision(testDecision);
    assert(module.lastDecision === testDecision);
  });

  await t.step("Concurrent modules can run", async () => {
    const module1 = new TestModule(
      "skill_execution",
      mockConfig,
      mockAgentState,
    );

    const mockConfig2: AgentConfig = AgentConfig({
      modules: {
        memory: {
          update_interval: 200,
        },
      },
    });

    const module2 = new TestModule(
      "memory",
      mockConfig2,
      mockAgentState,
    );

    const cognitiveController = {} as CognitiveController;
    module1.registerCognitiveController(cognitiveController);
    module2.registerCognitiveController(cognitiveController);

    using time = new FakeTime();

    module1.start();
    module2.start();

    // Advance time by update interval
    await time.tickAsync(100);
    await time.runMicrotasks();
    assert(module1.updateCallCount as number === 1);

    // Advance again
    await time.tickAsync(100);
    await time.runMicrotasks();
    assert(module1.updateCallCount as number === 2);
    assert(module2.updateCallCount as number === 1);

    module1.stop();
    module2.stop();
    await time.runAllAsync();
  });
});
