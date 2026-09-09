import type {LLM} from "../agent/llm";
import type {Tool} from "../tools/tool";
import {Context} from "./context";

export class Executor {
    constructor(private llm:LLM){

    }

    async runStep(
        step:string,
        context:Context,
        instructions:string,
        tools:Tool[]
    ){
        for(let attempt =0 ; attempt<3; attempt++){
            const reply = await this.llm.ask(
                `Step: ${step}\nContext so far: ${JSON.stringify(context.data)}`,
                instructions,
                tools,
                [],
              );

              context.set(`step${Object.keys(context.data).length}`, reply);
              return reply;
        }
    };

    async runAll(steps:string[] , instructions:string , tools:Tool[]){
        const context = new Context();
        const results = [];

        for(const step of steps){
            const result = await this.runStep(step, context, instructions, tools);
            results.push(result);
        }

        return {context , results};
    }
}