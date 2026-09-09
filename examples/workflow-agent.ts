import { Agent, calculator, workflow } from "../src/index";

const researchWorkflow = workflow({
  name: "research-and-summarize",
  steps: [
    { input: "Research this topic in 2-3 sentences: {{query}}" },
    { input: "Summarize this in one sentence: {{step.0.result}}" },
  ],
});

const mathWorkflow = workflow({
  name: "add-and-explain",
  steps: [
    { tool: "calculator", input: '{"a": {{a}}, "b": {{b}}}' },
    { input: "Explain why {{a}} + {{b}} = {{step.0.result}} in one sentence." },
  ],
});

const agent = new Agent({
  name: "workflow-bot",
  instructions: "You are a helpful assistant.",
});

agent.registerTool(calculator);

console.log("--- Research workflow ---");
const research = await agent.runWorkflow(researchWorkflow, {
  query: "AI agents in 2026 and their applications",
});
console.log(research);

console.log("\n--- Math workflow ---");
const math = await agent.runWorkflow(mathWorkflow, { a: 32, b: 50 });
console.log(math);
