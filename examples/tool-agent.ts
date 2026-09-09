import { Agent, calculator } from "../src/index";

const agent = new Agent({
    name:"calc-bot",
    instructions:"You are a helpful calculator bot. You can use the calculator tool to add two numbers together.",
});

agent.registerTool(calculator);

const result = await agent.run("What is 10 + 20?");
console.log(result);