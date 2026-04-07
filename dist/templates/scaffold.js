import { configTemplate, decisionTemplate, entityTemplate, initialIndex, initialLog, issueTemplate, lessonTemplate, sourceSummaryTemplate } from "./page-templates.js";
import { adapterFiles } from "./adapter-templates.js";
export function scaffoldEntries(projectName, tools) {
    const entries = [
        { path: ".codewiki/templates", directory: true },
        { path: ".codewiki/adapters", directory: true },
        { path: "raw", directory: true },
        { path: "wiki/entities", directory: true },
        { path: "wiki/decisions", directory: true },
        { path: "wiki/lessons", directory: true },
        { path: "wiki/issues", directory: true },
        { path: "wiki/sources", directory: true },
        { path: ".codewiki/config.yml", content: configTemplate(projectName, tools) },
        { path: ".codewiki/templates/entity.md", content: entityTemplate },
        { path: ".codewiki/templates/decision.md", content: decisionTemplate },
        { path: ".codewiki/templates/lesson.md", content: lessonTemplate },
        { path: ".codewiki/templates/issue.md", content: issueTemplate },
        { path: ".codewiki/templates/source-summary.md", content: sourceSummaryTemplate },
        { path: "wiki/index.md", content: initialIndex },
        { path: "wiki/log.md", content: initialLog }
    ];
    for (const tool of tools) {
        entries.push({ path: `.codewiki/adapters/${tool}`, directory: true });
        entries.push(...adapterFiles(tool));
    }
    return entries;
}
//# sourceMappingURL=scaffold.js.map