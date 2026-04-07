import { type SupportedTool } from "../core/types.js";
export interface InitOptions {
    root?: string;
    tools?: SupportedTool[];
    name?: string;
    force?: boolean;
}
export declare function parseToolList(value: string): SupportedTool[];
export declare function initCommand(options?: InitOptions): Promise<string>;
