import type { SupportedTool } from "../../core/types.js";
import type { ReportEntry } from "../reporter.js";

export interface AdapterInstallOptions {
  root: string;
  projectName: string;
  force: boolean;
  templateDir: string;
}

export interface ToolAdapter {
  tool: SupportedTool;
  install(options: AdapterInstallOptions): Promise<ReportEntry[]>;
}