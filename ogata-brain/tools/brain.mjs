// ogata-brain: チサトとマコトの「脳」を読み書きするモジュール(Node 18+、依存なし)
// どの出し先(配信ツール・タイムライン・ボイス)もこれを通して記憶を読み、出来事を書き戻す。
//
// 使い方:
//   import { loadContext, addEvent } from "./ogata-brain/tools/brain.mjs";
//   const ctx = await loadContext("chisato");          // システムプロンプトに入れる文章
//   await addEvent({ source: "stream", involved: ["chisato"], summary: "配信で…" });
//
// ローカルのクローンがあればそれを読み、なければ GitHub の公開URLから読む。

import { readFile, writeFile, mkdir, readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const RAW = "https://raw.githubusercontent.com/saiogata/website/main/ogata-brain";
export const CHARACTERS = ["chisato", "makoto"];
const NAMES = { chisato: "チサト", makoto: "マコト" };

export function todayJST(d = new Date()) {
  return new Date(d.getTime() + 9 * 3600e3).toISOString().slice(0, 10);
}
function nowTimeJST(d = new Date()) {
  return new Date(d.getTime() + 9 * 3600e3).toISOString().slice(11, 16);
}

async function readJSON(rel, { root = ROOT, remote = !existsSync(join(ROOT, "bible.json")) } = {}) {
  if (remote) {
    const r = await fetch(`${RAW}/${rel}?t=${Date.now()}`);
    if (r.status === 404) return null;
    if (!r.ok) throw new Error(`ogata-brain: ${rel} の取得に失敗 (${r.status})`);
    return r.json();
  }
  const p = join(root, rel);
  if (!existsSync(p)) return null;
  return JSON.parse(await readFile(p, "utf8"));
}

async function writeJSON(rel, obj, root = ROOT) {
  const p = join(root, rel);
  await mkdir(dirname(p), { recursive: true });
  await writeFile(p, JSON.stringify(obj, null, 2) + "\n", "utf8");
}

/** 直近 days 日分の出来事(新しい順)。who を渡すと、その人が関わった出来事だけ */
export async function recentEvents({ days = 7, who = null, today = todayJST(), ...opt } = {}) {
  const out = [];
  const base = new Date(today + "T00:00:00Z");
  for (let i = 0; i < days; i++) {
    const d = new Date(base.getTime() - i * 864e5).toISOString().slice(0, 10);
    const log = await readJSON(`events/${d}.json`, opt);
    if (!log?.events) continue;
    for (const e of [...log.events].reverse()) {
      if (who && !(e.involved || []).includes(who)) continue;
      out.push({ date: d, ...e });
    }
  }
  return out;
}

/** キャラ1人分の文脈(世界観・本人の設定・本人の記憶・本人が関わった最近の出来事)を文章にする */
export async function loadContext(who, opt = {}) {
  if (!CHARACTERS.includes(who)) throw new Error(`ogata-brain: 不明なキャラ ${who}`);
  const bible = await readJSON("bible.json", opt);
  const mem = await readJSON(`${who}/memory.json`, opt);
  const events = await recentEvents({ days: opt.days ?? 7, who, ...opt });
  const other = who === "chisato" ? "makoto" : "chisato";
  const lines = [
    `# 世界観\n${bible.world}`,
    `# あなた(${NAMES[who]})\n${bible[who]}`,
    `# 相手(${NAMES[other]})\n${bible[other]}`,
    `# ルール\n${(bible.rules || []).map((r) => `- ${r}`).join("\n")}`,
  ];
  if (mem) {
    lines.push(`# あなたの記憶(${mem.updatedAt}時点)`);
    if (mem.self) lines.push(`自分について: ${mem.self}`);
    for (const [k, v] of Object.entries(mem.relationships || {})) lines.push(`${k === "ogata" ? "オガタさん" : NAMES[k]}について: ${v}`);
    for (const key of ["facts", "feelings", "secrets", "threads"]) {
      if (mem[key]?.length) lines.push(`${{ facts: "覚えていること", feelings: "気持ち", secrets: "秘密", threads: "気になっていること・約束" }[key]}:\n${mem[key].map((x) => `- ${x}`).join("\n")}`);
    }
  }
  if (events.length) lines.push(`# 最近あなたが関わった出来事(新しい順)\n${events.map((e) => `- ${e.date} ${e.time || ""} [${e.source}] ${e.summary}`).join("\n")}`);
  return lines.join("\n\n");
}

/** 出来事を今日のログに追記する(ローカルのクローンが必要。追記後は git で commit/push) */
export async function addEvent({ source, involved, summary, date = todayJST(), time = nowTimeJST() }, root = ROOT) {
  if (!source || !summary) throw new Error("ogata-brain: source と summary は必須");
  const inv = (involved || []).filter((c) => CHARACTERS.includes(c));
  if (!inv.length) throw new Error("ogata-brain: involved に chisato か makoto を入れてください");
  const rel = `events/${date}.json`;
  const log = (await readJSON(rel, { root, remote: false })) || { date, events: [] };
  log.events.push({ time, source, involved: inv, summary });
  log.events.sort((a, b) => String(a.time).localeCompare(String(b.time)));
  await writeJSON(rel, log, root);
  return log;
}

/** 出来事ログのある日付の一覧(古い順) */
export async function eventDays(root = ROOT) {
  const dir = join(root, "events");
  if (!existsSync(dir)) return [];
  return (await readdir(dir)).filter((f) => /^\d{4}-\d{2}-\d{2}\.json$/.test(f)).map((f) => f.slice(0, 10)).sort();
}

// コマンドラインから: node brain.mjs context chisato / node brain.mjs event stream chisato "配信で…"
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const [cmd, a, b, c] = process.argv.slice(2);
  if (cmd === "context") console.log(await loadContext(a));
  else if (cmd === "event") console.log(JSON.stringify(await addEvent({ source: a, involved: b.split(","), summary: c }), null, 2));
  else console.log("usage: node brain.mjs context <chisato|makoto>\n       node brain.mjs event <source> <chisato,makoto> <summary>");
}
