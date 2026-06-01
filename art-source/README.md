# 美術原料資料夾 art-source/

把你的**原始圖片**丟進這個資料夾。這裡的圖**不會直接進遊戲**，
它們是「原料」；我會用工具（`npm run art`）把它們處理成遊戲素材，
輸出到 `public/assets/`，遊戲再去載入。

> 你只要負責「丟圖 + 取對名字」，剩下的縮放、去背、接進遊戲交給我／腳本。

---

## 命名規則（檔名決定這張圖用在哪裡）

| 檔名 | 用途 |
|------|------|
| `player.png` | 主角 |
| `enemy-poring.png` | 怪物「太空波利」 |
| `enemy-sprout.png` | 咬人花苗 |
| `enemy-lavabug.png` | 熔岩甲蟲 |
| `enemy-scorpion.png` | 機械蠍 |
| `enemy-iceghost.png` | 冰晶幽靈 |
| `enemy-yeti.png` | 霜雪獸（首領） |
| `item-potion.png` | 治療藥劑 |
| `item-hipotion.png` | 高效治療劑 |
| `item-ether.png` | 能量電池 |
| `ground-station.png` | 太空站 地面／背景 |
| `ground-verdant.png` | 綠林星 地面 |
| `ground-crimson.png` | 赤焰星 地面 |
| `ground-frost.png` | 冰霜星 地面 |
| `npc-任意名字.png` | NPC（丟進來後跟我說哪個是誰，我幫你接上） |

（檔名對應 `src/data/enemies.js`、`items.js`、`planets.js` 裡的 id。
　不確定就照上表，或隨便命名後告訴我。）

---

## 圖片小建議（不強制，但效果更好）

- **去背的 PNG（透明背景）最理想**——角色／怪物才能漂亮地疊在場景上。
  - 背景單純的話，我可以幫你去背；複雜照片背景，我可以用 Python 的 AI 去背。
- **角色／怪物**：主體置中、接近正方形最好（我會自動縮放，不用你調大小）。
- **地面／背景**：任意大小都行，會被當成可重複鋪的材質或背景。
- 格式 png / jpg 都可以。
