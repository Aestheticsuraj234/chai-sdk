import { Agent, blockTool, contentFilter, tool } from "../src/index";

const deleteFile = tool(
  "deleteFile",
  "Delete a file from disk",
  (args: { path: string }) => `Would delete: ${args.path}`,
  {
    type: "object",
    properties: {
      path: { type: "string", description: "File path to delete" },
    },
    required: ["path"],
  },
);

const agent = new Agent({
  name: "safe-bot",
  instructions: "You are a helpful assistant.",
  guardrails: [
    blockTool("deleteFile"),
    contentFilter(["password", "secret"]),
  ],
});

agent.registerTool(deleteFile);

console.log("--- Blocked word test ---");
const r1 = await agent.run("Tell me my password");
console.log(r1);

console.log("\n--- Normal question ---");
const r2 = await agent.run("What is 2 + 2?");
console.log(r2);

console.log("\n--- Trace ---");
agent.tracer.events
  .filter((e) => e.type === "guardrail_block")
  .forEach((e) => console.log("  blocked:", e.data.reason));
