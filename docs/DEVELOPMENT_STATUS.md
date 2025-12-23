# ConstructionScheduler 개발 현황

> 최종 업데이트: 2024-12-23

---

## 📋 프로젝트 개요

**ConstructionScheduler**는 건설 프로젝트의 공정 관리를 위한 웹 애플리케이션입니다.

- **핵심 기능**: CPM 기반 공정표, WBS 관리, Dual Calendar 시스템
- **기술 스택**: Next.js 16 + React 19 + TypeScript + Supabase
- **모노레포**: Turborepo + pnpm workspace

---

## ✅ Phase 1 - Week 1~2: 완료된 작업

### 1. Turborepo 모노레포 구축

```
contech-gantt/
├── apps/
│   └── web/                    # Next.js 16 웹 애플리케이션
│       ├── src/app/
│       │   └── (container)/projects/[id]/schedule/  # 간트차트 페이지
│       └── package.json        # name: "web"
├── packages/
│   └── gantt/                  # 간트차트 라이브러리
│       ├── src/lib/
│       │   ├── components/     # GanttChart, TaskEditModal 등
│       │   ├── services/       # LocalStorageService, DataService
│       │   ├── types/          # ConstructionTask, Milestone 등
│       │   └── utils/          # criticalPath, dateUtils 등
│       └── package.json        # name: "@contech/gantt"
├── package.json                # 루트 워크스페이스
├── turbo.json                  # Turborepo 설정
├── pnpm-workspace.yaml         # pnpm workspace 설정
└── tsconfig.json               # 공유 TypeScript 설정
```

### 2. 패키지 통합 완료

| 원본 프로젝트 | 이동 위치 | 패키지명 |
|--------------|----------|---------|
| `contech-dx` | `apps/web` | `web` |
| `sa-gantt-lib` | `packages/gantt` | `@contech/gantt` |

### 3. 간트차트 페이지 구현

**파일**: `apps/web/src/app/(container)/projects/[id]/schedule/page.tsx`

```tsx
// 주요 기능
- LocalStorage 기반 데이터 저장 (프로젝트별 분리)
- 자동 저장 (3초 디바운스)
- JSON Import/Export
- 한국 공휴일 적용 (2025~2027)
```

### 4. 설정 파일 구성

| 파일 | 역할 |
|------|------|
| `turbo.json` | 빌드 파이프라인, 캐싱 설정 |
| `pnpm-workspace.yaml` | 워크스페이스 패키지 정의 |
| `tsconfig.json` (루트) | 공유 TypeScript 설정 |
| `next.config.ts` | Turbopack, transpilePackages 설정 |

---

## 🔄 현재 상태

### 빌드 상태
- ✅ `@contech/gantt` 빌드 성공
- ✅ `web` 빌드 성공
- ✅ 라우트 `/projects/[id]/schedule` 생성 완료

### 데이터 저장
- ✅ LocalStorage 기반 저장 (현재)
- ⏳ Supabase 연동 (예정)

### 핵심 타입 (packages/gantt)

```typescript
// ConstructionTask - 작업 정의
interface ConstructionTask {
  id: string;
  parentId: string | null;
  wbsLevel: 1 | 2;
  type: 'GROUP' | 'CP' | 'TASK';
  name: string;
  startDate: Date;
  endDate: Date;
  dependencies: Dependency[];
  task?: TaskData;      // Level 2 TASK용
  cp?: CPData;          // Level 1 CP용
  group?: GroupData;    // GROUP용
}

// Dual Calendar 시스템
interface TaskData {
  netWorkDays: number;           // 순작업일 (빨간색)
  indirectWorkDaysPre: number;   // 앞 간접작업일 (파란색)
  indirectWorkDaysPost: number;  // 뒤 간접작업일 (파란색)
}
```

---

## 📅 개발 로드맵

### Phase 1: MVP (Month 1~6)

#### Month 1: 인프라 구축 ✅ 진행 중

| 주차 | 작업 | 상태 |
|------|------|------|
| Week 1-2 | 모노레포 설정, 프로젝트 이동 | ✅ 완료 |
| Week 3-4 | 프로젝트 상세 페이지 간트 탭 추가 | ⏳ 다음 |

**Week 3-4 상세 작업:**
- [ ] 프로젝트 상세 페이지에 Schedule 탭 추가
- [ ] 프로젝트 ↔ 간트차트 네비게이션 구현
- [ ] 기본 UI 통합 (사이드바, 헤더)

#### Month 2: 기능 완성 및 DB 설계

