export type Tool = {
    name:string;
    description:string;
    execute:(args:any)=>any;
    parameters:any;
}

export function tool(
    name:string,
    description:string,
    execute:(args:any)=>any,
    parameters:any
):Tool{
    return {
        name,
        description,
        execute,
        parameters
    }
}