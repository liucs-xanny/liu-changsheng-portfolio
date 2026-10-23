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

## 轻量编辑后台

双击本地的「作品集管理后台.cmd」。核心项目只需要编辑项目名称、起止时间、担任职位、项目介绍和标签，再添加封面、展示图、视频或 PDF。新项目自动生成英文地址，默认隐藏；原有的研究与策略等详细资料仍保留在数据文件中。

「视觉手记 · 日常作品」单独管理首页 VISUAL NOTES 画廊。支持多图上传、改标题与分类、替换图片、调整顺序和隐藏。前台支持分类、自动轮播、手动切换、触屏滑动以及点击放大和旋转；鼠标悬停、键盘操作或打开大图时暂停自动切换。

修改后按「保存修改 → 重新生成 → 打开作品集」检查，再用「上传 GitHub」更新线上版本。项目资料在 `data/projects.json`，日常作品在 `data/studies.json`；展示素材使用 `public/` 下的英文路径，兼容 GitHub Pages 仓库前缀。

「个人简历 · 介绍与获奖」管理 `data/profile.json`：自我介绍、职业定位、联系方式、教育语言、数据卡片、能力标签、获奖荣誉、科研专利及校园经历。经历可新增、排序、隐藏；职业定位与联系方式同步用于封面和联系区。可替换两张个人照片与下载简历 PDF。网页文案和下载文件分别维护，编辑网页不会自动改写 PDF。个人资料每次保存前自动备份到本地 `tmp/profile-backups/`。

## 发布状态

「上传 GitHub」在后台执行，页面会持续显示上传与部署进度，刷新页面后也能继续查看。本地没有待保存修改，不代表 GitHub 已收到提交。发布器会核对远端提交，再等待 GitHub Pages 的 `site-version.json` 与本次提交一致，确认后才显示「网站已更新」。若已上传但部署失败或未确认，会显示对应原因及 Actions 链接。

普通 GitHub 仓库不能接收超过 100 MiB 的文件。项目素材上传限制为 95 MiB；原始大视频请保留在本机，网站使用压缩后的播放版。本次原视频保存在已忽略的 `local-media-originals/`，未上传提交的恢复副本在本地 `backup/publish-original-f724680` 分支。
