# -*- coding: utf-8 -*-
# 把 art-source/ 的原始圖片，處理成遊戲素材輸出到 public/assets/。
# 流程：去背(rembg) -> 裁掉透明邊 -> 置中放進正方形 -> 像素化/卡通化 -> 縮放 -> 存 PNG
# 並更新 src/data/assetManifest.js（遊戲端據此載入）。
#
# 執行：npm run art   （等同 python scripts/process_art.py）
import os
import glob

SRC = "art-source"
OUT = "public/assets"
MANIFEST = "src/data/assetManifest.js"

# ---- 風格參數（想微調看這裡）----
PIXELATE = True       # 卡通/像素風（先縮小再用鄰近法放大）
SATURATION = 1.35     # 飽和度（>1 更鮮豔）
CONTRAST = 1.08       # 對比


def target_size(name):
    if name == "player":
        return 64
    if name.startswith("enemy-"):
        return 112
    if name.startswith("npc-"):
        return 64
    if name.startswith("item-"):
        return 48
    if name.startswith("ground-"):
        return 256
    return 64


def is_ground(name):
    return name.startswith("ground-")


def trim_transparent(img):
    bbox = img.getbbox()
    return img.crop(bbox) if bbox else img


def fit_square(img, size, pad=0.86):
    # 等比例縮放讓主體佔正方形的 pad 比例，置中，背景透明
    from PIL import Image
    w, h = img.size
    scale = (size * pad) / max(w, h)
    nw, nh = max(1, int(w * scale)), max(1, int(h * scale))
    img = img.resize((nw, nh), Image.LANCZOS)
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    canvas.paste(img, ((size - nw) // 2, (size - nh) // 2), img)
    return canvas


def fit_cover_square(img, size):
    # 地面：縮放後裁成填滿的正方形
    from PIL import Image
    w, h = img.size
    scale = size / min(w, h)
    nw, nh = max(1, int(w * scale)), max(1, int(h * scale))
    img = img.resize((nw, nh), Image.LANCZOS)
    left, top = (nw - size) // 2, (nh - size) // 2
    return img.crop((left, top, left + size, top + size))


def stylize(img, size):
    from PIL import Image, ImageEnhance
    if PIXELATE:
        small = max(24, size // 2)
        img = img.resize((small, small), Image.NEAREST).resize((size, size), Image.NEAREST)
    alpha = img.split()[3]
    rgb = img.convert("RGB")
    rgb = ImageEnhance.Color(rgb).enhance(SATURATION)
    rgb = ImageEnhance.Contrast(rgb).enhance(CONTRAST)
    r, g, b = rgb.split()
    return Image.merge("RGBA", (r, g, b, alpha))


def main():
    from PIL import Image

    # 嘗試載入 rembg（去背）。失敗就跳過去背，只做縮放/風格化。
    remove = None
    session = None
    try:
        from rembg import remove as _remove, new_session
        remove = _remove
        session = new_session("u2net")
        print("rembg 去背：已啟用")
    except Exception as e:
        print("rembg 去背：停用（", e, "）— 只做縮放/像素化")

    os.makedirs(OUT, exist_ok=True)

    files = []
    for ext in ("png", "jpg", "jpeg", "webp", "PNG", "JPG", "JPEG"):
        files += glob.glob(os.path.join(SRC, "*." + ext))
    files = [f for f in files if os.path.basename(f).lower() != "readme.md"]

    keys = []
    for path in sorted(set(files)):
        name = os.path.splitext(os.path.basename(path))[0]
        size = target_size(name)
        try:
            img = Image.open(path).convert("RGBA")
            if is_ground(name):
                img = fit_cover_square(img, size)
            else:
                if remove is not None:
                    img = remove(img, session=session).convert("RGBA")
                    img = trim_transparent(img)
                img = fit_square(img, size)
            img = stylize(img, size)
            img.save(os.path.join(OUT, name + ".png"))
            keys.append(name)
            print("  OK  %s.png  (%dx%d)" % (name, size, size))
        except Exception as e:
            print("  跳過 %s：%s" % (name, e))

    # 更新 manifest
    os.makedirs(os.path.dirname(MANIFEST), exist_ok=True)
    arr = ", ".join('"%s"' % k for k in sorted(keys))
    with open(MANIFEST, "w", encoding="utf-8") as f:
        f.write("// 自動產生：由 scripts/process_art.py 寫入。請勿手動編輯。\n")
        f.write("// public/assets/ 裡可用的素材 key（檔名去掉 .png）。\n")
        f.write("export const ASSET_KEYS = [%s];\n" % arr)

    if keys:
        print("完成：%d 張素材已輸出到 %s/，manifest 已更新。" % (len(keys), OUT))
    else:
        print("art-source/ 裡沒有可處理的圖片。放圖進去再執行一次 npm run art。")


if __name__ == "__main__":
    main()
