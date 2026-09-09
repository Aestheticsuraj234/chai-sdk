import type { LLM } from "../agent/llm";
import type { ToolRegistry } from "../tools/registry";

export class WorkflowEngine {
    resolve(template:string , inputs:any , results:any[]){
        let out = template;

        for (const key in inputs) {
            out = out.replaceAll(`{{${key}}}`, String(inputs[key]));
          }

          out = out.replace(/\{\{step\.(\d+)\.result\}\}/g, (_, i) => {
            const r = results[Number(i)];
            return typeof r === "string" ? r : JSON.stringify(r);
          });

          return out;
      
    }

    async run(
        workflow: { name: string; steps: { input: string; tool?: string }[] },
        inputs: any,
        llm: LLM,
        tools: ToolRegistry,
        instructions: string,
      ) {
        const results: any[] = [];
    
        for (const step of workflow.steps) {
          const input = this.resolve(step.input, inputs, results);
    
          if (step.tool) {
            results.push(await tools.run(step.tool, JSON.parse(input)));
          } else {
            results.push(await llm.ask(input, instructions, tools.tools, []));
          }
        }
    
        return results.at(-1);
      }
}