# @contech/gantt 업그레이드 전략

> 건설 전문 간트차트 라이브러리 UI/기능 대폭 개선 계획

---

## 📊 현재 상태 평가

| 영역 | 현재 수준 | 목표 수준 | 우선순위 |
|------|----------|----------|---------|
| **UI/디자인** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | 🔴 높음 |
| **접근성** | ⭐⭐ | ⭐⭐⭐⭐ | 🔴 높음 |
| **기능 완성도** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | 🟡 중간 |
| **성능** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | 🟡 중간 |
| **모바일 지원** | ⭐ | ⭐⭐⭐ | 🟢 낮음 |

---

## 🎯 업그레이드 목표

### 핵심 목표
1. **프로덕션 수준 UI** - shadcn/ui 기반 모던 디자인 시스템
2. **접근성 준수** - WCAG 2.1 AA 수준
3. **건설 특화 기능** - 베이스라인, 제약조건, EVM 지원
4. **성능 최적화** - 10,000개 작업 처리 가능

---

## 📋 Phase 1: UI/UX 대폭 개선 (2주)

### 1.1 컴포넌트 라이브러리 통합

**현재 문제:**
- DIV 기반 모달 (접근성 미흡)
- 일관성 없는 입력 필드
- 수동 스타일링으로 유지보수 어려움

**해결 방안:**
```tsx
// Before: 수동 모달
<div className="fixed inset-0 bg-black/50">
  <div className="bg-white rounded-lg p-6">...</div>
</div>

// After: shadcn/ui Dialog
import { Dialog, DialogContent, DialogHeader } from '@/components/ui/dialog';
<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent>
    <DialogHeader>태스크 편집</DialogHeader>
    ...
  </DialogContent>
</Dialog>
```

**도입할 컴포넌트:**
| 현재 | shadcn/ui 대체 |
|------|---------------|
| `<div>` 모달 | `<Dialog>` |
| `<input>` | `<Input>`, `<DatePicker>` |
| `<select>` | `<Select>` |
| `<button>` | `<Button>` |
| 커스텀 툴팁 | `<Tooltip>` |
| 컨텍스트 메뉴 | `<ContextMenu>` |
| 드롭다운 | `<DropdownMenu>` |

**작업 항목:**
- [ ] shadcn/ui 설치 및 설정
- [ ] TaskEditModal → Dialog 기반으로 재작성
- [ ] MilestoneEditModal → Dialog 기반으로 재작성
- [ ] 사이드바 컨텍스트 메뉴 → ContextMenu 컴포넌트
- [ ] 타임라인 컨텍스트 메뉴 → ContextMenu 컴포넌트
- [ ] 입력 필드 전체 Input/Select 컴포넌트로 교체
- [ ] 버튼 스타일 통일 (Button variants)

---

### 1.2 디자인 시스템 구축

**디자인 토큰 정의:**

```css
/* packages/gantt/src/lib/design-tokens.css */

:root {
  /* === Spacing Scale === */
  --gantt-space-1: 0.25rem;  /* 4px */
  --gantt-space-2: 0.5rem;   /* 8px */
  --gantt-space-3: 0.75rem;  /* 12px */
  --gantt-space-4: 1rem;     /* 16px */
  --gantt-space-6: 1.5rem;   /* 24px */
  --gantt-space-8: 2rem;     /* 32px */

  /* === Typography Scale === */
  --gantt-text-xs: 0.75rem;   /* 12px - 셀 내용 */
  --gantt-text-sm: 0.875rem;  /* 14px - 기본 */
  --gantt-text-base: 1rem;    /* 16px - 제목 */
  --gantt-text-lg: 1.125rem;  /* 18px - 섹션 */
  --gantt-text-xl: 1.25rem;   /* 20px - 페이지 */

  /* === Border Radius === */
  --gantt-radius-sm: 0.25rem;
  --gantt-radius-md: 0.375rem;
  --gantt-radius-lg: 0.5rem;
  --gantt-radius-full: 9999px;

  /* === Shadows === */
  --gantt-shadow-sm: 0 1px 2px rgba(0,0,0,0.05);
  --gantt-shadow-md: 0 4px 6px rgba(0,0,0,0.1);
  --gantt-shadow-lg: 0 10px 15px rgba(0,0,0,0.1);

  /* === Animation === */
  --gantt-transition-fast: 150ms ease;
  --gantt-transition-normal: 200ms ease;
  --gantt-transition-slow: 300ms ease;
}
```

