export interface CliIO {
    cwd: string;
    stdout: (message: string) => void;
    stderr: (message: string) => void;
    now?: Date;
}
export declare function helpText(): string;
export declare function runCli(argv?: string[], io?: Partial<CliIO>): Promise<number>;
