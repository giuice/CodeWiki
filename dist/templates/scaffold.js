import { adapterReadme } from "./adapter-templates.js";
import { configTemplate, decisionTemplate, entityTemplate, indexTemplate, issueTemplate, lessonTemplate, logTemplate, sourceSummaryTemplate } from "./page-templates.js";
export function scaffoldDirectories(tools) {
    return [
        ".codewiki/templates",
        ".codewiki/adapters",
        ...tools.map((tool) => `.codewiki/adapters/${tool}`),
        "raw",
        "wiki/entities",
        "wiki/decisions",
        "wiki/lessons",
        "wiki/issues",
        "wiki/sources"
    ];
}
export function scaffoldFiles(projectName, tools) {
    return [
        { path: ".codewiki/config.yml", content: configTemplate(projectName, tools) },
        { path: ".codewiki/templates/entity.md", content: entityTemplate },
        { path: ".codewiki/templates/decision.md", content: decisionTemplate },
        { path: ".codewiki/templates/lesson.md", content: lessonTemplate },
        { path: ".codewiki/templates/issue.md", content: issueTemplate },
        { path: ".codewiki/templates/source-summary.md", content: sourceSummaryTemplate },
        { path: "wiki/index.md", content: indexTemplate(projectName) },
        { path: "wiki/log.md", content: logTemplate },
        ...tools.map((tool) => ({ path: `.codewiki/adapters/${tool}/README.md`, content: adapterReadme(tool) }))
    ];
}
//# sourceMappingURL=scaffold.js.map