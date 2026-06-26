from pathlib import Path
import math

from PIL import Image
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.utils import ImageReader
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas


ROOT = Path.cwd()
OUT_DIR = ROOT / "output" / "pdf"
OUT_DIR.mkdir(parents=True, exist_ok=True)
PDF_PATH = OUT_DIR / "liu-changsheng-one-page-resume.pdf"

FONT_PATH = r"C:\Windows\Fonts\simhei.ttf"
pdfmetrics.registerFont(TTFont("ResumeCN", FONT_PATH))
pdfmetrics.registerFont(TTFont("ResumeCN-Bold", FONT_PATH))

W, H = A4
BLUE = colors.HexColor("#1262D6")
INK = colors.HexColor("#111111")
MUTED = colors.HexColor("#555555")
LIGHT = colors.HexColor("#F7F5F0")
LINE = colors.HexColor("#D7D7D7")

c = canvas.Canvas(str(PDF_PATH), pagesize=A4)
c.setTitle("刘昌盛 - AI Product Experience Designer - 一页纸简历")
c.setFillColor(colors.white)
c.rect(0, 0, W, H, fill=1, stroke=0)

LEFT_X = 46
RIGHT_X = 286
RIGHT_W = W - RIGHT_X - 46


def font_name(bold=False):
    return "ResumeCN-Bold" if bold else "ResumeCN"


def setfont(size, color=INK, bold=False):
    c.setFont(font_name(bold), size)
    c.setFillColor(color)


def text(x, y, s, size=8, color=INK, bold=False):
    setfont(size, color, bold)
    c.drawString(x, y, s)


def fit_text(x, y, s, max_w, size=8, color=INK, bold=False):
    setfont(size, color, bold)
    while c.stringWidth(s, font_name(bold), size) > max_w and len(s) > 4:
        s = s[:-2]
    c.drawString(x, y, s)


def wrap(s, max_w, size=8, bold=False):
    lines, cur = [], ""
    for ch in s:
        trial = cur + ch
        if c.stringWidth(trial, font_name(bold), size) <= max_w:
            cur = trial
        else:
            if cur:
                lines.append(cur)
            cur = ch
    if cur:
        lines.append(cur)
    return lines


def paragraph(x, y, s, max_w, size=7.4, leading=11, color=MUTED, bold=False, max_lines=None):
    lines = wrap(s, max_w, size, bold)
    if max_lines:
        lines = lines[:max_lines]
    setfont(size, color, bold)
    for line in lines:
        c.drawString(x, y, line)
        y -= leading
    return y


def section(x, y, en, cn):
    c.setStrokeColor(BLUE)
    c.setLineWidth(0.8)
    c.circle(x + 6, y + 3, 5, stroke=1, fill=0)
    for i in range(8):
        angle = math.pi * 2 * i / 8
        c.line(
            x + 6 + math.cos(angle) * 7,
            y + 3 + math.sin(angle) * 7,
            x + 6 + math.cos(angle) * 9,
            y + 3 + math.sin(angle) * 9,
        )
    text(x + 20, y, en, 18, BLUE, True)
    text(x + RIGHT_W - 30, y + 2, cn, 7.5, INK)
    c.line(x + 20, y - 5, x + RIGHT_W, y - 5)
    return y - 22


def bullet(x, y, s, max_w, size=7.2, leading=10.5):
    setfont(size, MUTED)
    c.drawString(x, y, "·")
    return paragraph(x + 8, y, s, max_w - 8, size, leading, MUTED)


text(28, H - 34, "ALWAYS", 6.5, INK)
text(28, H - 42, "DESIGN", 6.5, INK)
text(W - 82, H - 34, "PORTFOLIO", 6.5, INK)
text(W - 82, H - 42, "2026", 6.5, INK)

text(LEFT_X, H - 92, "AI Product", 35, BLUE, True)
text(LEFT_X, H - 132, "Experience", 35, BLUE, True)
text(LEFT_X, H - 172, "Designer", 35, BLUE, True)

text(LEFT_X, H - 225, "刘昌盛", 20, BLUE, True)
text(LEFT_X + 78, H - 222, "Liu Changsheng", 11, BLUE)
text(LEFT_X, H - 250, "广东工业大学｜工业设计工程 硕士", 8.2, INK)
text(LEFT_X, H - 265, "AI产品体验设计 / 交互设计 / 智能产品设计", 7.6, INK)
text(LEFT_X, H - 280, "广州｜18900691231｜858572182@qq.com", 7.4, INK)
text(LEFT_X, H - 295, "liucs-xanny.github.io/liu-changsheng-portfolio", 7.1, BLUE)

