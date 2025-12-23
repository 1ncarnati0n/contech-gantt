# ConstructionScheduler 개발 로드맵

> 건설 공정관리 웹 애플리케이션 개발 로드맵
> 최종 업데이트: 2024-12-23

---

## Quick Status

| 단계 | 상태 | 진행률 |
|------|------|--------|
| **Phase 1 MVP** | 진행 중 | 35% |
| Phase 2 확장 | 예정 | 0% |
| Phase 3 고급 기능 | 예정 | 0% |
| Phase 4 AI | 예정 | 0% |

### 최근 완료
- [x] Turborepo 모노레포 설정
- [x] 간트차트 페이지 구현 (`/projects/[id]/schedule`)
- [x] LocalStorage 기반 데이터 저장
- [x] shadcn/ui 컴포넌트 (Dialog, Button, Input, Checkbox)
- [x] TaskEditModal 리팩토링 (Radix Dialog 기반)
- [x] 디자인 토큰 시스템 구축
- [x] MilestoneEditModal 리팩토링 (Radix Dialog 기반)

### 다음 작업
1. [ ] ContextMenu 컴포넌트 마이그레이션
2. [ ] 프로젝트 상세 페이지 Schedule 탭 추가
3. [ ] Supabase 스키마 설계

---

## Phase 1: MVP (6개월)

### Month 1: 인프라 구축 ✅ 완료

#### Week 1-2: 모노레포 설정 ✅
- [x] Turborepo 초기화
- [x] contech-dx → `apps/web` 이동
- [x] sa-gantt-lib → `packages/gantt` 이동 (`@contech/gantt`)
- [x] 공유 설정 (tsconfig, pnpm workspace)
- [x] Next.js 16 + Turbopack 설정

#### Week 3-4: 간트차트 페이지 통합 ✅
- [x] `/projects/[id]/schedule` 라우트 생성
- [x] GanttChart 컴포넌트 임베드
- [x] LocalStorage 기반 데이터 저장

---

### Month 2: 기능 완성 및 DB 설계 ⏳ 진행 중

#### @contech/gantt UI/UX 업그레이드

| 항목 | 상태 | 설명 |
|------|------|------|
| shadcn/ui 설치 | ✅ | Radix UI + CVA |
| 디자인 토큰 | ✅ | `design-tokens.css` |
| Dialog 컴포넌트 | ✅ | TaskEditModal 적용 |
| Button/Input/Checkbox | ✅ | UI 컴포넌트 생성 |
| AlertDialog | ✅ | 삭제 확인용 |
| MilestoneEditModal | ✅ | Radix Dialog 적용 |
| ContextMenu | ⏳ | 사이드바/타임라인 메뉴 |
| Tooltip | ⏳ | TaskBar 호버 정보 |

#### Week 1-2: 기능 보완
- [ ] 베이스라인 관리 기능
  - `Baseline` 타입 정의
  - 스냅샷 저장/로드 UI
  - 현재 vs 베이스라인 오버레이
- [ ] 제약조건 (Constraints) 기능
  - `ConstraintType` 타입 (ASAP, ALAP, SNET, SNLT 등)
  - TaskEditModal에 제약조건 설정 UI
  - CPM 엔진에 제약조건 반영

#### Week 3-4: Supabase 스키마 설계
- [ ] 테이블 생성 SQL 작성
  ```sql
  schedule_tasks          -- 작업 (WBS, 일정, 제약조건)
  schedule_dependencies   -- 의존관계 (앵커 기반 포함)
  schedule_milestones     -- 마일스톤
  schedule_baselines      -- 베이스라인 스냅샷
  schedule_calendars      -- 캘린더 정의
  ```
- [ ] RLS 정책 설계 (프로젝트 멤버 기반)
- [ ] 인덱스 및 트리거 설정

---

### Month 3: Supabase 연동

#### Week 1-2: SupabaseService 구현
- [ ] DataService 인터페이스 구현
- [ ] Tasks CRUD (Date 직렬화/역직렬화)
- [ ] Dependencies CRUD (앵커 기반 포함)
- [ ] Milestones CRUD
- [ ] Baselines CRUD

#### Week 3-4: React Query 통합
- [ ] `useScheduleTasks`, `useScheduleMilestones` 훅
- [ ] `useUpdateTask`, `useCreateDependency` Mutation
- [ ] 낙관적 업데이트 (Optimistic Update)
- [ ] LocalStorage → Supabase 마이그레이션

