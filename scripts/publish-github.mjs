import { spawn, spawnSync } from "node:child_process";
import { existsSync, statSync } from "node:fs";
import { resolve } from "node:path";
import http from "node:http";

const cwd = process.cwd();
const gitArgs = ["--git-dir=.repo", "--work-tree=."];
const candidates = [process.env.GIT_EXE, "git", "C:\\Program Files\\Git\\cmd\\git.exe", "D:\\研究生阶段\\Git\\cmd\\git.exe"].filter(Boolean);
const git = candidates.find(candidate => (candidate === "git" || existsSync(candidate)) && spawnSync(candidate, ["--version"], {cwd, encoding:"utf8"}).status === 0);
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
const httpOptions = ["-c", "http.version=HTTP/1.1", "-c", "http.postBuffer=1048576"];

function configureNetwork() {
  let proxy = process.env.https_proxy || process.env.HTTPS_PROXY || process.env.http_proxy || process.env.HTTP_PROXY;
  if (!proxy) proxy = spawnSync(git, [...gitArgs,"config","--get","http.proxy"], {cwd, encoding:"utf8"}).stdout?.trim();
  if (!proxy && process.platform === "win32") {
    const registry = spawnSync("powershell.exe", ["-NoProfile","-Command","$networkSettings = Get-ItemProperty 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings'; if ($networkSettings.ProxyEnable -eq 1) { $networkSettings.ProxyServer }"], {encoding:"utf8", windowsHide:true, timeout:10000});
    const values = registry.stdout?.trim().split(";") || [];
    const systemProxy = values.find(value => value.startsWith("https="))?.slice(6) || values.find(value => value.startsWith("http="))?.slice(5) || values.find(value => !value.includes("="));
    if (systemProxy) {
      const direct = spawnSync(git, [...gitArgs,"-c","http.proxy=","-c","http.version=HTTP/1.1","ls-remote","origin","refs/heads/main"], {cwd, encoding:"utf8", windowsHide:true, timeout:25000});
      if (direct.status === 0) {
        httpOptions.push("-c", "http.proxy=");
        console.log("已确认可直连 GitHub，使用直连上传（不更改系统代理）。");
        return;
      }
      proxy = systemProxy;
    }
  }
  if (!proxy) return;
  if (!proxy.includes("://")) proxy = `http://${proxy}`;
  httpOptions.push("-c", `http.proxy=${proxy}`);
  if (typeof http.setGlobalProxyFromEnv === "function") http.setGlobalProxyFromEnv({http_proxy:proxy, https_proxy:proxy, no_proxy:"localhost,127.0.0.1"});
  console.log("使用本机已启用的代理连接 GitHub（不更改系统设置）。");
}

function run(args, {live = false, timeout = 60000, input} = {}) {
  return new Promise(resolveResult => {
    const child = spawn(git, [...gitArgs, ...args], {cwd, windowsHide:true, stdio:["pipe","pipe","pipe"]});
    let output = "";
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      output += "\n连接超时，正在停止本次上传并核对远端状态。";
      if (live) process.stdout.write("\n连接超时，正在停止本次上传并核对远端状态。\n");
      // Git starts HTTPS helper processes on Windows. Stop the owned tree so
      // a timed-out helper cannot keep the pipes open or overlap a retry.
      if (process.platform === "win32" && child.pid) {
        spawn("taskkill", ["/PID", String(child.pid), "/T", "/F"], {windowsHide:true, stdio:"ignore"})
          .on("error", () => child.kill());
      } else child.kill();
    }, timeout);
    for (const stream of [child.stdout, child.stderr]) stream.on("data", chunk => {
      output += chunk.toString();
      if (live) process.stdout.write(chunk);
    });
    child.on("error", error => { output += `\n${error.message}`; });
    child.on("close", status => { clearTimeout(timer); resolveResult({ok:status === 0 && !timedOut, status, output:output.trim(), timedOut}); });
    child.stdin.on("error", () => {});
    child.stdin.end(input || "");
  });
}

async function must(args, options) {
  const result = await run(args, options);
  if (!result.ok) throw new Error(result.output || (result.timedOut ? "操作超时，请稍后重试。" : "Git 操作失败。"));
  return result.output;
}

async function verifyRemote(head) {
  const result = await run([...httpOptions, "ls-remote", "origin", "refs/heads/main"], {timeout:45000});
  return result.ok && result.output.split(/\s+/)[0] === head;
}

async function verifyFileSizes() {
  const files = await must(["ls-files", "--cached", "--others", "--exclude-standard", "-z"]);
  const oversized = files.split("\0").filter(Boolean).filter(file => {
    try { return statSync(resolve(cwd, file)).size > 100 * 1024 * 1024; } catch { return false; }
  });
  if (oversized.length) throw new Error(`以下文件超过 GitHub 的 100 MiB 限制，请先压缩后再上传：\n${oversized.join("\n")}`);
}

