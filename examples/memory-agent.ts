import { Agent } from "../src/index";

const agent = new Agent({
  name: "chat-bot",
  instructions: "You are a friendly assistant. Remember what the user tells you.",
});

await agent.run("My name is Suraj");

const response = await agent.run("What's my name?");
console.log(response);

console.log("\nFull memory:");
console.log(agent.memory.messages);
