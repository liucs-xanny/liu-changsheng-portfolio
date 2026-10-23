import { spawn } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

export function createPublisher(root, nodeExe) {
  const file = join(root, "portfolio-publish-state.json");
  let state = { status:"idle", running:false, output:"", startedAt:null, finishedAt:null };
  if (existsSync(file)) {
    try { state = {...state, ...JSON.parse(readFileSync(file, "utf8"))}; } catch { /* Ignore an incomplete old status file. */ }
    if (state.running) state = {...state, running:false, status:"interrupted", output:state.output + "\n上次发布未确认完成。重试时会先核对 GitHub 上的实际版本。"};
  }
  const persist = () => writeFileSync(file, JSON.stringify(state, null, 2), "utf8");
  const append = text => { state.output = (state.output + text.replace(/\r/g, "\n")).slice(-24000); persist(); };
  return {
    snapshot: () => ({...state}),
    start() {
      if (state.running) return {...state};
      state = {status:"running", running:true, output:"正在准备上传并检查部署…\n", startedAt:new Date().toISOString(), finishedAt:null};
      persist();
      const child = spawn(nodeExe, [join(root, "scripts/publish-github.mjs")], {cwd:root, windowsHide:true, stdio:["ignore","pipe","pipe"]});
      child.stdout.setEncoding("utf8");
      child.stderr.setEncoding("utf8");
      child.stdout.on("data", append);
      child.stderr.on("data", append);
      child.on("error", error => append(`\n发布进程未能启动：${error.message}\n`));
      child.on("close", code => {
        state.running = false;
        state.status = code === 0 ? "success" : code === 2 ? "pending" : "error";
        state.finishedAt = new Date().toISOString();
        state.exitCode = code;
        persist();
        writeFileSync(join(root, "portfolio-admin-last.log"), state.output, "utf8");
      });
      return {...state};
    },
  };
}
