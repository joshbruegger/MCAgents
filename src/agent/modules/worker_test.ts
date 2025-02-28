import {
  isMainThread,
  parentPort,
  Worker,
  workerData,
} from "node:worker_threads";

function startWorker(data: string) {
  const worker = new Worker(import.meta.url, {
    workerData: data,
  });
  worker.on("message", (message) => {
    console.log(`Worker: ${message}`);
  });
  worker.on("error", (error) => {
    console.error(error);
  });
  worker.on("exit", (code) => {
    if (code !== 0) {
      console.error(`Worker stopped with exit code ${code}`);
    }
  });
  return worker;
}

async function mainThread() {
  const worker = startWorker("Working!");

  // Run for a longer time to see more worker messages
  for (let i = 0; i < 20; i++) {
    console.log(`\nMain thread: I am at index ${i}`);
    // Send the current index to the worker
    worker.postMessage(`The main thread is at index ${i}`);
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  // Properly terminate the worker
  console.log("Terminating worker...");
  await worker.terminate();
  console.log("Worker terminated");
}

async function workerThread() {
  const message = workerData;
  let i = 0;
  let lastReceivedIndex = "none yet";

  // Listen for messages from the main thread
  parentPort?.on("message", (receivedMessage) => {
    // Extract the index from the received message
    const receivedIndex = receivedMessage.match(/index (\d+)/)?.[1] ||
      "unknown";
    lastReceivedIndex = receivedIndex;
    // Send acknowledgment back to the main thread
    parentPort?.postMessage(
      `Index ${receivedIndex}, got it! I am at index ${i}`,
    );
  });

  // Initial message
  parentPort?.postMessage(`${message} - Worker initialized and ready`);

  // Independent infinite loop
  while (true) {
    // Send a heartbeat message with the current state
    parentPort?.postMessage(
      `I am at index ${i}, last received main thread index: ${lastReceivedIndex}`,
    );
    await new Promise((resolve) => setTimeout(resolve, 250));
    i++;
  }
}

// For direct execution
if (isMainThread && import.meta.main) {
  await mainThread();
} else if (!isMainThread) {
  await workerThread();
}

// For testing
Deno.test("Worker communication test", async function () {
  if (isMainThread) {
    await mainThread();
  } else {
    await workerThread();
  }
});
