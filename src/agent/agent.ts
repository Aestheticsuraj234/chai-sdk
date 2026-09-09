import { OpenAILLM } from "./llm";

export class Agent {
    name:string;
    instructions:string;
    llm:OpenAILLM;

   constructor(options:{
    name:string;
    instructions:string;
    apiKey:string;
    model?:string;
   }){
    this.name = options.name;
    this.instructions = options.instructions;
    this.llm = new OpenAILLM(options.apiKey, options.model);
   }

   async run(prompt:string){
    return this.llm.ask(prompt, this.instructions);
   }
}