**색상 시스템 개선:**

```css
:root {
  /* === Semantic Colors === */
  --gantt-primary: #3B82F6;       /* 주요 액션 */
  --gantt-primary-hover: #2563EB;

  --gantt-success: #10B981;       /* 완료, 진행률 */
  --gantt-warning: #F59E0B;       /* 지연 경고 */
  --gantt-danger: #EF4444;        /* 오류, Critical */

  /* === Construction-Specific === */
  --gantt-cp-work: #E34234;       /* Level 1 작업일 (주홍) */
  --gantt-cp-nonwork: #008080;    /* Level 1 비작업일 (청록) */

  --gantt-task-net: #DC2626;      /* Level 2 순작업일 (빨강) */
  --gantt-task-indirect: #2563EB; /* Level 2 간접작업일 (파랑) */

  --gantt-critical: #B91C1C;      /* Critical Path */
  --gantt-milestone-master: #6366F1;
  --gantt-milestone-detail: #F59E0B;

  /* === Progress Colors === */
  --gantt-progress-0: #E5E7EB;    /* 0% */
  --gantt-progress-25: #FCD34D;   /* 25% */
  --gantt-progress-50: #FBBF24;   /* 50% */
  --gantt-progress-75: #34D399;   /* 75% */
  --gantt-progress-100: #10B981;  /* 100% */
}
```

**작업 항목:**
- [ ] design-tokens.css 생성
- [ ] 기존 style.css를 토큰 기반으로 리팩토링
- [ ] 인라인 스타일 → Tailwind 클래스로 변환
- [ ] 컬러 팔레트 문서화

---

### 1.3 TaskBar UI 개선

**현재 문제:**
- 진행률 시각화 없음
- 지연 상태 표시 없음
- 호버 시 정보 부족

**개선안:**

```
┌─────────────────────────────────────────────┐
│  [🔵 간접] [🔴 순작업일 ████████░░] [🔵 간접] │ ← 진행률 표시
│                     75%                      │
└─────────────────────────────────────────────┘
         ↓ 호버 시 툴팁
┌─────────────────────────────────┐
│ 📋 터파기 공사                   │
│ ─────────────────────────────── │
│ 📅 2025-01-06 ~ 2025-01-20      │
│ ⏱️ 순작업일: 10일 / 간접: 5일    │
│ 📊 진행률: 75%                   │
│ ⚠️ 상태: 정상 진행               │
│ 🔗 선행작업: 가설공사             │
└─────────────────────────────────┘
```

**구현 코드:**
```tsx
// TaskBar with progress overlay
<g className="task-bar-group">
  {/* Background (total duration) */}
  <rect className="task-bg" />

  {/* Progress overlay */}
  <rect
    className="task-progress"
    width={barWidth * (progress / 100)}
    style={{ fill: getProgressColor(progress) }}
  />

  {/* Indirect work segments */}
  <rect className="indirect-pre" />
  <rect className="indirect-post" />

  {/* Progress text (if space allows) */}
  {barWidth > 40 && (
    <text className="progress-label">{progress}%</text>
  )}

  {/* Delay indicator */}
  {isDelayed && (
    <circle className="delay-indicator" fill="var(--gantt-warning)" />
  )}
</g>
```

**작업 항목:**
- [ ] TaskBar 컴포넌트에 진행률 오버레이 추가
- [ ] 지연 상태 인디케이터 추가 (빨간 점)
- [ ] 호버 툴팁 (Tooltip 컴포넌트) 추가
- [ ] 진행률 색상 그라데이션 적용
- [ ] Critical Path 하이라이트 강화

---

### 1.4 사이드바 UI 개선

**현재 문제:**
- 컬럼 헤더가 단순함
- 정렬 기능 없음
- 필터 기능 없음

**개선안:**

