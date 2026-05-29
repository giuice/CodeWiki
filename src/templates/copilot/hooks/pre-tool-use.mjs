#!/usr/bin/env node
import { readStdin, repositoryRoot, runSharedHook, writeJson } from "./codewiki-wrapper-lib.mjs";

const payload = readStdin();
const root = repositoryRoot();

runSharedHook(root, "pre-wiki-context.mjs", "preToolUse", payload);
writeJson({});
