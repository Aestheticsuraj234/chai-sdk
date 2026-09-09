import type { Tool } from "./tool";
import type { Tracer } from "../tracing/tracer";

export class ToolRegistry {
    tools:Tool[] = [];

    constructor(private tracer?: Tracer) {}

    register(tool:Tool){
        this.tools.push(tool);
        this.tracer?.log("tool.register", { name: tool.name });
    }

    get(name:string){
        return this.tools.find((t)=>t.name === name);
    }

    async run(name:string , args:any){
        const span = this.tracer?.startSpan("tool.run", { name, args });
        try {
            const t = this.get(name);
            const result = await t?.execute(args);
            span?.end({ name, result });
            return result;
        } catch (err) {
            span?.error(err);
            throw err;
        }
    }
}