```
┌────────────────────────────────────────────────────────────┐
│ 🔍 검색...                            [📊 필터] [⚙️ 설정] │
├────────────────────────────────────────────────────────────┤
│ WBS │ 작업명           ▼ │ 시작일  ▲ │ 종료일   │ 진행률 │
├─────┼───────────────────┼──────────┼──────────┼────────┤
│ 1   │ ▼ 📁 가설공사     │ 01/06    │ 02/28    │ ████░  │
│ 1.1 │   └ 가설울타리    │ 01/06    │ 01/17    │ ██████ │
│ 1.2 │   └ 현장사무소    │ 01/13    │ 01/24    │ ████░░ │
├─────┼───────────────────┼──────────┼──────────┼────────┤
│ 2   │ ▶ 📁 기초공사     │ 01/27    │ 03/15    │ ░░░░░░ │
└─────┴───────────────────┴──────────┴──────────┴────────┘
```

**새로운 기능:**
1. **검색 바** - 작업명으로 필터링
2. **컬럼 정렬** - 클릭하여 오름차순/내림차순
3. **진행률 바** - 미니 프로그레스 바
4. **상태 아이콘** - 정상/지연/완료
5. **필터 드롭다운** - 상태별, 담당자별

**작업 항목:**
- [ ] 검색 바 컴포넌트 추가
- [ ] 컬럼 헤더 정렬 기능
- [ ] 진행률 미니 바 렌더링
- [ ] 상태 아이콘 추가
- [ ] 필터 드롭다운 메뉴

---

### 1.5 헤더 툴바 개선

**현재:**
```
[Master] [Detail] | [Day] [Week] [Month] | [Theme Toggle]
```

**개선안:**
```
┌─────────────────────────────────────────────────────────────────────────┐
│ 📅 공정표                                                               │
├─────────────────────────────────────────────────────────────────────────┤
│ [◀ 오늘] [◀ 이전] [다음 ▶]  │  🔍 2025년 1월  │  [📅] [📊] [📋]       │
│                              │                  │                       │
│ [Master ▾] [Day ▾]          │  진행률: 45%     │  [💾 저장] [↗ 내보내기]│
└─────────────────────────────────────────────────────────────────────────┘
```

**새로운 기능:**
1. **날짜 네비게이션** - 오늘, 이전/다음 기간
2. **현재 날짜 표시** - 스크롤 위치의 날짜
3. **전체 진행률** - 프로젝트 진행 상황
4. **뷰 전환 탭** - 간트/리스트/캘린더
5. **빠른 액션** - 저장, 내보내기, 설정

**작업 항목:**
- [ ] GanttHeader 컴포넌트 리디자인
- [ ] 날짜 네비게이션 버튼 추가
- [ ] "오늘로 이동" 기능
- [ ] 전체 진행률 표시
- [ ] 저장 상태 인디케이터

---

## 📋 Phase 2: 접근성 개선 (1주)

### 2.1 ARIA 레이블 추가

```tsx
// Before
<rect onClick={handleClick} />

// After
<rect
  role="button"
  aria-label={`${task.name}, ${formatDate(task.startDate)}부터 ${formatDate(task.endDate)}까지`}
  aria-describedby={`task-${task.id}-details`}
  tabIndex={0}
  onKeyDown={handleKeyDown}
  onClick={handleClick}
/>
```

### 2.2 키보드 네비게이션 강화

| 키 | 동작 |
|----|------|
| `Tab` | 다음 요소로 이동 |
| `Arrow Keys` | 작업 간 이동 |
| `Enter` | 편집 모달 열기 |
| `Space` | 작업 선택 토글 |
| `Delete` | 선택된 작업 삭제 |
| `Ctrl+C/V` | 복사/붙여넣기 |
| `Ctrl+Z/Y` | 실행취소/다시실행 |
| `Home/End` | 첫/마지막 작업으로 |

### 2.3 색상 대비 개선

```css
/* 색상만 의존하지 않고 패턴 추가 */
.task-net-work {
  fill: var(--gantt-task-net);
  /* 추가: 사선 패턴 */
  fill: url(#pattern-net-work);
}

.task-indirect {
  fill: var(--gantt-task-indirect);
  /* 추가: 점선 패턴 */
  fill: url(#pattern-indirect);
}
```

**작업 항목:**
- [ ] 모든 인터랙티브 요소에 ARIA 레이블 추가
- [ ] SVG 요소 키보드 접근성
- [ ] 포커스 인디케이터 스타일링
- [ ] 스크린 리더 테스트
- [ ] 색맹 모드 지원 (패턴 기반)

