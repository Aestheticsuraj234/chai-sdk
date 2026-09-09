import type { Tracer } from "../tracing/tracer";

export class ConversationMemory {
    messages: {role:string , content:string}[] = [];

    constructor(private tracer?: Tracer) {}

    add(role:string , content:string){
        this.messages.push({role, content});
        this.tracer?.log("memory.add", { role, content });
    }

    clear(){
        this.messages = [];
        this.tracer?.log("memory.clear");
    }
}
