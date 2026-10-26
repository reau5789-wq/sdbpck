/* ================================================================
   노회 모바일 — 화면 코드
   회원(목사·장로) 전용: 공지 · 일정 · 증명서/공문서 신청 · 교회찾기
   사무장 전용: 신청 처리 · 공지/일정 등록 · 가입 승인
   ================================================================ */
(function () {
  const C = window.APP_CONFIG;
  const PID = (new URLSearchParams(location.search).get('p')) || localStorage.getItem('nm_pid') || C.defaultPresbytery;
  const P = C.presbyteries[PID] || C.presbyteries[C.defaultPresbytery];
  const D = window.PRESBYTERY_DATA[P.id];
  const S = window.createStore(P.id);
  const $app = document.getElementById('app');
  let me = null, unread = 0, unreadNotices = 0;
  const TODAY = new Date();
  const todayStr = ymd(TODAY);

  /* ---------- 도구 ---------- */
  function ymd(d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const DOW = ['일','월','화','수','목','금','토'];
  const kdate = s => { if (!s) return ''; const d = new Date(s.slice(0, 10) + 'T00:00:00'); return `${d.getMonth() + 1}월 ${d.getDate()}일 (${DOW[d.getDay()]})`; };
  const kdt = s => { if (!s) return ''; const d = new Date(s); return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; };
  const digits = s => String(s || '').replace(/[^\d]/g, '');
  const telHref = s => 'tel:' + digits(s);
  const mapHref = addr => 'https://map.kakao.com/link/search/' + encodeURIComponent(String(addr || '').replace(/^\d{5}\s*/, ''));
  const validHome = u => u && /^https?:\/\/[^/]+\.[^/]+/.test(u);
  const churchOf = name => D.directory.find(r => r[1] === name);
  const honor = role => ({'목사':'목사님','장로':'장로님','전도사':'전도사님','선교사':'선교사님','사무장':'사무장님','사무국 직원':'님'}[role] || '님');
  const STATUS = {received:['접수','info'], working:['처리 중','warn'], done:['처리 완료','ok'], rejected:['반려','bad']};
  const statusPill = s => `<span class="pill ${STATUS[s][1]}">${STATUS[s][0]}</span>`;

  const I = {
    home:'<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
    bell:'<path d="M6 8a6 6 0 1 1 12 0c0 7 3 8 3 8H3s3-1 3-8"/><path d="M10.3 20a1.9 1.9 0 0 0 3.4 0"/>',
    news:'<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 7h8M8 11h8M8 15h5"/>',
    cal:'<rect x="3" y="4.5" width="18" height="16.5" rx="2"/><path d="M3 9.5h18M8 2.5v4M16 2.5v4"/>',
    doc:'<path d="M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8z"/><path d="M14 3v5h5M9 13h6M9 17h6"/>',
    church:'<path d="M12 2v5M9.5 4.5h5M5 21V12l7-5 7 5v9"/><path d="M10 21v-4a2 2 0 0 1 4 0v4M3 21h18"/>',
    more:'<circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/>',
    back:'<path d="M15 5l-7 7 7 7"/>',
    chev:'<path d="M9 5l7 7-7 7"/>',
    left:'<path d="M15 5l-7 7 7 7"/>', right:'<path d="M9 5l7 7-7 7"/>',
    phone:'<path d="M5 4h3l2 5-2.5 1.5a11 11 0 0 0 6 6L15 14l5 2v3a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/>',
    map:'<path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
    globe:'<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
    search:'<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    cert:'<rect x="3" y="4" width="18" height="13" rx="2"/><path d="M7 9h10M7 12.5h6"/><path d="m14 17 1.5 4 1.5-1.2 1.5 1.2L20 17"/>',
    mail:'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
    list:'<path d="M9 6h11M9 12h11M9 18h11"/><circle cx="4.5" cy="6" r="1.2"/><circle cx="4.5" cy="12" r="1.2"/><circle cx="4.5" cy="18" r="1.2"/>',
    clip:'<path d="m20 11-8.5 8.5a5 5 0 0 1-7-7L13 4a3.3 3.3 0 0 1 4.7 4.7L9.5 17a1.7 1.7 0 0 1-2.4-2.4L14.5 7"/>',
    gear:'<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1A1.7 1.7 0 0 0 4.6 9a1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
    shield:'<path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z"/><path d="m9 12 2 2 4-4"/>',
    plus:'<path d="M12 5v14M5 12h14"/>',
    ext:'<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
    info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>'
  };
  const ic = (n, s = 22, w = 1.8) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${I[n]}</svg>`;

  function toast(msg) {
    let t = document.querySelector('.toast');
    if (!t) { t = document.createElement('div'); t.className = 'toast'; document.body.appendChild(t); }
    t.textContent = msg; t.classList.add('show');
    clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('show'), 2400);
  }
  function sheet(title, html, onMount) {
    const bg = document.createElement('div'); bg.className = 'sheet-bg';
    bg.innerHTML = `<div class="sheet" role="dialog" aria-label="${esc(title)}"><h3>${esc(title)}</h3>${html}</div>`;
    bg.addEventListener('click', e => { if (e.target === bg) bg.remove(); });
    document.body.appendChild(bg);
    onMount && onMount(bg.querySelector('.sheet'), () => bg.remove());
  }
  function confirmBox(msg, okText = '확인') {
    return new Promise(res => sheet('확인', `<p style="margin:0 0 16px">${esc(msg)}</p><div class="btns"><button class="btn line" data-n>취소</button><button class="btn" data-y>${esc(okText)}</button></div>`,
      (el, close) => { el.querySelector('[data-n]').onclick = () => { close(); res(false); }; el.querySelector('[data-y]').onclick = () => { close(); res(true); }; }));
  }
  const go = h => { if (location.hash === h) route(); else location.hash = h; };

  /* ---------- 틀 ---------- */
  function frame({title, sub, back, tab, body, noTabs}) {
    const tabs = [['home','홈','home'],['notices','공지','news'],['calendar','일정','cal'],['apply','신청','doc'],['more','더보기','more']];
    return `
      <header class="topbar">
        ${back ? `<button class="back" data-back aria-label="뒤로">${ic('back', 26, 2.2)}</button>` : ''}
        <h1>${esc(title)}${sub ? `<small>${esc(sub)}</small>` : ''}</h1>
        <button class="iconbtn" data-go="#alerts" aria-label="알림">${ic('bell', 22)}${unread ? `<span class="dot">${unread > 9 ? '9+' : unread}</span>` : ''}</button>
      </header>
      ${S.mode === 'demo' ? `<div class="demo-band">체험 모드 · 입력한 내용은 이 휴대폰에만 저장됩니다</div>` : ''}
      <main class="${noTabs ? 'noTabs' : ''}">${body}</main>
      ${noTabs ? '' : `<nav class="tabs"><div class="wrap">${tabs.map(([k, l, i]) =>
        `<button class="${tab === k ? 'on' : ''}" data-go="#${k}">${ic(i, 24, tab === k ? 2.1 : 1.8)}<span>${l}</span>${k === 'notices' && unreadNotices ? `<span class="badge">${unreadNotices > 9 ? '9+' : unreadNotices}</span>` : ''}</button>`).join('')}</div></nav>`}`;
  }
  function bindCommon() {
    $app.querySelectorAll('[data-go]').forEach(b => b.addEventListener('click', e => { e.preventDefault(); go(b.dataset.go); }));
    const bk = $app.querySelector('[data-back]'); if (bk) bk.onclick = () => history.length > 1 ? history.back() : go('#home');
  }
  async function refreshBadges() {
    const ns = await S.listNotifications(); unread = ns.filter(n => !n.read).length;
    const notices = await S.listNotices(); const read = await S.readNoticeIds();
    const cutoff = new Date(TODAY.getTime() - 30 * 864e5).toISOString().slice(0, 10);
    unreadNotices = notices.filter(n => n.date >= cutoff && !read.includes(n.id)).length;
  }

  /* ---------- 첫 화면 · 가입 ---------- */
  function viewWelcome() {
    const others = Object.values(C.presbyteries).filter(p => p.id !== P.id);
    $app.innerHTML = `
      <div class="welcome">
        <div class="logo">${churchLogo(46)}</div>
        <h1>${esc(P.name)} 모바일</h1>
        <p class="sub">회원교회 목사님·장로님을 위한 노회 업무 앱</p>
        <div class="card">
          <h2 class="sec" style="margin-top:0">처음 오셨나요?</h2>
          <p class="small muted" style="margin:0 0 14px">가입 신청을 하시면 노회 사무국에서 확인 후 승인해 드립니다. 승인되면 공지·일정을 받아보고 증명서를 신청하실 수 있습니다.</p>
          <button class="btn" data-signup>가입 신청하기</button>
          ${S.mode === 'demo' ? `
            <div style="border-top:1px solid var(--line);margin:18px 0 14px"></div>
            <p class="small muted" style="margin:0 0 10px">먼저 둘러보시려면</p>
            <div class="btns" style="margin-top:0">
              <button class="btn soft" data-demo="member">회원으로 체험</button>
              <button class="btn soft" data-demo="admin">사무장으로 체험</button>
            </div>` : ''}
        </div>
        <div class="card small">
          <b>${esc(P.fullName)}</b><br>
          <span class="muted">사무국 ${esc(P.office.tel)} · ${esc(P.office.email)}</span>
          ${others.length ? `<div class="hint">다른 노회: ${others.map(o => esc(o.name)).join(', ')}</div>` : `<div class="hint">예장통합 다른 노회도 같은 앱으로 쓰실 수 있도록 준비 중입니다.</div>`}
        </div>
        <div class="foot">${esc(C.copyright)}</div>
      </div>`;
    $app.querySelector('[data-signup]').onclick = viewSignup;
    $app.querySelectorAll('[data-demo]').forEach(b => b.onclick = async () => { me = await S.demoLogin(b.dataset.demo); await refreshBadges(); go('#home'); route(); });
  }

  function viewSignup() {
    const isOffice = g => g === P.officeGroup;
    const churches = g => isOffice(g) ? [P.officeGroup] : D.directory.filter(r => r[0] === g).map(r => r[1]);
    const roles = g => isOffice(g) ? P.officeRoles : P.roles;
    $app.innerHTML = frame({title:'가입 신청', sub:P.name, back:true, noTabs:true, body:`
      <div class="note" style="margin:0 0 16px">이 앱은 ${esc(P.name)} 회원교회 교역자와 장로님 전용입니다. 사무국이 명단과 대조해 승인합니다.</div>
      <form id="f">
        <div class="field"><label>소속 시찰·기관<em>*</em></label>
          <select class="input" name="group" required>${P.memberGroups.map(g => `<option>${g}</option>`).join('')}</select></div>
        <div class="field"><label id="chl">교회(기관)<em>*</em></label>
          <select class="input" name="church" required></select></div>
        <div class="two">
          <div class="field"><label>성명<em>*</em></label><input class="input" name="name" required autocomplete="name"></div>
          <div class="field"><label>직분<em>*</em></label><select class="input" name="role">${P.roles.map(r => `<option>${r}</option>`).join('')}</select></div>
        </div>
        <div class="field"><label>휴대폰 번호<em>*</em></label><input class="input" name="phone" type="tel" inputmode="tel" required placeholder="010-0000-0000" autocomplete="tel"></div>
        <label class="check"><input type="checkbox" name="agree" required><span class="small">노회 업무 처리를 위해 성명·교회·직분·휴대폰 번호를 수집하는 데 동의합니다. <a href="privacy.html" target="_blank">개인정보처리방침</a></span></label>
        <button class="btn" type="submit">가입 신청</button>
      </form>`});
    bindCommon();
    const f = $app.querySelector('#f');
    const fill = () => {
      f.church.innerHTML = churches(f.group.value).map(c => `<option>${esc(c)}</option>`).join('');
      f.role.innerHTML = roles(f.group.value).map(r => `<option>${esc(r)}</option>`).join('');
      $app.querySelector('#chl').innerHTML = (isOffice(f.group.value) ? '소속' : '교회(기관)') + '<em>*</em>';
    };
    f.group.onchange = fill; fill();
    $app.querySelector('[data-back]').onclick = () => viewWelcome();
    f.onsubmit = async e => {
      e.preventDefault();
      if (digits(f.phone.value).length < 10) return toast('휴대폰 번호를 확인해 주세요');
      me = await S.signup({group:f.group.value, church:f.church.value, name:f.name.value.trim(), role:f.role.value, phone:f.phone.value.trim()});
      route();
    };
  }

  function viewPending() {
    $app.innerHTML = `
      <div class="welcome">
        <div class="logo">${churchLogo(46)}</div>
        <h1>승인을 기다리고 있습니다</h1>
        <p class="sub">${esc(me.church)} ${esc(me.name)} ${esc(honor(me.role))}</p>
        <div class="card">
          <p style="margin:0 0 6px">${me.status === 'rejected' ? '가입 신청이 반려되었습니다. 사무국으로 문의해 주세요.' : '노회 사무국에서 명단을 확인하고 있습니다. 승인되면 바로 이용하실 수 있습니다.'}</p>
          <p class="small muted" style="margin:0 0 16px">급하신 일은 사무국으로 전화 주세요.</p>
          <button class="btn" data-r>승인 여부 다시 확인</button>
          <div class="btns"><a class="btn line" href="${telHref(P.office.tel)}">${ic('phone', 20)} 사무국 전화</a></div>
          ${S.mode === 'demo' ? `<div class="note gold">체험 모드: 아래 버튼으로 사무장 화면에 들어가 방금 신청을 직접 승인해 보실 수 있습니다.</div>
            <div class="btns"><button class="btn soft" data-admin>사무장으로 승인해 보기</button></div>` : ''}
          <div class="btns"><button class="btn danger sm" data-cancel>신청 취소</button></div>
        </div>
      </div>`;
    $app.querySelector('[data-r]').onclick = async () => { me = await S.refreshMe(); if (me && me.status === 'approved') { toast('승인되었습니다'); await refreshBadges(); go('#home'); } else toast('아직 승인 전입니다'); route(); };
    const a = $app.querySelector('[data-admin]'); if (a) a.onclick = async () => { me = await S.demoLogin('admin'); go('#admin/members'); route(); };
    $app.querySelector('[data-cancel]').onclick = async () => { if (await confirmBox('가입 신청을 취소할까요?', '취소하기')) { await S.logout(); me = null; route(); } };
  }

  function churchLogo(s) {
    return `<svg width="${s}" height="${s}" viewBox="0 0 48 48" aria-hidden="true"><rect width="48" height="48" rx="12" fill="#1d3557"/><path d="M24 8v9M19.5 12.5h9" stroke="#e0b65a" stroke-width="3" stroke-linecap="round"/><path d="M12 38V26l12-8 12 8v12z" fill="#fff"/><path d="M21 38v-6a3 3 0 0 1 6 0v6" fill="#1d3557"/></svg>`;
  }

  /* ---------- 홈 ---------- */
  async function viewHome() {
    const [notices, events, mine, read] = await Promise.all([S.listNotices(), S.listEvents(), me.admin ? S.listAllRequests() : S.listMyRequests(), S.readNoticeIds()]);
    const upcoming = events.filter(e => e.date >= todayStr).slice(0, 3);
    const latest = notices.filter(n => n.cat === 'notice').slice(0, 4);
    const open = mine.filter(r => r.status === 'received' || r.status === 'working');
    $app.innerHTML = frame({title:P.name, sub:'회원 전용', tab:'home', body:`
      <div class="hello">
        <div class="who">${me.admin ? '사무장님' : esc(me.name) + ' ' + esc(honor(me.role))}, 평안하십니까</div>
        <div class="ch">${esc(me.church)}${me.group ? ' · ' + esc(me.group) : ''}</div>
      </div>
      ${me.admin ? `<button class="adminbar" data-go="#admin">${ic('shield', 26)}<span class="grow"><b>사무장 관리</b><span class="small">신청 ${open.length}건 처리 대기 · 공지·일정 등록 · 가입 승인</span></span>${ic('chev', 20)}</button>` : ''}
      <div class="quick">
        <button data-go="#apply/cert"><span class="ic">${ic('cert')}</span><b>증명서 신청</b><span>소속·재직·안수 등 8종</span></button>
        <button data-go="#apply/doc"><span class="ic">${ic('mail')}</span><b>공문서 요청</b><span>사무장에게 서류 요청</span></button>
        <button data-go="#apply/mine"><span class="ic gold">${ic('list')}</span><b>내 신청 현황</b><span>${me.admin ? '사무장은 관리 화면 이용' : (open.length ? `처리 중 ${open.length}건` : '진행 중인 신청 없음')}</span></button>
        <a href="${telHref(P.office.tel)}"><span class="ic gold">${ic('phone')}</span><b>사무국 전화</b><span>${esc(P.office.tel)}</span></a>
      </div>
      <h2 class="sec">노회 공지 <a href="#notices">전체 보기</a></h2>
      <div class="list">${latest.map(n => noticeRow(n, read)).join('') || '<div class="empty">공지가 없습니다</div>'}</div>
      <h2 class="sec">다가오는 일정 <a href="#calendar">달력 보기</a></h2>
      <div class="list">${upcoming.map(eventRow).join('') || '<div class="empty">예정된 노회 일정이 없습니다</div>'}</div>
    `});
    bindCommon(); bindIcs(events);
  }
  function noticeRow(n, read) {
    const isNew = n.date >= ymd(new Date(TODAY.getTime() - 30 * 864e5)) && !read.includes(n.id);
    return `<a class="row ${isNew ? 'unread' : ''}" href="#notice/${n.id}"><span class="grow"><span class="t">${n.pinned ? '<span class="pill gold">필독</span> ' : ''}${n.urgent ? '<span class="pill bad">긴급</span> ' : ''}${esc(n.title)}</span><span class="s">${kdate(n.date)}${n.files && n.files.length ? ' · 첨부 ' + n.files.length : ''}</span></span><span class="chev">${ic('chev', 18)}</span></a>`;
  }
  function eventRow(e) {
    const d = new Date(e.date + 'T00:00:00');
    return `<div class="row" style="cursor:default"><span class="datebox ${e.important ? 'imp' : ''}"><small>${d.getMonth() + 1}월</small><b>${d.getDate()}</b><small>${DOW[d.getDay()]}</small></span><span class="grow"><span class="t">${esc(e.title)}</span><span class="s">${[e.time, e.place].filter(Boolean).map(esc).join(' · ') || kdate(e.date)}</span></span>
      <button class="btn soft sm" data-ics="${esc(e.id)}" aria-label="내 달력에 추가">${ic('plus', 18)}</button></div>`;
  }

  /* ---------- 공지 ---------- */
  let noticeTab = 'notice';
  async function viewNotices() {
    const [all, read] = await Promise.all([S.listNotices(), S.readNoticeIds()]);
    const rows = all.filter(n => n.cat === noticeTab);
    $app.innerHTML = frame({title:'공지', sub:P.name, tab:'notices', body:`
      <div class="seg"><button data-t="notice" class="${noticeTab === 'notice' ? 'on' : ''}">노회공지</button><button data-t="news" class="${noticeTab === 'news' ? 'on' : ''}">소속교회 동정</button></div>
      <div class="list">${rows.map(n => noticeRow(n, read)).join('') || '<div class="empty">글이 없습니다</div>'}</div>
      <div class="btns"><a class="btn line" href="${P.homepage}/index.asp" target="_blank" rel="noopener">${ic('ext', 18)} 홈페이지 게시판 전체 보기</a></div>`});
    bindCommon();
    $app.querySelectorAll('[data-t]').forEach(b => b.onclick = () => { noticeTab = b.dataset.t; viewNotices(); });
  }
  async function viewNotice(id) {
    const n = (await S.listNotices()).find(x => x.id === id);
    if (!n) return go('#notices');
    await S.readNotice(id); await refreshBadges();
    const url = n.seq ? (n.cat === 'news' ? P.newsUrl(n.seq) : P.noticeUrl(n.seq)) : n.link;
    $app.innerHTML = frame({title:n.cat === 'news' ? '소속교회 동정' : '노회공지', back:true, tab:'notices', body:`
      <div class="card article">
        ${n.pinned ? '<span class="pill gold">필독</span> ' : ''}${n.urgent ? '<span class="pill bad">긴급</span>' : ''}
        <h3>${esc(n.title)}</h3>
        <div class="meta">${kdate(n.date)} · ${n.source === 'app' ? '노회 사무국' : '노회 홈페이지'}</div>
        ${n.body ? `<div class="body">${esc(n.body)}</div>` : `<div class="muted small">본문과 첨부파일은 노회 홈페이지 원문에서 보실 수 있습니다.</div>`}
        ${n.files && n.files.length ? `<div class="files">${n.files.map(f => `<div>${ic('clip', 16)} ${esc(f)}</div>`).join('')}</div>` : ''}
      </div>
      ${url ? `<div class="btns"><a class="btn" href="${esc(url)}" target="_blank" rel="noopener">${ic('ext', 18)} 홈페이지 원문·첨부파일 보기</a></div>` : ''}
      <div class="btns"><button class="btn line" data-share>${ic('ext', 18)} 카카오톡 등으로 공유</button></div>
      ${me.admin && n.source === 'app' ? `<div class="btns"><button class="btn danger" data-del>이 공지 삭제</button></div>` : ''}`});
    bindCommon();
    $app.querySelector('[data-share]').onclick = () => {
      const text = `[${P.name}] ${n.title}` + (url ? '\n' + url : '');
      if (navigator.share) navigator.share({title:n.title, text}).catch(() => {});
      else { navigator.clipboard && navigator.clipboard.writeText(text); toast('내용을 복사했습니다'); }
    };
    const del = $app.querySelector('[data-del]');
    if (del) del.onclick = async () => { if (await confirmBox('이 공지를 삭제할까요?', '삭제')) { await S.deleteNotice(id); toast('삭제했습니다'); go('#notices'); } };
  }

  /* ---------- 일정 ---------- */
  let calY = TODAY.getFullYear(), calM = TODAY.getMonth(), calSel = todayStr;
  async function viewCalendar() {
    const events = await S.listEvents();
    const first = new Date(calY, calM, 1), start = first.getDay(), days = new Date(calY, calM + 1, 0).getDate();
    const has = new Set(events.map(e => e.date));
    let cells = '';
    for (let i = 0; i < start; i++) cells += `<span class="d other"></span>`;
    for (let d = 1; d <= days; d++) {
      const s = ymd(new Date(calY, calM, d)), dow = (start + d - 1) % 7;
      cells += `<button class="d ${dow === 0 ? 'sun' : ''} ${s === todayStr ? 'today' : ''} ${s === calSel ? 'sel' : ''}" data-d="${s}">${d}${has.has(s) ? '<i></i>' : ''}</button>`;
    }
    const monthKey = `${calY}-${String(calM + 1).padStart(2, '0')}`;
    const monthEvents = events.filter(e => e.date.startsWith(monthKey));
    const dayEvents = events.filter(e => e.date === calSel);
    $app.innerHTML = frame({title:'노회 일정', sub:P.name, tab:'calendar', body:`
      <div class="cal">
        <div class="head"><button data-m="-1" aria-label="이전 달">${ic('left', 20, 2.2)}</button><b>${calY}년 ${calM + 1}월</b><button data-m="1" aria-label="다음 달">${ic('right', 20, 2.2)}</button></div>
        <div class="grid">${DOW.map(d => `<span class="dow">${d}</span>`).join('')}${cells}</div>
      </div>
      <h2 class="sec">${kdate(calSel)}</h2>
      <div class="list">${dayEvents.map(eventRow).join('') || '<div class="empty">이날 일정이 없습니다</div>'}</div>
      <h2 class="sec">${calM + 1}월 전체 일정 <span class="muted small">${monthEvents.length}건</span></h2>
      <div class="list">${monthEvents.map(eventRow).join('') || '<div class="empty">이달 일정이 없습니다</div>'}</div>
      ${me.admin ? `<div class="btns"><button class="btn" data-go="#admin/event">${ic('plus', 20)} 일정 등록</button></div>` : ''}`});
    bindCommon(); bindIcs(events);
    $app.querySelectorAll('[data-m]').forEach(b => b.onclick = () => { calM += +b.dataset.m; if (calM < 0) { calM = 11; calY--; } if (calM > 11) { calM = 0; calY++; } viewCalendar(); });
    $app.querySelectorAll('[data-d]').forEach(b => b.onclick = () => { calSel = b.dataset.d; viewCalendar(); });
  }
  function bindIcs(events) {
    $app.querySelectorAll('[data-ics]').forEach(b => b.onclick = () => {
      const e = events.find(x => x.id === b.dataset.ics); if (!e) return;
      const d = e.date.replace(/-/g, ''), nd = ymd(new Date(new Date(e.date + 'T00:00:00').getTime() + 864e5)).replace(/-/g, '');
      const ics = ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//nohoe-mobile//KO','BEGIN:VEVENT','UID:' + e.id + '@' + P.id,
        'DTSTART;VALUE=DATE:' + d, 'DTEND;VALUE=DATE:' + nd, 'SUMMARY:[' + P.name + '] ' + e.title,
        e.place ? 'LOCATION:' + e.place : '', 'END:VEVENT','END:VCALENDAR'].filter(Boolean).join('\r\n');
      const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([ics], {type:'text/calendar'})); a.download = `${e.date}_${e.title}.ics`; a.click();
      toast('휴대폰 달력에 추가할 파일을 열었습니다');
    });
  }

  /* ---------- 신청 ---------- */
  async function viewApply() {
    const mine = me.admin ? [] : await S.listMyRequests();
    $app.innerHTML = frame({title:'신청', sub:'사무국에 요청하기', tab:'apply', body:`
      <div class="list">
        <a class="row" href="#apply/cert"><span class="datebox">${ic('cert', 24)}</span><span class="grow"><span class="t">증명서 발급 신청</span><span class="s">소속·재직·대표자·직인·안수·경력·사례비·기타</span></span><span class="chev">${ic('chev', 18)}</span></a>
        <a class="row" href="#apply/doc"><span class="datebox">${ic('mail', 24)}</span><span class="grow"><span class="t">공문서·서류 요청</span><span class="s">공문 발송, 서류 사본, 확인서 등</span></span><span class="chev">${ic('chev', 18)}</span></a>
        <a class="row" href="#forms"><span class="datebox">${ic('doc', 24)}</span><span class="grow"><span class="t">행정서식 내려받기</span><span class="s">청빙·장로선택·고시 청원 등 ${D.forms.length}종</span></span><span class="chev">${ic('chev', 18)}</span></a>
      </div>
      <h2 class="sec">내 신청 현황</h2>
      ${me.admin ? `<div class="card small">사무장님은 <a href="#admin">관리 화면</a>에서 모든 신청을 처리하실 수 있습니다.</div>` :
        `<div class="list">${mine.map(reqRow).join('') || '<div class="empty">신청 내역이 없습니다</div>'}</div>`}
      <h2 class="sec">홈페이지에서 직접 하기</h2>
      <div class="list">
        <a class="row" href="${P.mailboxUrl}" target="_blank" rel="noopener"><span class="grow"><span class="t">온라인 공문 사서함</span><span class="s">교회별 사서함 아이디로 로그인</span></span><span class="chev">${ic('ext', 18)}</span></a>
        <a class="row" href="${P.budgetUrl}" target="_blank" rel="noopener"><span class="grow"><span class="t">부서예산 신청</span><span class="s">홈페이지 회원 로그인</span></span><span class="chev">${ic('ext', 18)}</span></a>
        <a class="row" href="${P.certUrl}" target="_blank" rel="noopener"><span class="grow"><span class="t">홈페이지 증명서 신청서</span><span class="s">기존 방식으로 신청할 때</span></span><span class="chev">${ic('ext', 18)}</span></a>
      </div>`});
    bindCommon();
  }
  function reqRow(r) {
    return `<a class="row" href="#request/${r.id}"><span class="grow"><span class="t">${esc(r.title)}</span><span class="s">${kdt(r.createdAt)} 신청${r.updatedAt !== r.createdAt ? ' · ' + kdt(r.updatedAt) + ' 변경' : ''}</span></span>${statusPill(r.status)}</a>`;
  }

  function churchPrefill() {
    if (me.church === P.officeGroup) return {church:P.officeGroup, pastor:'', address:P.office.address, tel:P.office.tel, fax:P.office.fax};
    const c = churchOf(me.church) || [];
    return {church:me.church, pastor:c[2] || '', address:c[3] || '', tel:c[4] || '', fax:c[5] || ''};
  }

  function viewCert() {
    if (me.admin) { toast('사무장 계정은 신청 대신 처리를 합니다'); return go('#admin'); }
    const pf = churchPrefill();
    $app.innerHTML = frame({title:'증명서 발급 신청', back:true, noTabs:true, body:`
      <form id="f">
        <div class="prefill"><b>교회 정보</b> <span class="muted">(노회 주소록에서 자동 입력)</span>
          <dl><dt>교회</dt><dd>${esc(pf.church)}</dd><dt>담임</dt><dd>${esc(pf.pastor) || '-'}</dd><dt>주소</dt><dd>${esc(pf.address) || '-'}</dd><dt>전화</dt><dd>${esc(pf.tel) || '-'}</dd><dt>팩스</dt><dd>${esc(pf.fax) || '<span class="muted">주소록에 없음 · 아래에 입력</span>'}</dd></dl></div>
        <div class="field"><label>증명 대상자<em>*</em></label>
          <div class="two"><input class="input" name="name" value="${esc(me.name)}" placeholder="성명" required><input class="input" name="role" value="${esc(me.role)}" placeholder="직분 및 관계" required></div></div>
        <div class="two">
          <div class="field"><label>생년월일<em>*</em></label><input class="input" name="birth" placeholder="예) 1971-03-15" required></div>
          <div class="field"><label>연락처<em>*</em></label><input class="input" name="phone" type="tel" value="${esc(me.phone)}" required></div>
        </div>
        <h2 class="sec">필요한 증명서 <span class="muted small">여러 개 선택 가능</span></h2>
        ${P.certificates.map(c => `
          <div class="certbox" data-c="${c.id}">
            <label><input type="checkbox" name="c_${c.id}"> ${esc(c.name)}${c.note ? ` <span class="pill gold">${esc(c.note)}</span>` : ''}</label>
            <div class="more">
              ${c.extra ? `<div class="field"><label>${esc(c.extra)}</label><input class="input" name="x_${c.id}"></div>` : ''}
              <div class="two">
                <div class="field"><label>부수</label><select class="input" name="n_${c.id}">${[1,2,3,4,5].map(n => `<option>${n}</option>`).join('')}</select></div>
                <div class="field"><label>제출처</label><input class="input" name="s_${c.id}" placeholder="예) 은행, 학교"></div>
              </div>
              <div class="field"><label>용도</label><input class="input" name="p_${c.id}" placeholder="예) 대출 서류, 비자 신청"></div>
              ${c.attach ? `<div class="note gold" style="margin:0 0 12px">첨부 서류는 사무국 이메일(${esc(P.office.email)})로 보내 주세요.</div>` : ''}
            </div>
          </div>`).join('')}
        <h2 class="sec">받는 방법</h2>
        <div class="radios">${P.receiveMethods.map((m, i) => `<label><input type="radio" name="receive" value="${esc(m)}" ${i === 0 ? 'checked' : ''}> ${esc(m)}</label>`).join('')}</div>
        <div class="field" style="margin-top:12px" id="faxf"><label>받을 팩스 번호</label><input class="input" name="fax" type="tel" value="${esc(pf.fax)}"></div>
        <div class="field"><label>사무국에 남길 말</label><textarea class="input" name="memo" placeholder="급한 날짜 등"></textarea></div>
        <label class="check"><input type="checkbox" name="agree" required><span class="small">본 신청은 신청자 본인 또는 대표자로부터 위임받아 하는 것이며, 증명서 발급을 위한 개인정보 이용에 동의합니다.</span></label>
        <button class="btn" type="submit">신청하기</button>
      </form>`});
    bindCommon();
    const f = $app.querySelector('#f');
    f.querySelectorAll('.certbox input[type=checkbox]').forEach(cb => cb.onchange = () => cb.closest('.certbox').classList.toggle('on', cb.checked));
    const faxToggle = () => { $app.querySelector('#faxf').style.display = f.receive.value === '교회팩스' ? '' : 'none'; };
    f.querySelectorAll('[name=receive]').forEach(r => r.onchange = faxToggle); faxToggle();
    f.onsubmit = async e => {
      e.preventDefault();
      const items = P.certificates.filter(c => f['c_' + c.id].checked).map(c => ({
        cert:c.name, copies:+f['n_' + c.id].value, submitTo:f['s_' + c.id].value.trim(), purpose:f['p_' + c.id].value.trim(),
        extra:c.extra ? (f['x_' + c.id].value.trim() ? `${c.extra}: ${f['x_' + c.id].value.trim()}` : '') : ''}));
      if (!items.length) return toast('증명서를 하나 이상 선택해 주세요');
      if (f.receive.value === '교회팩스' && digits(f.fax.value).length < 9) return toast('받을 팩스 번호를 입력해 주세요');
      const title = items.map(i => `${i.cert} ${i.copies}부`).join(', ');
      const r = await S.addRequest({kind:'cert', title, church:pf.church, churchInfo:pf, name:f.name.value.trim(), role:f.role.value.trim(), birth:f.birth.value.trim(), phone:f.phone.value.trim(),
        items, receive:f.receive.value, fax:f.receive.value === '교회팩스' ? f.fax.value.trim() : '', memo:f.memo.value.trim()});
      toast('신청이 접수되었습니다'); go('#request/' + r.id);
    };
  }

  function viewDoc() {
    if (me.admin) { toast('사무장 계정은 신청 대신 처리를 합니다'); return go('#admin'); }
    $app.innerHTML = frame({title:'공문서·서류 요청', back:true, noTabs:true, body:`
      <div class="note" style="margin:0 0 14px">노회 사무장님께 직접 요청하는 창구입니다. 처리 상황은 '내 신청 현황'과 알림으로 알려드립니다.</div>
      <form id="f">
        <div class="field"><label>요청 종류<em>*</em></label><select class="input" name="type">${P.docTypes.map(t => `<option>${t}</option>`).join('')}</select></div>
        <div class="field"><label>제목<em>*</em></label><input class="input" name="title" required placeholder="예) 제17회 정기노회 회의록 중 우리 교회 청원 결의 부분"></div>
        <div class="field"><label>내용<em>*</em></label><textarea class="input" name="body" required placeholder="필요한 서류와 쓰실 곳을 적어 주세요"></textarea></div>
        <div class="field"><label>필요한 날짜</label><input class="input" type="date" name="due" min="${todayStr}"></div>
        <h2 class="sec">받는 방법</h2>
        <div class="radios">${P.receiveMethods.map((m, i) => `<label><input type="radio" name="receive" value="${esc(m)}" ${i === 1 ? 'checked' : ''}> ${esc(m)}</label>`).join('')}</div>
        <div class="btns" style="margin-top:18px"><button class="btn" type="submit">요청 보내기</button></div>
      </form>`});
    bindCommon();
    const f = $app.querySelector('#f');
    f.onsubmit = async e => {
      e.preventDefault();
      const pf = churchPrefill();
      const r = await S.addRequest({kind:'doc', docType:f.type.value, title:`[${f.type.value}] ${f.title.value.trim()}`, body:f.body.value.trim(), due:f.due.value,
        church:pf.church, churchInfo:pf, name:me.name, role:me.role, phone:me.phone, receive:f.receive.value, memo:''});
      toast('요청을 보냈습니다'); go('#request/' + r.id);
    };
  }

  async function viewRequest(id) {
    const list = me.admin ? await S.listAllRequests() : await S.listMyRequests();
    const r = list.find(x => x.id === id); if (!r) return go('#apply');
    const order = ['received','working','done'];
    const idx = r.status === 'rejected' ? -1 : order.indexOf(r.status);
    $app.innerHTML = frame({title:'신청 상세', back:true, tab:'apply', body:`
      <div class="card">
        <div style="display:flex;justify-content:space-between;gap:8px;align-items:flex-start"><b>${esc(r.title)}</b>${statusPill(r.status)}</div>
        ${r.status === 'rejected' ? '' : `<div class="steps">${['접수','처리 중','처리 완료'].map((s, i) => `<div class="${i <= idx ? 'on' : ''}">${s}</div>`).join('')}</div>`}
        ${r.adminNote ? `<div class="note ${r.status === 'done' ? 'ok' : r.status === 'rejected' ? 'gold' : ''}"><b>사무국 안내</b><br>${esc(r.adminNote)}</div>` : ''}
      </div>
      <div class="card">${reqDetail(r)}</div>
      <div class="btns"><a class="btn line" href="${telHref(P.office.tel)}">${ic('phone', 20)} 사무국 문의</a></div>`});
    bindCommon();
  }
  function reqDetail(r) {
    const rows = [['구분', r.kind === 'cert' ? '증명서 발급' : (r.docType || '공문서 요청')], ['교회', r.church], ['신청인', `${r.name} ${r.role || ''}`], ['연락처', r.phone]];
    if (r.birth) rows.push(['생년월일', r.birth]);
    if (r.items) r.items.forEach(i => rows.push([i.cert, [`${i.copies}부`, i.submitTo && '제출처 ' + i.submitTo, i.purpose && '용도 ' + i.purpose, i.extra].filter(Boolean).join(' · ')]));
    if (r.body) rows.push(['내용', r.body]);
    if (r.due) rows.push(['필요일', kdate(r.due)]);
    rows.push(['받는 방법', r.receive + (r.fax ? ` (${r.fax})` : '')]);
    if (r.memo) rows.push(['남긴 말', r.memo]);
    rows.push(['신청일시', kdt(r.createdAt)]);
    return `<dl class="kv">${rows.map(([k, v]) => `<dt>${esc(k)}</dt><dd style="white-space:pre-wrap">${esc(v)}</dd>`).join('')}</dl>`;
  }

  /* ---------- 교회찾기 · 더보기 ---------- */
  let dirGroup = '전체', dirQ = '';
  function viewChurches() {
    const q = dirQ.trim();
    const rows = D.directory.filter(r => (dirGroup === '전체' || r[0] === dirGroup) && (!q || (r[1] + r[2] + r[3]).includes(q)));
    $app.innerHTML = frame({title:'노회 주소록', sub:`${D.directory.length}곳`, back:true, tab:'more', body:`
      <div class="search">${ic('search', 20)}<input class="input" id="q" type="search" placeholder="교회명·목사님·지역 검색" value="${esc(dirQ)}"></div>
      <div class="chips">${['전체'].concat(P.groups).map(g => `<button class="${g === dirGroup ? 'on' : ''}" data-g="${g}">${g}</button>`).join('')}</div>
      <div id="res">${dirList(rows)}</div>`});
    bindCommon();
    const qi = $app.querySelector('#q');
    qi.oninput = () => { dirQ = qi.value; const q2 = dirQ.trim(); $app.querySelector('#res').innerHTML = dirList(D.directory.filter(r => (dirGroup === '전체' || r[0] === dirGroup) && (!q2 || (r[1] + r[2] + r[3]).includes(q2)))); };
    $app.querySelectorAll('[data-g]').forEach(b => b.onclick = () => { dirGroup = b.dataset.g; viewChurches(); });
  }
  function dirList(rows) {
    if (!rows.length) return '<div class="empty">찾는 결과가 없습니다</div>';
    return `<p class="small muted" style="margin:0 2px 8px">${rows.length}곳</p>` + rows.map(r => {
      const isOrg = ['기도처','전도기관','선교사'].includes(r[0]);
      const name = isOrg || /교회$/.test(r[1]) ? r[1] : r[1] + '교회';
      return `<div class="church"><div class="nm">${esc(name)} <span class="pill navy">${esc(r[0])}</span></div>
        <div class="ps">${r[2] ? esc(r[2]) + (isOrg || /선교사|군목/.test(r[2]) ? '' : ' 목사') : '<span class="muted">담임 정보 없음</span>'}</div>
        ${r[3] ? `<div class="ad">${esc(r[3])}</div>` : ''}
        <div class="acts">
          ${r[4] ? `<a href="${telHref(r[4])}">${ic('phone', 16)} 전화</a>` : ''}
          ${r[3] && /\d{5}/.test(r[3]) ? `<a href="${mapHref(r[3])}" target="_blank" rel="noopener">${ic('map', 16)} 길찾기</a>` : ''}
          ${validHome(r[6]) ? `<a href="${esc(r[6])}" target="_blank" rel="noopener">${ic('globe', 16)} 홈페이지</a>` : ''}
        </div></div>`;
    }).join('');
  }

  function viewForms() {
    const groups = [...new Set(D.forms.map(f => f.group))];
    $app.innerHTML = frame({title:'행정서식', sub:`${D.forms.length}종 · 노회 홈페이지 자료실`, back:true, tab:'more', body:
      groups.map(g => `<h2 class="sec">${esc(g)}</h2><div class="list">${D.forms.filter(f => f.group === g).map(f =>
        `<a class="row" href="${esc(P.formUrl(f.seq))}" target="_blank" rel="noopener"><span class="grow"><span class="t">${esc(f.title)}</span></span><span class="chev">${ic('ext', 18)}</span></a>`).join('')}</div>`).join('') +
      `<div class="note">서식 파일(한글·PDF)은 노회 홈페이지에서 내려받습니다. 한글 파일은 휴대폰에서 '한컴오피스 Viewer' 앱으로 열 수 있습니다.</div>`});
    bindCommon();
  }

  function viewMore() {
    const fs = localStorage.getItem('nm_fs') || 'm';
    $app.innerHTML = frame({title:'더보기', sub:P.name, tab:'more', body:`
      <div class="card"><b>${esc(me.name)} ${esc(honor(me.role))}</b><div class="small muted">${esc(me.church)}${me.group ? ' · ' + esc(me.group) : ''} · ${esc(me.phone || '')}</div></div>
      <h2 class="sec">노회 업무</h2>
      <div class="list">
        <a class="row" href="#churches"><span class="grow"><span class="t">노회 주소록</span><span class="s">${D.directory.length}개 교회·기관 · 전화·길찾기</span></span><span class="chev">${ic('chev', 18)}</span></a>
        <a class="row" href="#forms"><span class="grow"><span class="t">행정서식</span><span class="s">${D.forms.length}종</span></span><span class="chev">${ic('chev', 18)}</span></a>
        <a class="row" href="#office"><span class="grow"><span class="t">노회 사무국 안내</span><span class="s">주소·전화·팩스·이메일</span></span><span class="chev">${ic('chev', 18)}</span></a>
        <a class="row" href="${P.homepage}/index.asp" target="_blank" rel="noopener"><span class="grow"><span class="t">노회 홈페이지</span><span class="s">노회소개·역사·조직·규칙·앨범</span></span><span class="chev">${ic('ext', 18)}</span></a>
        ${me.admin ? `<a class="row" href="#admin"><span class="grow"><span class="t">사무장 관리</span></span><span class="chev">${ic('chev', 18)}</span></a>` : ''}
      </div>
      <h2 class="sec">글자 크기</h2>
      <div class="seg">${[['m','보통'],['l','크게'],['xl','아주 크게']].map(([k, l]) => `<button data-fs="${k}" class="${fs === k ? 'on' : ''}">${l}</button>`).join('')}</div>
      <h2 class="sec">앱 정보</h2>
      <div class="list">
        <a class="row" href="privacy.html" target="_blank"><span class="grow"><span class="t">개인정보처리방침</span></span><span class="chev">${ic('chev', 18)}</span></a>
        <div class="row" style="cursor:default"><span class="grow"><span class="t">버전</span></span><span class="muted small">${C.version}${S.mode === 'demo' ? ' (체험)' : ''}</span></div>
      </div>
      <div class="btns"><button class="btn danger" data-out>${S.mode === 'demo' ? '체험 마치기' : '이 휴대폰에서 탈퇴'}</button></div>
      ${S.mode === 'demo' ? `<div class="btns"><button class="btn line sm" data-reset>체험 자료 처음 상태로</button></div>` : ''}
      <div class="foot">${esc(C.copyright)}</div>`});
    bindCommon();
    $app.querySelectorAll('[data-fs]').forEach(b => b.onclick = () => { localStorage.setItem('nm_fs', b.dataset.fs); applyFs(); viewMore(); });
    $app.querySelector('[data-out]').onclick = async () => {
      const msg = S.mode === 'demo' ? '체험을 마치고 첫 화면으로 갈까요?' : '이 휴대폰에서 탈퇴하면 다시 가입 신청과 승인이 필요합니다. 계속할까요?';
      if (await confirmBox(msg, '확인')) { await S.logout(); me = null; location.hash = ''; route(); }
    };
    const rs = $app.querySelector('[data-reset]');
    if (rs) rs.onclick = async () => { if (await confirmBox('체험 중 입력한 내용을 모두 지울까요?', '지우기')) { await S.resetDemo(); me = null; location.hash = ''; route(); } };
  }
  function applyFs() { const fs = localStorage.getItem('nm_fs') || 'm'; document.documentElement.className = fs === 'm' ? '' : 'fs-' + fs; }

  function viewOffice() {
    const o = P.office;
    $app.innerHTML = frame({title:'노회 사무국', back:true, tab:'more', body:`
      <div class="card"><b>${esc(P.fullName)} 사무국</b>
        <dl class="kv" style="margin-top:12px"><dt>주소</dt><dd>${esc(o.address)}</dd><dt>전화</dt><dd>${esc(o.tel)}</dd><dt>팩스</dt><dd>${esc(o.fax)}</dd><dt>이메일</dt><dd>${esc(o.email)}</dd></dl></div>
      <div class="btns"><a class="btn" href="${telHref(o.tel)}">${ic('phone', 20)} 전화하기</a><a class="btn line" href="mailto:${esc(o.email)}">${ic('mail', 20)} 이메일</a></div>
      <div class="btns"><a class="btn soft" href="${mapHref(o.address)}" target="_blank" rel="noopener">${ic('map', 20)} 오시는 길 (지도)</a></div>`});
    bindCommon();
  }

  async function viewAlerts() {
    const ns = await S.listNotifications();
    $app.innerHTML = frame({title:'알림', back:true, tab:'home', body:`
      <div class="list">${ns.map(n => `<a class="row ${n.read ? '' : 'unread'}" href="#${linkOf(n.link)}"><span class="grow"><span class="t">${esc(n.title)}</span><span class="s">${esc(n.body)} · ${kdt(n.createdAt)}</span></span><span class="chev">${ic('chev', 18)}</span></a>`).join('') || '<div class="empty">새 알림이 없습니다</div>'}</div>
      <div class="note small">새 공지, 일정, 신청 처리 결과가 여기에 모입니다.${S.mode === 'live' ? '' : ' 실제 운영에서는 휴대폰 알림(푸시)으로도 받으실 수 있습니다.'}</div>`});
    bindCommon();
    await S.markNotificationsRead(); unread = 0;
    const dot = $app.querySelector('.iconbtn .dot'); if (dot) dot.remove();
  }
  const linkOf = l => !l ? 'home' : l.startsWith('notice:') ? 'notice/' + l.slice(7) : l.startsWith('request:') ? 'request/' + l.slice(8) : l;

  /* ---------- 사무장 관리 ---------- */
  let reqFilter = 'open';
  async function viewAdmin(sub) {
    if (!me.admin) return go('#home');
    const [reqs, pend] = await Promise.all([S.listAllRequests(), S.listMembers('pending')]);
    const cnt = s => reqs.filter(r => r.status === s).length;
    const tabs = [['','신청 처리'],['notice','공지 등록'],['event','일정 등록'],['members','가입 승인' + (pend.length ? ` ${pend.length}` : '')]];
    let body = `<div class="seg">${tabs.map(([k, l]) => `<button class="${(sub || '') === k ? 'on' : ''}" data-go="#admin${k ? '/' + k : ''}">${l}</button>`).join('')}</div>`;

    if (!sub) {
      const shown = reqs.filter(r => reqFilter === 'open' ? (r.status === 'received' || r.status === 'working') : r.status === reqFilter);
      body += `<div class="stat"><div><b>${cnt('received')}</b><span>새 접수</span></div><div><b>${cnt('working')}</b><span>처리 중</span></div><div><b>${cnt('done')}</b><span>완료</span></div></div>
        <div class="chips">${[['open','처리 대기'],['done','완료'],['rejected','반려']].map(([k, l]) => `<button class="${reqFilter === k ? 'on' : ''}" data-f="${k}">${l}</button>`).join('')}</div>
        ${shown.map(r => `<div class="card" style="margin-bottom:10px">
          <div style="display:flex;justify-content:space-between;gap:8px"><b>${esc(r.title)}</b>${statusPill(r.status)}</div>
          <div class="small muted" style="margin:4px 0 10px">${esc(r.church)} · ${esc(r.name)} ${esc(r.role || '')} · ${kdt(r.createdAt)}</div>
          <details><summary class="small" style="cursor:pointer;color:var(--info)">신청 내용 전체 보기</summary><div style="margin-top:10px">${reqDetail(r)}</div></details>
          <div class="field" style="margin-top:12px"><label>신청인에게 보낼 안내</label><textarea class="input" data-note="${r.id}" style="min-height:70px" placeholder="예) 내일 오전 교회 팩스로 보내드리겠습니다">${esc(r.adminNote)}</textarea></div>
          <div class="actgrid">
            <button class="btn soft sm" data-st="working" data-id="${r.id}">처리 중</button>
            <button class="btn sm" data-st="done" data-id="${r.id}">처리 완료</button>
            <button class="btn danger sm" data-st="rejected" data-id="${r.id}">반려</button>
            <a class="btn line sm" href="${telHref(r.phone)}">${ic('phone', 16)} 전화</a>
          </div></div>`).join('') || '<div class="empty">해당하는 신청이 없습니다</div>'}`;
    }
    if (sub === 'notice') {
      body += `<form id="f">
        <div class="field"><label>구분</label><select class="input" name="cat"><option value="notice">노회공지</option><option value="news">소속교회 동정</option></select></div>
        <div class="field"><label>제목<em>*</em></label><input class="input" name="title" required maxlength="80"><div class="hint">휴대폰 알림에 그대로 뜹니다. 30자 안쪽이 보기 좋습니다.</div></div>
        <div class="field"><label>내용</label><textarea class="input" name="body" placeholder="요약 내용 (첨부파일은 홈페이지 원문에)"></textarea></div>
        <div class="field"><label>홈페이지 원문 주소</label><input class="input" name="link" type="url" placeholder="https://sdbpck.or.kr/..."><div class="hint">홈페이지에 올린 글 주소를 붙여넣으면 '원문 보기' 버튼이 생깁니다.</div></div>
        <label class="check"><input type="checkbox" name="pinned"><span>필독 공지로 맨 위에 고정</span></label>
        <label class="check"><input type="checkbox" name="urgent"><span>긴급 공지 (알림에 [긴급] 표시)</span></label>
        <button class="btn" type="submit">등록하고 전체 회원에게 알리기</button></form>`;
    }
    if (sub === 'event') {
      const evs = (await S.listEvents()).filter(e => e.date >= todayStr);
      body += `<form id="f">
        <div class="field"><label>일정 이름<em>*</em></label><input class="input" name="title" required></div>
        <div class="two"><div class="field"><label>날짜<em>*</em></label><input class="input" type="date" name="date" required value="${todayStr}"></div>
        <div class="field"><label>시간</label><input class="input" type="time" name="time"></div></div>
        <div class="field"><label>장소</label><input class="input" name="place"></div>
        <label class="check"><input type="checkbox" name="important"><span>중요 일정으로 표시 (정기노회 등)</span></label>
        <button class="btn" type="submit">일정 등록</button></form>
        <h2 class="sec">앞으로의 일정</h2>
        <div class="list">${evs.map(e => `<div class="row" style="cursor:default"><span class="grow"><span class="t">${esc(e.title)}</span><span class="s">${kdate(e.date)} ${esc(e.time || '')} ${esc(e.place || '')}</span></span>${e.source === 'homepage' ? '<span class="pill navy">홈페이지</span>' : `<button class="btn danger sm" data-delev="${e.id}">삭제</button>`}</div>`).join('') || '<div class="empty">등록된 일정이 없습니다</div>'}</div>`;
    }
    if (sub === 'members') {
      const all = await S.listMembers();
      const ok = all.filter(m => m.status === 'approved');
      body += `<h2 class="sec">승인 대기 ${pend.length}명</h2>
        ${pend.map(m => `<div class="card" style="margin-bottom:8px"><b>${esc(m.name)} ${esc(m.role)}</b><div class="small muted">${esc(m.church)} · ${esc(m.group)} · ${esc(m.phone)} · ${kdt(m.createdAt)}</div>
          <div class="btns"><button class="btn sm" data-ok="${m.id}">승인</button><button class="btn danger sm" data-no="${m.id}">반려</button><a class="btn line sm" href="${telHref(m.phone)}">${ic('phone', 16)} 전화</a></div></div>`).join('') || '<div class="empty">승인 대기 중인 신청이 없습니다</div>'}
        <h2 class="sec">승인된 회원 ${ok.length}명</h2>
        <div class="list">${ok.map(m => `<div class="row" style="cursor:default"><span class="grow"><span class="t">${esc(m.name)} ${esc(m.role)}</span><span class="s">${esc(m.church)}</span></span></div>`).join('') || '<div class="empty">아직 없습니다</div>'}</div>`;
    }

    $app.innerHTML = frame({title:'사무장 관리', sub:P.name, back:true, tab:'home', body});
    bindCommon();
    $app.querySelectorAll('[data-f]').forEach(b => b.onclick = () => { reqFilter = b.dataset.f; viewAdmin(sub); });
    $app.querySelectorAll('[data-st]').forEach(b => b.onclick = async () => {
      const note = $app.querySelector(`[data-note="${b.dataset.id}"]`).value.trim();
      if (b.dataset.st === 'rejected' && !note) return toast('반려 사유를 안내란에 적어 주세요');
      await S.updateRequest(b.dataset.id, {status:b.dataset.st, adminNote:note});
      toast('신청인에게 알림을 보냈습니다'); viewAdmin(sub);
    });
    const f = $app.querySelector('#f');
    if (f && sub === 'notice') f.onsubmit = async e => {
      e.preventDefault();
      await S.addNotice({cat:f.cat.value, title:f.title.value.trim(), body:f.body.value.trim(), link:f.link.value.trim(), pinned:f.pinned.checked, urgent:f.urgent.checked, files:[]});
      toast('공지를 등록하고 알림을 보냈습니다'); await refreshBadges(); go('#notices');
    };
    if (f && sub === 'event') f.onsubmit = async e => {
      e.preventDefault();
      await S.addEvent({title:f.title.value.trim(), date:f.date.value, time:f.time.value, place:f.place.value.trim(), important:f.important.checked});
      toast('일정을 등록했습니다'); viewAdmin('event');
    };
    $app.querySelectorAll('[data-delev]').forEach(b => b.onclick = async () => { if (await confirmBox('이 일정을 삭제할까요?', '삭제')) { await S.deleteEvent(b.dataset.delev); viewAdmin('event'); } });
    $app.querySelectorAll('[data-ok]').forEach(b => b.onclick = async () => { await S.setMemberStatus(b.dataset.ok, 'approved'); toast('승인했습니다'); viewAdmin('members'); });
    $app.querySelectorAll('[data-no]').forEach(b => b.onclick = async () => { if (await confirmBox('가입 신청을 반려할까요?', '반려')) { await S.setMemberStatus(b.dataset.no, 'rejected'); viewAdmin('members'); } });
  }

  /* ---------- 길잡이 ---------- */
  async function route() {
    window.scrollTo(0, 0);
    if (!me) me = await S.currentUser();
    if (!me) return viewWelcome();
    if (me.status !== 'approved') return viewPending();
    const [page, arg] = location.hash.replace(/^#/, '').split('/');
    await refreshBadges();
    switch (page) {
      case 'notices': return viewNotices();
      case 'notice': return viewNotice(arg);
      case 'calendar': return viewCalendar();
      case 'apply': return arg === 'cert' ? viewCert() : arg === 'doc' ? viewDoc() : viewApply();
      case 'request': return viewRequest(arg);
      case 'churches': return viewChurches();
      case 'forms': return viewForms();
      case 'office': return viewOffice();
      case 'more': return viewMore();
      case 'alerts': return viewAlerts();
      case 'admin': return viewAdmin(arg);
      default: return viewHome();
    }
  }

  window.addEventListener('hashchange', route);
  applyFs();
  localStorage.setItem('nm_pid', P.id);
  document.title = P.name + ' 모바일';
  S.init().then(route).catch(err => {
    $app.innerHTML = `<div class="welcome"><h1>연결할 수 없습니다</h1><p class="sub">인터넷 연결을 확인한 뒤 다시 열어 주세요.</p><div class="card small muted">${esc(err.message || err)}</div></div>`;
  });
  if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {});
})();
