import type { SupportedTool } from "../core/types.js";
import { adapterReadme } from "./adapter-templates.js";
import { configTemplate, decisionTemplate, entityTemplate, indexTemplate, issueTemplate, lessonTemplate, logTemplate, sourceSummaryTemplate } from "./page-templates.js";

export interface ScaffoldFile {
  path: string;
  content: string;
}

function uniqueTools(tools: readonly SupportedTool[]): SupportedTool[] {
  return [...new Set(tools)];
}

export function scaffoldDirectories(tools: readonly SupportedTool[]): string[] {
  const selectedTools = uniqueTools(tools);

  return [
    ".codewiki/templates",
    ".codewiki/adapters",
    ...selectedTools.map((tool) => `.codewiki/adapters/${tool}`),
    "raw",
    "tasks",
    "wiki/entities",
    "wiki/decisions",
    "wiki/lessons",
    "wiki/issues",
    "wiki/sources"
  ];
}

export function scaffoldFiles(projectName: string, tools: readonly SupportedTool[]): ScaffoldFile[] {
  const selectedTools = uniqueTools(tools);

  return [
    { path: ".codewiki/config.yml", content: configTemplate(projectName, selectedTools) },
    { path: ".codewiki/templates/entity.md", content: entityTemplate },
    { path: ".codewiki/templates/decision.md", content: decisionTemplate },
    { path: ".codewiki/templates/lesson.md", content: lessonTemplate },
    { path: ".codewiki/templates/issue.md", content: issueTemplate },
    { path: ".codewiki/templates/source-summary.md", content: sourceSummaryTemplate },
    { path: "wiki/index.md", content: indexTemplate(projectName) },
    { path: "wiki/log.md", content: logTemplate },
    { path: "wiki/_backlinks.json", content: "{}\n" },
    ...selectedTools.flatMap((tool) => [
      { path: `.codewiki/adapters/${tool}/README.md`, content: adapterReadme(tool) },
      ...(tool === "codex" ? [{ path: `.codewiki/adapters/${tool}/AGENTS.fragment.md`, content: adapterReadme(tool) }] : [])
    ])
  ];
}
