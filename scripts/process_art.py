# -*- coding: utf-8 -*-
# 把 art-source/ 的原始圖片，處理成遊戲素材輸出到 public/assets/。
#
# 支援兩種對應方式：
#   1) 命名規則：player.png / enemy-<id>.png / item-<id>.png / ground-<id>.png / npc-*.png
#   2) art-source/mapping.json：把任意檔名對應到 key，或把「一張多怪的圖」切成多隻
#      例： { "小怪圖.png": { "split": ["enemy-poring","enemy-lavabug","enemy-sprout"] },
#             "男主角.png": { "key": "player-male" } }
#
# 流程：(去背) -> 裁掉透明邊 -> 置中放進正方形 -> 像素化/卡通化 -> 縮放 -> 存 PNG
# 並更新 src/data/assetManifest.js。  執行：npm run art
import os
import glob
import json

SRC = "art-source"
OUT = "public/assets"
MANIFEST = "src/data/assetManifest.js"
MAPPING = os.path.join(SRC, "mapping.json")

# ---- 風格參數 ----
PIXELATE = True
SATURATION = 1.35
CONTRAST = 1.08

KNOWN_PREFIXES = ("enemy-", "npc-", "item-", "ground-")


def target_size(key):
    if key.startswith("player"):
        return 64
    if key.startswith("enemy-"):
        return 112
    if key.startswith("npc-"):
        return 64
    if key.startswith("item-"):
        return 48
    if key.startswith("ground-"):
        return 256
    return 64


def is_ground(key):
    return key.startswith("ground-")


def matches_convention(name):
    return name.startswith("player") or any(name.startswith(p) for p in KNOWN_PREFIXES)


def trim_transparent(img):
    bbox = img.getbbox()
    return img.crop(bbox) if bbox else img


def fit_square(img, size, pad=0.86):
    from PIL import Image
    w, h = img.size
    scale = (size * pad) / max(w, h)
    nw, nh = max(1, int(w * scale)), max(1, int(h * scale))
    img = img.resize((nw, nh), Image.LANCZOS)
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    canvas.paste(img, ((size - nw) // 2, (size - nh) // 2), img)
    return canvas


def fit_cover_square(img, size):
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
        small = max(28, size // 2)
        img = img.resize((small, small), Image.NEAREST).resize((size, size), Image.NEAREST)
    alpha = img.split()[3]
    rgb = img.convert("RGB")
    rgb = ImageEnhance.Color(rgb).enhance(SATURATION)
    rgb = ImageEnhance.Contrast(rgb).enhance(CONTRAST)
    r, g, b = rgb.split()
    return Image.merge("RGBA", (r, g, b, alpha))


def split_sheet(img, n):
    # 把白底上並排的 n 個主體，依「白色空隙」切成 n 張
    import numpy as np
    rgb = np.asarray(img.convert("RGB"))
    content = ~np.all(rgb > 235, axis=2)   # True = 非白（有內容）
    col = content.any(axis=0)
    runs = []
    start = None
    gap = 0
    min_gap = max(4, img.width // 80)
    for x in range(len(col)):
        if col[x]:
            if start is None:
                start = x
            gap = 0
        else:
            if start is not None:
                gap += 1
                if gap >= min_gap:
                    runs.append((start, x - gap + 1))
                    start = None
                    gap = 0
    if start is not None:
        runs.append((start, len(col)))
    if len(runs) != n:   # 偵測不到剛好 n 段就平均切
        w = img.width // n
        runs = [(i * w, (i + 1) * w if i < n - 1 else img.width) for i in range(n)]
    crops = []
    for (x0, x1) in runs:
        sub = content[:, x0:x1]
        rows = np.where(sub.any(axis=1))[0]
        y0, y1 = (int(rows[0]), int(rows[-1]) + 1) if len(rows) else (0, img.height)
        crops.append(img.crop((x0, y0, x1, y1)))
    return crops


def process_one(img, key, remove, session):
    size = target_size(key)
    img = img.convert("RGBA")
    if is_ground(key):
        img = fit_cover_square(img, size)
    else:
        if remove is not None:
            img = remove(img, session=session).convert("RGBA")
            img = trim_transparent(img)
        img = fit_square(img, size)
    img = stylize(img, size)
    img.save(os.path.join(OUT, key + ".png"))
    print("  OK  %s.png (%dx%d)" % (key, size, size))


def main():
    from PIL import Image

    remove = None
    session = None
    try:
        from rembg import remove as _remove, new_session
        remove = _remove
        session = new_session("u2net")
        print("rembg 去背：已啟用")
    except Exception as e:
        print("rembg 去背：停用 (", e, ")")

    os.makedirs(OUT, exist_ok=True)

    mapping = {}
    if os.path.exists(MAPPING):
        try:
            with open(MAPPING, "r", encoding="utf-8") as f:
                mapping = json.load(f)
        except Exception as e:
            print("讀取 mapping.json 失敗：", e)

    files = []
    for ext in ("png", "jpg", "jpeg", "webp", "PNG", "JPG", "JPEG"):
        files += glob.glob(os.path.join(SRC, "*." + ext))
    files = sorted(set(files))

    keys = []
    for path in files:
        base = os.path.basename(path)
        name = os.path.splitext(base)[0]
        try:
            if base in mapping:
                instr = mapping[base]
                if "split" in instr:
                    parts = split_sheet(Image.open(path), len(instr["split"]))
                    for crop, k in zip(parts, instr["split"]):
                        process_one(crop, k, remove, session)
                        keys.append(k)
                elif "key" in instr:
                    process_one(Image.open(path), instr["key"], remove, session)
                    keys.append(instr["key"])
            elif matches_convention(name):
                process_one(Image.open(path), name, remove, session)
                keys.append(name)
            else:
                print("  略過（未對應）:", base)
        except Exception as e:
            print("  跳過 %s：%s" % (base, e))

    os.makedirs(os.path.dirname(MANIFEST), exist_ok=True)
    arr = ", ".join('"%s"' % k for k in sorted(set(keys)))
    with open(MANIFEST, "w", encoding="utf-8") as f:
        f.write("// 自動產生：由 scripts/process_art.py 寫入。請勿手動編輯。\n")
        f.write("// public/assets/ 裡可用的素材 key（檔名去掉 .png）。\n")
        f.write("export const ASSET_KEYS = [%s];\n" % arr)

    if keys:
        print("完成：%d 個素材已輸出到 %s/，manifest 已更新。" % (len(set(keys)), OUT))
    else:
        print("art-source/ 裡沒有可處理的圖片（或都未對應）。")


if __name__ == "__main__":
    main()
