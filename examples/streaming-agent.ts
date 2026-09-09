import { Agent } from "../src/index";

const agent = new Agent({
  name: "stream-bot",
  instructions: "You are a creative writer. Keep it short.",
});

console.log("Streaming response:\n");

for await (const event of agent.runStream("Write a 40-line poem about coding")) {
  if (event.type === "token") process.stdout.write(event.text);
  if (event.type === "done") console.log("\n\n--- done ---");
}
