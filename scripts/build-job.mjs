import { spawn } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

export function createBuilder(root, nodeExe, {args = ["node_modules/next/dist/bin/next", "build"], timeoutMs = 900000} = {}) {
  const file = join(root, "portfolio-build-state.json");
  let state = {status:"idle", running:false, output:"", startedAt:null, finishedAt:null};
  if (existsSync(file)) {
    try { state = {...state, ...JSON.parse(readFileSync(file, "utf8"))}; } catch { /* Ignore incomplete status. */ }
    if (state.running) state = {...state, status:"interrupted", running:false, output:state.output + "\n后台曾关闭，生成结果未确认；可重新生成。"};
  }
  const persist = () => writeFileSync(file, JSON.stringify(state, null, 2), "utf8");
  const append = text => { state.output = (state.output + text.replace(/\r/g, "\n")).slice(-24000); persist(); };
  return {
    snapshot: () => ({...state}),
    start() {
      if (state.running) return {...state};
      state = {status:"running", running:true, output:"正在生成作品集，请保持后台服务运行。可切换栏目，进度会持续更新…\n", startedAt:new Date().toISOString(), finishedAt:null};
      persist();
      const child = spawn(nodeExe, args, {cwd:root, windowsHide:true, stdio:["ignore","pipe","pipe"],
        env:{...process.env, GITHUB_ACTIONS:"true", GITHUB_REPOSITORY:process.env.GITHUB_REPOSITORY || "liucs-xanny/liu-changsheng-portfolio"}});
      let timedOut = false;
      const timer = setTimeout(() => {
        timedOut = true;
        append("\n生成超过 15 分钟，已停止本次任务。保存的内容不受影响，请查看最后停在哪一步。\n");
        if (process.platform === "win32" && child.pid) spawn("taskkill", ["/PID",String(child.pid),"/T","/F"], {windowsHide:true, stdio:"ignore"}).on("error", () => child.kill()).on("exit", code => { if (code) child.kill(); });
        else child.kill();
      }, timeoutMs);
      child.stdout.setEncoding("utf8"); child.stderr.setEncoding("utf8");
      child.stdout.on("data", append); child.stderr.on("data", append);
      child.on("error", error => append(`\n生成未能启动：${error.message}\n`));
      child.on("close", code => {
        clearTimeout(timer);
        state = {...state, running:false, status:code === 0 && !timedOut ? "success" : "error", exitCode:code, finishedAt:new Date().toISOString()};
        append(state.status === "success" ? "\n生成完成。点击「打开作品集」查看；已打开的页面请刷新。\n" : "\n生成未完成，保存的文案与素材仍在。请查看上方具体原因。\n");
        writeFileSync(join(root, "portfolio-admin-last.log"), state.output, "utf8");
      });
      return {...state};
    },
  };
}
