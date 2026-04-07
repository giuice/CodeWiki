import { basename } from "node:path";
import { defaultConfigYaml } from "../core/config.js";
import { SupportedTool } from "../core/types.js";
import { adapterFiles } from "./adapter-templates.js";
import { PAGE_TEMPLATES } from "./page-templates.js";

export interface ScaffoldFile {
  path: string;
  content: string;
}

export function scaffoldDirectories(tools: SupportedTool[]): string[] {
  return [
    ".codewiki/templates",
    ".codewiki/adapters",
    ...tools.map((tool) => `.codewiki/adapters/${tool}`),
    "raw",
    "wiki/entities",
    "wiki/decisions",
    "wiki/lessons",
    "wiki/issues",
    "wiki/sources",
  ];
}

export function scaffoldFiles(projectName: string, tools: SupportedTool[]): ScaffoldFile[] {
  const files: ScaffoldFile[] = [
    { path: ".codewiki/config.yml", content: defaultConfigYaml(projectName || basename(process.cwd()), tools) },
    { path: "wiki/index.md", content: "# CodeWiki Index\n\nEvery human-approved wiki page is cataloged here with summary and tags. Read this file first for queries.\n\n## Entities\n\n## Decisions\n\n## Lessons\n\n## Issues\n\n## Sources\n" },
    { path: "wiki/log.md", content: "# CodeWiki Log\n\nAppend-only human-approved operation log.\n" },
  ];

  for (const [name, render] of Object.entries(PAGE_TEMPLATES)) {
    files.push({ path: `.codewiki/templates/${name}`, content: render() });
  }

  for (const tool of tools) {
    for (const [fileName, content] of Object.entries(adapterFiles(tool))) {
      files.push({ path: `.codewiki/adapters/${tool}/${fileName}`, content });
    }
  }

  return files;
}
