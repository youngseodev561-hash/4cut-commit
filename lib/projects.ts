// 방명록 지구본에 올라갈 졸업작품 목록.
// ⚠️ 지금은 예시 데이터예요. 실제 전시 프로젝트 이름/팀으로 바꿔주세요.
// lat/lon: 지구본 위 위치(도). 비워두면 자동 배치돼요.

export interface Project {
  id: string;
  name: string;
  team: string;
  desc: string;
  /** 작품 소개 (2~3문장) */
  intro: string;
  /** 팀원 이름 */
  members: string[];
  /** 기술/키워드 */
  tags: string[];
  lat?: number;
  lon?: number;
}

export const PROJECTS: Project[] = [
  { id: 'medinote', name: 'MediNote', team: '1팀', desc: '복약 기록을 약사와 함께 관리하는 앱', intro: '약을 여러 개 챙겨 먹는 사람과 약사를 한 화면으로 연결했어요. 복용 기록이 쌓이면 약사가 조합을 다시 검토할 수 있어요.', members: ['[팀원1]', '[팀원2]', '[팀원3]'], tags: ['Flutter', 'Spring Boot', 'PostgreSQL'] },
  { id: 'campusmap', name: 'CampusMap', team: '2팀', desc: '신입생을 위한 실내 캠퍼스 길찾기', intro: '처음 온 신입생도 강의실을 헤매지 않도록, 건물 안 층별 지도와 길 안내를 만들었어요.', members: ['[팀원1]', '[팀원2]', '[팀원3]'], tags: ['React Native', 'Indoor Positioning'] },
  { id: 'studymate', name: 'StudyMate', team: '3팀', desc: 'AI 스터디 매칭 서비스', intro: '공부 스타일과 시간표를 분석해 잘 맞는 스터디 메이트를 AI가 추천해줘요.', members: ['[팀원1]', '[팀원2]', '[팀원3]'], tags: ['Next.js', 'Python', 'LLM'] },
  { id: 'fitlog', name: 'FitLog', team: '4팀', desc: '운동 루틴 자동 기록', intro: '헬스장에서 기구 앞에 서기만 하면 세트와 무게가 자동으로 기록돼요.', members: ['[팀원1]', '[팀원2]', '[팀원3]'], tags: ['iOS', 'NFC', 'Firebase'] },
  { id: 'petcare', name: 'PetCare+', team: '5팀', desc: '반려동물 건강 다이어리', intro: '반려동물의 식사, 산책, 병원 기록을 한곳에 모아 건강 변화를 그래프로 보여줘요.', members: ['[팀원1]', '[팀원2]', '[팀원3]'], tags: ['Kotlin', 'Spring Boot'] },
  { id: 'ecoroute', name: 'EcoRoute', team: '6팀', desc: '탄소 줄이는 경로 추천', intro: '같은 목적지라도 탄소를 덜 내는 길을 골라주고, 아낀 탄소량을 기록해줘요.', members: ['[팀원1]', '[팀원2]', '[팀원3]'], tags: ['Vue', 'Map API', 'Node.js'] },
  { id: 'chatbridge', name: 'ChatBridge', team: '7팀', desc: '실시간 수어 번역 채팅', intro: '카메라로 수어를 인식해 실시간 채팅 문장으로 바꿔주는 대화 도구예요.', members: ['[팀원1]', '[팀원2]', '[팀원3]'], tags: ['Computer Vision', 'WebRTC'] },
  { id: 'safewalk', name: 'SafeWalk', team: '8팀', desc: '밤길 귀갓길 동행 서비스', intro: '밤길 귀갓길에 친구와 위치를 공유하고, 위험할 땐 버튼 한 번으로 알릴 수 있어요.', members: ['[팀원1]', '[팀원2]', '[팀원3]'], tags: ['Flutter', 'Socket.io'] },
  { id: 'mooddiary', name: 'MoodDiary', team: '9팀', desc: '감정 일기 + 회고', intro: '하루 감정을 색으로 기록하고, 한 달이 지나면 나만의 감정 회고를 만들어줘요.', members: ['[팀원1]', '[팀원2]', '[팀원3]'], tags: ['SwiftUI', 'Core ML'] },
  { id: 'bookswap', name: 'BookSwap', team: '10팀', desc: '전공책 중고 교환', intro: '학기가 끝나면 쌓이는 전공책을 같은 과 후배와 바로 교환할 수 있어요.', members: ['[팀원1]', '[팀원2]', '[팀원3]'], tags: ['React', 'Express', 'MySQL'] },
  { id: 'parkingnow', name: 'ParkingNow', team: '11팀', desc: '실시간 주차 자리 알림', intro: '주차장 카메라 영상으로 빈자리를 찾아 실시간으로 알려줘요.', members: ['[팀원1]', '[팀원2]', '[팀원3]'], tags: ['YOLO', 'Raspberry Pi', 'FastAPI'] },
  { id: 'aitutor', name: 'AI Tutor', team: '12팀', desc: '코딩 과제 피드백 튜터', intro: '코딩 과제를 올리면 정답 대신 생각할 힌트와 피드백을 단계별로 줘요.', members: ['[팀원1]', '[팀원2]', '[팀원3]'], tags: ['Next.js', 'LLM', 'Docker'] },
];

/** 위치가 없으면 피보나치 구 배치로 고르게 흩뿌림 */
export function projectPositions() {
  const n = PROJECTS.length;
  const g = Math.PI * (3 - Math.sqrt(5));
  return PROJECTS.map((p, i) => {
    if (p.lat !== undefined && p.lon !== undefined) return { ...p, lat: p.lat, lon: p.lon };
    const y = 0.75 - (i / Math.max(1, n - 1)) * 1.5; // 극지방은 피해서
    const lat = (Math.asin(y) * 180) / Math.PI;
    const lon = (((g * i * 180) / Math.PI) % 360) - 180;
    return { ...p, lat, lon };
  });
}
