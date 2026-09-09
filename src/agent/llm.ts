import { tool, type Tool } from "../tools/tool";

type Message = {
    role:string;
    content:string;
}

export class LLM {
    constructor(
        private apiKey:string,
        private model = "gpt-4o-mini"
    ){}

    async ask(prompt:string , system:string, tools:Tool[]=[], history:Message[] = []){

        const body:any = {

            model:this.model,
            messages:[
                {role:"system" , content:system},
                ...history,
                {role:"user" , content:prompt}
            ]
        }
        if(tools.length){
            body.tools = tools.map((t)=>({
                type: "function",
                function: {
                    name: t.name,
                    description: t.description,
                    parameters: t.parameters ?? { type: "object", properties: {} },
                }
            }))
        }

        const res = await fetch("https://api.openai.com/v1/chat/completions",{
            method:"POST",
            headers:{
                "Content-Type": "application/json",
                Authorization: `Bearer ${this.apiKey}`,
            },
                body:JSON.stringify(body)
        });

        const data:any = await res.json();
        const message = data.choices[0].message;

        if(message?.tool_calls?.length){
            const call = message.tool_calls[0];
            return JSON.stringify({
                tool:call.function.name,
                args:JSON.parse(call.function.arguments || "{}")
            })
        }

        return message.content;
    }
}