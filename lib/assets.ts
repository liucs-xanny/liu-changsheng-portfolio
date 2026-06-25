export function assetPath(path: string) {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

  if (!path) return path;
  if (/^(https?:)?\/\//.test(path) || path.startsWith("data:") || path.startsWith("blob:")) {
    return path;
  }
  if (!path.startsWith("/")) return path;
  if (basePath && path.startsWith(`${basePath}/`)) return path;

  return `${basePath}${path}`;
}
