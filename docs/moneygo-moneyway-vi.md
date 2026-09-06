# Money Go / Money Way 品牌 VI 规范

> 版本：VI 1.0  
> 日期：2026-09-01  
> 品牌架构：Money Way 是长期成长与财富工具矩阵，Money Go 是其中的工位陪伴与周期工资产品。

## 1. 命名建议

- 正式中文品牌：**前路 Money Way**。语义是长期方向、选择与人生路径。
- 产品中文名：**钱进 Money Go**。保留“钱”与“前进”双关，适合工资、愿望和正反馈。
- “前进”作为 Money Go 的行为口号，不与“钱进”同时作为商店名。
- “钱路”可作为内容栏目名，不建议替代 Money Way 的正式中文名。

## 2. 设计概念

共同母题是 **“向前的路径 + 可积累的节点”**。

- Money Go：金币节点沿曲线向右上方前进，代表“每一段时间都在到账”。
- Money Way：一条道路从起点通向右上方，代表“看见前路、保留选择”。
- 家族关系：相同的圆角方形、右上方箭头、圆形节点和 24 px 图标网格。
- 避免：不使用微信双气泡、聊天尾巴、微信文字或与微信 Logo 近似的负形。

## 3. Logo 结构

### 3.1 图形标

- 基准画板：512×512。
- 外轮廓：480×480，左上角坐标 16,16，圆角 108。
- 安全区：图形四周至少保留 Logo 宽度的 1/4。
- 最小尺寸：数字界面 16 px，印刷 8 mm。小于 24 px 时不显示内部小线或文字。
- 禁止拉伸、旋转、改变箭头方向、加外发光、使用渐变字体或在低对比背景直接使用。

### 3.2 组合标

- 横版：图形标 + 中文名 + 英文名，适用于顶部栏、官网和商店图。
- 竖版：图形标在上，中英文在下，适用于启动页、封面和二维码页。
- 英文书写固定为 `Money Go` / `Money Way`，不写成 `MoneyGo`、`MoneyGO` 或 `money go`。

## 4. 品牌色

| 品牌 | 主色 | 辅色 | 中性色 | 使用说明 |
|---|---|---|---|---|
| Money Go | `#07C160` Go Green | `#FFC300` Coin Gold | `#191919` | 绿色占 70%，黄色不超过 10% |
| Money Way | `#576B95` Way Indigo | `#10AEFF` Horizon Blue | `#191919` | 靛蓝表示理性路径，蓝色只做节点 |
| 公用 | `#FFFFFF` | `#F7F7F7` | `rgba(0,0,0,.9/.55/.3)` | 与 WeUI 层级一致 |

单色环境使用纯黑或纯白版；不用灰度相近的主色 Logo 覆盖在复杂图片上。

## 5. 字体

- 中文：PingFang SC / Noto Sans CJK SC / Microsoft YaHei。
- 英文：SF Pro Display / Helvetica Neue / Arial。
- 品牌字重：600；产品内容正文：400；数据：600–700。
- 不在运行时远程加载字体。

## 6. Icon 规范

- 基准网格：24×24；默认视觉边界 20×20。
- 线宽：2 px；端点与连接：round。
- 默认为单色 `currentColor`，只有品牌 Logo 和金币可使用多色。
- 选中态可使用面性填充，但外轮廓不变，避免布局抖动。
- 点击目标不小于 44×44 px，图标本身建议 20–24 px。
- 全套基础图标：Home、Income、Goal、Calendar、Weekend、Settings、Share、Privacy、Sound、Back、Close、More。

## 7. 插画与仓鼠 IP

- 仓鼠是 Money Go 的产品角色，不是 Money Way 母品牌 Logo。
- 将红色围巾 / 肚兜改为品牌绿，金币保留黄色；轮廓改为深色 `#5B3A29`。
- 表情优先表达状态：敲代码、午休、收工、愿望达成。
- 不使用仓鼠代替警告、权限或破坏性操作图标。

## 8. 文件结构

```text
brand-system-v1/
├── money-go/
│   ├── mark.svg
│   ├── logo-horizontal.svg
│   └── icon-{16,32,48,64,128,256,512}.png
├── money-way/
│   ├── mark.svg
│   ├── logo-horizontal.svg
│   └── icon-{16,32,48,64,128,256,512}.png
├── icons/
│   ├── *.svg
│   └── sprite.svg
├── brand-tokens.css
├── brand-board.svg
└── brand-board.png
```

Chrome 商店 Icon 从 Money Go `mark.svg` 导出 16 / 32 / 48 / 128 px PNG；小程序和官网优先使用 SVG 或从同一源文件导出。
