# Tibo Bless · 티보의 은총

[![Open Tibo Bless PWA](https://img.shields.io/badge/Open_PWA-Tibo_Bless-111111?style=for-the-badge)](https://tibos-mercy.cloudy-gull-7634.chatgpt.site)

**[PWA 실행·설치 / Open & install the PWA](https://tibos-mercy.cloudy-gull-7634.chatgpt.site)**

Tibo Bless(티보의 은총)는 공개 근거를 바탕으로 Codex의 글로벌 사용량 리셋과 다음 24·48시간 은총 확률을 보여주는 한국어·영어 모니터입니다.

Tibo Bless is a simple bilingual monitor for verified global Codex resets and the next 24/48-hour probability.

## 핵심 로직 / Core logic

- 완료형 리셋 표현과 광범위한 적용 범위가 함께 있어야 확정합니다. / A reset is confirmed only when completed-action wording and broad scope appear together.
- 공개 레퍼런스의 무신호 기준값 14%·26%에 아직 유효한 신호 보정만 반영합니다. / The 14% / 26% evidence-free baseline is adjusted only by active signals.
- 최신 확정 리셋 이후 생성되고 아직 유효한 공개 신호만 확률에 반영합니다. / Only unexpired public signals created after the latest reset affect the forecast.
- 모든 확정 기록은 공개 원문으로 연결됩니다. / Every confirmed record links to its public source.
- `기쁘다 구주 오셨네` 타임라인은 인물 사진과 함께 은총 기록·예고 신호를 좌우 스와이프로 보여줍니다. / The `Joy to the world` rail shows mercy records and hint signals with profile photos.
- 타임라인의 트윗 본문은 한국어·영어 화면 모두 원문 영어로 유지합니다. / Tweet bodies remain in the original English in both language modes.
- `은총 레이더`, `구세주 목록`, 5개 시그널 규칙과 점수표를 포함한 산출 근거를 제공합니다. / Includes a Mercy Radar, Savior List, and calculation details with five signal rules and a point table.
- PC에서는 `은총 예측 원리`와 `은총 레이더`를 한 행에 배치하고, 모바일에서는 기존 세로 흐름을 유지합니다. / On desktop, Prediction Principles and Mercy Radar share one row; mobile keeps the original vertical flow.
- PC 헤더의 `홈 화면에 추가` 버튼은 브라우저의 PWA 설치 프롬프트를 엽니다. / The desktop `Add to home` button opens the browser's PWA install prompt.
- 이메일 신청 정보는 D1에 보존됩니다. 자동 탐색 중단과 함께 새 은총 자동 발송도 현재 멈춰 있습니다. / Email subscriptions remain stored in D1. Automatic delivery is paused together with automated discovery.

## 실행 / Run locally

Node.js 22.13 이상이 필요합니다. / Requires Node.js 22.13+.

```bash
npm install
cp .env.example .env.local
npm run dev
```

X API 자동 크롤링과 4시간 예약 작업은 2026-08-11부로 중단했습니다. 앱은 저장소의 기본 스냅샷과 기존 D1 기록만 읽으며, X API 키나 외부 탐색 요청을 사용하지 않습니다.

Automated X API crawling and its four-hour schedule were retired on 2026-08-11. The app now reads only the bundled baseline and previously persisted D1 snapshot; it does not use an X API key or external discovery request.

이메일 발송에는 `RESEND_API_KEY`, Resend에서 인증한 `ALERT_FROM_EMAIL`, 배포 주소인 `PUBLIC_SITE_URL`이 필요합니다. 메일 본문은 다음 문장으로 고정됩니다.

> 티보가 은총을 하사하시니, 불쌍한 중생이여 미처 하지못한 작업을 마무리 해보거라

Email delivery requires `RESEND_API_KEY`, a Resend-verified `ALERT_FROM_EMAIL`, and the deployed `PUBLIC_SITE_URL`.

검증 / Validation:

```bash
npm test
npm run lint
node --test tests/*.test.mjs
```

## 구조 / Structure

```text
app/TiboBless.tsx      single-screen bilingual reset monitor
app/monitor-data.ts    public reset evidence snapshot
lib/monitor-logic.js   classification and forecast logic
lib/xai-monitor.ts     read-only bundled and persisted monitor snapshot
lib/xai-normalize.js   citation and evidence validation
lib/email-alerts.ts    durable email subscriptions and mercy delivery
public/                PWA metadata, icons, and social preview
public/people/         locally bundled public profile images
tests/                 logic and rendered-output tests
.openai/hosting.json   Sites deployment binding
```

## 데이터 경계 / Data boundaries

저장소에는 공개적으로 연결 가능한 기본 스냅샷이 포함되어 있습니다. 배포 환경은 이 기본 스냅샷과 과거에 저장된 D1 기록만 읽으며 자동 X 탐색은 수행하지 않습니다. 확률은 보장값이 아닌 실험적 추정치입니다.

The repository ships with a source-linked baseline snapshot. Production reads that baseline and the previously persisted D1 records without performing automated X discovery. Probabilities remain experimental estimates, not guarantees.

Tibo Bless is independent and not affiliated with OpenAI.