| 주차 | 작업 | 설명 |
|------|------|------|
| Week 1-2 | 베이스라인 기능 | 스냅샷 저장/비교 |
| Week 1-2 | 제약조건 기능 | ASAP, ALAP, SNET, SNLT 등 |
| Week 3-4 | Supabase 스키마 | 테이블 설계, RLS 정책 |

**Supabase 테이블 설계 (예정):**
```sql
-- 핵심 테이블
schedule_tasks          -- 작업 (WBS, 일정, 제약조건)
schedule_dependencies   -- 의존관계 (앵커 기반 포함)
schedule_milestones     -- 마일스톤
schedule_baselines      -- 베이스라인 스냅샷
schedule_calendars      -- 캘린더 정의
```

#### Month 3: Supabase 연동

| 주차 | 작업 |
|------|------|
| Week 1-2 | SupabaseService 구현 |
| Week 3-4 | React Query 통합, 낙관적 업데이트 |

**핵심 파일 (예정):**
- `packages/gantt/src/lib/services/SupabaseService.ts`
- `apps/web/src/lib/hooks/useScheduleData.ts`

#### Month 4: 보고서 및 내보내기

- 공정 현황 보고서
- Critical Path 보고서
- Excel Export (xlsx)

#### Month 5: 권한 및 UX

- 역할별 편집 권한 (PM, Engineer, Viewer)
- 키보드 단축키 확장
- 에러 핸들링 개선

#### Month 6: 테스트 및 배포

- 10,000 작업 성능 테스트
- E2E 테스트 (Playwright)
- Vercel 프로덕션 배포

---

### Phase 2: 확장 (Month 7~10) - 연기됨

- 실시간 협업 (Supabase Realtime)
- 자원 관리 (Resource Management)
- 모바일 최적화

### Phase 3: 고급 기능 (Month 11~14)

- P6 XER Import/Export
- EVM (Earned Value Management)

### Phase 4: AI 기능 (Month 15~20)

- AI 일정 최적화
- 리스크 예측

---

## 🛠 개발 명령어

```bash
# 의존성 설치
pnpm install

# 개발 서버 실행
pnpm dev              # 전체 실행
pnpm dev:web          # 웹만 실행
pnpm dev:gantt        # 간트 라이브러리만 실행

# 빌드
pnpm build            # 전체 빌드
pnpm build:web        # 웹만 빌드
pnpm build:gantt      # 간트만 빌드

# 테스트
pnpm test

# 정리
pnpm clean
```

---

## 📁 핵심 파일 위치

### 간트차트 라이브러리 (packages/gantt)

| 파일 | 역할 |
|------|------|
| `src/lib/components/GanttChart/index.tsx` | 메인 간트 컴포넌트 |
| `src/lib/components/GanttTimeline/TaskBar.tsx` | 작업 바 렌더링 |
| `src/lib/services/LocalStorageService.ts` | 로컬 저장소 서비스 |
| `src/lib/services/DataService.ts` | 저장소 인터페이스 |
| `src/lib/types/core.ts` | 핵심 타입 정의 |
| `src/lib/utils/criticalPath/calculator.ts` | CPM 엔진 |
| `src/lib/utils/date/dualCalendar.ts` | Dual Calendar 계산 |

### 웹 애플리케이션 (apps/web)

| 파일 | 역할 |
|------|------|
| `src/app/(container)/projects/[id]/schedule/page.tsx` | 간트차트 페이지 |
| `src/app/(container)/projects/[id]/page.tsx` | 프로젝트 상세 |
| `src/lib/supabase/client.ts` | Supabase 클라이언트 |

---

## 🔧 환경 설정

### 필수 환경변수 (.env.local)

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### Node.js 요구사항

- Node.js >= 18
- pnpm >= 9

---

## 📚 참고 문서

- [PRD 문서](./ConstructionScheduler_PRD.md)
- [개발 계획](../.claude/plans/velvet-knitting-thimble.md)
- [sa-gantt-lib 스킬](~/.claude/skills/sa-gantt-lib/SKILL.md)

---

## 🚀 즉시 실행 가능한 다음 작업

### 1. 프로젝트 상세 페이지에 Schedule 탭 추가

```tsx
// apps/web/src/app/(container)/projects/[id]/page.tsx 수정
// 또는 별도 탭 컴포넌트 생성
```

### 2. 실제 Supabase 연결

```bash
# .env.local에 실제 Supabase 값 설정
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

### 3. 개발 서버 실행 및 테스트

```bash
cd /Users/1ncarnati0n/Desktop/tsxPJT/contech-gantt
pnpm dev:web
# 브라우저에서 http://localhost:3000/projects/test-project/schedule 접속
```

---

*문서 버전: 1.0 | 작성일: 2024-12-23*
