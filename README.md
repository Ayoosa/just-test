# 阿蒙外卖评价系统

纯 HTML、CSS、JavaScript 的 GitHub Pages 项目，评论数据使用 Supabase 保存。

## 本地预览

直接用浏览器打开 `index.html` 即可查看界面。填写 Supabase 配置后，请通过本地静态服务器预览，例如 VS Code 的 Live Server。

## Supabase 配置

1. 新建一个 Supabase 项目，在 SQL Editor 中执行 [supabase.sql](supabase.sql)。
2. 在项目 **Settings → API** 找到 `Project URL` 和 `anon public key`。
3. 将两项填入 `config.js`。只能使用 anon public key，绝不能使用 `service_role` key。
4. 可在 Table Editor 的 `reviews` 表中确认提交的数据。

## GitHub Pages 部署

1. 将此目录内容推送到一个 GitHub 仓库根目录。
2. 打开仓库 **Settings → Pages**，Source 选择 **Deploy from a branch**。
3. 选择 `main` 分支和 `/ (root)`，保存后等待 GitHub 给出网站地址。

GitHub Pages 是静态托管，`config.js` 中的 anon key 会公开；本项目已通过 Supabase RLS 策略限制为只允许读和新增评价。
