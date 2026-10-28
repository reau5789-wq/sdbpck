/* ================================================================
   노회 앱 설정 — 노회마다 이 항목 하나만 추가하면 같은 앱을 씁니다.
   (예장통합 70여 개 노회 확장을 위한 구조)
   ================================================================ */
window.APP_CONFIG = {
  appName: '노회 모바일',
  version: '1.3.1',
  copyright: 'ⓒ2026 Barista of Soul, All Rights Reserved.',

  /* 'demo' = 이 휴대폰 안에서만 저장되는 체험 모드
     'live' = Firebase에 연결된 실제 운영 모드 (firebase 항목 입력 후) */
  mode: 'live',

  /* 로그인 방법 — Firebase Authentication에서 켠 것만 true로 */
  login: {
    email: true,               // 이메일·비밀번호 회원가입
    google: true,
    kakao: false,              // 카카오 OIDC 설정을 마치면 true로
    kakaoProviderId: 'oidc.kakao'
  },

  /* 현재 앱이 기본으로 여는 노회 */
  defaultPresbytery: 'sdbpck',

  /* Firebase 콘솔 > 프로젝트 설정 > 내 앱(웹)에서 복사해 붙여넣기 */
  firebase: {
    apiKey: 'AIzaSyBOWDZxR-dfiAzb2Il4LumXtAtKyWokkxc',
    authDomain: 'nohoe-mobile.firebaseapp.com',
    projectId: 'nohoe-mobile',
    storageBucket: 'nohoe-mobile.firebasestorage.app',
    messagingSenderId: '144015911356',
    appId: '1:144015911356:web:72adf70759d8831ba423b9'
  },

  presbyteries: {
    sdbpck: {
      id: 'sdbpck',
      name: '서울동북노회',
      fullName: '대한예수교장로회 서울동북노회',
      homepage: 'https://sdbpck.or.kr',
      noticeUrl: seq => `https://sdbpck.or.kr/modu/s_board/read.asp?board_seq=1&board_sub_seq=1&view_sub_seq=0&seq=${seq}&lef=nav25`,
      newsUrl:   seq => `https://sdbpck.or.kr/modu/s_board/read.asp?board_seq=2&board_sub_seq=1&view_sub_seq=0&seq=${seq}&lef=nav26`,
      formUrl:   seq => `https://sdbpck.or.kr/modu/s_board/read.asp?board_seq=3&board_sub_seq=1&view_sub_seq=0&seq=${seq}&lef=nav27`,
      certUrl: 'https://sdbpck.or.kr/html/certificate/certi_apply.asp?sub=certificate',
      mailboxUrl: 'https://sdbpck.or.kr/modu/mailbox/mailbox_list.asp',
      budgetUrl: 'https://sdbpck.or.kr/modu/budget/budget_list.asp',
      office: {
        address: '경기도 남양주시 순화궁로 249 별내파라곤스퀘어 N동 1001호',
        tel: '031-570-2766',
        fax: '031-570-2767',
        email: 'sdb223@naver.com'
      },
      groups: ['가화시찰','구리시찰','남양주시찰','동남시찰','동부시찰','기도처','전도기관','선교사'],
      /* 가입 시 선택할 수 있는 구분 (교회가 속한 시찰) */
      memberGroups: ['가화시찰','구리시찰','남양주시찰','동남시찰','동부시찰','기도처','전도기관','노회 사무국'],
      /* 노회 사무국 직원(사무장 등)은 회원교회 명단에 없으므로 따로 고릅니다 */
      officeGroup: '노회 사무국',
      officeRoles: ['사무장','사무국 직원'],
      roles: ['목사','장로','전도사','선교사','교회 사무담당'],
      /* 홈페이지 증명서 신청서와 같은 8종 */
      certificates: [
        {id:'belong',    name:'소속증명',   extra:null},
        {id:'employ',    name:'재직증명',   extra:null},
        {id:'represent', name:'대표자증명', extra:'대표자명·생년월일', attach:true},
        {id:'seal',      name:'직인증명',   extra:null, attach:true},
        {id:'ordain',    name:'안수증명',   extra:'안수일', note:'본 노회 안수자만 신청 가능'},
        {id:'career',    name:'경력증명',   extra:'경력기간'},
        {id:'pay',       name:'사례비증명', extra:'월 사례비·개월 수'},
        {id:'etc',       name:'기타증명',   extra:'증명 내용'}
      ],
      receiveMethods: ['교회팩스','공문 온라인사서함','사무국 방문 수령'],
      docTypes: ['공문 발송 요청','서류 사본 요청','회의록 발췌 요청','확인서 요청','기타 요청']
    }
    /* 다른 노회 추가 예시:
    , seoulnam: { id:'seoulnam', name:'서울남노회', ... } */
  }
};
