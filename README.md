# IDE-119

비밀번호 기반 접근 게이트와 보호 라우팅 미들웨어를 제공하는 IdeaBank 서비스입니다.

## Requirements

- Node.js 22+
- Docker / Docker Compose (optional)

## Run locally

```bash
npm start
```

기본 포트는 `3201`이며 `PORT` 환경 변수로 변경할 수 있습니다.

기본 접근 비밀번호는 `ideabank2026`이며 `ACCESS_PASSWORD` 환경 변수로 변경할 수 있습니다.

## Development

```bash
npm run dev
```

## Test

```bash
npm test
```

## Docker

```bash
docker compose up --build
```

## Routes

- `/`: 비밀번호 입력 페이지
- `/login`: 비밀번호 제출 엔드포인트
- `/app`: 보호 대시보드
- `/ideas`: 추가 보호 경로 예시
- `/logout`: 세션 종료

## Authentication flow

1. 사용자는 `/`에서 비밀번호를 입력합니다.
2. 서버는 `ACCESS_PASSWORD` 값과 비교합니다.
3. 성공 시 `HttpOnly` 쿠키 세션을 발급합니다.
4. 미들웨어가 보호 경로 접근 전에 쿠키를 검사하고, 실패하면 `/`로 리다이렉트합니다.
