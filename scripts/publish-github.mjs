import { spawnSync } from "node:child_process";

const cwd = process.cwd();
const gitArgs = ["--git-dir=.repo", "--work-tree=."];

function run(args, options = {}) {
  const result = spawnSync("git", [...gitArgs, ...args], {
    cwd,
    encoding: "utf8",
    shell: true,
    ...options,
  });

  return {
    ok: result.status === 0,
    status: result.status,
    output: `${result.stdout || ""}${result.stderr || ""}`.trim(),
  };
}

const status = run(["status", "--short"]);
if (!status.ok) {
  console.error(status.output || "Unable to read git status.");
  process.exit(status.status || 1);
}

if (status.output) {
  const add = run(["add", "-A"]);
  if (!add.ok) {
    console.error(add.output || "Unable to stage changes.");
    process.exit(add.status || 1);
  }

  const commit = run(["commit", "-m", "Update portfolio content"]);
  if (!commit.ok && !/nothing to commit/i.test(commit.output)) {
    console.error(commit.output || "Unable to create commit.");
    process.exit(commit.status || 1);
  }

  if (commit.output) console.log(commit.output);
} else {
  console.log("No local changes to commit.");
}

const push = run(["push", "-u", "origin", "main"]);
if (!push.ok) {
  console.error(push.output || "Unable to push to GitHub.");
  process.exit(push.status || 1);
}

console.log(push.output || "Uploaded to GitHub.");
