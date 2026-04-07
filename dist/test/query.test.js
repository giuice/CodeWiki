import test from "node:test";
import assert from "node:assert/strict";
import { writeFileSync } from "node:fs";
import path from "node:path";
import { mustRun, read, tempProject } from "./helpers.js";
test("query reads index first, emits references, and does not file answers", () => {
    const cwd = tempProject();
    mustRun(cwd, ["init"]);
    writeFileSync(path.join(cwd, "wiki/index.md"), "# CodeWiki Index\n\n- [[api-client]] — retry backoff entity #retry\n");
    writeFileSync(path.join(cwd, "wiki/entities/api-client.md"), "---\ntype: entity\nname: api-client\n---\n# api-client\n\nRetry backoff must avoid zero delay.\n");
    const before = read(cwd, "wiki/entities/api-client.md");
    const result = mustRun(cwd, ["query", "retry", "backoff"]);
    assert.match(result.stdout, /Read Order\n1\. wiki\/index\.md/);
    assert.match(result.stdout, /wiki\/entities\/api-client\.md/);
    assert.match(result.stdout, /Cite relative wiki paths/);
    assert.equal(read(cwd, "wiki/entities/api-client.md"), before);
});
test("query no-match is explicit", () => {
    const cwd = tempProject();
    mustRun(cwd, ["init"]);
    const result = mustRun(cwd, ["query", "unrelatedzzzz"]);
    assert.match(result.stdout, /No matching wiki pages found/);
});
