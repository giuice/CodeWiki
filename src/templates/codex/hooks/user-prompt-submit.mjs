#!/usr/bin/env node
import { readStdin, repositoryRoot, runSharedHook } from "./codewiki-wrapper-lib.mjs";

const payload = readStdin();
const root = repositoryRoot();
const output = runSharedHook(root, "pre-wiki-context.mjs", "UserPromptSubmit", payload);

if (output) process.stdout.write(output);
