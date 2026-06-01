// 美術小工具：有圖就用圖，沒圖就用色塊。
// 這讓遊戲在「還沒換美術」時照樣能跑（用佔位色塊），
// 等你放了圖、跑過 npm run art 之後，同樣的程式就自動改用真圖。

// 建立一個顯示物件：材質存在 → 用圖片(縮到 displaySize)；否則 → 用 makeShape() 畫的色塊。
export function spriteOrShape(scene, x, y, key, displaySize, makeShape) {
  if (key && scene.textures.exists(key)) {
    const img = scene.add.image(x, y, key);
    const scale = displaySize / Math.max(img.width, img.height);
    img.setScale(scale);
    return img;
  }
  return makeShape();
}

// 材質是否存在（已載入）
export function hasTex(scene, key) {
  return !!key && scene.textures.exists(key);
}
