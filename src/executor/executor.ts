import type {LLM} from "../agent/llm";
import type {Tool} from "../tools/tool";
import type { Tracer } from "../tracing/tracer";
import {Context} from "./context";

export class Executor {
    constructor(private llm:LLM, private tracer?: Tracer){

    }

    async runStep(
        step:string,
        context:Context,
        instructions:string,
        tools:Tool[]
    ){
        const span = this.tracer?.startSpan("executor.step", { step });
        try {
            for(let attempt =0 ; attempt<3; attempt++){
                const reply = await this.llm.ask(
                    `Step: ${step}\nContext so far: ${JSON.stringify(context.data)}`,
                    instructions,
                    tools,
                    [],
                  );

                  context.set(`step${Object.keys(context.data).length}`, reply);
                  span?.end({ reply, attempt });
                  return reply;
            }
        } catch (err) {
            span?.error(err);
            throw err;
        }
    };

    async runAll(steps:string[] , instructions:string , tools:Tool[]){
        const span = this.tracer?.startSpan("executor.runAll", { steps });
        try {
            const context = new Context();
            const results = [];

            for(const step of steps){
                const result = await this.runStep(step, context, instructions, tools);
                results.push(result);
            }

            span?.end({ count: results.length });
            return {context , results};
        } catch (err) {
            span?.error(err);
            throw err;
        }
    }
}
