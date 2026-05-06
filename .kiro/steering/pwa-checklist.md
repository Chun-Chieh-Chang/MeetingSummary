# PWA 開發檢查清單

## 圖示檢查
- [ ] PWA 圖示已放置於 `public/icons/` 目錄
- [ ] `manifest.webmanifest` 中的圖示路徑正確
- [ ] `vite.config.ts` 中的 PWA 圖示路徑正確
- [ ] 圖示已加入 `.gitignore` 的排除清單（或已追蹤）

## 功能檢查
- [ ] Service Worker 已正確生成
- [ ] Manifest 檔案可正常存取 (`/manifest.webmanifest`)
- [ ] PWA 圖示可正常下載
- [ ] 離線支援已啟用

## 部署前檢查
- [ ] 執行 `npx vite build` 確認無錯誤
- [ ] 檢查 `dist/manifest.webmanifest` 路徑正確
- [ ] 檢查 `dist/sw.js` 已生成
- [ ] 確認 `.gitignore` 不會排除必要的 PWA 檔案

## 常見錯誤
- ❌ 圖示路徑錯誤（忘記子目錄）
- ❌ `.gitignore` 錯誤排除 PWA 檔案
- ❌ GitHub Pages base path 設定錯誤
- ❌ Service Worker 未正確註冊