---

### Month 4: 보고서 및 내보내기

- [ ] 공정 현황 보고서 (WBS별 진척)
- [ ] Critical Path 보고서
- [ ] 프린트 스타일 최적화
- [ ] JSON Export/Import
- [ ] Excel Export (xlsx)

---

### Month 5: 권한 및 UX 개선

#### 권한 세분화
- [ ] 역할별 편집 권한 (PM, Engineer, Viewer)
- [ ] RLS 정책으로 권한 적용
- [ ] 작업 잠금 기능

#### UX 개선
- [ ] 키보드 단축키 확장
- [ ] 툴팁 및 도움말
- [ ] 에러 핸들링 개선
- [ ] 로딩/스켈레톤 UI

---

### Month 6: 테스트 및 배포

- [ ] 10,000 작업 로드 테스트
- [ ] CPM 재계산 최적화 (Web Worker)
- [ ] 번들 사이즈 분석 및 최적화
- [ ] E2E 테스트 (Playwright)
- [ ] Vercel 프로덕션 배포

---

## Phase 2: 확장 (Month 7~10)

| 기능 | 설명 | 우선순위 |
|------|------|----------|
| 실시간 협업 | Supabase Realtime | 높음 |
| 편집 중 사용자 표시 | Presence API | 중간 |
| 자원 관리 | Resource Management | 중간 |
| 모바일 최적화 | 터치 제스처 | 낮음 |

---

## Phase 3: 고급 기능 (Month 11~14)

| 기능 | 설명 |
|------|------|
| P6 XER Import/Export | Primavera 호환 |
| EVM | Earned Value Management |
| 자원 레벨링 | Resource Leveling |
| 다중 베이스라인 | 여러 버전 비교 |

---

## Phase 4: AI 기능 (Month 15~20)

| 기능 | 설명 |
|------|------|
| AI 일정 최적화 | 자동 일정 조정 |
| 리스크 예측 | 지연 위험 분석 |
| 자연어 쿼리 | "다음 주 작업 보여줘" |
| 자동 WBS 생성 | 프로젝트 설명 기반 |

---

## @contech/gantt 업그레이드 일정

> 간트차트 라이브러리 UI/기능 개선 계획

### UI/UX 업그레이드 (9주)

| 주차 | Phase | 작업 | 상태 |
|------|-------|------|------|
| Week 1-2 | Phase 1 | shadcn/ui 컴포넌트 | ✅ 완료 |
| Week 3 | Phase 2 | 접근성 (ARIA, 키보드) | ⏳ 예정 |
| Week 4-6 | Phase 3 | 기능 강화 (베이스라인, 제약조건) | ⏳ 예정 |
| Week 7 | Phase 4 | 성능 최적화 | ⏳ 예정 |
| Week 8-9 | Phase 5 | 데이터 계층 (Supabase) | ⏳ 예정 |

### 성공 지표

| 지표 | 현재 | 목표 |
|------|------|------|
| Lighthouse 접근성 | 65 | 90+ |
| 번들 사이즈 | 477KB | 380KB |
| 초기 로딩 | 2.5s | 1.5s |
| 10,000 작업 렌더링 | 불가 | < 2s |
| 드래그 FPS | 30 | 60 |

---

## 핵심 파일 위치

### packages/gantt
| 파일 | 역할 |
|------|------|
| `src/lib/components/ui/` | shadcn 스타일 UI 컴포넌트 |
| `src/lib/components/TaskEditModal.tsx` | 태스크 편집 모달 |
| `src/lib/design-tokens.css` | 디자인 토큰 |
| `src/lib/services/DataService.ts` | 저장소 인터페이스 |
| `src/lib/utils/criticalPath/` | CPM 엔진 |

### apps/web
| 파일 | 역할 |
|------|------|
| `src/app/(container)/projects/[id]/schedule/` | 간트차트 페이지 |
| `src/lib/supabase/client.ts` | Supabase 클라이언트 |

---

## 관련 문서

- [개발 현황](./DEVELOPMENT_STATUS.md) - 상세 구현 상태
- [간트 업그레이드 전략](./GANTT_UPGRADE_STRATEGY.md) - UI/기능 개선 상세
- [PRD 문서](./ConstructionScheduler_PRD.md) - 요구사항 정의

---

*문서 버전: 1.0 | 작성일: 2024-12-23*