---

## 📋 Phase 3: 기능 강화 (3주)

### 3.1 베이스라인 기능

**목적:** 원래 계획과 현재 계획 비교

```tsx
interface Baseline {
  id: string;
  name: string;
  createdAt: Date;
  tasks: BaselineTask[];
}

interface BaselineTask {
  taskId: string;
  plannedStart: Date;
  plannedEnd: Date;
  plannedNetWorkDays: number;
}
```

**UI 표현:**
```
현재 계획  ████████████████████
베이스라인 ░░░░░░░░░░░░░░░░░░   (원래 더 짧았음 - 지연)
                          ↑
                       +5일 지연
```

**작업 항목:**
- [ ] Baseline 타입 정의
- [ ] 베이스라인 저장/불러오기 UI
- [ ] 베이스라인 오버레이 렌더링
- [ ] 차이 분석 표시 (지연/단축)
- [ ] 베이스라인 비교 보고서

---

### 3.2 제약조건 (Constraints)

**목적:** 작업 일정 제한 설정

```tsx
type ConstraintType =
  | 'ASAP'  // As Soon As Possible (기본값)
  | 'ALAP'  // As Late As Possible
  | 'SNET'  // Start No Earlier Than
  | 'SNLT'  // Start No Later Than
  | 'FNET'  // Finish No Earlier Than
  | 'FNLT'  // Finish No Later Than
  | 'MSO'   // Must Start On
  | 'MFO';  // Must Finish On

interface TaskConstraint {
  type: ConstraintType;
  date?: Date;  // SNET, SNLT, FNET, FNLT, MSO, MFO에 필요
}
```

**UI 표현:**
```
[작업명] [🔒 SNLT: 01/15] ██████████████
                    ↑
              "1월 15일 이전 시작 필수"
```

**작업 항목:**
- [ ] ConstraintType 타입 정의
- [ ] TaskEditModal에 제약조건 UI 추가
- [ ] CPM 엔진에 제약조건 반영
- [ ] 제약조건 위반 경고 표시
- [ ] 제약조건 아이콘/툴팁

---

### 3.3 자원 관리 (Resource Allocation)

**목적:** 인력/장비 배정 및 과부하 감지

```tsx
interface Resource {
  id: string;
  name: string;
  type: 'LABOR' | 'EQUIPMENT' | 'MATERIAL';
  capacity: number;  // 일일 가용량
  unit: string;      // '명', '대', 'ton' 등
}

interface TaskResource {
  resourceId: string;
  allocation: number;  // 배정량
}
```

**UI - 자원 히스토그램:**
```
인력 배정 현황
12 ┤
10 ┤     ████
 8 ┤   ██████████  ← 과부하 (빨간색)
 6 ┤─────────────────── 가용량
 4 ┤ ██████████████
 2 ┤████████████████
 0 └─────────────────────────
     1월   2월   3월
```

**작업 항목:**
- [ ] Resource, TaskResource 타입 정의
- [ ] 자원 관리 패널 UI
- [ ] 자원 히스토그램 차트
- [ ] 과부하 감지 및 경고
- [ ] 자원 레벨링 알고리즘 (기본)

---

### 3.4 진척 관리 강화

**목적:** 실제 진행 상황 추적

```tsx
interface TaskProgress {
  plannedProgress: number;    // 계획 진행률 (날짜 기준)
  actualProgress: number;     // 실제 진행률 (입력)
  actualStart?: Date;         // 실제 시작일
  actualEnd?: Date;           // 실제 종료일
  remainingDays?: number;     // 잔여 작업일
}
```

**상태 자동 계산:**
- 🟢 **정상** - 실제 ≥ 계획
- 🟡 **주의** - 실제 < 계획 (5% 이내)
- 🔴 **지연** - 실제 < 계획 (5% 초과)
- ✅ **완료** - 100% 완료

**작업 항목:**
- [ ] TaskProgress 타입 정의
- [ ] 진행률 입력 UI
- [ ] 계획 대비 실적 비교
- [ ] 상태 자동 계산 로직
- [ ] 지연 작업 필터/하이라이트

---

### 3.5 보고서 기능

**목적:** 공정 현황 보고서 생성

