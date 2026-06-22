# 刘昌盛个人交互式网页作品集

面向 AI 产品体验、交互设计、服务设计、品牌体验与工业设计方向的个人数字作品集。

## 技术栈

- Next.js 15
- TypeScript
- Tailwind CSS
- Framer Motion
- GSAP
- Lenis Smooth Scroll

## 本地运行

```bash
pnpm install
pnpm dev
```

访问 `http://localhost:3000`。

## 生产构建

```bash
pnpm build
```

网站将静态导出到 `out/`。

## GitHub Pages 部署

推送到 `main` 分支后，`.github/workflows/deploy.yml` 会自动安装依赖、构建并发布网站。

首次部署需要在仓库的 `Settings → Pages → Build and deployment` 中将 Source 设置为 `GitHub Actions`。
