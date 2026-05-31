import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

// 部署到 GitHub Pages 時，網址會是
//   https://<你的帳號>.github.io/<儲存庫名稱>/
// 所以「正式建置」時 base 必須設成 "/<儲存庫名稱>/"，
// 否則網頁會找不到 JS/圖片（白畫面）。
// 若你之後把儲存庫改名，記得同步改這裡。
const REPO_NAME = "magic-rpg";

export default defineConfig(({ command }) => ({
  // 本機開發維持 "/"；正式建置(build)才加上儲存庫路徑。
  base: command === "build" ? `/${REPO_NAME}/` : "/",
  server: { open: false },
  plugins: [
    VitePWA({
      registerType: "autoUpdate", // 有新版本時自動更新
      includeAssets: ["icon-192.png", "icon-512.png", "icon-512-maskable.png"],
      manifest: {
        name: "星界旅人 Astral Voyager",
        short_name: "星界旅人",
        description: "一款太空探險 RPG —— 駕著太空船，航向每一顆未知的星球。",
        lang: "zh-Hant",
        theme_color: "#0b1f3a",
        background_color: "#05080f",
        display: "fullscreen",
        orientation: "landscape",
        icons: [
          { src: "icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "icon-512-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      workbox: {
        // 把這些檔案都快取起來，沒網路也能玩
        globPatterns: ["**/*.{js,css,html,png,svg,woff2}"],
      },
    }),
  ],
}));
