import { createServer } from "node:http";
import { closeSync, createReadStream, existsSync, mkdirSync, openSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { basename, extname, join, normalize, relative } from "node:path";
import { spawn, spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { readProfile, saveProfile } from "./profile-store.mjs";
import { createPublisher } from "./publish-job.mjs";

const root = process.cwd();
const publicRoot = join(root, "public");
const projectsFile = join(root, "data", "projects.json");
const studiesFile = join(root, "data", "studies.json");
const port = Number(process.env.ADMIN_PORT || 4188);
const nodeExe = process.execPath;
const publisher = createPublisher(root, nodeExe);

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".mp4": "video/mp4",
  ".pdf": "application/pdf",
};

function json(response, data, status = 200) {
  response.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
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
    timeout,
  });

  return {
    ok: result.status === 0,
    status: result.status,
    output: `${result.stdout || ""}${result.stderr || ""}`.trim(),
  };
}

function startDetached(command, args, stdoutFile, stderrFile) {
  const out = openSync(join(root, stdoutFile), "a");
  const err = openSync(join(root, stderrFile), "a");
  try {
    const child = spawn(command, args, {
      cwd: root, detached: true, stdio: ["ignore", out, err], windowsHide: true,
    });
    child.on("error", (error) => writeFileSync(join(root, stderrFile), `${error.message}\n`, { flag: "a" }));
    child.unref();
  } finally { closeSync(out); closeSync(err); }
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function waitForPortfolioUrl(timeout = 6000) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    const url = portfolioUrl();
    if (url) return url;
    await sleep(250);
  }
  return portfolioUrl();
}

function openUrl(url) {
  spawn("cmd", ["/c", "start", "", url], {
    cwd: root,
    detached: true,
    stdio: "ignore",
    windowsHide: true,
  }).unref();
}

async function openPortfolioServer() {
  const existing = portfolioUrl();
  if (/^http:\/\/127\.0\.0\.1:(417[3-9]|418[0-3])\//.test(existing)) {
    try {
      const response = await fetch(existing, { signal: AbortSignal.timeout(1500) });
      if (response.ok) return;
    } catch { /* A saved address may refer to a stopped preview. */ }
  }
  const urlPath = join(root, "portfolio-local-url.txt");
  if (existsSync(urlPath)) rmSync(urlPath, { force: true });
  startDetached(nodeExe, ["scripts/preview-static.mjs"], "portfolio-local.log", "portfolio-local-error.log");
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
  if (!result.ok) return result.output || "暂时无法读取本地保存状态。";
  const counts = run("git", ["--git-dir=.repo", "--work-tree=.", "rev-list", "--left-right", "--count", "HEAD...origin/main"], 10000);
  const [ahead, behind] = counts.ok ? counts.output.split(/\s+/).map(Number) : [null, null];
  const saved = result.output ? `有尚未保存到提交的修改：\n${result.output}` : "本地内容已保存。";
  if (ahead > 0) return `${saved}\n还有 ${ahead} 次提交未确认上传到 GitHub。${behind > 0 ? `线上另有 ${behind} 次修改需要同步。` : ""}`;
  if (behind > 0) return `${saved}\nGitHub 有 ${behind} 次修改尚未同步到本地。`;
  return `${saved}\n与最近核对的 GitHub 提交一致；网站是否更新请看下方发布状态。`;
}

function readProjects() {
  if (!existsSync(projectsFile)) return [];
  return JSON.parse(readFileSync(projectsFile, "utf8"));
}

function writeProjects(projects) {
  mkdirSync(join(root, "data"), { recursive: true });
  writeFileSync(projectsFile, JSON.stringify(projects, null, 2), "utf8");
}

function readStudies() {
  return existsSync(studiesFile) ? JSON.parse(readFileSync(studiesFile, "utf8")) : [];
}

function writeStudies(items) {
  mkdirSync(join(root, "data"), { recursive: true });
  writeFileSync(studiesFile, `${JSON.stringify(items, null, 2)}\n`, "utf8");
}

