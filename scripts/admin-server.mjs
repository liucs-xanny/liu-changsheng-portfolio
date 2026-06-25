import { createServer } from "node:http";
import { createReadStream, createWriteStream, existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { basename, extname, join, normalize, relative } from "node:path";
import { spawn, spawnSync } from "node:child_process";

const root = process.cwd();
const publicRoot = join(root, "public");
const port = Number(process.env.ADMIN_PORT || 4188);
const nodeExe = process.execPath;

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".mp4": "video/mp4",
  ".pdf": "application/pdf",
};

function json(response, data, status = 200) {
  response.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(data, null, 2));
}

function text(response, value, status = 200) {
  response.writeHead(status, { "Content-Type": "text/plain; charset=utf-8" });
  response.end(value);
}

function safePublicPath(input = "") {
  const clean = normalize(input.replace(/^\/+/, "")).replace(/^(\.\.(\\|\/|$))+/, "");
  const resolved = join(publicRoot, clean);
  if (!resolved.startsWith(publicRoot)) throw new Error("Path is outside public folder.");
  return resolved;
}

function slugifyFileName(name) {
  const extension = extname(name).toLowerCase();
  const stem = basename(name, extension)
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .toLowerCase();
  const fallback = `asset-${new Date().toISOString().replace(/[-:TZ.]/g, "").slice(0, 14)}`;
  return `${stem || fallback}${extension}`;
}

function run(command, args, timeout = 120000) {
  const result = spawnSync(command, args, {
    cwd: root,
    encoding: "utf8",
    shell: true,
    timeout,
  });

  return {
    ok: result.status === 0,
    status: result.status,
    output: `${result.stdout || ""}${result.stderr || ""}`.trim(),
  };
}

function startDetached(command, args, stdoutFile, stderrFile) {
  const out = createWriteStream(join(root, stdoutFile), { flags: "a" });
  const err = createWriteStream(join(root, stderrFile), { flags: "a" });
  const child = spawn(command, args, {
    cwd: root,
    detached: true,
    stdio: ["ignore", out, err],
    windowsHide: true,
  });
  child.unref();
}

function listAssets(folder = "") {
  const target = safePublicPath(folder);
  if (!existsSync(target)) return [];

  return readdirSync(target, { withFileTypes: true }).map((entry) => {
    const fullPath = join(target, entry.name);
    const publicPath = `/${relative(publicRoot, fullPath).replace(/\\/g, "/")}`;
    return {
      name: entry.name,
      path: publicPath,
      kind: entry.isDirectory() ? "folder" : "file",
      size: entry.isDirectory() ? null : statSync(fullPath).size,
      extension: entry.isDirectory() ? "" : extname(entry.name).toLowerCase(),
    };
  });
}

function portfolioUrl() {
  const file = join(root, "portfolio-local-url.txt");
  if (!existsSync(file)) return "";
  return readFileSync(file, "utf8").trim();
}

function gitStatus() {
  if (!existsSync(join(root, ".repo", "HEAD"))) return "Local git metadata was not found.";
  const result = run("git", ["--git-dir=.repo", "--work-tree=.", "status", "--short"], 10000);
  return result.ok ? result.output || "Clean" : result.output || "Unable to read git status.";
}