**보고서 유형:**
1. **공정 현황 보고서** - WBS별 진척 요약
2. **Critical Path 보고서** - CP 작업 목록
3. **지연 작업 보고서** - 지연 원인/대책
4. **자원 현황 보고서** - 자원 배정/과부하

**출력 형식:**
- 📄 PDF (react-pdf)
- 📊 Excel (xlsx)
- 🖨️ 인쇄 최적화 CSS

**작업 항목:**
- [ ] 보고서 템플릿 디자인
- [ ] PDF 생성 기능 (react-pdf)
- [ ] Excel 내보내기 (xlsx)
- [ ] 인쇄용 CSS 최적화

---

## 📋 Phase 4: 성능 최적화 (1주)

### 4.1 SVG 렌더링 최적화

**현재 문제:**
- 100개+ 작업 시 렌더링 지연
- 드래그 시 프레임 드롭

**해결 방안:**

```tsx
// 1. Canvas 하이브리드 렌더링
const RenderMode = {
  SVG: 'svg',      // < 200 tasks
  CANVAS: 'canvas' // >= 200 tasks
};

// 2. 레이어 분리
<svg>
  <g id="grid-layer">...</g>      {/* 정적 - 캐싱 */}
  <g id="bars-layer">...</g>      {/* 동적 - 필요시만 */}
  <g id="deps-layer">...</g>      {/* 정적 - 캐싱 */}
  <g id="overlay-layer">...</g>   {/* 드래그 중만 */}
</svg>

// 3. 가상화 확장
- 현재: 사이드바 행만 가상화
- 개선: 타임라인 열도 가상화
```

### 4.2 메모이제이션 강화

```tsx
// 날짜 계산 캐싱
const dateCache = new Map<string, Date>();

const addWorkingDaysMemo = useMemo(() => {
  return memoize(addWorkingDays, {
    maxSize: 1000,
    keyFn: (date, days, holidays) =>
      `${date.getTime()}-${days}-${holidays.length}`
  });
}, []);

// 의존성 라인 계산 캐싱
const dependencyPaths = useMemo(() => {
  return dependencies.map(dep =>
    calculateDependencyPath(dep, taskPositions)
  );
}, [dependencies, taskPositions]);
```

### 4.3 번들 최적화

```tsx
// 동적 임포트
const TaskEditModal = lazy(() => import('./TaskEditModal'));
const MilestoneEditModal = lazy(() => import('./MilestoneEditModal'));
const ReportGenerator = lazy(() => import('./ReportGenerator'));

// Tree-shaking 최적화
export { GanttChart } from './components';
export type { ConstructionTask, Milestone } from './types';
// 불필요한 내부 유틸 노출 제거
```

**작업 항목:**
- [ ] Canvas 렌더링 모드 추가 (대규모 데이터)
- [ ] 타임라인 열 가상화
- [ ] 날짜 계산 메모이제이션
- [ ] React.memo 적용 범위 확대
- [ ] 번들 사이즈 분석 및 최적화

---

## 📋 Phase 5: 데이터 계층 강화 (2주)

### 5.1 Supabase 서비스 구현

```tsx
// packages/gantt/src/lib/services/SupabaseService.ts
export class SupabaseService implements DataService {
  private supabase: SupabaseClient;
  private projectId: string;

  async loadAll(): Promise<GanttData> {
    const [tasks, milestones, deps] = await Promise.all([
      this.supabase.from('schedule_tasks')
        .select('*')
        .eq('project_id', this.projectId),
      this.supabase.from('schedule_milestones')
        .select('*')
        .eq('project_id', this.projectId),
      this.supabase.from('schedule_dependencies')
        .select('*')
        .eq('project_id', this.projectId),
    ]);

    return {
      tasks: this.deserializeTasks(tasks.data),
      milestones: this.deserializeMilestones(milestones.data),
      dependencies: deps.data,
    };
  }

  async saveTask(task: ConstructionTask): Promise<void> {
    await this.supabase
      .from('schedule_tasks')
      .upsert(this.serializeTask(task));
  }
}
```

### 5.2 React Query 통합

