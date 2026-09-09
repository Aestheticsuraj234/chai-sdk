import type { LLM } from "../agent/llm";
import type { ToolRegistry } from "../tools/registry";
import type { Tracer } from "../tracing/tracer";

export class WorkflowEngine {
    constructor(private tracer?: Tracer) {}

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
        const span = this.tracer?.startSpan("workflow.run", {
          name: workflow.name,
          inputs,
          steps: workflow.steps.length,
        });

        try {
          const results: any[] = [];
      
          for (let i = 0; i < workflow.steps.length; i++) {
            const step = workflow.steps[i]!;
            const input = this.resolve(step.input, inputs, results);
            this.tracer?.log("workflow.step.start", { index: i, tool: step.tool, input });
      
            let result;
            if (step.tool) {
              result = await tools.run(step.tool, JSON.parse(input));
            } else {
              result = await llm.ask(input, instructions, tools.tools, []);
            }

            results.push(result);
            this.tracer?.log("workflow.step.end", { index: i, result });
          }
      
          const output = results.at(-1);
          span?.end({ result: output });
          return output;
        } catch (err) {
          span?.error(err);
          throw err;
        }
      }
}
