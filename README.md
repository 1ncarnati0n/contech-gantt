# ConstructionScheduler

건설 공정관리 웹 애플리케이션 - WBS 기반 CPM 공정표 및 Pre-Construction 플랫폼

[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
[![Turborepo](https://img.shields.io/badge/Turborepo-2-red)](https://turbo.build/)

---

## 🏗 프로젝트 구조

```
contech-gantt/
├── apps/
│   └── web/                    # Next.js 웹 애플리케이션
├── packages/
│   └── gantt/                  # @contech/gantt 라이브러리
├── docs/                       # 문서
│   ├── ConstructionScheduler_PRD.md
│   └── DEVELOPMENT_STATUS.md   # 개발 현황
├── turbo.json
├── pnpm-workspace.yaml
└── package.json
```

---

## ✨ 주요 기능

### 간트차트 라이브러리 (@contech/gantt)

- **Dual Calendar 시스템**: 순작업일/간접작업일 구분
- **CPM 엔진**: Critical Path 자동 계산
- **Level 1/2 뷰**: 공구공정표(Master) / 주공정표(Detail)
- **한국 공휴일**: 2025~2027년 내장
- **드래그 앤 드롭**: 태스크, 그룹, 의존성
- **앵커 기반 의존성**: 유연한 연결점 설정

### 웹 애플리케이션 (apps/web)

- **프로젝트 관리**: 다중 프로젝트 지원
- **공정표 페이지**: `/projects/[id]/schedule`
- **LocalStorage 저장**: 프로젝트별 데이터 분리
- **Import/Export**: JSON 파일

---

## 🚀 빠른 시작

### 요구사항

- Node.js >= 18
- pnpm >= 9

### 설치

```bash
# 저장소 클론
git clone <repository-url>
cd contech-gantt

# pnpm 설치 (없는 경우)
npm install -g pnpm@9

# 의존성 설치
pnpm install
```

### 환경 설정

```bash
# .env.local 생성
cp apps/web/.env.example apps/web/.env.local

# Supabase 설정 (apps/web/.env.local)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### 개발 서버 실행

```bash
# 전체 실행
pnpm dev

# 웹만 실행
pnpm dev:web

# 간트 라이브러리만 실행
pnpm dev:gantt
```

브라우저에서 `http://localhost:3000` 접속

---

## 📦 패키지

### @contech/gantt

건설 공정표 전문 간트차트 React 라이브러리

```tsx
import {
  GanttChart,
  ThemeProvider,
  KOREAN_HOLIDAYS_ALL,
} from '@contech/gantt';
import '@contech/gantt/style.css';

function SchedulePage() {
  return (
    <ThemeProvider defaultTheme="light">
      <GanttChart
        tasks={tasks}
        milestones={milestones}
        holidays={KOREAN_HOLIDAYS_ALL}
        onTaskUpdate={handleTaskUpdate}
      />
    </ThemeProvider>
  );
}
```

### web

Next.js 16 기반 웹 애플리케이션

---

## 🛠 개발 명령어

| 명령어 | 설명 |
|--------|------|
| `pnpm dev` | 개발 서버 (전체) |
| `pnpm dev:web` | 웹 개발 서버 |
| `pnpm dev:gantt` | 간트 개발 서버 |
| `pnpm build` | 프로덕션 빌드 |
| `pnpm test` | 테스트 실행 |
| `pnpm lint` | 린트 검사 |
| `pnpm clean` | 빌드 결과물 정리 |

---

## 📖 문서

- [개발 현황](./docs/DEVELOPMENT_STATUS.md) - 구현 상태 및 로드맵
- [PRD 문서](./docs/ConstructionScheduler_PRD.md) - 상세 요구사항

---

## 🗺 로드맵

**📍 [전체 개발 로드맵 보기](./docs/ROADMAP.md)**

### 현재 상태
- ✅ Phase 1 MVP 진행 중 (35%)
- ✅ 모노레포, 간트차트 페이지, UI 컴포넌트 완료
- ⏳ 다음: Supabase 연동, 베이스라인 기능

---

## 🤝 기여

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 라이선스

MIT License - see [LICENSE](LICENSE) for details

---

## 📞 문의

프로젝트 관련 문의는 Issue를 통해 남겨주세요.
