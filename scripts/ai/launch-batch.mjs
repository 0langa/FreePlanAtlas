import { spawn } from "node:child_process";
import readline from "node:readline/promises";
import process from "node:process";

const DEFAULT_TIMEOUT_MS = 10_000;

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: "inherit", ...options });
    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`${command} ${args.join(" ")} failed with ${code}`));
      }
    });
  });
}

async function askYesNo(rl, prompt, { defaultYes } = {}) {
  const suffix = defaultYes ? "(Y/n)" : "(y/N)";
  const defaultLabel = defaultYes ? "Y" : "N";

  const timeout = new Promise((resolve) => {
    const timer = setTimeout(() => {
      clearTimeout(timer);
      resolve(defaultYes ? "y" : "n");
    }, DEFAULT_TIMEOUT_MS);
  });

  const question = rl.question(`${prompt} ${suffix} [auto ${defaultLabel} in 10s]: `);
  const answer = (await Promise.race([question, timeout])) ?? "";
  const value = String(answer).trim().toLowerCase();

  if (!value) return !!defaultYes;
  if (value === "y" || value === "yes") return true;
  if (value === "n" || value === "no") return false;
  return !!defaultYes;
}

async function main() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  try {
    const runAll = await askYesNo(rl, "Run AI batch pipeline for ALL batch-intake/*.md (all kinds)?", { defaultYes: true });
    if (!runAll) {
      console.log("Aborted. No batch jobs started.");
      return;
    }

    const skipFoundry = await askYesNo(rl, "Skip Foundry and use existing *.responses.jsonl files?", { defaultYes: false });
    const force = await askYesNo(rl, "Overwrite existing entries if they already exist?", { defaultYes: false });

    const args = ["scripts/ai/run-batch.mjs", "batch-intake", "services"];
    if (skipFoundry) {
      args.push("--skipFoundry", "true");
    }
    if (force) {
      args.push("--force", "true");
    }

    await run("node", args, { cwd: process.cwd() });
  } finally {
    rl.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});