import path from "node:path";

import { ensureDir, ensureInsideRoot } from "../../core/files.js";
import type { ReportEntry } from "../reporter.js";
import { copyTemplateDir } from "./base.js";
import type { AdapterInstallOptions, ToolAdapter } from "./types.js";

const AGENT_SKILLS_DIR = ".agents/skills";

export class SharedSkillsAdapter implements ToolAdapter {
  tool = "shared-skills" as const;

  async install(options: AdapterInstallOptions): Promise<ReportEntry[]> {
    await ensureDir(options.root, AGENT_SKILLS_DIR);

    return copyTemplateDir(
      path.join(options.templateDir, "skills"),
      ensureInsideRoot(options.root, AGENT_SKILLS_DIR),
      options.force,
      options.root
    );
  }
}
