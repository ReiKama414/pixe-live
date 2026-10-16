# PIXELIVE

虛構 VTuber 直播宇宙的完整前端 Demo

React · TypeScript · Vite · React Router · Lucide · Vitest

> **作品紀年：2024**  
> 本專案為 2024 年完成的作品，後經磁碟整理重新彙整、補齊文件與公開授權後釋出
> 但很沒有動力就放 MIT 吧(x)

- GitHub Pages：https://reikama414.github.io/pixe-live/
- Cloudflare：https://pixelive.rkm414.workers.dev
- 作者：[ReiKama414](https://reikama414.vercel.app/)
- GitHub：https://github.com/ReiKama414/pixe-live
- 授權：[MIT License](./LICENSE)（中英對照）

## 執行

```sh
npm ci
npm run dev
npm test
npm run build
```

開發伺服器：http://localhost:5173  
正式建置產物輸出至 `dist/`。

GitHub Pages 建置：

```sh
npm run build:pages
```

## 體驗網路恢復 Demo

1. 開啟 `/live/yuki`，展開 **Network simulator**。
2. 送出聊天訊息，樂觀更新會從 **Sending** 變成 **Sent**（模擬 ACK）。
3. 選擇 **HIGH LATENCY**，再送訊息可看到 500–1,500ms ACK 延遲。
4. 選擇 **UNSTABLE**，觀察連線警告、封包遺失、可重試失敗訊息與畫質下降。
5. 選擇 **DISCONNECT**，連送兩則訊息；兩者顯示 **Waiting for connection**，佇列為 2。
6. 觀察重連：延遲由 1s → 2s → 4s，上限 8s（另加傳輸延遲）。DISCONNECT 會刻意保持斷線直到手動恢復。
7. 點 **Restore connection** 或切回 **NORMAL**，觀察 **SYNCING**、歷史恢復、FIFO 沖刷，以及 **CONNECTION RESTORED** 摘要。
8. 畫質每 6 秒穩定後升一級。開啟 **Architecture** 可看傳輸邊界與職責。

## 產品功能

- 十二組路由：`/`、`/live`、`/live/:id`、`/creators`、`/creator/:username`、`/categories`、`/category/:slug`、`/ranking`、`/clips`、`/following`、`/search`、`/me`
- 十六位虛構創作者，共用單一資料源
- 分類篩選、搜尋、觀眾／粉絲排行、創作者頁、追蹤清單（本機持久化）
- 插畫直播、暫停／繼續、本機合成環境音、全螢幕、手動／自動模擬畫質、彈幕
- 禮物、粒子特效、按讚、XP、粉絲等級、成就通知、禮物連擊
- Demo 錢包、每日獎勵；無真實金流
- 手機版面、鍵盤焦點樣式、減少動態、語意化控制與即時狀態公告
- 原創 Yuki 工作室插畫與程式內嵌創作者肖像

## 即時架構

`App.tsx` 透過 `useSyncExternalStore` 訂閱 `RealtimeEngine`。畫面層不直接排程傳輸或產生隨機伺服器事件。

- `realtime/types.ts`：連線／訊息／事件型別與 `RealtimeTransport` 契約
- `realtime/RealtimeEngine.ts`：連線狀態、樂觀聊天、FIFO 佇列、ACK、重試、序號去重、重播、特效與生命週期清理
- `realtime/MockRealtimeAdapter.ts`：模擬伺服器、單調事件 ID、歷史重播、冪等 ACK、延遲與封包遺失
- `realtime/NetworkSimulator.ts`：網路模式與延遲抽樣
- `stream/StreamQualityManager.ts`：健康檢查時立即降級；穩定後分階恢復

未來的 `WebSocketAdapter` 只要實作 `RealtimeTransport` 即可接上，無需重寫畫面。瀏覽器渲染與音訊與網路排程分離。

資源上限：聊天 100、外送佇列 50、模擬伺服器事件 600、冪等紀錄 300、每次特效粒子 12。伺服器歷史約涵蓋目前 tick 速率下 18 分鐘；更長的斷線只恢復保留區間。離開直播間會清理 timer、listener 與 AudioContext。

## 哪些是模擬的

沒有資料庫、認證伺服器、真實 WebSocket 後端、影片 ingest、真實付款或外部串流服務。直播間為動畫插畫與可選本機合成音；剪輯為動畫亮點；畫質為視覺柔化模擬，非真實轉碼。探索指標與檔案統計為虛構 Demo 資料。聊天與伺服器歷史僅存在目前房間的記憶體；追蹤與 Demo 金幣使用瀏覽器儲存。

## 驗證

九項 Vitest 覆蓋樂觀 ACK、高延遲、指數重試、恢復與 FIFO、連線中斷、失敗重試、緩衝上限、冪等、timer 清理與分階畫質恢復。

桌面與手機的探索／直播版面、正常與延遲 ACK、離線佇列兩則訊息、重連、同步、事件恢復、佇列沖刷與架構面板皆已瀏覽器驗證。

## 部署

### GitHub Pages

推送到 `main` 後，`.github/workflows/deploy-pages.yml` 會執行 `npm run build:pages` 並部署。倉庫 Settings → Pages → Source 請選 **GitHub Actions**。

### Cloudflare

`wrangler.jsonc` 以 Workers Static Assets 提供 `dist/`（`base` 為 `/`），並啟用 SPA fallback。不含應用後端。

```sh
npm run build
npx wrangler deploy
```

需已用 Wrangler 登入 Cloudflare。巢狀路由由 `assets.not_found_handling: "single-page-application"` 處理。

## 素材

`public/yuki-studio.png` 為本專案原創插畫。創作者肖像為 `src/Art.tsx` 的 SVG 元件。圖示來自 Lucide；字型為 Google Fonts 的 DM Sans 與 Space Grotesk（本機無字型時回退系統字型）。

## 授權

本專案程式碼以 [MIT](./LICENSE) 授權，Copyright © 2024 [ReiKama414](https://reikama414.vercel.app/)。

LICENSE 含**繁體中文譯文**與英文原文；發生歧義時以英文原文為準。  
MIT 僅涵蓋本專案自行撰寫的程式碼、版面與原創圖形。
