export class ConversationMemory {
    messages: {role:string , content:string}[] = [];

    add(role:string , content:string){
        this.messages.push({role, content});
    }

    clear(){
        this.messages = [];
    }
}