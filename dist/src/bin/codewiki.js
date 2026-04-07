#!/usr/bin/env node
import { runCli } from "../cli.js";
const exitCode = await runCli();
process.exitCode = exitCode;
//# sourceMappingURL=codewiki.js.map