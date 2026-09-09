import type {LLM} from "../agent/llm";
import type { Tracer } from "../tracing/tracer";


export class Planner {
    constructor(private llm:LLM, private tracer?: Tracer){}


    async createPlan(goal:string){
        const span = this.tracer?.startSpan("planner.create", { goal });
        try {
            const reply = await this.llm.ask(
                `Break this goal into 3 simple steps as a JSON array of strings: ${goal}`,
                'Return ONLY a JSON array like ["step 1", "step 2", "step 3"]',
              );
              const steps = JSON.parse(reply);
              span?.end({ steps });
              return steps;
        } catch (err) {
            span?.error(err);
            throw err;
        }
    }
}