function adminHtml() {
  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>刘昌盛作品集管理后台</title>
  <style>
    :root { color-scheme: dark; --bg:#11100e; --panel:#191714; --line:rgba(244,232,220,.16); --text:#f4e8dc; --muted:rgba(244,232,220,.56); --blue:#356fe8; --peach:#ffb894; }
    * { box-sizing: border-box; }
    body { margin:0; background: radial-gradient(circle at top left, rgba(53,111,232,.18), transparent 32rem), var(--bg); color:var(--text); font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
    main { width:min(1180px, calc(100vw - 32px)); margin:0 auto; padding:32px 0 56px; }
    header { display:flex; justify-content:space-between; gap:24px; align-items:flex-end; margin-bottom:24px; }
    h1 { margin:0; font-size:clamp(32px, 6vw, 72px); line-height:.9; letter-spacing:-.06em; }
    h2 { margin:0 0 16px; font-size:20px; }
    p { color:var(--muted); line-height:1.7; }
    .grid { display:grid; grid-template-columns: repeat(12, 1fr); gap:14px; }
    .panel { grid-column: span 6; border:1px solid var(--line); background:rgba(25,23,20,.82); border-radius:24px; padding:22px; backdrop-filter: blur(14px); }
    .wide { grid-column: span 12; }
    .third { grid-column: span 4; }
    button, select, input { border:1px solid var(--line); background:#0e0d0b; color:var(--text); border-radius:999px; padding:11px 16px; }
    button { cursor:pointer; transition:.2s ease; }
    button:hover { border-color:var(--peach); color:var(--peach); transform:translateY(-1px); }
    .primary { background:var(--peach); color:#11100e; border-color:var(--peach); font-weight:700; }
    .danger:hover { border-color:#ff7373; color:#ff7373; }
    .row { display:flex; gap:10px; flex-wrap:wrap; align-items:center; }
    .status { white-space:pre-wrap; min-height:96px; max-height:260px; overflow:auto; background:#0b0a09; border:1px solid var(--line); border-radius:18px; padding:14px; color:var(--muted); font:12px/1.6 ui-monospace, SFMono-Regular, Consolas, monospace; }
    .assets { display:grid; grid-template-columns: repeat(auto-fill, minmax(170px, 1fr)); gap:12px; }
    .asset { border:1px solid var(--line); border-radius:18px; padding:10px; min-height:120px; background:#11100e; overflow:hidden; }
    .asset img, .asset video { width:100%; height:110px; object-fit:cover; border-radius:12px; background:#050505; }
    .asset small { display:block; color:var(--muted); word-break:break-all; margin-top:8px; }
    label { display:block; color:var(--muted); font-size:12px; margin-bottom:8px; letter-spacing:.08em; text-transform:uppercase; }
    .hint { font-size:13px; }
    @media (max-width: 820px) { .panel, .third { grid-column: span 12; } header { display:block; } }
  </style>
</head>
<body>
  <main>
    <header>
      <div>
        <p>LOCAL DESIGNER OPERATING SYSTEM</p>
        <h1>Portfolio<br/>Admin</h1>
      </div>
      <div class="row">
        <button onclick="refresh()">刷新状态</button>
        <button class="primary" onclick="action('open-admin')">重新打开后台</button>
      </div>
    </header>

    <section class="grid">
      <article class="panel third">
        <h2>作品集预览</h2>
        <p class="hint">启动或关闭本地作品集服务器。推荐以后都从这里打开。</p>
        <div class="row">
          <button class="primary" onclick="action('preview')">打开作品集</button>
          <button class="danger" onclick="action('close-preview')">关闭作品集</button>
        </div>
      </article>

      <article class="panel third">
        <h2>生成网站</h2>
        <p class="hint">更换素材后，点这里重新生成 out 文件夹。</p>
        <div class="row">
          <button onclick="action('build')">重新生成</button>
        </div>
      </article>

      <article class="panel third">
        <h2>同步 GitHub</h2>
        <p class="hint">会自动提交本地改动并推送到 main，然后 GitHub Actions 会部署。</p>
        <div class="row">
          <button onclick="action('publish')">上传发布</button>
        </div>
      </article>

      <article class="panel wide">
        <h2>状态</h2>
        <div id="status" class="status">Loading...</div>
      </article>

      <article class="panel wide">
        <h2>素材管理</h2>
        <p class="hint">先选 public 下的目标文件夹，再上传图片、视频或 PDF。文件名会自动清理成英文安全格式。</p>
        <div class="row">
          <select id="folder" onchange="loadAssets()">
            <option value="images/cover">首页 / 个人照片</option>
            <option value="images/projects/yuandian/selected">原点向导精选图</option>
            <option value="images/projects/shanyin/selected">山音接力精选图</option>
            <option value="images/projects/lechang/selected">乐后昌城精选图</option>
            <option value="images/projects/yueban/selected">悦伴精选图</option>
            <option value="images/projects/medical">医疗机器人</option>
            <option value="images/projects/zhijing">智清镜</option>
            <option value="media">视频素材</option>
            <option value="docs/projects">项目 PDF</option>
          </select>
          <input id="file" type="file" />
          <button onclick="upload()">上传到当前文件夹</button>
        </div>
        <div id="assets" class="assets" style="margin-top:18px"></div>
      </article>

      <article class="panel wide">
        <h2>下一版：项目编辑表单</h2>
        <p>这一版先把“启动、生成、上传、素材替换”打通。下一版我建议把项目文案迁到 <code>data/projects.json</code>，后台就能直接编辑标题、简介、标签、排序和项目段落。这样会更安全，也更像真正 CMS。</p>
      </article>
    </section>
  </main>

  <script>
    async function api(path, options) {
      const response = await fetch(path, options);
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || '请求失败');
      return data;
    }

    async function refresh() {
      const data = await api('/api/status');
      document.getElementById('status').textContent =
        '作品集地址: ' + (data.portfolioUrl || '未启动') + '\\n\\n' +
        'Git 状态:\\n' + data.gitStatus + '\\n\\n' +
        '最近操作:\\n' + (data.lastLog || '暂无');
    }

    async function action(name) {
      const box = document.getElementById('status');
      box.textContent = '正在执行：' + name + ' ...';
      try {
        const data = await api('/api/action', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: name })
        });
        box.textContent = data.output || '完成';
        setTimeout(refresh, 800);
      } catch (error) {
        box.textContent = error.message;
      }
    }

    async function loadAssets() {
      const folder = document.getElementById('folder').value;
      const data = await api('/api/assets?folder=' + encodeURIComponent(folder));
      const container = document.getElementById('assets');
      container.innerHTML = data.items.map((item) => {
        const src = item.path;
        const preview = item.kind === 'folder'
          ? '<p>📁 文件夹</p>'
          : ['.png','.jpg','.jpeg','.webp','.svg'].includes(item.extension)
            ? '<img src="' + src + '" alt="">'
            : ['.mp4','.webm'].includes(item.extension)
              ? '<video src="' + src + '" muted></video>'
              : '<p>📄 文件</p>';
        return '<div class="asset">' + preview + '<small>' + item.path + '</small></div>';
      }).join('');
    }

    async function upload() {
      const input = document.getElementById('file');
      const file = input.files[0];
      if (!file) return alert('先选择一个文件');
      const folder = document.getElementById('folder').value;
      const response = await fetch('/api/upload?folder=' + encodeURIComponent(folder), {
        method: 'POST',
        headers: { 'x-file-name': encodeURIComponent(file.name) },
        body: file
      });
      const data = await response.json();
      if (!response.ok) return alert(data.error || '上传失败');
      input.value = '';
      await loadAssets();
      await refresh();
      alert('已上传：' + data.path);
    }

    refresh();
    loadAssets();
  </script>
</body>
</html>`;
}

async function readBody(request) {
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  return Buffer.concat(chunks);
}

const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url || "/", `http://127.0.0.1:${port}`);

    if (request.method === "GET" && url.pathname === "/") {
      response.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      response.end(adminHtml());
      return;
    }

    if (request.method === "GET" && url.pathname.startsWith("/images/") || request.method === "GET" && url.pathname.startsWith("/media/") || request.method === "GET" && url.pathname.startsWith("/docs/")) {
      const filePath = safePublicPath(url.pathname);
      if (!existsSync(filePath) || !statSync(filePath).isFile()) return text(response, "Not found", 404);
      response.writeHead(200, { "Content-Type": mimeTypes[extname(filePath).toLowerCase()] || "application/octet-stream" });
      createReadStream(filePath).pipe(response);
      return;
    }

    if (request.method === "GET" && url.pathname === "/api/status") {
      const lastLogPath = join(root, "portfolio-admin-last.log");
      json(response, {
        portfolioUrl: portfolioUrl(),
        gitStatus: gitStatus(),
        lastLog: existsSync(lastLogPath) ? readFileSync(lastLogPath, "utf8").slice(-5000) : "",
      });
      return;
    }

    if (request.method === "GET" && url.pathname === "/api/assets") {
      json(response, { items: listAssets(url.searchParams.get("folder") || "") });
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/upload") {
      const folder = url.searchParams.get("folder") || "";
      const targetFolder = safePublicPath(folder);
      mkdirSync(targetFolder, { recursive: true });
      const originalName = decodeURIComponent(request.headers["x-file-name"] || "asset.bin");
      const fileName = slugifyFileName(originalName);
      const targetPath = join(targetFolder, fileName);
      writeFileSync(targetPath, await readBody(request));
      json(response, { path: `/${relative(publicRoot, targetPath).replace(/\\/g, "/")}` });
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/action") {
      const body = JSON.parse((await readBody(request)).toString("utf8") || "{}");
      const action = body.action;
      let result = { ok: true, output: "" };

      if (action === "preview") {
        startDetached(nodeExe, ["scripts/preview-static.mjs"], "portfolio-local.log", "portfolio-local-error.log");
        result.output = "作品集预览已启动。稍等 1 秒后会自动打开浏览器。";
        setTimeout(() => {
          const url = portfolioUrl() || "http://127.0.0.1:4173/liu-changsheng-portfolio/";
          spawn("cmd", ["/c", "start", "", url], { detached: true, stdio: "ignore", windowsHide: true }).unref();
        }, 900);
      } else if (action === "close-preview") {
        result = run("powershell", ["-NoProfile", "-Command", "$connections = Get-NetTCPConnection -LocalPort (4173..4183) -State Listen -ErrorAction SilentlyContinue; if ($connections) { $connections | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }; 'Portfolio server stopped.' } else { 'Portfolio server is not running.' }; if (Test-Path 'portfolio-local-url.txt') { Remove-Item 'portfolio-local-url.txt' -Force }"], 20000);
      } else if (action === "build") {
        result = run(nodeExe, ["node_modules/next/dist/bin/next", "build"], 180000);
      } else if (action === "publish") {
        result = run(nodeExe, ["scripts/publish-github.mjs"], 180000);
      } else if (action === "open-admin") {
        spawn("cmd", ["/c", "start", "", `http://127.0.0.1:${port}/`], { detached: true, stdio: "ignore", windowsHide: true }).unref();
        result.output = "后台已重新打开。";
      } else {
        json(response, { error: "Unknown action." }, 400);
        return;
      }

      writeFileSync(join(root, "portfolio-admin-last.log"), result.output || "", "utf8");
      json(response, result, result.ok ? 200 : 500);
      return;
    }

    text(response, "Not found", 404);
  } catch (error) {
    json(response, { error: error.message || String(error) }, 500);
  }
});

server.listen(port, "127.0.0.1", () => {
  const url = `http://127.0.0.1:${port}/`;
  writeFileSync(join(root, "portfolio-admin-url.txt"), url, "utf8");
  console.log(`Portfolio admin is running at ${url}`);
});
