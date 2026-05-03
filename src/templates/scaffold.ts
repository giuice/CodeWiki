import type { SupportedTool } from "../core/types.js";
import { configTemplate, decisionTemplate, entityTemplate, indexTemplate, issueTemplate, lessonTemplate, logTemplate, schemaTemplate, sourceSummaryTemplate } from "./page-templates.js";

export interface ScaffoldFile {
  path: string;
  content: string;
}

export function scaffoldDirectories(_tools: readonly SupportedTool[]): string[] {
  return [
    ".codewiki/templates",
    ".codewiki/hooks",
    ".codewiki/tasks",
    "wiki/raw/articles",
    "wiki/raw/papers",
    "wiki/raw/transcripts",
    "wiki/raw/specs",
    "wiki/raw/assets",
    "wiki/entities",
    "wiki/decisions",
    "wiki/concepts",
    "wiki/comparisons",
    "wiki/lessons",
    "wiki/issues",
    "wiki/sources",
    "wiki/queries"
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
    { path: "wiki/SCHEMA.md", content: schemaTemplate(projectName) },
    { path: "wiki/index.md", content: indexTemplate(projectName) },
    { path: "wiki/log.md", content: logTemplate },
    { path: "wiki/_backlinks.json", content: "{}\n" }
  ];
}
