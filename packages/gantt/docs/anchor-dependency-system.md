# 앵커 기반 간트 차트 종속성 시스템

## 개요

기존 FS(Finish-to-Start), SS(Start-to-Start) 등의 고정된 종속성 타입 대신, **태스크 바 하단의 Day 그리드 접점에 앵커를 배치**하여 임의의 지점 간 연결을 가능하게 하는 유연한 종속성 시스템입니다.

---

## 핵심 개념

### 앵커 (Anchor)

- 태스크 바 하단에 외접하는 연결점
- 각 Day 그리드 경계선마다 앵커 존재
- N일 태스크 → N+1개 앵커 (시작점 + 각 Day 경계)

```
태스크 바 (3일)
┌──────────────────┐
│     3일          │
└──────────────────┘
●────●────●────●
0    1    2    3   ← 앵커 인덱스 (dayIndex)
```

### 종속성 데이터 구조

```typescript
interface Dependency {
  id: number;
  fromTask: number;    // 출발 태스크 ID
  fromDay: number;     // 출발 앵커 인덱스 (0 = 시작점, duration = 끝점)
  toTask: number;      // 도착 태스크 ID
  toDay: number;       // 도착 앵커 인덱스
}
```

### 기존 종속성 타입과의 대응

| 기존 타입 | 앵커 표현 |
|----------|----------|
| FS (Finish-to-Start) | fromDay: duration, toDay: 0 |
| SS (Start-to-Start) | fromDay: 0, toDay: 0 |
| FF (Finish-to-Finish) | fromDay: duration, toDay: duration |
| SF (Start-to-Finish) | fromDay: 0, toDay: duration |
| **중간 연결** | fromDay: N, toDay: M (자유롭게 지정) |

---

## 구현 요소

### 1. 앵커 위치 계산

```javascript
const getAnchorPosition = (task, dayIndex) => {
  const absoluteDay = task.start + dayIndex;
  return {
    x: absoluteDay * CELL_WIDTH,
    y: HEADER_HEIGHT + task.row * ROW_HEIGHT + TASK_TOP_MARGIN + TASK_HEIGHT,
  };
};
```

### 2. 종속성 경로 생성

- 시작점: 출발 앵커 하단 (`y + ANCHOR_RADIUS`)
- 끝점: 도착 앵커 상단에 접함 (`y - ANCHOR_RADIUS`)
- 직각 경로로 연결 (수직 → 수평 → 수직)

```javascript
const createDependencyPath = (dep) => {
  const start = getAnchorPosition(fromTask, dep.fromDay);
  const end = getAnchorPosition(toTask, dep.toDay);
  
  const startY = start.y + ANCHOR_RADIUS;
  const endY = end.y - ANCHOR_RADIUS;
  
  // 아래로 가는 경우
  const midY = startY + (endY - startY) / 2;
  return `M ${start.x} ${startY} V ${midY} H ${end.x} V ${endY}`;
};
```

### 3. 태스크 바 내 앵커 연결선

동일 태스크 내에서 들어오는 종속성(toDay)과 나가는 종속성(fromDay)을 수평선으로 연결하여 크리티컬 패스를 시각적으로 완성합니다.

```javascript
// 들어오는 앵커 → 나가는 앵커 연결
const incomingAnchors = dependencies
  .filter(dep => dep.toTask === task.id)
  .map(dep => dep.toDay);

const outgoingAnchors = dependencies
  .filter(dep => dep.fromTask === task.id)
  .map(dep => dep.fromDay);
```

---

## 렌더링 레이어 순서

SVG에서 나중에 렌더링되는 요소가 위에 표시됩니다.

1. **태스크 바** (맨 아래)
2. **태스크 바 내 앵커 연결선**
3. **종속성 선** (태스크 간)
4. **앵커 포인트**
5. **연결 미리보기 선**
6. **툴팁** (맨 위)

---

## 앵커 표시 조건

앵커는 항상 표시하지 않고 조건부로 표시합니다.

```javascript
const isVisible = isTaskHovered || isConnecting || isAnchorCritical;
```

- 태스크 바에 호버했을 때
- 연결 작업 중일 때 (모든 앵커 표시)
- 크리티컬 패스에 연결된 앵커

---

## 크리티컬 패스 계산

### Forward Pass (ES, EF)

```javascript
// ES = max(선행 작업들의 EF)
if (predecessors.length > 0) {
  data.ES = Math.max(...predecessors.map(p => taskData[p.taskId].EF));
}
data.EF = data.ES + data.duration;
```

### Backward Pass (LS, LF)

```javascript
// LF = min(후행 작업들의 LS)
if (successors.length > 0) {
  data.LF = Math.min(...successors.map(s => taskData[s.taskId].LS));
}
data.LS = data.LF - data.duration;
data.float = data.LS - data.ES;
```

### 크리티컬 판정

```javascript
// Float = 0인 태스크가 크리티컬
const criticalTasks = new Set(
  Object.values(taskData)
    .filter(d => Math.abs(d.float) < 0.001)
    .map(d => d.id)
);

// 양쪽 태스크가 모두 크리티컬인 종속성이 크리티컬 종속성
const criticalDeps = new Set(
  dependencies
    .filter(dep => criticalTasks.has(dep.fromTask) && criticalTasks.has(dep.toTask))
    .map(dep => dep.id)
);
```

---

## 시각적 스타일

### 화살표 마커

```svg
<marker id="arrow" markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto">
  <path d="M0.5,0.5 L4,2.5 L0.5,4.5" 
        fill="none" 
        stroke="#9CA3AF" 
        strokeWidth="1" 
        strokeLinecap="round" 
        strokeLinejoin="round" />
</marker>
```

### 크리티컬 앵커

```javascript
{
  r: 2.5,                    // 작은 내부 원
  fill: '#FEE2E2',           // 연한 분홍
  stroke: '#111827',         // 검은 외곽선
  strokeWidth: 2.5           // 두꺼운 외곽선
}
```

---

## 장점

1. **유연성**: FS/SS 등 고정 타입에 제한되지 않음
2. **직관성**: Day 단위로 정확한 연결점 지정 가능
3. **겹침 표현**: 태스크 중간 지점에서 연결 가능 (Fast-tracking)
4. **시각적 명확성**: 크리티컬 패스가 끊김 없이 연결됨

---

## 적용 시 고려사항

- `ANCHOR_RADIUS` 값에 따라 경로 끝점 조정 필요
- 종속성 선이 태스크 바 위에 렌더링되도록 레이어 순서 관리
- 호버/연결 상태에 따른 앵커 가시성 제어
- 휴일 등 비작업일 처리 시 앵커 위치 계산 고려
