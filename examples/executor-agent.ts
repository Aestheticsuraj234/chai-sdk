import { Agent } from "../src/index";

const agent = new Agent({
  name: "executor-bot",
  instructions: "You execute tasks step by step. Each step builds on the last.",
});

const response = await agent.runWithPlan(
  "Explain how solar panels work in simple terms",
);

console.log("Plan:");
agent.plan.forEach((step, i) => console.log(`  ${i + 1}. ${step}`));

console.log("\nContext (results from each step):");
console.log(agent.context.data);

console.log("\nFinal answer:");
console.log(response);
