# Jellyfin/Emby 显示剧照

Tampermonkey 油猴脚本，在 Jellyfin/Emby 媒体服务器详情页底部显示剧照（Backdrop）图片，支持点击缩放和左右切换浏览。

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

- 点击缩略图 → 打开大图浏览
- `←` `→` 键 / 滚轮 / 左右按钮 → 切换图片
- `ESC` 或点击遮罩 → 关闭大图
- 脚本菜单（Tampermonkey 图标）→ 切换"从第1张/第2张开始"

## 致谢

本脚本基于 [Squirtle](https://greasyfork.org/zh-CN/scripts/489553) 原作（由 WorkBuddy 适配）修改而来，遵循 [MIT 协议](LICENSE)。

## 许可证

MIT
