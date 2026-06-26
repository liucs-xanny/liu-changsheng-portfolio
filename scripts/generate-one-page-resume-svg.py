from pathlib import Path
from base64 import b64encode
from PIL import Image
from io import BytesIO
import html


ROOT = Path.cwd()
OUT_DIR = ROOT / "output" / "design"
OUT_DIR.mkdir(parents=True, exist_ok=True)
SVG_PATH = OUT_DIR / "liu-changsheng-one-page-resume-editable.svg"


def esc(value: str) -> str:
    return html.escape(value, quote=True)


def image_data_uri(path: Path) -> str:
    image = Image.open(path).convert("RGB")
    image.thumbnail((900, 1100))
    buffer = BytesIO()
    image.save(buffer, format="PNG", optimize=True)
    return "data:image/png;base64," + b64encode(buffer.getvalue()).decode("ascii")


photo = ROOT / "public" / "images" / "cover" / "portrait-reading.webp"
photo_uri = image_data_uri(photo) if photo.exists() else ""

W, H = 1080, 1528
paper_x, paper_y = 150, 155
paper_w, paper_h = 780, 1190
blue = "#1262D6"
ink = "#111111"
muted = "#5A5A5A"
paper = "#F8F7F3"


def text(x, y, content, size=20, fill=ink, weight=400, extra=""):
    return f'<text x="{x}" y="{y}" font-size="{size}" font-weight="{weight}" fill="{fill}" {extra}>{esc(content)}</text>'


def multiline(x, y, lines, size=17, leading=27, fill=muted, weight=400, extra=""):
    parts = [f'<text x="{x}" y="{y}" font-size="{size}" font-weight="{weight}" fill="{fill}" {extra}>']
    for i, line in enumerate(lines):
        dy = 0 if i == 0 else leading
        parts.append(f'<tspan x="{x}" dy="{dy}">{esc(line)}</tspan>')
    parts.append("</text>")
    return "\n".join(parts)


def section(x, y, en, cn):
    return f"""
    <g id="section-{esc(en)}">
      <circle cx="{x + 12}" cy="{y - 6}" r="10" fill="none" stroke="{blue}" stroke-width="2"/>
      <line x1="{x + 32}" y1="{y + 6}" x2="{x + 330}" y2="{y + 6}" stroke="{blue}" stroke-width="2"/>
      {text(x + 34, y, en, 30, blue, 500, 'letter-spacing="1"')}
      {text(x + 600, y - 2, cn, 15, ink, 400)}
    </g>
    """


