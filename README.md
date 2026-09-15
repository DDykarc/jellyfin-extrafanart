# Jellyfin/Emby 显示剧照

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
![Jellyfin](https://img.shields.io/badge/Jellyfin-10.11.x-00A4DC?logo=jellyfin&logoColor=white)
![Tampermonkey](https://img.shields.io/badge/Tampermonkey-userscript-00485B?logo=tampermonkey&logoColor=white)

Tampermonkey 油猴脚本，在 Jellyfin/Emby 媒体服务器详情页底部显示剧照（Backdrop）图片，支持点击缩放和左右切换浏览。

## 效果

> 详情页底部展示全部剧照缩略图，点击任意一张进入大图浏览。

<!-- 建议在此处插入一张截图或 GIF：详情页剧照列表 + 大图浏览 -->
<!-- ![效果预览](images/preview.gif) -->

## 功能

- 详情页自动加载并展示所有 Backdrop 剧照
- 点击缩略图放大查看，支持左右键/滚轮/按钮切换
- 脚本菜单可跳过前 1-2 张封面图（从第 1 张或第 2 张开始显示）
- 适配 Jellyfin 10.11.x，三级降级兼容旧版

## 安装

1. 安装 [Tampermonkey](https://www.tampermonkey.net/) 浏览器扩展
2. 点击 [直接安装脚本](jellyfin-extrafanart.user.js)（或复制 `.user.js` 文件内容手动创建新脚本）
3. 访问你的 Jellyfin/Emby 详情页即可看到剧照

## 使用

| 操作 | 效果 |
|------|------|
| 点击缩略图 | 打开大图浏览 |
| `←` `→` 键 / 滚轮 / 左右按钮 | 切换图片 |
| `ESC` 或点击遮罩 | 关闭大图 |
| 脚本菜单（Tampermonkey 图标） | 切换"从第 1 张/第 2 张开始" |

## 兼容性

| 服务端 | 状态 |
|--------|------|
| Jellyfin 10.11.x | ✅ 完整支持 |
| Jellyfin 旧版本 | ✅ 三级降级兼容 |
| Emby | ✅ 支持 |

## 常见问题

**Q：详情页没有显示剧照？**
A：确认该媒体条目在服务端确实有 Backdrop 图片；若只有海报（Poster）则不会有剧照。

**Q：想从第 2 张开始显示？**
A：点击浏览器工具栏的 Tampermonkey 图标 → 在脚本菜单中切换开始位置。

## 致谢

本脚本基于 **Squirtle** 的原作修改而来：

- 原作地址：<https://greasyfork.org/zh-CN/scripts/489553>
- 原脚本名：Jellyfin/Emby 显示剧照
- 由 WorkBuddy 适配

感谢原作者的开源分享。

## 许可证

[MIT](LICENSE) © 2026 DDykarc
