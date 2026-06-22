import { createServer } from "node:http";
import { createReadStream, existsSync, statSync } from "node:fs";
import { extname, join, normalize } from "node:path";

const root = join(process.cwd(), "out");
const port = Number(process.env.PORT || 4173);

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
  const cleanPath = decodeURIComponent(urlPath.split("?")[0]).replace(/^\/+/, "");
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
    console.log(`Portfolio is already running at http://localhost:${port}`);
    process.exit(0);
  }
  console.error(error);
  process.exit(1);
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Portfolio is running at http://localhost:${port}`);
  console.log("Run the stop shortcut to close the local server.");
});
