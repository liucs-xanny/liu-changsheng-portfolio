import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";

const cwd = process.cwd();
const gitArgs = ["--git-dir=.repo", "--work-tree=."];
const gitCandidates = [
  process.env.GIT_EXE,
  "git",
  "C:\\Program Files\\Git\\cmd\\git.exe",
  "C:\\Program Files (x86)\\Git\\cmd\\git.exe",
  "D:\\研究生阶段\\Git\\cmd\\git.exe",
].filter(Boolean);

function findGit() {
  for (const candidate of gitCandidates) {
    if (candidate !== "git" && !existsSync(candidate)) continue;
    const result = spawnSync(candidate, ["--version"], {
      cwd,
      encoding: "utf8",
    });
    if (result.status === 0) return candidate;
  }
  return "";
}

const git = findGit();

if (!git) {
  console.error("Git was not found. Please install Git or set GIT_EXE to your git.exe path.");
  process.exit(1);
}

function run(args, options = {}) {
  const result = spawnSync(git, [...gitArgs, ...args], {
    cwd,
    encoding: "utf8",
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
