/* ================================================================
   노회 홈페이지 게시판 → 앱 연동
   GitHub Actions가 30분마다 이 파일을 실행합니다.
   노회공지·소속교회 동정 게시판 첫 페이지와 노회 일정(지난달~3개월 뒤)을 읽어 data/board.json으로 저장하고,
   앱은 이 파일을 읽어 공지 목록에 보여 줍니다. (사무국은 홈페이지에만 올리면 됩니다)
   ================================================================ */
import { readFile, writeFile, mkdir } from 'node:fs/promises';

const SITE = process.env.SYNC_SITE || 'https://sdbpck.or.kr';
const BOARDS = [
  { key: 'notice', seq: 1, lef: 'nav25' },   // 노회공지
  { key: 'news',   seq: 2, lef: 'nav26' }    // 소속교회 동정
];
const OUT = 'data/board.json';
const KEEP = 60;   // 게시판마다 최근 60개까지 보관

/* 게시판 목록 HTML에서 글 목록을 뽑습니다 (브라우저·Node 공용 함수) */
export function parseBoardList(html, boardSeq) {
  const rows = html.split(/<tr[^>]*class="[^"]*sboard_list_line[^"]*"[^>]*>/i).slice(1).map(r => r.split(/<\/tr>/i)[0]);
  const strip = s => s.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\s+/g, ' ').trim();
  const out = [];
  for (const r of rows) {
    const link = r.match(new RegExp(`href="read\\.asp\\?board_seq=${boardSeq}[^"]*?[?&]seq=(\\d+)[^"]*"[^>]*>([\\s\\S]*?)</a>`, 'i'));
    if (!link) continue;
    const num = strip((r.match(/<td[^>]*class="[^"]*sboard_num[^"]*"[^>]*>([\s\S]*?)<\/td>/i) || [])[1] || '');
    const date = (strip((r.match(/<td[^>]*class="[^"]*sboard_date[^"]*"[^>]*>([\s\S]*?)<\/td>/i) || [])[1] || '').match(/\d{4}-\d{2}-\d{2}/) || [])[0] || '';
    const writer = strip((r.match(/<td[^>]*class="[^"]*sboard_pid[^"]*"[^>]*>([\s\S]*?)<\/td>/i) || [])[1] || '');
    out.push({
      seq: Number(link[1]),
      title: strip(link[2]),
      date,
      writer,
      pinned: !/^\d+$/.test(num),          // 번호 대신 '공지'로 표시된 글
      hasFile: /fa-paperclip/i.test(r)
    });
  }
  return out;
}

/* 홈페이지 달력 자료(ajax_calendar.asp)에서 공개 일정을 뽑습니다 */
export function parseCalendar(text) {
  const out = [];
  const blocks = text.split(/'date'\s*:/).slice(1);
  for (const b of blocks) {
    const d = (b.match(/^\s*'(\d{8})'/) || [])[1];
    if (!d) continue;
    const date = `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`;
    const re = /\{\s*'dec'\s*:\s*'([\s\S]*?)'\s*,\s*'seq'\s*:\s*'(\d+)'\s*,\s*'sopen'\s*:\s*'([YN])'\s*\}/g;
    let m;
    while ((m = re.exec(b))) {
      if (m[3] !== 'Y') continue;                       // 비공개 일정은 가져오지 않음
      const title = m[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/\s+/g, ' ').trim();
      out.push({ seq: Number(m[2]), date, title, important: /정기노회|제\s*\d+\s*회\s*노회$/.test(title) });
    }
  }
  return out;
}

/* 한국 시간 기준 지난달부터 3개월 뒤까지의 'YYYYMM' 목록 */
function monthsToSync() {
  const now = new Date(Date.now() + 9 * 3600e3);
  const list = [];
  for (let k = -1; k <= 3; k++) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + k, 1));
    list.push(`${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, '0')}`);
  }
  return list;
}

async function getText(url) {
  const res = await fetch(url, { headers: { 'User-Agent': 'sdbpck-mobile-app-sync/1.0 (+https://reau5789-wq.github.io/sdbpck/)' } });
  if (!res.ok) throw new Error(`${url} → HTTP ${res.status}`);
  return res.text();
}

async function main() {
  let prev = { notice: [], news: [] };
  try { prev = JSON.parse(await readFile(OUT, 'utf8')); } catch {}
  const next = { updatedAt: prev.updatedAt || null, source: SITE };
  let changed = false;

  for (const b of BOARDS) {
    const html = await getText(`${SITE}/modu/s_board/list.asp?board_seq=${b.seq}&lef=${b.lef}`);
    const fresh = parseBoardList(html, b.seq);
    if (!fresh.length) throw new Error(`${b.key}: 글을 하나도 읽지 못했습니다 (홈페이지 구조가 바뀌었을 수 있음)`);
    const bySeq = new Map((prev[b.key] || []).map(x => [x.seq, x]));
    for (const x of fresh) bySeq.set(x.seq, { ...bySeq.get(x.seq), ...x });
    const merged = [...bySeq.values()].sort((a, c) => (c.pinned - a.pinned) || c.date.localeCompare(a.date) || c.seq - a.seq).slice(0, KEEP);
    if (JSON.stringify(merged) !== JSON.stringify(prev[b.key] || [])) changed = true;
    next[b.key] = merged;
    console.log(`${b.key}: ${fresh.length}건 읽음, 최신 "${fresh.filter(x => !x.pinned)[0]?.title || '-'}"`);
  }

  /* 노회 일정: 읽은 달은 홈페이지 내용으로 바꾸고(지운 일정은 빠짐), 그 전 달은 1년까지 보관 */
  const months = monthsToSync();
  const fresh = [];
  for (const ym of months) {
    const t = await getText(`${SITE}/ajax_calendar.asp?date=${ym}`);
    fresh.push(...parseCalendar(t));
  }
  const inRange = e => months.includes(e.date.slice(0, 7).replace('-', ''));
  const cutoff = new Date(Date.now() - 365 * 864e5).toISOString().slice(0, 10);
  const events = (prev.events || []).filter(e => !inRange(e) && e.date >= cutoff).concat(fresh)
    .sort((a, c) => a.date.localeCompare(c.date) || a.seq - c.seq);
  if (JSON.stringify(events) !== JSON.stringify(prev.events || [])) changed = true;
  next.events = events;
  console.log(`events: ${months[0]}~${months.at(-1)} ${fresh.length}건 읽음`);

  if (!changed) { console.log('바뀐 글 없음'); return; }
  next.updatedAt = new Date().toISOString();
  await mkdir('data', { recursive: true });
  await writeFile(OUT, JSON.stringify(next, null, 1) + '\n');
  console.log('data/board.json 저장');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(e => { console.error(e.message); process.exit(1); });
}
