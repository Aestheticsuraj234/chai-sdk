import { Agent } from "../src/index";


const agent = new Agent({
    name:"Hello Agent",
    instructions:"You are a helpful assistant that can answer questions and help with tasks.",
    apiKey:process.env.OPENAI_API_KEY!,
})

const response = await agent.run("What is Typescript?")

console.log(response);