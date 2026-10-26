---
name: yt-collector
description: YouTube 影片收集與自動發布技能。當使用者貼上 YouTube 影片網址（如 youtu.be 或 youtube.com）或要求收錄影片到 yt.tonny.tw 時觸發，自動擷取影片縮圖與資訊、更新 Hacker News 風格靜態網站，並自動 Commit & Push 觸發 Cloudflare Pages 部署。具備重複影片智慧偵測與防呆機制。
---

# YouTube 影片收集與自動發布 (yt-collector Skill)

此技能專門用於將 YouTube 影片快速收錄並發布至 `yt.tonny.tw`（以經典 Hacker News 風格呈現的 Cloudflare Pages 靜態網站）。

## 觸發條件
- 使用者提供 YouTube 網址（例如 `https://youtu.be/...`、`https://www.youtube.com/watch?v=...`、`https://www.youtube.com/shorts/...`）。
- 使用者要求「收錄這支影片」、「發布到 yt.tonny.tw」、「加到影片清單」等。

## 執行流程 SOP

### 第一步：定位專案目錄
專案預設工作目錄為：`/Users/tonny/agy/yt.tonny.tw`。
確保在此目錄下操作。

### 第二步：執行收錄腳本
執行腳本將影片自動解析、抓取 oEmbed 標題與縮圖，並加入 `data/videos.json`：
```bash
node scripts/add-video.js "<YOUTUBE_URL>"
```

#### 分支 A：若影片已存在（Exit Code 2 或輸出含 `[ALREADY_EXISTS]`）
1. **停止後續流程**：**切勿**執行 `git add`、`git commit` 或 `git push`（避免無效 commit 或引發 git error）。
2. **回報使用者**：
   - 友善告知：「這部影片先前已經收錄過囉！」
   - 列出當初收錄的時間、影片標題、頻道作者與縮圖。
   - 提供線上站台 [yt.tonny.tw](https://yt.tonny.tw) 連結，並提示使用者若需要強制更新資訊可使用 `--force`。

#### 分支 B：若為新影片成功加入（Exit Code 0）
執行第三步與第四步。

### 第三步：提交並推送至 GitHub
將變更提交並推送到遠端儲存庫，觸發 GitHub Actions 與 Cloudflare Pages 自動部署：
```bash
git add data/videos.json
git commit -m "feat(video): add <影片標題>"
git push
```
（若本地有新增其他調整，可一併提交）。

### 第四步：回報收錄結果
向使用者回報：
1. **影片標題**與**頻道作者**
2. **影片縮圖預覽**
3. **發布狀態與網址**：說明已 Push 到 GitHub，並已觸發 Actions 部署至 [yt.tonny.tw](https://yt.tonny.tw)。
