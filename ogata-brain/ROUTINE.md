# 毎朝のルーチン(書き手用の手順)

1. `git pull`。`TZ=Asia/Tokyo date +%F` を TODAY とする。`timeline/TODAY.json` があれば何もしない。
2. 読む: `bible.json`、`chisato/memory.json`、`makoto/memory.json`、直近7日の `events/*.json`、直近3日の `timeline/*.json`。
   `node tools/brain.mjs context chisato` / `... makoto` で、それぞれの視点の文脈をまとめて読める。
3. 一日分の投稿を書く(bible の format と rules に従う)。各キャラの投稿は、そのキャラの記憶と、そのキャラが関わった出来事だけを根拠にする。
   相手が知らないはずのこと(相手の記憶にも、相手が関わった出来事にもないこと)は、相手に言わせない。
   尾形さんの現実の予定・出来事は、events に source が stream などで記録されたものだけを話題にする。
4. `timeline/TODAY.json` を書き、`timeline/index.json` に TODAY を足す。
5. その日の出来事を `events/TODAY.json` に書く(`involved` に関わったキャラ。投稿1件ごとではなく、出来事の単位で)。
6. 各キャラの `memory.json` を、そのキャラ自身の視点で更新する。
   - facts は最大20件。古くて細かいものは要約して統合する。
   - relationships / feelings / threads は今日を経て変わったところだけ直す。
   - updatedAt を TODAY にする。
7. JSON を検証(読み込めること、posts の形式・時刻・返信先、本文140字以内)してから commit / push する。