async function verifyOutgoingHistory() {
  const objects = await must(["rev-list", "--objects", "origin/main..HEAD"]);
  if (!objects) return;
  const sizes = await must(["cat-file", "--batch-check=%(objecttype) %(objectsize) %(rest)"], {input:objects + "\n"});
  const oversized = sizes.split("\n").filter(line => /^blob (\d+) /.test(line) && Number(line.split(" ")[1]) > 100 * 1024 * 1024);
  if (oversized.length) throw new Error(`未上传的旧提交中仍有超限文件。仅删除当前文件无法解决，请先整理未上传提交：\n${oversized.join("\n")}`);
}

async function waitForDeployment(head, repository) {
  const [owner, repo] = repository;
  const site = `https://${owner}.github.io/${repo}/`;
  const actions = `https://github.com/${owner}/${repo}/actions`;
  console.log(`\n代码已确认到达 GitHub。正在等待网站部署，请保持后台服务运行。\n部署进度：${actions}`);
  const deadline = Date.now() + Number(process.env.PUBLISH_DEPLOY_TIMEOUT_MS || 480000);
  let iteration = 0;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${site}site-version.json?commit=${head}&check=${iteration}`, {signal:AbortSignal.timeout(10000), cache:"no-store"});
      const version = response.ok ? await response.json() : null;
      if (version?.commit === head) { console.log(`\n网站已更新并核对成功：${site}\n线上版本：${head.slice(0, 7)}`); return 0; }
    } catch { /* The previous deployment may not have a version endpoint yet. */ }
    if (iteration % 3 === 0) {
      try {
        const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/actions/runs?branch=main&head_sha=${head}&per_page=10`, {headers:{Accept:"application/vnd.github+json","User-Agent":"portfolio-publisher"}, signal:AbortSignal.timeout(10000)});
        const data = response.ok ? await response.json() : null;
        const workflow = data?.workflow_runs?.find(item => item.head_sha === head && item.path === ".github/workflows/deploy.yml");
        if (workflow?.status === "completed" && ["failure","cancelled","timed_out","action_required"].includes(workflow.conclusion)) {
          throw Object.assign(new Error(`代码已上传，但网站部署失败。请查看：${workflow.html_url}`), {deploymentFailed:true});
        }
      } catch (error) { if (error.deploymentFailed) throw error; }
    }
    iteration++;
    console.log(`网站尚在部署或等待线上缓存刷新（第 ${iteration} 次确认）…`);
    await pause(15000);
  }
  console.log(`\n代码已上传，但暂未确认网站已更新。请查看部署进度：${actions}\n网站：${site}`);
  return 2;
}

async function main() {
  if (!git) throw new Error("没有找到 Git，请检查本机 Git 安装。");
  configureNetwork();
  console.log("正在检查待上传文件…");
  await verifyFileSizes();
  const status = await must(["status", "--short"]);
  if (status) {
    await must(["add", "-A"]);
    await must(["commit", "-m", "Update portfolio content"], {live:true});
  } else console.log("本地修改已保存，正在核对 GitHub 是否收到提交…");
  await must([...httpOptions, "fetch", "origin", "main"], {timeout:90000, live:true});
  const [ahead, behind] = (await must(["rev-list", "--left-right", "--count", "HEAD...origin/main"])).split(/\s+/).map(Number);
  if (behind) throw new Error("GitHub 上有本地尚未合并的修改，请先同步后再上传。此次没有覆盖线上内容。");
  await verifyOutgoingHistory();
  const head = await must(["rev-parse", "HEAD"]);
  let uploaded = ahead === 0 && await verifyRemote(head);
  for (let attempt = 1; !uploaded && attempt <= 3; attempt++) {
    console.log(`\n正在上传到 GitHub（第 ${attempt}/3 次）…`);
    const push = await run([...httpOptions, "push", "--progress", "-u", "origin", "main"], {timeout:600000, live:true});
    // A disconnect can happen after the server has received the commit. Verify the ref, not the log wording.
    uploaded = await verifyRemote(head);
    if (uploaded) break;
    if (/GH001|large files detected|exceeds.*limit|\[rejected\]|fetch first|permission denied|authentication failed/i.test(push.output)) throw new Error("上传被拒绝，停止重复重试。请根据上方具体错误处理。");
    if (attempt < 3) { console.log("尚未确认远端收到更新，稍后重试…"); await pause(3000 * attempt); }
  }
  if (!uploaded) throw new Error("上传未完成：GitHub 仍未收到最新提交。本地内容和提交均已保留。请稍后重试。");
  console.log(`GitHub 已确认收到提交 ${head.slice(0, 7)}。`);
  if (process.argv.includes("--no-deploy-wait")) return 0;
  const remote = await must(["remote", "get-url", "origin"]);
  const match = remote.match(/github\.com[/:]([^/]+)\/([^/\s]+?)(?:\.git)?\/?$/);
  if (!match) return 0;
  return waitForDeployment(head, [match[1], match[2]]);
}

main().then(code => { process.exitCode = code; }).catch(error => { console.error(`\n发布未完成：${error.message}`); process.exitCode = 1; });
