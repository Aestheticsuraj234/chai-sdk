import type {LLM} from "../agent/llm";


export class Planner {
    constructor(private llm:LLM){}


    async createPlan(goal:string){
        const reply = await this.llm.ask(
            `Break this goal into 3 simple steps as a JSON array of strings: ${goal}`,
            'Return ONLY a JSON array like ["step 1", "step 2", "step 3"]',
          );
          return JSON.parse(reply);
    }
}