num_y = H - 350
for dx, top, bottom in [(0, "6+", "核心项目"), (75, "1", "国家级一等奖"), (145, "3+", "AI项目")]:
    c.setStrokeColor(BLUE)
    c.arc(LEFT_X + dx - 5, num_y - 3, LEFT_X + dx + 16, num_y + 18, 90, 180)
    c.arc(LEFT_X + dx + 52, num_y - 3, LEFT_X + dx + 73, num_y + 18, -90, 180)
    text(LEFT_X + dx + 18, num_y + 8, top, 13, BLUE, True)
    text(LEFT_X + dx + 7, num_y - 8, bottom, 6.7, BLUE)

c.setStrokeColor(BLUE)
c.line(LEFT_X + 6, H - 478, LEFT_X + 185, H - 385)
c.line(LEFT_X + 6, H - 478, LEFT_X + 15, H - 476)
c.line(LEFT_X + 6, H - 478, LEFT_X + 9, H - 468)

photo = ROOT / "public" / "images" / "cover" / "portrait-reading.webp"
if photo.exists():
    img = Image.open(photo).convert("RGB")
    box_w, box_h = 170, 205
    x0, y0 = LEFT_X, 72
    c.setFillColor(LIGHT)
    c.rect(x0 - 5, y0 - 5, box_w + 10, box_h + 10, fill=1, stroke=0)
    c.drawImage(ImageReader(img), x0, y0, width=box_w, height=box_h, preserveAspectRatio=True, anchor="c")

ry = H - 96
ry = section(RIGHT_X, ry, "About Me", "关于我")
ry = paragraph(
    RIGHT_X,
    ry,
    "广东工业大学工业设计工程硕士研究生，研究方向为人工智能与设计创新。具备工业设计、交互设计、用户研究、服务设计、品牌体验与AI应用的复合背景，能够参与从问题研究、产品定义、信息架构、交互流程、UI视觉到AI能力整合与技术协作的完整流程。",
    RIGHT_W,
    7.4,
    11.2,
    MUTED,
    max_lines=5,
) - 8

ry = section(RIGHT_X, ry, "Selected Projects", "核心项目")
projects = [
    (
        "原点向导·智绘美家｜数字人系统",
        "组长｜2026.04-05",
        "规划原点新城专属数字人IP与多终端智能服务体验，整合豆包大模型、RAG知识库与LiveTalking框架，完成6个高保真界面；获中国好创意全国总决赛一等奖。",
    ),
    (
        "山音接力｜智能Agent交接系统",
        "组长｜2026.03-05",
        "面向乡村支教教师高流动场景，完成8位教师深访、扎根理论编码、三阶段服务流程、Agent工作流与移动端高保真设计。",
    ),
    (
        "核电站金属构件损伤AI识别系统",
        "组长｜2026.02-至今",
        "使用Blender节点与Python批量生成1000+损伤图及Mask标注，协作YOLO训练与结果可视化，相关方法拟形成发明专利。",
    ),
    (
        "乐后昌城 / 悦伴｜品牌与服务体验",
        "品牌/服务｜2025-26",
        "完成韶关乐昌农文旅品牌、IP与AI音乐MV传播；参与母婴全周期服务设计，悦伴APP获软件著作权。",
    ),
]

for title, meta, desc in projects:
    text(RIGHT_X, ry, title, 8.2, INK, True)
    fit_text(RIGHT_X + 188, ry, meta, RIGHT_W - 188, 6.6, INK)
    ry -= 11
    ry = bullet(RIGHT_X, ry, desc, RIGHT_W, 6.7, 9.2) - 3

ry = section(RIGHT_X, ry, "Awards", "成果奖项")
for item in [
    "第二十届中国好创意全国数字艺术设计大赛原点新城专项数字人赛道全国总决赛一等奖",
    "“悦伴APP”计算机软件著作权；YOLO菌落识别Web系统软著提交审核中",
    "核电站金属构件损伤AI识别方法拟申请发明专利",
]:
    ry = bullet(RIGHT_X, ry, item, RIGHT_W, 6.9, 9.5)

ry -= 6
ry = section(RIGHT_X, ry, "Skills", "能力地图")
ry = paragraph(
    RIGHT_X,
    ry,
    "AI Product / AI Agent / Digital Human / YOLO / RAG / AIGC / UX Research / Service Design / Brand Experience / Industrial Design",
    RIGHT_W,
    7.0,
    10.2,
    INK,
    max_lines=2,
)
paragraph(
    RIGHT_X,
    ry - 2,
    "Figma / Rhino / Creo / KeyShot / Blender / Python / Coze / Suno / Vidu / Midjourney / Photoshop / Illustrator",
    RIGHT_W,
    6.8,
    9.8,
    MUTED,
    max_lines=2,
)

c.setStrokeColor(LINE)
c.line(46, 42, W - 46, 42)
text(46, 28, "AI Product Experience Designer · Interaction Design · Service & Brand Experience", 6.4, MUTED)
text(W - 138, 28, "One-page Resume / 2026", 6.4, MUTED)

c.showPage()
c.save()
print(PDF_PATH)