```tsx
// apps/web/src/lib/hooks/useScheduleData.ts
export function useScheduleTasks(projectId: string) {
  return useQuery({
    queryKey: ['schedule', projectId, 'tasks'],
    queryFn: () => scheduleService.loadTasks(projectId),
    staleTime: 1000 * 60 * 5, // 5분
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: scheduleService.updateTask,
    // 낙관적 업데이트
    onMutate: async (task) => {
      await queryClient.cancelQueries(['schedule', task.projectId]);
      const previous = queryClient.getQueryData(['schedule', task.projectId]);
      queryClient.setQueryData(['schedule', task.projectId], (old) => ({
        ...old,
        tasks: old.tasks.map(t => t.id === task.id ? task : t)
      }));
      return { previous };
    },
    onError: (err, task, context) => {
      queryClient.setQueryData(['schedule', task.projectId], context.previous);
    },
  });
}
```

### 5.3 실시간 동기화 (Phase 2 대비)

```tsx
// Supabase Realtime 구독
useEffect(() => {
  const channel = supabase
    .channel(`schedule-${projectId}`)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'schedule_tasks',
      filter: `project_id=eq.${projectId}`
    }, (payload) => {
      queryClient.invalidateQueries(['schedule', projectId]);
    })
    .subscribe();

  return () => { channel.unsubscribe(); };
}, [projectId]);
```

---

## 📊 구현 우선순위 매트릭스

```
                    영향력 높음
                        │
     ┌──────────────────┼──────────────────┐
     │                  │                  │
     │  [Phase 3]       │  [Phase 1]       │
     │  기능 강화        │  UI/UX 개선      │
     │  - 베이스라인     │  - shadcn/ui    │
     │  - 제약조건      │  - 디자인 토큰   │ 노력
     │  - 자원 관리     │  - TaskBar 개선  │ 높음
     │                  │                  │
─────┼──────────────────┼──────────────────┼─────
     │                  │                  │
     │  [Phase 5]       │  [Phase 2]       │
     │  데이터 계층      │  접근성 개선     │ 노력
     │  - Supabase     │  - ARIA         │ 낮음
     │  - React Query  │  - 키보드       │
     │                  │                  │
     └──────────────────┼──────────────────┘
                        │
                    영향력 낮음
```

---

## 📅 실행 일정

| Phase | 기간 | 주요 작업 |
|-------|------|----------|
| **Phase 1** | Week 1-2 | UI/UX 개선 (shadcn/ui, 디자인 토큰) |
| **Phase 2** | Week 3 | 접근성 (ARIA, 키보드) |
| **Phase 3** | Week 4-6 | 기능 강화 (베이스라인, 제약조건) |
| **Phase 4** | Week 7 | 성능 최적화 |
| **Phase 5** | Week 8-9 | 데이터 계층 (Supabase) |

---

## 🎯 성공 지표

| 지표 | 현재 | 목표 |
|------|------|------|
| Lighthouse 접근성 | 65 | 90+ |
| 번들 사이즈 | 350KB | 280KB |
| 초기 로딩 | 2.5s | 1.5s |
| 10,000 작업 렌더링 | 불가 | < 2s |
| 드래그 FPS | 30 | 60 |

---

## 📂 파일 구조 변경 (예상)

```
packages/gantt/src/lib/
├── components/
│   ├── ui/                    # shadcn/ui 기반 (NEW)
│   │   ├── dialog.tsx
│   │   ├── input.tsx
│   │   ├── button.tsx
│   │   └── ...
│   ├── GanttChart/
│   ├── GanttTimeline/
│   │   ├── TaskBar/           # 분리 (NEW)
│   │   │   ├── TaskBarLevel1.tsx
│   │   │   ├── TaskBarLevel2.tsx
│   │   │   ├── ProgressOverlay.tsx
│   │   │   └── TaskTooltip.tsx
│   │   └── ...
│   └── GanttSidebar/
│       ├── SearchBar.tsx       # NEW
│       ├── FilterDropdown.tsx  # NEW
│       └── ...
├── features/                   # 도메인별 분리 (NEW)
│   ├── baseline/
│   │   ├── types.ts
│   │   ├── BaselineOverlay.tsx
│   │   └── useBaseline.ts
│   ├── constraints/
│   ├── resources/
│   └── reports/
├── services/
│   ├── SupabaseService.ts     # NEW
│   └── ...
└── styles/
    ├── design-tokens.css      # NEW
    └── style.css
```

---

*문서 버전: 1.0 | 작성일: 2024-12-23*
