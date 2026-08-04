# Tibo Bless

[![Open Tibo Bless PWA](https://img.shields.io/badge/Open_PWA-Tibo_Bless-111111?style=for-the-badge)](https://tibos-mercy.cloudy-gull-7634.chatgpt.site)

**[PWA 실행·설치 / Open & install the PWA](https://tibos-mercy.cloudy-gull-7634.chatgpt.site)**

Tibo Bless는 공개 근거를 바탕으로 Codex의 글로벌 사용량 리셋과 다음 24·48시간 가능성을 보여주는 간단한 한국어·영어 모니터입니다.

Tibo Bless is a simple bilingual monitor for verified global Codex resets and the next 24/48-hour probability.

## 핵심 로직 / Core logic

- 완료형 리셋 표현과 광범위한 적용 범위가 함께 있어야 확정합니다. / A reset is confirmed only when completed-action wording and broad scope appear together.
- 과거 리셋 간격의 보수적 위험률로 24시간·48시간 기준 확률을 계산합니다. / Conservative historical intervals produce the 24h/48h baseline.
- 최신 확정 리셋 이후 생성되고 아직 유효한 공개 신호만 확률에 반영합니다. / Only unexpired public signals created after the latest reset affect the forecast.
- 모든 확정 기록은 공개 원문으로 연결됩니다. / Every confirmed record links to its public source.

## 실행 / Run locally

Node.js 22.13 이상이 필요합니다. / Requires Node.js 22.13+.

```bash
npm install
npm run dev
```

검증 / Validation:

```bash
npm test
npm run lint
node --test tests/monitor-logic.test.mjs
```

## 구조 / Structure

```text
app/TiboBless.tsx      single-screen bilingual reset monitor
app/monitor-data.ts    public reset evidence snapshot
lib/monitor-logic.js   classification and forecast logic
public/                PWA metadata, icons, and social preview
tests/                 logic and rendered-output tests
.openai/hosting.json   Sites deployment binding
```

## 데이터 경계 / Data boundaries

저장소에는 공개적으로 연결 가능한 샘플 스냅샷이 포함되어 있습니다. 실제 정기 수집은 X API 권한과 별도 스케줄러가 필요하며, 확률은 보장값이 아닌 실험적 추정치입니다.

The repository ships with a source-linked sample snapshot. Live recurring collection requires X API access and a scheduler; all probabilities are experimental estimates, not guarantees.

Tibo Bless is independent and not affiliated with OpenAI.
