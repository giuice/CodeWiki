import type { SupportedTool } from "../../core/types.js";
import type { ReportEntry } from "../reporter.js";

export interface AdapterInstallOptions {
  root: string;
  projectName: string;
  force: boolean;
  templateDir: string;
}

export type AdapterSection = SupportedTool | "shared-skills";

export interface ToolAdapter {
  tool: AdapterSection;
  install(options: AdapterInstallOptions): Promise<ReportEntry[]>;
}
