import { createServer } from "node:http";
import { createReadStream, existsSync, statSync, writeFileSync } from "node:fs";
import { extname, join, normalize } from "node:path";

const root = join(process.cwd(), "out");
const startPort = Number(process.env.PORT || 4173);
const basePath = (process.env.BASE_PATH || "/liu-changsheng-portfolio").replace(/\/+$/, "");
const urlFile = join(process.cwd(), "portfolio-local-url.txt");

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
  ".ico": "image/x-icon",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".pdf": "application/pdf",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

if (!existsSync(root)) {
  console.error("The out folder is missing. Build the website first.");
  process.exit(1);
}

function resolveFile(urlPath) {
  const pathname = decodeURIComponent(urlPath.split("?")[0]);
  const localPath =
    basePath && (pathname === basePath || pathname.startsWith(`${basePath}/`))
      ? pathname.slice(basePath.length) || "/"
      : pathname;
  const cleanPath = localPath.replace(/^\/+/, "");
  const safePath = normalize(cleanPath).replace(/^(\.\.(\\|\/|$))+/, "");
  let filePath = join(root, safePath);

  if (existsSync(filePath) && statSync(filePath).isDirectory()) {
    filePath = join(filePath, "index.html");
  } else if (!extname(filePath)) {
    const htmlPath = `${filePath}.html`;
    const indexPath = join(filePath, "index.html");
    if (existsSync(htmlPath)) filePath = htmlPath;
    else if (existsSync(indexPath)) filePath = indexPath;
  }

  return filePath;
}

const server = createServer((request, response) => {
  const filePath = resolveFile(request.url || "/");

  if (!existsSync(filePath) || !statSync(filePath).isFile()) {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Page not found");
    return;
  }

  const stat = statSync(filePath);
  const range = request.headers.range;
  const contentType =
    mimeTypes[extname(filePath).toLowerCase()] || "application/octet-stream";

  if (range && contentType.startsWith("video/")) {
    const [startText, endText] = range.replace(/bytes=/, "").split("-");
    const start = Number(startText);
    const end = endText ? Number(endText) : stat.size - 1;

    response.writeHead(206, {
      "Accept-Ranges": "bytes",
      "Content-Range": `bytes ${start}-${end}/${stat.size}`,
      "Content-Length": end - start + 1,
      "Content-Type": contentType,
    });
    createReadStream(filePath, { start, end }).pipe(response);
    return;
  }

  response.writeHead(200, {
    "Accept-Ranges": "bytes",
    "Content-Length": stat.size,
    "Content-Type": contentType,
  });
  createReadStream(filePath).pipe(response);
});

server.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    const nextPort = Number(server.currentPort || startPort) + 1;
    if (nextPort <= startPort + 10) {
      listen(nextPort);
      return;
    }
  }
  console.error(error);
  process.exit(1);
});

function listen(port) {
  server.currentPort = port;
  server.listen(port, "127.0.0.1", () => {
    const url = `http://127.0.0.1:${port}${basePath}/`;
    writeFileSync(urlFile, url, "utf8");
    console.log(`Portfolio is running at ${url}`);
    console.log("Run the stop shortcut to close the local server.");
  });
}

listen(startPort);
