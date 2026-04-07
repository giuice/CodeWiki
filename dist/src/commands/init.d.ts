export interface InitOptions {
    cwd: string;
    args: string[];
}
export declare function runInit({ cwd, args }: InitOptions): Promise<string>;
