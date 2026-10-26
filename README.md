# yt.tonny.tw

Hacker News 風格的 YouTube 影片精選靜態網站，自動部署至 Cloudflare Pages (`https://yt.tonny.tw`)。

## 🌟 特色

- 經典 Hacker News (HN) 視覺風格（橙色頂欄、米白背景、排名、推文評分、精簡排版）。
- 每部影片具備緊湊清晰的預覽縮圖、原片連結與頻道來源。
- 支援「網頁內嵌播放（Embed Modal）」與「直達 YouTube」雙模式。
- 即時關鍵字搜尋與頻道過濾（免後端、即時響應）。
- 自動生成 RSS Feed (`/rss.xml`)。
- 零框架依賴，純靜態秒級構建，極速載入與 100/100 Lighthouse 評分。

## 🚀 快速新增影片

```bash
# 新增單一影片並自動重建（預設具備防呆機制：若已收錄則提示並略過，不重複發布）
node scripts/add-video.js "https://youtu.be/ddAnghj8HpE?si=3tgCla-1ddLO5zZB"

# 若需要強制更新已存在影片的標題或縮圖：
node scripts/add-video.js "https://youtu.be/ddAnghj8HpE" --force

# 手動重建靜態網站 (產出至 dist/)
npm run build
```

## ☁️ Cloudflare Pages 部署設定

### 方法一：GitHub Actions 自動部署 (已內建)
1. 在 Cloudflare Dashboard 建立一個名為 `yt-tonny-tw` 的 Pages 專案。
2. 取得 Cloudflare `Account ID` 與具備 Cloudflare Pages 權限的 `API Token`。
3. 在 GitHub Repo 的 Settings -> Secrets and variables -> Actions 新增兩個 Secrets：
   - `CLOUDFLARE_API_TOKEN`
   - `CLOUDFLARE_ACCOUNT_ID`
4. 每次 `git push main` 即會自動建置並發布到 Cloudflare Pages。
5. 在 Cloudflare Pages 專案的 **Custom domains** 綁定 `yt.tonny.tw`。

### 方法二：Cloudflare Pages 原生 Git 連動
1. 在 Cloudflare Dashboard 建立 Pages 專案並連結此 GitHub Repo。
2. 設定：
   - **Framework preset**: None
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
3. 綁定自訂網域 `yt.tonny.tw`。

## 🤖 Antigravity 專屬技能 (yt-collector)
本專案已配備 Antigravity 自訂技能。只要在對話中貼上任何 YouTube 網址，AI 就會自動抓取資訊、加入清單、建置並 Push 部署！
