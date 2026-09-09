import { ConversationMemory } from "../memory/conversation";
import  { ToolRegistry } from "../tools/registry";
import type { Tool } from "../tools/tool";
import { LLM } from "./llm";
import { Planner } from "../planner/planner";
import { Context } from "../executor/context";
import { Executor } from "../executor/executor";
import { WorkflowEngine } from "../workflow/engine";
import { Tracer } from "../tracing/tracer";
import type { Guardrail } from "../guardrails/guardrails";

export class Agent {
    name:string;
    instructions:string;
    llm:LLM;
    tools: ToolRegistry;
    memory: ConversationMemory;
    planner:Planner;
    plan: string[] = [];
    context = new Context();
    executor:Executor;
    workflowEngine: WorkflowEngine;
    tracer: Tracer;
    guardrails: Guardrail[] = [];

   constructor(options:{
    name:string;
    instructions:string;
    apiKey?:string;
    model?:string;
    tracer?: Tracer;
    guardrails?: Guardrail[];
   }){
    this.name = options.name;
    this.instructions = options.instructions;
    this.tracer = options.tracer ?? new Tracer();
   const apiKey = options.apiKey || process.env.OPENAI_API_KEY!;
    this.llm = new LLM(apiKey, options.model, this.tracer);
    this.tools = new ToolRegistry(this.tracer);
    this.memory = new ConversationMemory(this.tracer);
    this.planner = new Planner(this.llm, this.tracer);
    this.executor = new Executor(this.llm, this.tracer);
    this.workflowEngine = new WorkflowEngine(this.tracer);
    this.guardrails = options.guardrails ?? [];
   }

   registerTool(tool:Tool){
    this.tools.register(tool);
   }

   async run(prompt:string){
    const span = this.tracer.startSpan("agent.run", { agent: this.name, prompt });
    let message = prompt;

    const inputCheck = this.checkGuardrails({prompt});
    if (!inputCheck.pass) {
      if (this.tracer) this.tracer.log("guardrail_block", inputCheck);
      return inputCheck.reason!;
    }

    try {
        for(let i =0; i<5; i++){
            this.tracer.log("agent.loop", { iteration: i });

            const reply = await this.llm.ask(
                message , 
                this.instructions , 
                this.tools.tools,
                this.memory.messages
            );

            try {
                const call = JSON.parse(reply);
                if (call.tool) {
                  const toolCheck = this.checkGuardrails({tool: call.tool});
                  if (!toolCheck.pass) {
                    if (this.tracer) this.tracer.log("guardrail_block", toolCheck);
                    return toolCheck.reason!;
                  }
                    const result = await this.tools.run(call.tool, call.args);
                    message = `The ${call.tool} tool already returned: ${result}. Do not call tools again. Give the user a final answer. Original question: ${prompt}`;
                    continue;
                }
            } catch {
                // Not a tool call — treat reply as the final answer
            }

            const outputCheck = this.checkGuardrails({reply});

            if (!outputCheck.pass) {
              if (this.tracer) this.tracer.log("guardrail_block", outputCheck);
              return outputCheck.reason!;
            }

            this.memory.add("user", prompt);
            this.memory.add("assistant", reply);

            this.tracer.log("agent.output", { reply });
            span.end({ reply });
            return reply;
        }

        const fallback = "Could not complete task";
        this.tracer.log("agent.output", { reply: fallback, reason: "max_iterations" });
        span.end({ reply: fallback, reason: "max_iterations" });
        return fallback;
    } catch (err) {
        span.error(err);
        throw err;
    }
   }

   checkGuardrails(ctx: { prompt?: string; tool?: string; reply?: string }) {
    for (const guard of this.guardrails) {
      const result = guard(ctx);
      if (!result.pass) return result;
    }
    return { pass: true };
  }

   async *runStream(prompt: string) {
    const span = this.tracer.startSpan("agent.stream", { agent: this.name, prompt });
    let full = "";

    const inputCheck  = this.checkGuardrails({prompt});
    if (!inputCheck.pass) {
      if (this.tracer) this.tracer.log("guardrail_block", inputCheck);
      return inputCheck.reason!;
    }

    try {
        for await (const token of this.llm.stream(
          prompt,
          this.instructions,
          this.memory.messages,
        )) {
          full += token;
          yield { type: "token", text: token };
        }

        this.memory.add("user", prompt);
        this.memory.add("assistant", full);
        this.tracer.log("agent.output", { reply: full });
        span.end({ length: full.length });
        yield { type: "done", text: full };
    } catch (err) {
        span.error(err);
        throw err;
    }
  }

   async runWithPlan(prompt:string){
    const span = this.tracer.startSpan("agent.plan", { agent: this.name, prompt });

    try {
        this.plan = await this.planner.createPlan(prompt);
        const {context , results} = await this.executor.runAll(this.plan, this.instructions, this.tools.tools);

        this.context = context;

        const summary = await this.llm.ask(
            `Goal: ${prompt}\nStep results: ${results.join(" | ")}\nGive a final summary.`,
            this.instructions,
          );

          this.memory.add("user", prompt);
          this.memory.add("assistant", summary);

          this.tracer.log("agent.output", { reply: summary });
          span.end({ reply: summary });
          return summary;
    } catch (err) {
        span.error(err);
        throw err;
    }
   }

   async runWorkflow(
    workflow: { name: string; steps: { input: string; tool?: string }[] },
    inputs: any = {},
  ) {
    const span = this.tracer.startSpan("agent.workflow", {
      agent: this.name,
      workflow: workflow.name,
      inputs,
    });

    try {
        const result = await this.workflowEngine.run(
          workflow,
          inputs,
          this.llm,
          this.tools,
          this.instructions,
        );

        this.memory.add("user", `[workflow: ${workflow.name}] ${JSON.stringify(inputs)}`);
        this.memory.add("assistant", String(result));
        this.tracer.log("agent.output", { reply: result });
        span.end({ result });
        return result;
    } catch (err) {
        span.error(err);
        throw err;
    }
  }
}
