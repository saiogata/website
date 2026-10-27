# 二人を動かす手順(書き手用)

## A. 毎朝の更新(06:49 JST)

1. `git pull`。`TZ=Asia/Tokyo date +%F` を TODAY とする。
2. 先に **C. 返信チェック** を行う(夜のあいだに届いたオガタさんの返信を処理する)。
3. `timeline/TODAY.json` が `"generated": true` なら 5 へ飛ぶ。
   ファイルがあっても `generated` が無い場合(オガタさんの返信だけが先に入っている)は、既存の posts を残したまま追記する。
4. 一日分の投稿を書く。
   - 読む: `bible.json`、`chisato/memory.json`、`makoto/memory.json`、直近7日の `events/*.json`、直近3日の `timeline/*.json`。
     `node tools/brain.mjs context chisato` / `... makoto` で、それぞれの視点の文脈をまとめて読める。
   - bible の format と rules に従う。各キャラの投稿は、そのキャラの記憶と、そのキャラが関わった出来事だけを根拠にする。
   - オガタさんの現実の予定・出来事は、events に source が stream / ogata などで記録されたものだけを話題にする。
   - id は p1, p2 …(o〜, r〜 はオガタさんの返信用に予約済み)。`"generated": true` を付ける。`timeline/index.json` に TODAY を足す。
   - その日の出来事を `events/TODAY.json` に書く(既存の source: ogata の出来事は残す)。
5. 各キャラの `memory.json` を、そのキャラ自身の視点で更新する(source: ogata の出来事も反映)。facts は最大20件、超えたら要約・統合。updatedAt を TODAY に。
6. JSON を検証(読み込めること、posts の形式・時刻・返信先、本文140字以内)してから commit / push。
7. 予約の補充: 毎朝の更新を3日先まで。返信チェック(C)を今日の 12:49 / 18:49 / 22:49 に(無ければ作る)。

## B. 配信などの出来事を足すとき

`node tools/brain.mjs event stream chisato,makoto "配信で…"` → commit / push。

## C. 返信チェック(12:49 / 18:49 / 22:49、毎朝の更新の最初にも)

1. `git pull` → `node tools/inbox.mjs pending`。
   - オガタさん(GitHub: saiogata)が投稿した `talk [...]` Issue のうち未処理のものだけが出る。他の人の Issue は出ない。
   - 何も無ければ、何も変更せずに「新着なし」とだけ報告して終える。
2. 返信ごとに、二人の返事を書く。
   - 宛先のキャラ(target.who)が必ず返事をする。つぶやき(target が null)は内容に近いほうが返事をする。もう一人も、ときどき短く加わってよい。
   - 返事の時刻は、チェックした時刻の 10〜50 分後(23:59 を超えない。22:49 のチェックなら短めに)。時刻が来るまでページには出ない。
   - bible の口調を厳守。オガタさんの言葉を勝手に足したり、言っていないことを言ったことにしない。
3. `[{ "issue": N, "replies": [{ "who": "...", "time": "HH:MM", "text": "..." }] }]` を JSON にして `node tools/inbox.mjs apply that.json`。
   タイムラインへのオガタさんの投稿・返事の書き込み、出来事ログ(source: ogata)、処理済みの記録はスクリプトがやる。
4. 二人の `memory.json` に、オガタさんが言ったことを、それぞれの視点で反映する。
5. 検証して commit / push。報告は「#番号 → だれが何時に返事」の一行だけ。
