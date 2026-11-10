# 4CUT.COMMIT

컴퓨터소프트웨어과 졸업작품전에서 쓰는 인생네컷 키오스크 웹앱 (Next.js).
`프레임 선택 → 6컷 촬영 → 4컷 고르기 → 꾸미기 → 인쇄 · QR 저장` 순서로 진행돼요.

## 실행

```bash
npm install
npm run dev            # 개발: http://localhost:3000
```

전시 당일에는 빌드해서 실행하세요.

```bash
cp .env.example .env   # PUBLIC_URL을 노트북 IP로 설정
npm run build
npm start              # 0.0.0.0:3000 으로 열림
```

## 전시장 세팅 체크리스트

1. **같은 와이파이**: 관람객 휴대폰이 키오스크 노트북과 같은 네트워크에 있어야 QR이 열려요.
   `.env`의 `PUBLIC_URL`을 `http://<노트북 IP>:3000` 으로 설정하세요.
2. **카메라 권한**: 브라우저는 `localhost`나 HTTPS에서만 카메라를 허용해요.
   키오스크 화면은 노트북에서 `http://localhost:3000` 으로 여세요 (QR 주소는 PUBLIC_URL로 따로 만들어져요).
3. **키오스크 모드 + 바로 인쇄** (Chrome):
   ```bash
   google-chrome --kiosk --kiosk-printing http://localhost:3000
   ```
   `--kiosk-printing`을 쓰면 인쇄 대화상자 없이 기본 프린터로 바로 출력돼요.
   프린터 용지를 **2x6 inch**로 맞춰두세요 (출력 이미지는 600×1800px, 300dpi).
4. **카메라가 없을 때**: 촬영 화면에서 "테스트 이미지로 진행"을 누르면 리허설할 수 있어요.

## 구조

```
app/
  page.tsx                 키오스크 (클라이언트 컴포넌트)
  p/[id]/page.tsx          QR로 열리는 모바일 저장 페이지
  api/photos/route.ts      POST 업로드 → { id, url }
  api/photos/[id]/route.ts PATCH 갤러리 노출 동의
  api/gallery/route.ts     GET 갤러리 월용 목록
  files/[id]/route.ts      PNG 원본
components/kiosk/          화면별 컴포넌트 (Start/Frame/Shoot/Select/Decorate/Result)
lib/strip.ts               네컷 합성 렌더러 (미리보기 = 출력물)
lib/storage.ts             사진 저장소 (로컬 디스크)
```

- 프레임 추가: `lib/strip.ts`의 `FRAMES`, `THEMES`, `drawChrome`에 케이스 추가
- 스티커/문구 프리셋: `components/kiosk/DecorateScreen.tsx` 상단 배열
- 촬영 컷 수/고를 컷 수: `components/kiosk/session.ts`의 `TOTAL_SHOTS`, `PICK_COUNT`
- 사진은 `RETENTION_DAYS`(기본 7일)가 지나면 새 사진이 저장될 때 자동 삭제돼요.

## Vercel 배포

1. GitHub 저장소를 Vercel에서 **Import** → Framework는 Next.js 자동 인식.
2. 프로젝트 **Storage** 탭에서
   - **Blob** 스토어 만들기 → `BLOB_READ_WRITE_TOKEN` 자동 추가 (사진 저장)
   - **Upstash for Redis** (Marketplace, 무료 플랜) 연결 → `KV_REST_API_URL`, `KV_REST_API_TOKEN` 자동 추가 (사진 정보)
3. Redeploy. HTTPS라서 카메라가 바로 동작해요.

환경 변수가 없으면(로컬) 자동으로 `data/` 폴더에 저장하는 방식으로 돌아가요.

## 주소 정리

| 주소 | 용도 |
| --- | --- |
| `/` | 인생네컷 키오스크 |
| `/p/[id]` | QR로 열리는 사진 저장 페이지 |
| `/gallery` | 네컷 갤러리 월 — 동의한 사진이 흘러가는 전시 화면 (`?demo=1` 리허설) |


> 방명록은 별도 저장소(`grad-guestbook`)로 분리했어요.
