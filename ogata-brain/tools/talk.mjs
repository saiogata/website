// オガタさんがチャットで話しかけた内容を、タイムラインと出来事ログに書き込む。
//
//   node ogata-brain/tools/talk.mjs <talk.json>
//
// talk.json の形:
//   {
//     "date": "2026-10-27", "time": "17:52",          // オガタさんが書いた時刻(JST)
//     "text": "画像、見たよ",                          // オガタさんの言葉そのまま(足さない・変えない)
//     "target": "2026-10-27/p9",                      // 返信先の投稿。つぶやきなら省略
//                                                      // (公開タイムラインに無い投稿なら {"who","text"} で引用だけ)
//     "replies": [{ "who": "chisato", "time": "18:05", "text": "…" }]   // 二人の返事
//   }

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const CHARS = ["chisato", "makoto"];
const NAMES = { chisato: "チサト", makoto: "マコト" };
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

const rj = async (rel, fallback) => (existsSync(join(ROOT, rel)) ? JSON.parse(await readFile(join(ROOT, rel), "utf8")) : fallback);
const wj = async (rel, obj) => {
  await mkdir(dirname(join(ROOT, rel)), { recursive: true });
  await writeFile(join(ROOT, rel), JSON.stringify(obj, null, 2) + "\n", "utf8");
};

export async function talk(t) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(t.date || "")) throw new Error("date は YYYY-MM-DD");
  if (!TIME.test(t.time || "")) throw new Error("time は HH:MM");
  const text = String(t.text || "").trim();
  if (!text || text.length > 280) throw new Error("text は1〜280字");
  const replies = t.replies || [];
  if (!replies.length) throw new Error("二人の返事がありません");
  let prev = t.time;
  for (const r of replies) {
    if (!CHARS.includes(r.who)) throw new Error("who は chisato か makoto");
    if (!TIME.test(r.time) || r.time <= prev) throw new Error(`返事の時刻 ${r.time} は直前の投稿(${prev})より後の HH:MM`);
    if (!r.text || r.text.length > 140) throw new Error("返事は1〜140字");
    prev = r.time;
  }

  let target = null;
  if (t.target && typeof t.target === "object") {
    // 返信先が公開タイムラインに無い投稿(専用ページ上の返事など)のときは、引用だけ残す
    if (!CHARS.includes(t.target.who) || !t.target.text) throw new Error("target は {who, text}");
    target = { date: null, id: null, who: t.target.who, text: String(t.target.text) };
  } else if (t.target) {
    const [d, id] = t.target.split("/");
    const p = (await rj(`timeline/${d}.json`, null))?.posts?.find((x) => x.id === id);
    if (!p) throw new Error(`返信先 ${t.target} が見つかりません`);
    target = { date: d, id, who: p.who, text: p.text };
  }

  const rel = `timeline/${t.date}.json`;
  const day = await rj(rel, { date: t.date, day: null, title: "", posts: [] });
  const n = day.posts.filter((p) => /^o\d+$/.test(p.id)).length + 1;
  const oid = `o${n}`;
  const ogata = { id: oid, who: "ogata", time: t.time, text };
  if (target) {
    if (target.date === t.date) ogata.reply_to = target.id;
    ogata.quote = { who: target.who, text: target.text };
  }
  day.posts.push(ogata);
  replies.forEach((r, k) => {
    day.posts.push({ id: `${oid}r${k + 1}`, who: r.who, time: r.time, text: r.text, reply_to: k === 0 ? oid : `${oid}r${k}` });
  });
  day.posts.sort((a, b) => String(a.time).localeCompare(String(b.time)));
  await wj(rel, day);

  const index = await rj("timeline/index.json", { days: [] });
  if (!index.days.includes(t.date)) { index.days = [...index.days, t.date].sort(); await wj("timeline/index.json", index); }

  const evRel = `events/${t.date}.json`;
  const ev = await rj(evRel, { date: t.date, events: [] });
  const involved = [...new Set([...(target && CHARS.includes(target.who) ? [target.who] : []), ...replies.map((r) => r.who)])];
  ev.events.push({
    time: t.time, source: "ogata", involved,
    summary: (target
      ? `オガタさんが${NAMES[target.who] || "オガタさん"}の投稿「${target.text.slice(0, 40)}」に返信した:「${text}」。`
      : `オガタさんがつぶやいた:「${text}」。`) + replies.map((r) => `${NAMES[r.who]}が返事をした`).join("、") + "。",
  });
  ev.events.sort((a, b) => String(a.time).localeCompare(String(b.time)));
  await wj(evRel, ev);
  return `${t.date} ${t.time} オガタ(${oid})${target ? ` → ${target.who}:${target.id}への返信` : ""} / ${replies.map((r) => `${r.who}@${r.time}`).join(", ")}`;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const file = process.argv[2];
  if (!file) { console.log("usage: node talk.mjs <talk.json>"); process.exit(1); }
  console.log(await talk(JSON.parse(await readFile(file, "utf8"))));
}
