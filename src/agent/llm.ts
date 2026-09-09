export class OpenAILLM {
    constructor(
        private apiKey:string,
        private model = "gpt-4o-mini"
    ){}

    async ask(prompt:string , system:string){
        const res = await fetch("https://api.openai.com/v1/chat/completions",{
            method:"POST",
            headers:{
                "Content-Type": "application/json",
                Authorization: `Bearer ${this.apiKey}`,
            },
            body:JSON.stringify({
                model:this.model,
                messages:[
                    {role:"system" , content:system},
                    {role:"user" , content:prompt}
                ]
            })
        });

        const data:any = await res.json();
        return data.choices[0].message.content;
    }
}