# ogata-brain

チサトとマコトの「脳」です。タイムライン、配信ツール、ボイスなど、二人が出てくるものはすべてここを読み、起きたことをここに書き戻します。

## 構成

| 場所 | 中身 |
|---|---|
| `bible.json` | 世界観・キャラ設定・ルール(尾形が直す) |
| `chisato/memory.json` | チサト本人の記憶(自分・関係・覚えていること・気持ち・約束) |
| `makoto/memory.json` | マコト本人の記憶(秘密もここ) |
| `events/YYYY-MM-DD.json` | その日に起きた出来事のログ。消さずに積み上げる。`involved` に関わったキャラ |
| `timeline/` | 公開タイムライン用の投稿(出力) |
| `tools/brain.mjs` | 読み書き用モジュール(Node 18+、依存なし、API不要) |
| `ROUTINE.md` | 毎朝の更新手順 |

同じ出来事でも、二人の記憶はそれぞれの視点で別々に書かれます。チサトが関わっていない出来事は、チサトの文脈には入りません。

## 配信ツールから使う

```js
import { loadContext, addEvent } from "./ogata-brain/tools/brain.mjs";

const context = await loadContext("chisato");   // システムプロンプトの先頭に入れる
// …配信…
await addEvent({ source: "stream", involved: ["chisato"], summary: "配信で起きたことを2〜3文で" });
// そのあと ogata-brain を git commit / push すると、翌朝の二人がそれを覚えている
```

ローカルにクローンがなくても、`loadContext` は GitHub の公開URLから読めます(書き込みはクローンが必要)。

コマンドラインからも使えます。

```
node ogata-brain/tools/brain.mjs context chisato
node ogata-brain/tools/brain.mjs event stream chisato "配信で…"
```
