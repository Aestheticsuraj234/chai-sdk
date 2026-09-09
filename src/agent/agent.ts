import { ConversationMemory } from "../memory/conversation";
import  { ToolRegistry } from "../tools/registry";
import type { Tool } from "../tools/tool";
import { OpenAILLM } from "./llm";

export class Agent {
    name:string;
    instructions:string;
    llm:OpenAILLM;
    tools = new ToolRegistry();
    memory = new ConversationMemory();

   constructor(options:{
    name:string;
    instructions:string;
    apiKey?:string;
    model?:string;
   }){
    this.name = options.name;
    this.instructions = options.instructions;
   const apiKey = options.apiKey || process.env.OPENAI_API_KEY!;
    this.llm = new OpenAILLM(apiKey, options.model);
   }

   registerTool(tool:Tool){
    this.tools.register(tool);
   }

   async run(prompt:string){
    let message = prompt;

    for(let i =0; i<5; i++){
        const reply = await this.llm.ask(
            message , 
            this.instructions , 
            this.tools.tools,
            this.memory.messages
        );

        try {
            const call = JSON.parse(reply);
            if (call.tool) {
                const result = await this.tools.run(call.tool, call.args);
                message = `The ${call.tool} tool already returned: ${result}. Do not call tools again. Give the user a final answer. Original question: ${prompt}`;
                continue;
            }
        } catch {
            // Not a tool call — treat reply as the final answer
        }

        this.memory.add("user", prompt);
        this.memory.add("assistant", reply);

        return reply;
    }

    return "Could not complete task";
   }
}