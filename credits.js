const PHASE_CREDITS = 'credits';

const CREDITS_DATA = [
  { type: 'gap' },
  { type: 'gap' },
  { type: 'logo',    text: '좀비 영역 전쟁' },
  { type: 'gap' },
  { type: 'gap' },
  { type: 'section', text: '제작팀' },
  { type: 'gap' },
  { type: 'role',    text: '기획 · 개발' },
  { type: 'name',    text: '이현서' },
  { type: 'gap' },
  { type: 'role',    text: '게임 디자인 · 밸런스' },
  { type: 'name',    text: '이유진' },
  { type: 'gap' },
  { type: 'role',    text: '레벨 디자인 · QA' },
  { type: 'name',    text: '전재민' },
  { type: 'gap' },
  { type: 'gap' },
  { type: 'section', text: '기술 스택' },
  { type: 'gap' },
  { type: 'role',    text: '렌더링 엔진' },
  { type: 'name',    text: 'p5.js v1.9.0' },
  { type: 'role',    text: '언어' },
  { type: 'name',    text: 'JavaScript (Vanilla)' },
  { type: 'gap' },
  { type: 'gap' },
  { type: 'section', text: '게임 정보' },
  { type: 'gap' },
  { type: 'role',    text: '장르' },
  { type: 'name',    text: '2인 협력 → 배신 영역 점령' },
  { type: 'role',    text: '플레이어' },
  { type: 'name',    text: '2인 로컬 멀티플레이' },
  { type: 'role',    text: '맵 크기' },
  { type: 'name',    text: '50 × 50 타일' },
  { type: 'gap' },
  { type: 'gap' },
  { type: 'section', text: '아이템 가이드' },
  { type: 'gap' },
  { type: 'role',    text: '💊 약' },
  { type: 'name',    text: '주변 영역 보너스 획득' },
  { type: 'role',    text: '🩸 피' },
  { type: 'name',    text: '좀비 이동 속도 대폭 상승' },
  { type: 'role',    text: '⚡ 에너지드링크' },
  { type: 'name',    text: '속도 2배 + 강철 꼬리 활성화' },
  { type: 'gap' },
  { type: 'gap' },
  { type: 'section', text: '특별 감사' },
  { type: 'gap' },
  { type: 'name',    text: '이 게임을 플레이해 주신' },
  { type: 'name',    text: '모든 분께 감사드립니다 🙏' },
  { type: 'gap' },
  { type: 'gap' },
  { type: 'gap' },
  { type: 'fin',     text: '🧟 THE END 🧟' },
  { type: 'gap' },
  { type: 'hint',    text: 'SPACE — 처음으로 돌아가기' },
  { type: 'gap' },
  { type: 'gap' },
  { type: 'gap' },
];

const LINE_H = {
  logo:    80,
  section: 52,
  role:    26,
  name:    32,
  fin:     72,
  hint:    28,
  gap:     22,
};

function _creditsTotalH() {
  return CREDITS_DATA.reduce((s, d) => s + (LINE_H[d.type] || 24), 0);
}

let creditsScrollY  = 0;
let creditsSpeed    = 1.4;
let creditsFinished = false;

function initCredits() {
  creditsScrollY  = CANVAS_H;
  creditsFinished = false;
}

function updateCredits() {
  creditsScrollY -= creditsSpeed;
  if (creditsScrollY + _creditsTotalH() < 0) {
    creditsFinished = true;
  }
}

function drawCredits(p) {
  p.background(6, 5, 12);

  p.noStroke();
  for (let i = 0; i < 60; i++) {
    const sx = ((i * 137 + 17) % CANVAS_W);
    const sy = ((i * 251 + 83) % CANVAS_H);
    const bri = 100 + ((Math.sin(p.frameCount * 0.04 + i) + 1) * 70);
    p.fill(bri, bri, bri + 40, 180);
    p.ellipse(sx, sy, 1.5, 1.5);
  }

  p.fill(120, 30, 200, 18); p.noStroke();
  p.rect(0, 0, 6, CANVAS_H);
  p.rect(CANVAS_W - 6, 0, 6, CANVAS_H);

  let y = creditsScrollY;
  const cx = CANVAS_W / 2;
  p.textFont('monospace');

  for (const item of CREDITS_DATA) {
    const h = LINE_H[item.type] || 24;
    if (y + h < -10 || y > CANVAS_H + 10) { y += h; continue; }

    p.textAlign(p.CENTER, p.TOP);
    p.noStroke();

    switch (item.type) {
      case 'logo':
        p.textSize(38);
        p.fill(30, 220, 80, 60);
        p.text(item.text, cx + 2, y + 2);
        p.fill('#4CAF50');
        p.text(item.text, cx, y);
        p.stroke('#4CAF50'); p.strokeWeight(1.5);
        p.line(cx - 160, y + 52, cx + 160, y + 52);
        p.noStroke();
        break;
      case 'section':
        p.textSize(15);
        p.fill(160, 100, 255);
        p.text('── ' + item.text + ' ──', cx, y + 14);
        break;
      case 'role':
        p.textSize(11);
        p.fill(130, 130, 160);
        p.text(item.text, cx, y + 6);
        break;
      case 'name':
        p.textSize(18);
        p.fill(230, 230, 255);
        p.text(item.text, cx, y + 4);
        break;
      case 'fin':
        p.textSize(32);
        p.fill(Math.sin(p.frameCount * 0.08) > 0 ? '#AB47BC' : '#7B1FA2');
        p.text(item.text, cx, y + 14);
        break;
      case 'hint':
        p.textSize(11);
        p.fill(180, 180, 200, 140 + Math.sin(p.frameCount * 0.06) * 80);
        p.text(item.text, cx, y + 6);
        break;
    }
    y += h;
  }

  for (let i = 0; i < 60; i++) {
    p.fill(6, 5, 12, p.map(i, 0, 60, 220, 0));
    p.noStroke();
    p.rect(0, i * 1, CANVAS_W, 2);
  }
  for (let i = 0; i < 60; i++) {
    p.fill(6, 5, 12, p.map(i, 0, 60, 0, 220));
    p.noStroke();
    p.rect(0, CANVAS_H - 60 + i, CANVAS_W, 2);
  }
}
