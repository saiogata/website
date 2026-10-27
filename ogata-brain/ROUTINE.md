# 二人を動かす手順(書き手用)

## A. 毎朝の更新(06:49 JST)

1. `git pull`。`TZ=Asia/Tokyo date +%F` を TODAY とする。
3. `timeline/TODAY.json` が `"generated": true` なら 5 へ飛ぶ。
   ファイルがあっても `generated` が無い場合(オガタさんの返信だけが先に入っている)は、既存の posts を残したまま追記する。
4. 一日分の投稿を書く。
   - 読む: `bible.json`、`chisato/memory.json`、`makoto/memory.json`、直近7日の `events/*.json`、直近3日の `timeline/*.json`。
     `node tools/brain.mjs context chisato` / `... makoto` で、それぞれの視点の文脈をまとめて読める。
   - bible の format と rules に従う。各キャラの投稿は、そのキャラの記憶と、そのキャラが関わった出来事だけを根拠にする。
   - オガタさんの現実の予定・出来事は、events に source が stream / ogata などで記録されたものだけを話題にする。
   - id は p1, p2 …(o〜 はオガタさんの投稿と、それへの返事用に予約済み)。`"generated": true` を付ける。`timeline/index.json` に TODAY を足す。
   - その日の出来事を `events/TODAY.json` に書く(既存の source: ogata の出来事は残す)。
5. 各キャラの `memory.json` を、そのキャラ自身の視点で更新する(source: ogata の出来事も反映)。facts は最大20件、超えたら要約・統合。updatedAt を TODAY に。
6. JSON を検証(読み込めること、posts の形式・時刻・返信先、本文140字以内)してから commit / push。
7. 予約の補充: 毎朝の更新を3日先まで(返信チェックの予約は作らない。廃止済み)。

## B. 配信などの出来事を足すとき

`node tools/brain.mjs event stream chisato,makoto "配信で…"` → commit / push。

## C. オガタさんがチャットで二人に話しかけたとき

チャットで「チサトに:〜」「マコトへ 〜」「つぶやき:〜」のように書かれたら、すぐに処理する(予約やチェックは無い)。

1. `git pull`。オガタさんの言葉は書かれたとおりに使う(「〜って言っといて」なら「〜」の部分)。一字も足さない・変えない。
2. 返信先: 特定の投稿を指していればその id(例: `2026-10-27/p9`)、名前だけならその人の今日の最新の投稿、どれでもなければ target なし(つぶやき)。
3. 二人の返事を書く。宛先のキャラが必ず返事をし、もう一人はときどき短く加わる。時刻は今から 5〜30 分後(23:59 を超えるなら短めに)。bible の口調を厳守。
4. `{date, time, text, target, replies}` を JSON にして `node tools/talk.mjs that.json`。タイムラインと出来事ログ(source: ogata)はスクリプトが書く。
5. 二人の `memory.json` に、オガタさんが言ったことをそれぞれの視点で反映。検証して commit / push。
6. 返答はひとこと(だれが何分後くらいに返事するか)。