svg = f"""<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">
  <defs>
    <style>
      text {{
        font-family: "Microsoft YaHei", "SimHei", "Noto Sans CJK SC", Arial, sans-serif;
        dominant-baseline: alphabetic;
      }}
      .tiny {{ letter-spacing: 1.2px; }}
      .spaced {{ letter-spacing: 2.5px; }}
    </style>
    <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="24" stdDeviation="28" flood-color="#000000" flood-opacity="0.28"/>
    </filter>
  </defs>

  <g id="background">
    <rect width="{W}" height="{H}" fill="#070707"/>
    <path d="M0 1050 C220 920 370 1050 520 900 C690 730 800 760 1080 640 L1080 1528 L0 1528 Z" fill="#2b2b2b" opacity="0.55"/>
    <path d="M650 0 C810 100 890 170 1080 165 L1080 0 Z" fill="#222" opacity="0.65"/>
    {text(28, 38, "ALWAYS", 15, "#F8F7F3", 400, 'class="tiny"')}
    {text(28, 56, "DESIGN", 15, "#F8F7F3", 400, 'class="tiny"')}
    {text(1012, 38, "ALWAYS", 15, "#F8F7F3", 400, 'text-anchor="end" class="tiny"')}
    {text(1012, 56, "HAPPY", 15, "#F8F7F3", 400, 'text-anchor="end" class="tiny"')}
  </g>

  <g id="paper" filter="url(#softShadow)">
    <rect x="{paper_x}" y="{paper_y}" width="{paper_w}" height="{paper_h}" fill="{paper}"/>
  </g>

  <g id="left-identity">
    {text(200, 245, "AI Product", 62, blue, 500, 'letter-spacing="-1.5"')}
    {text(200, 310, "Experience", 62, blue, 500, 'letter-spacing="-1.5"')}
    {text(200, 375, "Designer", 62, blue, 500, 'letter-spacing="-1.5"')}

    {text(200, 480, "刘昌盛", 38, blue, 700)}
    {text(310, 480, "Liu Changsheng", 21, blue, 400)}
    {text(200, 525, "广东工业大学｜工业设计工程 硕士", 17, ink, 400)}
    {text(200, 552, "AI产品体验设计 / 交互设计 / 智能产品设计", 16, ink, 400)}
    {text(200, 579, "广州｜18900691231｜858572182@qq.com", 15, ink, 400)}
    {text(200, 606, "liucs-xanny.github.io/liu-changsheng-portfolio", 14, blue, 400)}

    <g id="core-numbers">
      <text x="245" y="720" font-size="28" fill="{blue}" font-weight="600">6+</text>
      <text x="225" y="747" font-size="14" fill="{blue}">核心项目</text>
      <text x="360" y="720" font-size="28" fill="{blue}" font-weight="600">1</text>
      <text x="330" y="747" font-size="14" fill="{blue}">国家级一等奖</text>
      <text x="485" y="720" font-size="28" fill="{blue}" font-weight="600">3+</text>
      <text x="470" y="747" font-size="14" fill="{blue}">AI项目</text>
      <path d="M206 706 C206 680 235 676 248 690" fill="none" stroke="{blue}" stroke-width="2"/>
      <path d="M300 706 C300 680 270 676 258 690" fill="none" stroke="{blue}" stroke-width="2"/>
      <path d="M316 706 C316 680 344 676 356 690" fill="none" stroke="{blue}" stroke-width="2"/>
      <path d="M420 706 C420 680 390 676 368 690" fill="none" stroke="{blue}" stroke-width="2"/>
      <path d="M450 706 C450 680 478 676 490 690" fill="none" stroke="{blue}" stroke-width="2"/>
      <path d="M565 706 C565 680 535 676 505 690" fill="none" stroke="{blue}" stroke-width="2"/>
    </g>

    <path id="blue-arrow" d="M520 810 L210 970 M210 970 L230 968 M210 970 L218 950" fill="none" stroke="{blue}" stroke-width="2"/>

    <g id="portrait">
      <rect x="195" y="1060" width="300" height="300" fill="#EFEDE7"/>
      <image x="235" y="1072" width="220" height="278" preserveAspectRatio="xMidYMid meet" href="{photo_uri}"/>
    </g>
  </g>

  <g id="right-content">
    {section(540, 245, "About Me", "关于我")}
    {multiline(540, 292, [
        "广东工业大学工业设计工程硕士研究生，研究方向为人工智能与设计创新。",
        "具备工业设计、交互设计、用户研究、服务设计、品牌体验与AI应用的复合背景，",
        "能够参与从问题研究、产品定义、信息架构、交互流程、UI视觉到AI能力整合",
        "与技术协作的完整流程。"
      ], 16, 24, muted)}

    {section(540, 405, "Selected Projects", "核心项目")}
    <g id="projects">
      {text(540, 460, "原点向导·智绘美家｜数字人系统", 18, ink, 700)}
      {text(805, 460, "组长｜2026.04-05", 14, ink, 400)}
      {multiline(552, 485, ["规划原点新城专属数字人IP与多终端智能服务体验，整合豆包大模型、RAG知识库与", "LiveTalking框架，完成6个高保真界面；获中国好创意全国总决赛一等奖。"], 14, 22, muted)}

      {text(540, 545, "山音接力｜智能Agent交接系统", 18, ink, 700)}
      {text(805, 545, "组长｜2026.03-05", 14, ink, 400)}
      {multiline(552, 570, ["面向乡村支教教师高流动场景，完成8位教师深访、扎根理论编码、三阶段服务流程、", "Agent工作流与移动端高保真设计。"], 14, 22, muted)}

      {text(540, 630, "核电站金属构件损伤AI识别系统", 18, ink, 700)}
      {text(805, 630, "组长｜2026.02-至今", 14, ink, 400)}
      {multiline(552, 655, ["使用Blender节点与Python批量生成1000+损伤图及Mask标注，协作YOLO训练与结果", "可视化，相关方法拟形成发明专利。"], 14, 22, muted)}

      {text(540, 715, "乐后昌城 / 悦伴｜品牌与服务体验", 18, ink, 700)}
      {text(805, 715, "品牌/服务｜2025-26", 14, ink, 400)}
      {multiline(552, 740, ["完成韶关乐昌农文旅品牌、IP与AI音乐MV传播；参与母婴全周期服务设计，悦伴APP", "获软件著作权。"], 14, 22, muted)}
    </g>

    {section(540, 825, "Awards", "成果奖项")}
    {multiline(552, 872, [
      "· 第二十届中国好创意全国数字艺术设计大赛原点新城专项数字人赛道全国总决赛一等奖",
      "· “悦伴APP”计算机软件著作权；YOLO菌落识别Web系统软著提交审核中",
      "· 核电站金属构件损伤AI识别方法拟申请发明专利"
    ], 14, 25, muted)}

    {section(540, 1010, "Skills", "能力地图")}
    {multiline(540, 1060, [
      "AI Product / AI Agent / Digital Human / YOLO / RAG / AIGC / UX Research /",
      "Service Design / Brand Experience / Industrial Design",
      "Figma / Rhino / Creo / KeyShot / Blender / Python / Coze / Suno / Vidu /",
      "Midjourney / Photoshop / Illustrator"
    ], 14, 26, ink)}
  </g>

  <g id="footer">
    <line x1="200" y1="1305" x2="880" y2="1305" stroke="#D8D8D8" stroke-width="1"/>
    {text(200, 1334, "AI Product Experience Designer · Interaction Design · Service & Brand Experience", 12, muted)}
    {text(880, 1334, "One-page Resume / 2026", 12, muted, 400, 'text-anchor="end"')}
  </g>
</svg>
"""

SVG_PATH.write_text(svg, encoding="utf-8")
print(SVG_PATH)
