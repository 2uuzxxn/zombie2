// 전장 레이아웃 설정
const ROWS = 50;
const COLS = 50;
const TILE_SIZE = 18; // 50 * 18 = 900px 화면에 딱 맞는 크기

// 타일 소유권 코드
const OWNER_NONE = 0;
const OWNER_TEAM = 1;
const OWNER_ZOMBIE = 2;

// 좀비 속도 밸런스 설정 (요청 반영 하향 수치)
const ZOMBIE_SPEED_NORMAL = 4.0;
const ZOMBIE_SPEED_BOOSTED = 8.0;

// 아이템 박스 타입
const BOX_TYPE_MEDICINE = '💊';
const BOX_TYPE_BLOOD = '🩸';
const BOX_TYPE_DRINK = '⚡';

// 게임 페이즈 선언
const PHASE_LOBBY = 0;
const PHASE_GAME = 1;
const PHASE_OVER = 2;

// 전역 변수 공유용 플레이스홀더
let grid;
let players = [];
let zombies = [];
let currentPhase = PHASE_LOBBY;
