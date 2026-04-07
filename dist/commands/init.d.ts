export interface InitOptions {
    root?: string;
    args: string[];
}
export declare function initCommand({ root, args }: InitOptions): Promise<string>;
