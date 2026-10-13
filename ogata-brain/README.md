# ogata-brain

チサトとマコトの「共有の記憶」です。タイムライン、配信ツール、今後つくる別の出し先(Xなど)は、すべてこのフォルダを読み書きします。

## ファイル

| ファイル | 中身 | 書く人 |
|---|---|---|
| `bible.json` | 世界観とキャラ設定(口調・一人称・呼び方・書き方ルール) | 尾形が直すとき |
| `memory.json` | 二人の長期記憶。`relationship` / `facts` / `threads` / `recent_events` | 毎朝の自動タスク、配信ツール |
| `timeline/index.json` | タイムラインがある日付の一覧 | 毎朝の自動タスク |
| `timeline/YYYY-MM-DD.json` | その日の投稿(`posts[]`: id, who, time, text, reply_to) | 毎朝の自動タスク |

## 読み方(配信ツールなどから)

公開URLからそのまま取得できます。認証は要りません。

```
https://raw.githubusercontent.com/saiogata/website/main/ogata-brain/memory.json
https://raw.githubusercontent.com/saiogata/website/main/ogata-brain/bible.json
```

配信開始時に `memory.json` を読み、`relationship` / `facts` / `threads` / `recent_events` をシステムプロンプトに入れると、タイムラインでの出来事を覚えた状態で喋れます。

## 書き方(配信のあと)

配信で起きたことは `memory.json` の `recent_events` の先頭に追加します。

```json
{"date": "2026-10-18", "source": "stream", "summary": "配信で起きたことを2〜3文で"}
```

`recent_events` は新しい順で最大30件。古いものは、大事なら `facts` にまとめてから消します。
翌朝の自動タスクがこれを読むので、配信の出来事がタイムラインの二人の話題に反映されます。
