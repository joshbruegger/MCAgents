# Development Log

## 2025-02-28

- Figured out how to use node worker threads in `worker_test.ts`. Now I need to integrate them into `module.ts` to allow for parallel execution of modules.

## 2025-03-04

- Gave up on the worker thread idea. It was causing more problems than it was solving.
- Refactored the code to use promises and the `setInterval` function to call the `update` method of each module.
- Added LogTape for logging
- Added tests for the `module.ts` file
- Made getting the config easier with the `AgentConfig` function