function normalizeList(value) {
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
  return String(value || "")
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeProject(project) {
  return {
    hidden: Boolean(project.hidden),
    slug: String(project.slug || "").trim().toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-"),
    index: String(project.index || ""),
    title: String(project.title || "Untitled Project"),
    english: String(project.english || ""),
    summary: String(project.summary || ""),
    role: String(project.role || ""),
    time: String(project.time || ""),
    tags: normalizeList(project.tags),
    cover: String(project.cover || ""),
    accent: String(project.accent || "#356FE8"),
    overview: String(project.overview || ""),
    problem: String(project.problem || ""),
    research: normalizeList(project.research),
    strategy: normalizeList(project.strategy),
    workflow: normalizeList(project.workflow),
    outputs: normalizeList(project.outputs),
    result: String(project.result || ""),
    reflection: String(project.reflection || ""),
    gallery: Array.isArray(project.gallery) ? project.gallery : [],
    mediaSections: Array.isArray(project.mediaSections) ? project.mediaSections : undefined,
    videos: Array.isArray(project.videos) ? project.videos : undefined,
    video: project.video ? String(project.video) : undefined,
    document: project.document?.src ? project.document : undefined,
  };
}

function publicFolderForUpload(slug, target) {
  if (target === "video") return "media";
  if (target === "document") return "docs/projects";
  return `images/projects/${slug}/selected`;
}

function adminHtml() {
  return readFileSync(join(root, "scripts", "admin-ui.html"), "utf8");
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

    if (request.method === "GET" && url.pathname === "/profile-editor.js") {
      response.writeHead(200, { "Content-Type": "text/javascript; charset=utf-8", "Cache-Control": "no-store" });
      response.end(readFileSync(join(root, "scripts/profile-editor.js"), "utf8"));
      return;
    }

    if (
      request.method === "GET" &&
      (url.pathname.startsWith("/images/") || url.pathname.startsWith("/media/") || url.pathname.startsWith("/docs/"))
    ) {
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
        publish: publisher.snapshot(),
      });
      return;
    }

    if (request.method === "GET" && url.pathname === "/api/publish-status") {
      json(response, publisher.snapshot());
      return;
    }

    if (request.method === "GET" && url.pathname === "/api/projects") {
      json(response, { projects: readProjects() });
      return;
    }

    if (request.method === "GET" && url.pathname === "/api/profile") {
      json(response, { profile: readProfile(root) });
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/profile") {
      const body = JSON.parse((await readBody(request)).toString("utf8") || "{}");
      try { json(response, { profile: saveProfile(root, body.profile) }); }
      catch (error) { json(response, { error: error.message }, 400); }
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/profile-upload") {
      const target = url.searchParams.get("target");
      if (!["resume", "formal", "practice"].includes(target)) return json(response, { error: "请选择要替换的照片或简历。" }, 400);
      const fileName = decodeURIComponent(request.headers["x-file-name"] || "");
      const extension = extname(fileName).toLowerCase();
      const allowed = target === "resume" ? [".pdf"] : [".png", ".jpg", ".jpeg", ".webp", ".avif"];
      if (!allowed.includes(extension)) return json(response, { error: target === "resume" ? "请选择 PDF 简历。" : "请选择 PNG、JPG、WebP 或 AVIF 照片。" }, 400);
      if (Number(request.headers["content-length"] || 0) > 25 * 1024 * 1024) return json(response, { error: "文件请控制在 25 MB 以内。" }, 413);
      const buffer = await readBody(request);
      if (!buffer.length || buffer.length > 25 * 1024 * 1024) return json(response, { error: "文件为空或超过 25 MB。" }, 400);
      if (target === "resume" && buffer.subarray(0, 5).toString() !== "%PDF-") return json(response, { error: "文件内容不是有效的 PDF。" }, 400);
      const folder = target === "resume" ? "docs" : "images/cover";
      const publicPath = `/${folder}/${target}-${randomUUID().slice(0, 8)}${extension}`;
      mkdirSync(safePublicPath(folder), { recursive: true });
      writeFileSync(safePublicPath(publicPath), buffer);
      const profile = saveProfile(root, target === "resume" ? { resume: { src: publicPath } } : { portraits: { [target]: publicPath } });
      json(response, { profile });
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/project") {
      const body = JSON.parse((await readBody(request)).toString("utf8") || "{}");
      const projects = readProjects();
      const index = projects.findIndex((project) => project.slug === body.project?.slug);
      if (index < 0) return json(response, { error: "没有找到这个项目。" }, 404);
      const incoming = normalizeProject({ ...projects[index], ...body.project });
      if (!incoming.title.trim()) return json(response, { error: "请填写项目名称。" }, 400);

      projects[index] = incoming;
      writeProjects(projects);
      json(response, { project: incoming, projects });
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/project/new") {
      const body = JSON.parse((await readBody(request)).toString("utf8") || "{}");
      const slug = String(body.slug || `project-${randomUUID().slice(0, 8)}`)
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, "-")
        .replace(/-+/g, "-");
      if (!slug) return json(response, { error: "请输入英文项目 ID，例如 new-ai-project。" }, 400);

      const projects = readProjects();
      if (projects.some((project) => project.slug === slug)) {
        return json(response, { error: "这个项目 ID 已经存在。" }, 400);
      }

      const project = normalizeProject({
        hidden: true,
        slug,
        index: String(projects.length + 1).padStart(2, "0"),
        title: body.title || "新项目",
        english: body.english || "",
        summary: "",
        role: "",
        time: "",
        tags: [],
        cover: "",
        accent: "#356FE8",
        overview: "",
        problem: "",
        research: [],
        strategy: [],
        workflow: [],
        outputs: [],
        result: "",
        reflection: "",
        gallery: [],
      });

      projects.push(project);
      writeProjects(projects);
      mkdirSync(safePublicPath(`images/projects/${slug}/selected`), { recursive: true });
      json(response, { project, projects });
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/project/order") {
      const body = JSON.parse((await readBody(request)).toString("utf8") || "{}");
      const { slug, direction } = body;
      const projects = readProjects();
      const index = projects.findIndex((project) => project.slug === slug);
      const nextIndex = direction === "up" ? index - 1 : index + 1;
      if (index < 0 || nextIndex < 0 || nextIndex >= projects.length) {
        return json(response, { projects });
      }
      [projects[index], projects[nextIndex]] = [projects[nextIndex], projects[index]];
      writeProjects(projects);
      json(response, { projects });
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/project-upload") {
      const slug = String(url.searchParams.get("slug") || "");
      const target = String(url.searchParams.get("target") || "gallery");
      if (Number(request.headers["content-length"] || 0) > 95 * 1024 * 1024) {
        return json(response, {error:"文件过大，GitHub 无法发布。请先将视频或 PDF 压缩到 95 MiB 以下再上传。原文件可以保留在本机。"}, 413);
      }
      const projects = readProjects();
      const project = projects.find((item) => item.slug === slug);
      if (!project) return json(response, { error: "没有找到这个项目。" }, 404);
      const galleryIndex = url.searchParams.has("index") ? Number(url.searchParams.get("index")) : null;
      if (galleryIndex !== null && (target !== "gallery" || !Number.isInteger(galleryIndex) || !project.gallery?.[galleryIndex])) {
        return json(response, { error: "没有找到要替换的展示图。" }, 400);
      }

      const folder = publicFolderForUpload(slug, target);
      const targetFolder = safePublicPath(folder);
      mkdirSync(targetFolder, { recursive: true });
      const originalName = decodeURIComponent(request.headers["x-file-name"] || "asset.bin");
      const fileName = `${randomUUID().slice(0, 8)}-${slugifyFileName(originalName)}`;
      const targetPath = join(targetFolder, fileName);
      writeFileSync(targetPath, await readBody(request));
      const publicPath = `/${relative(publicRoot, targetPath).replace(/\\/g, "/")}`;

      if (target === "cover") {
        project.cover = publicPath;
      } else if (target === "gallery") {
        project.gallery = Array.isArray(project.gallery) ? project.gallery : [];
        if (galleryIndex !== null) {
          const previous = project.gallery[galleryIndex];
          project.gallery[galleryIndex] = { ...(typeof previous === "string" ? {} : previous), src: publicPath };
        } else {
          const format = ["portrait", "square", "landscape"].includes(url.searchParams.get("format")) ? url.searchParams.get("format") : "landscape";
          project.gallery.push({ src: publicPath, title: "", description: "", format });
        }
      } else if (target === "video") {
        project.videos = Array.isArray(project.videos) ? project.videos : [];
        project.videos.push({ src: publicPath, title: "项目视频", description: "" });
      } else if (target === "document") {
        project.document = { src: publicPath, label: "查看完整项目 PDF" };
      }

      writeProjects(projects);
      json(response, { path: publicPath, project, projects });
      return;
    }

    if (request.method === "GET" && url.pathname === "/api/studies") {
      json(response, { items: readStudies() });
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/studies") {
      const body = JSON.parse((await readBody(request)).toString("utf8") || "{}");
      if (!Array.isArray(body.items)) return json(response, { error: "作品列表格式不正确。" }, 400);
      const previous = readStudies();
      // Only edit known entries. Uploads create their own paths and identifiers.
      if (body.items.length !== previous.length || new Set(body.items.map((item) => item.id)).size !== previous.length) {
        return json(response, { error: "作品列表已更新，请刷新后重试。" }, 409);
      }
      const items = body.items.map((item) => {
        const stored = previous.find((entry) => entry.id === item.id);
        if (!stored) throw new Error("没有找到这张作品，请刷新后重试。");
        return { ...stored, title: String(item.title || "未命名作品").trim(), category: String(item.category || "日常练习").trim(), hidden: Boolean(item.hidden) };
      });
      writeStudies(items);
      json(response, { items });
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/study-upload") {
      const items = readStudies();
      const id = url.searchParams.get("id");
      const item = id ? items.find((entry) => entry.id === id) : null;
      if (id && !item) return json(response, { error: "没有找到这张作品。" }, 404);
      const originalName = decodeURIComponent(request.headers["x-file-name"] || "image.png");
      if (![".png", ".jpg", ".jpeg", ".webp", ".avif", ".gif"].includes(extname(originalName).toLowerCase())) {
        return json(response, { error: "请选择 PNG、JPG、WebP、AVIF 或 GIF 图片。" }, 400);
      }
      if (Number(request.headers["content-length"] || 0) > 25 * 1024 * 1024) return json(response, { error: "单张图片请控制在 25 MB 以内。" }, 413);
      const buffer = await readBody(request);
      if (!buffer.length || buffer.length > 25 * 1024 * 1024) return json(response, { error: "图片为空或超过 25 MB。" }, 400);
      const folder = safePublicPath("images/studies");
      mkdirSync(folder, { recursive: true });
      const fileName = `${randomUUID().slice(0, 8)}-${slugifyFileName(originalName)}`;
      writeFileSync(join(folder, fileName), buffer);
      const src = `/images/studies/${fileName}`;
      if (item) {
        item.src = src;
        item.thumbnail = src;
      } else {
        items.push({ id: randomUUID(), title: basename(originalName, extname(originalName)), category: "日常练习", src, thumbnail: src, hidden: false });
      }
      writeStudies(items);
      json(response, { items });
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

      if (action === "publish") {
        json(response, {ok:true, publish:publisher.start()}, 202);
        return;
      }
      if (action === "build" && publisher.snapshot().running) return json(response, {error:"正在发布，请等待本次完成后再重新生成。"}, 409);

      if (action === "preview") {
        await openPortfolioServer();
        const portfolio = await waitForPortfolioUrl();
        if (!portfolio) {
          result = { ok: false, output: "作品集本地服务器没有启动成功，请查看 portfolio-local-error.log。" };
        } else {
          openUrl(portfolio);
          result.output = `作品集已打开：${portfolio}`;
        }
      } else if (action === "close-preview") {
        result = run("powershell", ["-NoProfile", "-Command", "$connections = Get-NetTCPConnection -LocalPort (4173..4183) -State Listen -ErrorAction SilentlyContinue; if ($connections) { $connections | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }; 'Portfolio server stopped.' } else { 'Portfolio server is not running.' }; if (Test-Path 'portfolio-local-url.txt') { Remove-Item 'portfolio-local-url.txt' -Force }"], 20000);
      } else if (action === "build") {
        result = run(nodeExe, ["node_modules/next/dist/bin/next", "build"], 180000);
      } else if (action === "open-admin") {
        openUrl(`http://127.0.0.1:${port}/`);
        result.output = "后台已重新打开。";
      } else {
        json(response, { error: "Unknown action." }, 400);
        return;
      }

      writeFileSync(join(root, "portfolio-admin-last.log"), result.output || "", "utf8");
      json(response, result.ok ? result : { ...result, error: result.output || "Action failed." }, result.ok ? 200 : 500);
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
