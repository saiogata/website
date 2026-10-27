# 二人を動かす手順(書き手用)

## A. 毎朝の更新(06:49 JST)

1. `git pull`。`TZ=Asia/Tokyo date +%F` を TODAY とする。続けて **C(1) 取り込み** を行う。
2. `timeline/TODAY.json` が `"generated": true` なら 4 へ飛ぶ。
   ファイルがあっても `generated` が無い場合(オガタさんの返信だけが先に入っている)は、既存の posts を残したまま追記する。
3. 一日分の投稿を書く。
   - 読む: `bible.json`、`chisato/memory.json`、`makoto/memory.json`、直近7日の `events/*.json`、直近3日の `timeline/*.json`。
     `node tools/brain.mjs context chisato` / `... makoto` で、それぞれの視点の文脈をまとめて読める。
   - bible の format と rules に従う。各キャラの投稿は、そのキャラの記憶と、そのキャラが関わった出来事だけを根拠にする。
   - オガタさんの現実の予定・出来事は、events に source が stream / ogata などで記録されたものだけを話題にする。
   - id は p1, p2 …(o〜 はオガタさんの投稿と、それへの返事用に予約済み)。`"generated": true` を付ける。`timeline/index.json` に TODAY を足す。
   - その日の出来事を `events/TODAY.json` に書く(既存の source: ogata の出来事は残す)。
4. 各キャラの `memory.json` を、そのキャラ自身の視点で更新する(source: ogata の出来事も反映)。facts は最大20件、超えたら要約・統合。updatedAt を TODAY に。
5. JSON を検証(読み込めること、posts の形式・時刻・返信先、本文140字以内)してから commit / push。
6. **C(2) 反映**を行う。
7. 予約の補充: 毎朝の更新を3日先まで(返信チェックの予約は作らない。廃止済み)。

## B. 配信などの出来事を足すとき

`node tools/brain.mjs event stream chisato,makoto "配信で…"` → commit / push。

## C. オガタさんの専用ページ(Claude アプリ内)との同期

オガタさんは専用ページ https://claude.ai/artifact/JutCshZwZbJCzHJ7groLoD で、投稿ごとの返信ボタンやつぶやき欄から二人に話しかける。
二人の返事はそのページがその場で作り、数分〜30分後に表示する。データはそのページのデータベースにある。

毎朝の更新では、A の手順 1 の直後と最後に次をやる。

**(1) 取り込み(A-1 の直後)**
1. ArtifactData で `talk` コレクションを読む(`synced` が true でないもの)。
2. 1件ごとに `{date, time, text, target, replies}` を作って `node tools/talk.mjs that.json`。
   - target: 専用ページの target が `{date, id}` で、その id が公開タイムライン(`timeline/<date>.json`)にあればその `"date/id"`。無ければ `{who, text}`(引用だけ)。つぶやきなら無し。
   - replies: ページが作った返事(who, time, text)をそのまま使う。status が replied 以外(failed など)で返事が無いものは、ここで bible に従って返事を書く(時刻はオガタさんの投稿より後)。
   - オガタさんの言葉(text)は一字も変えない。
3. 取り込んだ talk ドキュメントを `synced: true` に update する(if_version は読んだときの version)。
4. 二人の `memory.json` に、オガタさんが言ったことをそれぞれの視点で反映する。

**(2) 反映(A の最後、push の後)**
ArtifactData の batch で、専用ページのデータベースを最新にする。
- `days/<date>` に直近7日分の `{date, title, posts}`(`timeline/<date>.json` から)。
- `brain/bible`、`brain/chisato`、`brain/makoto` に bible.json と二人の memory.json。

チャットで「チサトに:〜」のように話しかけられたときも、同じく `tools/talk.mjs` で書き込んでから (2) を行う。
