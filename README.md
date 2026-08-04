# Tibo Bless

[![Open Tibo Bless PWA](https://img.shields.io/badge/Open_PWA-Tibo_Bless-111111?style=for-the-badge)](https://tibos-mercy.cloudy-gull-7634.chatgpt.site)

**[PWA 실행·설치 / Open & install the PWA](https://tibos-mercy.cloudy-gull-7634.chatgpt.site)**

브라우저의 `앱 설치` 또는 `홈 화면에 추가` 기능으로 설치할 수 있습니다. 앱 상단의 **앱 설치** 버튼도 같은 설치 흐름을 안내합니다.  
Install it through your browser’s **Install app** or **Add to Home Screen** action. The in-app **Install app** button opens the same flow.

Tibo Bless는 공개 근거를 바탕으로 Codex의 글로벌 사용량 리셋, reasoning Juice, 모델 역량 변화를 추적하는 한국어·영어 동시 지원 웹 앱입니다.

Tibo Bless is a bilingual Korean/English web app that monitors global Codex usage resets, reasoning Juice, and model-capability signals from public evidence.

## 핵심 로직 / Core logic

- 완료형 리셋 표현과 광범위한 적용 범위가 함께 있어야 확정합니다. / A reset is confirmed only when completed-action wording and broad scope appear together.
- 과거 리셋 간격의 보수적 위험률로 24시간·48시간 기준 확률을 계산합니다. / Conservative historical interval hazard produces the 24h/48h baseline.
- 최신 확정 리셋 이후 생성되고 TTL이 남은 신호만 확률에 반영합니다. / Only unexpired signals created after the latest confirmed reset affect the forecast.
- Juice는 여섯 effort가 모두 수집된 sweep만 비교합니다. / Juice compares only complete six-effort sweeps.
- Capability 스냅샷이 6시간보다 오래되면 점수만 표시하고 결론을 보류합니다. / Capability conclusions are withheld when the snapshot is more than six hours old.
- 최소 세 effort가 함께 2점 이상 움직일 때만 동반 상승·하락으로 판정합니다. / A broad rise or decline requires at least three efforts moving by two points or more.
- 모든 확정 이벤트에 공개 원문 링크와 판정 이유를 보존합니다. / Every confirmed event preserves its public source and decision reason.
- `The waiting game`은 최근 26주의 리셋 날짜를 GitHub식 히트맵으로 보여주며, 리셋 칸은 공개 근거로 연결됩니다. / `The waiting game` renders 26 weeks of reset days as a GitHub-style heatmap and links every reset cell to public evidence.
- 웹 앱 매니페스트, 오프라인 캐시, 설치 아이콘을 포함한 PWA입니다. / Includes a web app manifest, offline cache, and install icons as an installable PWA.

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
```

## 구조 / Structure

```text
app/TiboBless.tsx      bilingual product UI and interactions
app/monitor-data.ts    public evidence and measurement snapshot
lib/monitor-logic.js   classification, forecast, Juice, capability logic
public/manifest.webmanifest  PWA metadata and install icons
public/sw.js           offline cache service worker
tests/                 logic and server-render tests
.openai/hosting.json   Sites deployment binding
```

## 데이터 경계 / Data boundaries

현재 저장소에는 공개적으로 연결 가능한 샘플 스냅샷이 포함되어 있습니다. 실제 정기 수집은 X API 권한과 별도 스케줄러가 필요합니다. Juice는 공식 OpenAI 지표가 아니며, 확률은 보장값이 아닌 실험적 추정치입니다.

The repository ships with a source-linked public sample snapshot. Live recurring collection requires X API access and a scheduler. Juice is not an official OpenAI metric, and all probabilities are experimental estimates—not guarantees.

Tibo Bless is independent and not affiliated with OpenAI.
