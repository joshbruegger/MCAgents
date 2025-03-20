import {
  ansiColorFormatter,
  configure,
  getConsoleSink,
} from "@logtape/logtape";

export async function configureTestLogger() {
  await configure({
    sinks: {
      console: getConsoleSink({
        formatter: ansiColorFormatter,
      }),
    },
    loggers: [
      {
        category: "MCAgents",
        lowestLevel: "debug",
        sinks: ["console"],
      },
    ],
  });
}
