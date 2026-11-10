// 방명록 지구본에 올라갈 졸업작품 목록.
// ⚠️ 지금은 예시 데이터예요. 실제 전시 프로젝트 이름/팀으로 바꿔주세요.
// lat/lon: 지구본 위 위치(도). 비워두면 자동 배치돼요.

export interface Project {
  id: string;
  name: string;
  team: string;
  desc: string;
  lat?: number;
  lon?: number;
}

export const PROJECTS: Project[] = [
  { id: 'medinote', name: 'MediNote', team: '1팀', desc: '복약 기록을 약사와 함께 관리하는 앱' },
  { id: 'campusmap', name: 'CampusMap', team: '2팀', desc: '신입생을 위한 실내 캠퍼스 길찾기' },
  { id: 'studymate', name: 'StudyMate', team: '3팀', desc: 'AI 스터디 매칭 서비스' },
  { id: 'fitlog', name: 'FitLog', team: '4팀', desc: '운동 루틴 자동 기록' },
  { id: 'petcare', name: 'PetCare+', team: '5팀', desc: '반려동물 건강 다이어리' },
  { id: 'ecoroute', name: 'EcoRoute', team: '6팀', desc: '탄소 줄이는 경로 추천' },
  { id: 'chatbridge', name: 'ChatBridge', team: '7팀', desc: '실시간 수어 번역 채팅' },
  { id: 'safewalk', name: 'SafeWalk', team: '8팀', desc: '밤길 귀갓길 동행 서비스' },
  { id: 'mooddiary', name: 'MoodDiary', team: '9팀', desc: '감정 일기 + 회고' },
  { id: 'bookswap', name: 'BookSwap', team: '10팀', desc: '전공책 중고 교환' },
  { id: 'parkingnow', name: 'ParkingNow', team: '11팀', desc: '실시간 주차 자리 알림' },
  { id: 'aitutor', name: 'AI Tutor', team: '12팀', desc: '코딩 과제 피드백 튜터' },
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
