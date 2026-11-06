# 専用ページの画像(アセット)を公開サイト用に変換する。
#   python3 ogata-brain/tools/webp.py <ダウンロードした画像> <アセットid>
# → assets/timeline/uploads/<id>.webp(長辺1600px、品質82)を書き、src を表示する。
import sys, os, re
from PIL import Image, ImageOps
src, aid = sys.argv[1], sys.argv[2]
if not re.fullmatch(r"[A-Za-z0-9_-]{8,64}", aid): sys.exit("アセットidが不正")
root = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..")
out_rel = f"assets/timeline/uploads/{aid}.webp"
out = os.path.join(root, out_rel)
os.makedirs(os.path.dirname(out), exist_ok=True)
im = ImageOps.exif_transpose(Image.open(src))
im = im.convert("RGBA" if im.mode in ("RGBA", "LA", "P") else "RGB")
im.thumbnail((1600, 1600))
im.save(out, "WEBP", quality=82, method=6)
print(out_rel, im.size[0], im.size[1], os.path.getsize(out))
