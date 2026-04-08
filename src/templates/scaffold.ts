import type { SupportedTool } from "../core/types.js";
import { configTemplate, decisionTemplate, entityTemplate, indexTemplate, issueTemplate, lessonTemplate, logTemplate, sourceSummaryTemplate } from "./page-templates.js";

export interface ScaffoldFile {
  path: string;
  content: string;
}

export function scaffoldDirectories(_tools: readonly SupportedTool[]): string[] {
  return [
    ".codewiki/templates",
    ".codewiki/hooks",
    "raw",
    "tasks",
    "wiki/entities",
    "wiki/decisions",
    "wiki/lessons",
    "wiki/issues",
    "wiki/sources"
  ];
}

export function scaffoldFiles(projectName: string, _tools: readonly SupportedTool[]): ScaffoldFile[] {
  return [
    { path: ".codewiki/config.yml", content: configTemplate(projectName, []) },
    { path: ".codewiki/templates/entity.md", content: entityTemplate },
    { path: ".codewiki/templates/decision.md", content: decisionTemplate },
    { path: ".codewiki/templates/lesson.md", content: lessonTemplate },
    { path: ".codewiki/templates/issue.md", content: issueTemplate },
    { path: ".codewiki/templates/source-summary.md", content: sourceSummaryTemplate },
    { path: "wiki/index.md", content: indexTemplate(projectName) },
    { path: "wiki/log.md", content: logTemplate },
    { path: "wiki/_backlinks.json", content: "{}\n" }
  ];
}
