// ogata-brain inbox: オガタさん(GitHub: saiogata)からチサト・マコトへの返信を取り込む。
//
//   node ogata-brain/tools/inbox.mjs pending
//       未処理の返信を JSON で出す(saiogata が投稿した "talk [...]" Issue だけ。他の人の Issue は無視)
//   node ogata-brain/tools/inbox.mjs apply <replies.json>
//       オガタさんの投稿と二人の返事をタイムラインへ書き込み、出来事ログに残し、処理済みにする
//
// replies.json の形:
//   [{ "issue": 12, "replies": [{ "who": "chisato", "time": "13:20", "text": "..." }, ...] }, ...]
//   返事の日付はオガタさんの投稿と同じ日。time はオガタさんの投稿より後、23:59 まで。

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OWNER = "saiogata";
const API = "https://api.github.com/repos/saiogata/website/issues";
const TITLE = /^talk \[(new|\d{4}-\d{2}-\d{2}\/[A-Za-z0-9_-]+)\]/;
const CHARS = ["chisato", "makoto"];
const NAMES = { chisato: "チサト", makoto: "マコト", ogata: "オガタさん" };

const rj = async (rel, fallback) => (existsSync(join(ROOT, rel)) ? JSON.parse(await readFile(join(ROOT, rel), "utf8")) : fallback);
const wj = async (rel, obj) => {
  await mkdir(dirname(join(ROOT, rel)), { recursive: true });
  await writeFile(join(ROOT, rel), JSON.stringify(obj, null, 2) + "\n", "utf8");
};
const jst = (iso) => {
  const d = new Date(new Date(iso).getTime() + 9 * 3600e3).toISOString();
  return { date: d.slice(0, 10), time: d.slice(11, 16) };
};
const clean = (s) => String(s || "").replace(/<!--[\s\S]*?-->/g, "").replace(/\r/g, "").trim().slice(0, 280);

async function fetchIssues() {
  // テスト用: INBOX_FAKE_ISSUES に JSON ファイルを渡すと GitHub に行かずにそれを使う
  if (process.env.INBOX_FAKE_ISSUES) return JSON.parse(await readFile(process.env.INBOX_FAKE_ISSUES, "utf8"));
  const url = `${API}?creator=${OWNER}&state=all&per_page=100&sort=created&direction=asc`;
  let body;
  try {
    // curl は環境のプロキシ設定をそのまま使えるので優先する
    body = execFileSync("curl", ["-sS", "--fail", "--max-time", "30", "-H", "Accept: application/vnd.github+json", "-H", "User-Agent: ogata-brain", url], { encoding: "utf8" });
  } catch {
    const r = await fetch(url, { headers: { Accept: "application/vnd.github+json", "User-Agent": "ogata-brain" } });
    if (!r.ok) throw new Error(`GitHub API ${r.status}`);
    body = await r.text();
  }
  return JSON.parse(body).filter((i) => !i.pull_request);
}

async function findPost(target) {
  const [date, id] = target.split("/");
  const day = await rj(`timeline/${date}.json`, null);
  const p = day?.posts?.find((x) => x.id === id);
  return p ? { date, id, who: p.who, text: p.text } : null;
}

export async function pending() {
  const done = new Set((await rj("inbox/processed.json", { issues: [] })).issues);
  const out = [];
  for (const i of await fetchIssues()) {
    if (i.user?.login !== OWNER || done.has(i.number)) continue;
    const m = TITLE.exec(i.title || "");
    const text = clean(i.body);
    if (!m || !text) continue;
    const at = jst(i.created_at);
    const target = m[1] === "new" ? null : await findPost(m[1]);
    out.push({ issue: i.number, date: at.date, time: at.time, text, target });
  }
  return out;
}

export async function apply(decisions) {
  const items = new Map((await pending()).map((p) => [p.issue, p]));
  const processed = await rj("inbox/processed.json", { issues: [] });
  const index = await rj("timeline/index.json", { days: [] });
  const report = [];
  for (const d of decisions) {
    const it = items.get(d.issue);
    if (!it) throw new Error(`issue #${d.issue} は未処理の返信ではありません`);
    const replies = d.replies || [];
    if (!replies.length) throw new Error(`issue #${d.issue}: 返事がありません`);
    for (const r of replies) {
      if (!CHARS.includes(r.who)) throw new Error(`issue #${d.issue}: who は chisato か makoto`);
      if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(r.time) || r.time <= it.time) throw new Error(`issue #${d.issue}: time ${r.time} はオガタさんの投稿(${it.time})より後の HH:MM`);
      if (!r.text || r.text.length > 140) throw new Error(`issue #${d.issue}: 本文は1〜140字`);
    }
    const rel = `timeline/${it.date}.json`;
    const day = await rj(rel, { date: it.date, day: null, title: "", posts: [] });
    const oid = `o${it.issue}`;
    if (day.posts.some((p) => p.id === oid)) throw new Error(`issue #${d.issue} は既にタイムラインにあります`);
    const ogata = { id: oid, who: "ogata", time: it.time, text: it.text };
    if (it.target) {
      if (it.target.date === it.date) ogata.reply_to = it.target.id;
      ogata.quote = { who: it.target.who, text: it.target.text };
    }
    day.posts.push(ogata);
    replies.forEach((r, k) => {
      day.posts.push({ id: `r${it.issue}${"abcdefgh"[k]}`, who: r.who, time: r.time, text: r.text, reply_to: k === 0 ? oid : `r${it.issue}${"abcdefgh"[k - 1]}` });
    });
    day.posts.sort((a, b) => String(a.time).localeCompare(String(b.time)));
    await wj(rel, day);
    if (!index.days.includes(it.date)) index.days = [...index.days, it.date].sort();

    const evRel = `events/${it.date}.json`;
    const ev = await rj(evRel, { date: it.date, events: [] });
    const involved = [...new Set([...(it.target && CHARS.includes(it.target.who) ? [it.target.who] : []), ...replies.map((r) => r.who)])];
    ev.events.push({
      time: it.time, source: "ogata", involved,
      summary: it.target
        ? `オガタさんが${NAMES[it.target.who]}の投稿「${it.target.text.slice(0, 40)}」に返信した:「${it.text}」。${replies.map((r) => `${NAMES[r.who]}が返事をした`).join("、")}。`
        : `オガタさんがつぶやいた:「${it.text}」。${replies.map((r) => `${NAMES[r.who]}が返事をした`).join("、")}。`,
    });
    ev.events.sort((a, b) => String(a.time).localeCompare(String(b.time)));
    await wj(evRel, ev);
    processed.issues.push(it.issue);
    report.push(`#${it.issue} ${it.date} ${it.time} → ${replies.map((r) => `${r.who}@${r.time}`).join(", ")}`);
  }
  await wj("timeline/index.json", index);
  await wj("inbox/processed.json", processed);
  return report;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const [cmd, file] = process.argv.slice(2);
  if (cmd === "pending") console.log(JSON.stringify(await pending(), null, 2));
  else if (cmd === "apply") console.log((await apply(JSON.parse(await readFile(file, "utf8")))).join("\n") || "nothing to apply");
  else console.log("usage: node inbox.mjs pending | apply <replies.json>");
}
