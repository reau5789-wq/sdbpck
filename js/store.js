/* ================================================================
   데이터 저장소
   - DemoStore  : 체험 모드. 이 휴대폰(브라우저)에만 저장됩니다.
   - FirebaseStore : 실제 운영. 모든 회원이 같은 자료를 봅니다.
   두 저장소는 똑같은 함수 이름을 가지므로 화면 코드는 바꿀 필요가 없습니다.
   Firestore 경로: presbyteries/{노회ID}/{members|notices|events|requests|notifications}
   ================================================================ */
(function () {
  const C = window.APP_CONFIG;
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

  /* 홈페이지 게시판 연동 — GitHub가 30분마다 만드는 data/board.json을 읽습니다 */
  let feedCache = null, feedAt = 0;
  async function loadFeed() {
    if (feedCache && Date.now() - feedAt < 60000) return feedCache;
    try {
      const r = await fetch('data/board.json?t=' + Date.now(), {cache:'no-store'});
      if (!r.ok) throw new Error(r.status);
      const j = await r.json();
      const conv = (arr, cat) => (arr || []).map(x => ({id:'n' + x.seq, seq:x.seq, cat, title:x.title, date:x.date, pinned:!!x.pinned,
        files:x.hasFile ? ['첨부파일 있음'] : [], body:'', source:'homepage', createdAt:x.date + 'T09:00:00+09:00'}));
      feedCache = conv(j.notice, 'notice').concat(conv(j.news, 'news')); feedAt = Date.now();
    } catch (e) { feedCache = feedCache || []; }
    return feedCache;
  }
  /* 기본 자료(홈페이지 초기 수집) + 연동 자료 + 앱에서 쓴 공지를 합칩니다. 같은 글은 연동 자료가 우선 */
  function mergeNotices(base, feed) {
    const m = new Map(base.map(n => [n.id, n]));
    feed.forEach(n => m.set(n.id, {...(m.get(n.id) || {}), ...n}));
    return [...m.values()].sort((a, b) => ((b.pinned ? 1 : 0) - (a.pinned ? 1 : 0)) || b.date.localeCompare(a.date) || (b.createdAt || '').localeCompare(a.createdAt || ''));
  }
  const nowIso = () => new Date().toISOString();

  /* ---------------- 체험 모드 ---------------- */
  function DemoStore(pid) {
    const KEY = 'nm_demo_' + pid;
    const seed = window.PRESBYTERY_DATA[pid];
    let db;
    const load = () => {
      try { db = JSON.parse(localStorage.getItem(KEY)); } catch (e) { db = null; }
      if (!db) {
        db = {
          me: null,
          members: [
            {id:'m1', name:'홍길동', church:'마석', group:'가화시찰', role:'장로', phone:'010-0000-0001', status:'pending', createdAt:'2026-10-24T09:10:00+09:00'},
            {id:'m2', name:'김은혜', church:'화도', group:'가화시찰', role:'전도사', phone:'010-0000-0002', status:'pending', createdAt:'2026-10-24T10:02:00+09:00'}
          ],
          notices: seed.notices.map(n => ({...n, id:'n' + n.seq, body:'', source:'homepage', createdAt:n.date + 'T09:00:00+09:00'})),
          events: seed.events.map((e, i) => ({...e, id:'e' + i, time:e.time || '', place:e.place || ''})),
          requests: [
            {id:'r-sample', uid:'demo-member', kind:'cert', title:'재직증명 1부', church:'동부광성생명샘', name:'체험회원', role:'장로', phone:'010-0000-0000',
             items:[{cert:'재직증명', copies:1, submitTo:'은행', purpose:'제출용'}], receive:'교회팩스', memo:'', status:'done',
             adminNote:'10월 20일 교회 팩스로 발송했습니다.', createdAt:'2026-10-19T10:00:00+09:00', updatedAt:'2026-10-20T15:00:00+09:00'}
          ],
          notifications: [],
          readNotices: []
        };
        save();
      }
    };
    const save = () => { try { localStorage.setItem(KEY, JSON.stringify(db)); } catch (e) {} };
    load();
    const notify = (to, title, body, link) => { db.notifications.unshift({id:uid(), to, title, body, link, read:false, createdAt:nowIso()}); };

    return {
      mode: 'demo',
      async init() {},
      async currentUser() { return db.me; },
      async demoLogin(kind) {
        db.me = kind === 'admin'
          ? {id:'demo-admin', name:'노회 사무장', church:'노회 사무국', group:'', role:'사무장', phone:'', status:'approved', admin:true}
          : {id:'demo-member', name:'체험회원', church:'동부광성생명샘', group:'가화시찰', role:'장로', phone:'010-0000-0000', status:'approved', admin:false};
        save(); return db.me;
      },
      async signup(profile) {
        const m = {...profile, id:uid(), status:'pending', admin:false, createdAt:nowIso()};
        db.members.unshift(m); db.me = m; save(); return m;
      },
      async refreshMe() { if (db.me) { const m = db.members.find(x => x.id === db.me.id); if (m) db.me = {...db.me, ...m}; save(); } return db.me; },
      async updateMe(patch) { db.me = {...db.me, ...patch}; const m = db.members.find(x => x.id === db.me.id); if (m) Object.assign(m, patch); save(); return db.me; },
      async logout() { db.me = null; save(); },
      async withdraw() { db.me = null; save(); },
      isSignedIn() { return false; }, isLegacyDevice() { return false; }, authName() { return ''; }, providerId() { return ''; },
      async socialSignIn() { throw new Error('체험 모드에서는 쓸 수 없습니다'); },
      async emailSignIn() { throw new Error('체험 모드'); }, async emailSignUp() { throw new Error('체험 모드'); }, async resetPassword() {},
      async resetDemo() { localStorage.removeItem(KEY); load(); },

      async listMembers(status) { return db.members.filter(m => !status || m.status === status); },
      async setMemberStatus(id, status) {
        const m = db.members.find(x => x.id === id); if (!m) return;
        m.status = status;
        notify(id, status === 'approved' ? '가입이 승인되었습니다' : '가입 신청이 반려되었습니다', '노회 사무국', 'home');
        save();
      },

      async listNotices() { return mergeNotices(db.notices, await loadFeed()); },
      async addNotice(n) {
        const x = {...n, id:uid(), date:n.date || nowIso().slice(0, 10), createdAt:nowIso(), source:'app'};
        db.notices.unshift(x);
        notify('*', (n.urgent ? '[긴급] ' : '') + '새 공지', n.title, 'notice:' + x.id);
        save(); return x;
      },
      async deleteNotice(id) { db.notices = db.notices.filter(n => n.id !== id); save(); },
      async readNotice(id) { if (!db.readNotices.includes(id)) { db.readNotices.push(id); save(); } },
      async readNoticeIds() { return db.readNotices; },

      async listEvents() { return [...db.events].sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time)); },
      async addEvent(e) { const x = {...e, id:uid()}; db.events.push(x); notify('*', '새 일정', `${e.date} ${e.title}`, 'calendar'); save(); return x; },
      async deleteEvent(id) { db.events = db.events.filter(e => e.id !== id); save(); },

      async addRequest(r) {
        const x = {...r, id:uid(), uid:db.me.id, status:'received', adminNote:'', createdAt:nowIso(), updatedAt:nowIso()};
        db.requests.unshift(x); notify('admin', '새 신청 접수', `${r.church} ${r.name} · ${r.title}`, 'admin'); save(); return x;
      },
      async listMyRequests() { return db.requests.filter(r => r.uid === db.me.id); },
      async listAllRequests() { return db.requests; },
      async updateRequest(id, patch) {
        const r = db.requests.find(x => x.id === id); if (!r) return;
        Object.assign(r, patch, {updatedAt:nowIso()});
        const label = {received:'접수', working:'처리 중', done:'처리 완료', rejected:'반려'}[r.status];
        notify(r.uid, `신청이 '${label}' 상태가 되었습니다`, r.title + (r.adminNote ? ' — ' + r.adminNote : ''), 'request:' + r.id);
        save();
      },

      async listNotifications() {
        const me = db.me; if (!me) return [];
        return db.notifications.filter(n => n.to === '*' || n.to === me.id || (me.admin && n.to === 'admin'));
      },
      async markNotificationsRead() {
        const me = db.me;
        db.notifications.forEach(n => { if (n.to === '*' || n.to === me.id || (me.admin && n.to === 'admin')) n.read = true; });
        save();
      }
    };
  }

  /* ---------------- 실제 운영 (Firebase) ----------------
     index.html에서 Firebase compat SDK를 불러온 뒤 사용됩니다.
     로그인: 익명 로그인 + 사무장 승인 방식 (아이디·비밀번호 없이 휴대폰 단위로 가입)
     사무장 지정: Firestore 콘솔에서 members/{사무장 uid} 문서의 admin 값을 true로 바꿉니다. */
  function FirebaseStore(pid) {
    const seed = window.PRESBYTERY_DATA[pid];
    let fs, auth, me = null, base;
    const col = name => base.collection(name);
    const list = async (q) => (await q.get()).docs.map(d => ({id:d.id, ...d.data()}));
    const notify = (to, title, body, link) => col('notifications').add({to, title, body, link, readBy:[], createdAt:nowIso()});

    return {
      mode: 'live',
      async init() {
        firebase.initializeApp(C.firebase);
        fs = firebase.firestore(); auth = firebase.auth();
        base = fs.collection('presbyteries').doc(pid);
        await new Promise(res => { const off = auth.onAuthStateChanged(() => { off(); res(); }); });
        await this.refreshMe();
      },
      /* 로그인 상태: 카카오·구글로 로그인했거나, 예전 방식(기기 가입)으로 이미 회원인 경우 */
      isSignedIn() { return !!auth.currentUser; },
      isLegacyDevice() { return !!(auth.currentUser && auth.currentUser.isAnonymous); },
      authName() { return (auth.currentUser && auth.currentUser.displayName) || ''; },
      providerId() { const u = auth.currentUser; return u && u.providerData[0] ? u.providerData[0].providerId : ''; },
      /* 카카오·구글 로그인. 예전 기기 가입 상태라면 같은 회원 정보를 그대로 이어 씁니다(계정 연결). */
      async socialSignIn(kind) {
        const L = C.login || {};
        const provider = kind === 'google' ? new firebase.auth.GoogleAuthProvider() : new firebase.auth.OAuthProvider(L.kakaoProviderId || 'oidc.kakao');
        if (kind !== 'google') { provider.addScope('openid'); provider.addScope('profile_nickname'); }
        else provider.setCustomParameters({prompt:'select_account'});
        const cur = auth.currentUser;
        if (cur && cur.isAnonymous) {
          try { await cur.linkWithPopup(provider); }
          catch (e) {
            if (e.code === 'auth/credential-already-in-use' && e.credential) await auth.signInWithCredential(e.credential);
            else throw e;
          }
        } else {
          await auth.signInWithPopup(provider);
        }
        return this.refreshMe();
      },
      async emailSignIn(email, pw) { await auth.signInWithEmailAndPassword(email, pw); return this.refreshMe(); },
      async emailSignUp(email, pw) {
        const cur = auth.currentUser;
        if (cur && cur.isAnonymous) await cur.linkWithCredential(firebase.auth.EmailAuthProvider.credential(email, pw));
        else await auth.createUserWithEmailAndPassword(email, pw);
        return this.refreshMe();
      },
      async resetPassword(email) { auth.languageCode = 'ko'; await auth.sendPasswordResetEmail(email); },
      async currentUser() { return me; },
      async demoLogin() { throw new Error('운영 모드에서는 체험하기를 쓸 수 없습니다.'); },
      async signup(profile) {
        const id = auth.currentUser.uid;
        const m = {...profile, status:'pending', admin:false, createdAt:nowIso(), provider:(auth.currentUser.providerData[0] || {}).providerId || 'device'};
        await col('members').doc(id).set(m);
        await notify('admin', '새 가입 신청', `${profile.church} ${profile.name} ${profile.role}`, 'admin');
        me = {id, ...m}; return me;
      },
      async refreshMe() {
        if (!auth.currentUser) { me = null; return me; }
        const s = await col('members').doc(auth.currentUser.uid).get();
        me = s.exists ? {id:s.id, ...s.data()} : null; return me;
      },
      async updateMe(patch) { await col('members').doc(me.id).update(patch); me = {...me, ...patch}; return me; },
      /* 로그아웃: 회원 정보는 남기고 이 기기에서만 나갑니다 */
      async logout() { await auth.signOut(); me = null; },
      /* 탈퇴: 회원 정보를 지웁니다 */
      async withdraw() { if (me) await col('members').doc(me.id).delete().catch(() => {}); await auth.signOut(); me = null; },
      async resetDemo() {},

      async listMembers(status) {
        let q = col('members'); if (status) q = q.where('status', '==', status);
        return list(q);
      },
      async setMemberStatus(id, status) {
        await col('members').doc(id).update({status});
        await notify(id, status === 'approved' ? '가입이 승인되었습니다' : '가입 신청이 반려되었습니다', '노회 사무국', 'home');
      },

      async listNotices() {
        const seedN = seed.notices.map(n => ({...n, id:'n' + n.seq, body:'', source:'homepage', createdAt:n.date + 'T09:00:00+09:00'}));
        const rows = (await list(col('notices').orderBy('date', 'desc').limit(100))).concat(seedN);
        return mergeNotices(rows, await loadFeed());
      },
      async addNotice(n) {
        const x = {...n, date:n.date || nowIso().slice(0, 10), createdAt:nowIso(), source:'app'};
        const ref = await col('notices').add(x);
        await notify('*', (n.urgent ? '[긴급] ' : '') + '새 공지', n.title, 'notice:' + ref.id);
        return {id:ref.id, ...x};
      },
      async deleteNotice(id) { await col('notices').doc(id).delete(); },
      async readNotice(id) { const k = 'nm_read_' + pid; const a = JSON.parse(localStorage.getItem(k) || '[]'); if (!a.includes(id)) { a.push(id); localStorage.setItem(k, JSON.stringify(a)); } },
      async readNoticeIds() { return JSON.parse(localStorage.getItem('nm_read_' + pid) || '[]'); },

      async listEvents() {
        const seedE = seed.events.map((e, i) => ({...e, id:'e' + i, time:e.time || '', place:e.place || '', source:'homepage'}));
        return (await list(col('events').orderBy('date'))).concat(seedE).sort((a, b) => (a.date + (a.time || '')).localeCompare(b.date + (b.time || '')));
      },
      async addEvent(e) { const ref = await col('events').add(e); await notify('*', '새 일정', `${e.date} ${e.title}`, 'calendar'); return {id:ref.id, ...e}; },
      async deleteEvent(id) { await col('events').doc(id).delete(); },

      async addRequest(r) {
        const x = {...r, uid:me.id, status:'received', adminNote:'', createdAt:nowIso(), updatedAt:nowIso()};
        const ref = await col('requests').add(x);
        await notify('admin', '새 신청 접수', `${r.church} ${r.name} · ${r.title}`, 'admin');
        return {id:ref.id, ...x};
      },
      async listMyRequests() { const rows = await list(col('requests').where('uid', '==', me.id)); return rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt)); },
      async listAllRequests() { return list(col('requests').orderBy('createdAt', 'desc').limit(200)); },
      async updateRequest(id, patch) {
        await col('requests').doc(id).update({...patch, updatedAt:nowIso()});
        const r = (await col('requests').doc(id).get()).data();
        const label = {received:'접수', working:'처리 중', done:'처리 완료', rejected:'반려'}[r.status];
        await notify(r.uid, `신청이 '${label}' 상태가 되었습니다`, r.title + (r.adminNote ? ' — ' + r.adminNote : ''), 'request:' + id);
      },

      async listNotifications() {
        const targets = ['*', me.id].concat(me.admin ? ['admin'] : []);
        try {
          const rows = await list(col('notifications').where('to', 'in', targets));
          return rows.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || '')).slice(0, 50)
            .map(n => ({...n, read:(n.readBy || []).includes(me.id)}));
        } catch (e) { console.error('알림을 불러오지 못했습니다', e); return []; }
      },
      async markNotificationsRead() {
        const rows = await this.listNotifications();
        await Promise.all(rows.filter(n => !n.read).map(n => col('notifications').doc(n.id).update({readBy:firebase.firestore.FieldValue.arrayUnion(me.id)})));
      }
    };
  }

  window.createStore = function (pid) {
    const live = C.mode === 'live' && C.firebase.apiKey && window.firebase;
    return live ? FirebaseStore(pid) : DemoStore(pid);
  };
})();
