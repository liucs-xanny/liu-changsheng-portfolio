import { createServer } from "node:http";
import { createReadStream, createWriteStream, existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { basename, extname, join, normalize, relative } from "node:path";
import { spawn, spawnSync } from "node:child_process";

const root = process.cwd();
const publicRoot = join(root, "public");
const projectsFile = join(root, "data", "projects.json");
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

function openPortfolioServer() {
  spawn("cmd", ["/c", `start "Portfolio Local Server" /min cmd /k ""${nodeExe}" "scripts\\preview-static.mjs""`], {
    cwd: root,
    detached: true,
    stdio: "ignore",
    windowsHide: true,
  }).unref();
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

function readProjects() {
  if (!existsSync(projectsFile)) return [];
  return JSON.parse(readFileSync(projectsFile, "utf8"));
}

function writeProjects(projects) {
  mkdirSync(join(root, "data"), { recursive: true });
  writeFileSync(projectsFile, JSON.stringify(projects, null, 2), "utf8");
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
      });
      return;
    }

    if (request.method === "GET" && url.pathname === "/api/projects") {
      json(response, { projects: readProjects() });
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/project") {
      const body = JSON.parse((await readBody(request)).toString("utf8") || "{}");
      const incoming = normalizeProject(body.project || {});
      if (!incoming.slug) return json(response, { error: "项目 slug 不能为空。" }, 400);

      const projects = readProjects();
      const index = projects.findIndex((project) => project.slug === incoming.slug);
      if (index < 0) return json(response, { error: "没有找到这个项目。" }, 404);

      projects[index] = incoming;
      writeProjects(projects);
      json(response, { project: incoming, projects });
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/project/new") {
      const body = JSON.parse((await readBody(request)).toString("utf8") || "{}");
      const slug = String(body.slug || "")
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
        summary: "一句话说明这个项目。",
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
      const projects = readProjects();
      const project = projects.find((item) => item.slug === slug);
      if (!project) return json(response, { error: "没有找到这个项目。" }, 404);

      const folder = publicFolderForUpload(slug, target);
      const targetFolder = safePublicPath(folder);
      mkdirSync(targetFolder, { recursive: true });
      const originalName = decodeURIComponent(request.headers["x-file-name"] || "asset.bin");
      const fileName = slugifyFileName(originalName);
      const targetPath = join(targetFolder, fileName);
      writeFileSync(targetPath, await readBody(request));
      const publicPath = `/${relative(publicRoot, targetPath).replace(/\\/g, "/")}`;

      if (target === "cover") {
        project.cover = publicPath;
      } else if (target === "gallery") {
        project.gallery = Array.isArray(project.gallery) ? project.gallery : [];
        project.gallery.push({ src: publicPath, title: "", description: "", format: "landscape" });
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
        openPortfolioServer();
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
