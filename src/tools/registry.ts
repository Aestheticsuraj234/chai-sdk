import type { Tool } from "./tool";

export class ToolRegistry {
    tools:Tool[] = [];

    register(tool:Tool){
        this.tools.push(tool);
    }

    get(name:string){
        return this.tools.find((t)=>t.name === name);
    }

    async run(name:string , args:any){
        const t = this.get(name);

        return t?.execute(args);
    }
}