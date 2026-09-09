import { Agent } from "../src/index";

const agent = new Agent({
  name: "planner-bot",
  instructions: "You break big tasks into small steps.",
});

const response = await agent.runWithPlan(
  "Research AI trends and write a summary",
);

console.log("Plan:");
agent.plan.forEach((step, i) => console.log(`  ${i + 1}. ${step}`));

console.log("\nFinal answer:");
console.log(response);
