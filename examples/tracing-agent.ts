import { Agent, calculator } from "../src/index";

const agent = new Agent({
  name: "trace-bot",
  instructions:
    "You are a helpful calculator bot. Use the calculator tool to add two numbers, then explain the result.",
});

agent.registerTool(calculator);

const result = await agent.run("What is 15 + 27?");
console.log("Answer:");
console.log(result);

console.log("\n--- Trace timeline ---");
console.log(agent.tracer.dump());

const timed = agent.tracer.events.filter((e) => e.duration != null);
console.log("\n--- Timed spans ---");
for (const event of timed) {
  console.log(`${event.type}: ${event.duration}ms`);
}
