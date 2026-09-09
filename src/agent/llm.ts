import type { Tool } from "../tools/tool";
import type { Tracer } from "../tracing/tracer";

type Message = {
    role:string;
    content:string;
}

function isJsonSchemaObject(value: unknown): value is Record<string, unknown> {
    return !!value && typeof value === "object" && !Array.isArray(value);
}

export class LLM {
    constructor(
        private apiKey:string,
        private model = "gpt-4o-mini",
        private tracer?: Tracer,
    ){}

    async ask(prompt:string , system:string, tools:Tool[]=[], history:Message[] = []){
        const span = this.tracer?.startSpan("llm.ask", {
            model: this.model,
            prompt,
            tools: tools.map((t) => t.name),
            history: history.length,
        });

        try {
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
                        parameters: isJsonSchemaObject(t.parameters)
                          ? t.parameters
                          : { type: "object", properties: {} },
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
            if (!res.ok || data.error || !data.choices?.[0]) {
                throw new Error(
                    data.error?.message ?? `OpenAI request failed (${res.status})`,
                );
            }
            const message = data.choices[0].message;

            if(message?.tool_calls?.length){
                const call = message.tool_calls[0];
                const payload = {
                    tool:call.function.name,
                    args:JSON.parse(call.function.arguments || "{}")
                };
                span?.end({ kind: "tool_call", ...payload });
                return JSON.stringify(payload)
            }

            span?.end({ kind: "text", content: message.content });
            return message.content;
        } catch (err) {
            span?.error(err);
            throw err;
        }
    }


    async *stream(
        prompt:string,
        system:string,
        history:Message[]=[],
    ){
        const span = this.tracer?.startSpan("llm.stream", {
            model: this.model,
            prompt,
            history: history.length,
        });
        let tokens = 0;

        try {
            const res = await fetch("https://api.openai.com/v1/chat/completions", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${this.apiKey}`,
                },
                body: JSON.stringify({
                  model: this.model,
                  stream: true,
                  messages: [
                    { role: "system", content: system },
                    ...history,
                    { role: "user", content: prompt },
                  ],
                }),
              });

              if (!res.ok) {
                const data: any = await res.json().catch(() => ({}));
                throw new Error(
                  data.error?.message ?? `OpenAI stream failed (${res.status})`,
                );
              }

              const reader = res.body!.getReader();
              const decoder = new TextDecoder();
              let buffer = "";

              while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });

                const lines = buffer.split("\n");
                buffer = lines.pop() ?? "";

                for (const line of lines) {
                  if (!line.startsWith("data: ")) continue;
                  const data = line.slice(6).trim();
                  if (data === "[DONE]") {
                    span?.end({ tokens });
                    return;
                  }
                  if (!data) continue;

                  const json: any = JSON.parse(data);
                  const text = json.choices?.[0]?.delta?.content;
                  if (text) {
                    tokens++;
                    yield text;
                  }
                }
              }

              buffer += decoder.decode();
              if (buffer.startsWith("data: ")) {
                const data = buffer.slice(6).trim();
                if (data && data !== "[DONE]") {
                  const json: any = JSON.parse(data);
                  const text = json.choices?.[0]?.delta?.content;
                  if (text) {
                    tokens++;
                    yield text;
                  }
                }
              }

              span?.end({ tokens });
        } catch (err) {
            span?.error(err);
            throw err;
        }
    }
}
