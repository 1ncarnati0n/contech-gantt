import React, { useState, useMemo } from 'react';

// 샘플 태스크 데이터
const initialTasks = [
  { id: 1, name: '기초 공사', start: 0, duration: 2, row: 0, color: '#3B82F6' },
  { id: 2, name: '골조 공사', start: 3, duration: 4, row: 1, color: '#10B981' },
  { id: 3, name: '전기 배선', start: 5, duration: 3, row: 2, color: '#F59E0B' },
  { id: 4, name: '배관 공사', start: 3, duration: 2, row: 3, color: '#8B5CF6' },
  { id: 5, name: '내부 마감', start: 8, duration: 2, row: 4, color: '#06B6D4' },
  { id: 6, name: '외부 작업', start: 10, duration: 2, row: 5, color: '#EC4899' },
];

// 종속성 (앵커 기반) - 골조 2일차에서 전기 시작으로 연결
const initialDependencies = [
  { id: 1, fromTask: 1, fromDay: 2, toTask: 2, toDay: 0 },
  { id: 2, fromTask: 2, fromDay: 2, toTask: 3, toDay: 0 },
  { id: 3, fromTask: 3, fromDay: 3, toTask: 5, toDay: 0 },
];

const CELL_WIDTH = 60;
const ROW_HEIGHT = 55;
const HEADER_HEIGHT = 40;
const TASK_HEIGHT = 28;
const TASK_TOP_MARGIN = 6;
const ANCHOR_RADIUS = 3;
const LABEL_WIDTH = 150;

export default function GanttCriticalPath() {
  const [tasks] = useState(initialTasks);
  const [dependencies, setDependencies] = useState(initialDependencies);
  const [selectedDep, setSelectedDep] = useState(null);
  const [hoveredAnchor, setHoveredAnchor] = useState(null);
  const [connecting, setConnecting] = useState(null);
  const [showCriticalPath, setShowCriticalPath] = useState(true);
  const [hoveredTask, setHoveredTask] = useState(null);

  const totalDays = 14;
  const chartWidth = totalDays * CELL_WIDTH;
  const chartHeight = tasks.length * ROW_HEIGHT + HEADER_HEIGHT;

  // 크리티컬 패스 계산
  const criticalPathData = useMemo(() => {
    const taskData = {};

    tasks.forEach(task => {
      taskData[task.id] = {
        id: task.id,
        duration: task.duration,
        ES: 0,
        EF: task.duration,
        LS: Infinity,
        LF: Infinity,
        float: 0,
        predecessors: [],
        successors: [],
      };
    });

    dependencies.forEach(dep => {
      const fromData = taskData[dep.fromTask];
      const toData = taskData[dep.toTask];
      if (fromData && toData) {
        fromData.successors.push({ taskId: dep.toTask, depId: dep.id });
        toData.predecessors.push({ taskId: dep.fromTask, depId: dep.id });
      }
    });

    // Forward Pass
    const visited = new Set();
    const queue = tasks
      .filter(t => taskData[t.id].predecessors.length === 0)
      .map(t => t.id);

    while (queue.length > 0) {
      const taskId = queue.shift();
      if (visited.has(taskId)) continue;

      const data = taskData[taskId];
      const allPredsDone = data.predecessors.every(p => visited.has(p.taskId));
      if (!allPredsDone) {
        queue.push(taskId);
        continue;
      }

      if (data.predecessors.length > 0) {
        data.ES = Math.max(...data.predecessors.map(p => taskData[p.taskId].EF));
      }
      data.EF = data.ES + data.duration;

      visited.add(taskId);
      data.successors.forEach(s => {
        if (!visited.has(s.taskId)) queue.push(s.taskId);
      });
    }

    const projectEnd = Math.max(...Object.values(taskData).map(d => d.EF));

    // Backward Pass
    const visitedBack = new Set();
    const endTasks = tasks
      .filter(t => taskData[t.id].successors.length === 0)
      .map(t => t.id);

    endTasks.forEach(id => {
      taskData[id].LF = projectEnd;
      taskData[id].LS = projectEnd - taskData[id].duration;
    });

    const queueBack = [...endTasks];

    while (queueBack.length > 0) {
      const taskId = queueBack.shift();
      if (visitedBack.has(taskId)) continue;

      const data = taskData[taskId];
      const allSuccsDone = data.successors.every(s => visitedBack.has(s.taskId));
      if (!allSuccsDone && data.successors.length > 0) {
        queueBack.push(taskId);
        continue;
      }

      if (data.successors.length > 0) {
        data.LF = Math.min(...data.successors.map(s => taskData[s.taskId].LS));
      }
      data.LS = data.LF - data.duration;
      data.float = data.LS - data.ES;

      visitedBack.add(taskId);
      data.predecessors.forEach(p => {
        if (!visitedBack.has(p.taskId)) queueBack.push(p.taskId);
      });
    }

    const criticalTasks = new Set(
      Object.values(taskData)
        .filter(d => Math.abs(d.float) < 0.001)
        .map(d => d.id)
    );

    const criticalDeps = new Set(
      dependencies
        .filter(dep => criticalTasks.has(dep.fromTask) && criticalTasks.has(dep.toTask))
        .map(dep => dep.id)
    );

    return { taskData, criticalTasks, criticalDeps, projectEnd };
  }, [tasks, dependencies]);

  // 앵커 위치 계산
  const getAnchorPosition = (task, dayIndex) => {
    const absoluteDay = task.start + dayIndex;
    return {
      x: absoluteDay * CELL_WIDTH,
      y: HEADER_HEIGHT + task.row * ROW_HEIGHT + TASK_TOP_MARGIN + TASK_HEIGHT,
    };
  };

  // 종속성 경로 생성 - 앵커에 접하도록 조정
  const createDependencyPath = (dep) => {
    const fromTask = tasks.find(t => t.id === dep.fromTask);
    const toTask = tasks.find(t => t.id === dep.toTask);

    if (!fromTask || !toTask) return null;

    const start = getAnchorPosition(fromTask, dep.fromDay);
    const end = getAnchorPosition(toTask, dep.toDay);

    // 시작점: 앵커 하단에서 시작
    const startY = start.y + ANCHOR_RADIUS;
    // 끝점: 앵커 상단에 접하도록 (앵커 반지름만큼 위에서 끝)
    const endY = end.y - ANCHOR_RADIUS;

    const verticalDiff = end.y - start.y;
    const horizontalDiff = end.x - start.x;

    if (Math.abs(verticalDiff) < 5) {
      // 같은 행 - 수평선
      const endX = end.x - ANCHOR_RADIUS;
      return `M ${start.x} ${startY} L ${endX} ${start.y}`;
    } else if (verticalDiff > 0) {
      // 아래로 가는 경우
      const midY = startY + (endY - startY) / 2;
      return `M ${start.x} ${startY} V ${midY} H ${end.x} V ${endY}`;
    } else {
      // 위로 가는 경우
      const dropDown = 10;
      const midX = Math.min(start.x, end.x) - 15;
      return `M ${start.x} ${startY} V ${startY + dropDown} H ${midX} V ${endY - dropDown} H ${end.x} V ${endY}`;
    }
  };

  const handleAnchorClick = (task, dayIndex) => {
    if (!connecting) {
      setConnecting({ task, dayIndex });
    } else {
      if (connecting.task.id !== task.id) {
        const newDep = {
          id: Date.now(),
          fromTask: connecting.task.id,
          fromDay: connecting.dayIndex,
          toTask: task.id,
          toDay: dayIndex,
        };
        setDependencies([...dependencies, newDep]);
      }
      setConnecting(null);
    }
  };

  const handleDeleteDep = () => {
    if (selectedDep !== null) {
      setDependencies(dependencies.filter((_, idx) => idx !== selectedDep));
      setSelectedDep(null);
    }
  };

  const { criticalTasks, criticalDeps, taskData, projectEnd } = criticalPathData;

  return (
    <div className="p-4 bg-gray-50 min-h-screen">
      <h1 className="text-xl font-bold mb-2 text-gray-800">크리티컬 패스 분석</h1>

      {/* 컨트롤 */}
      <div className="mb-4 flex gap-4 items-center flex-wrap">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={showCriticalPath}
            onChange={(e) => setShowCriticalPath(e.target.checked)}
            className="w-4 h-4 rounded"
          />
          <span className="text-sm font-medium text-gray-700">크리티컬 패스 표시</span>
        </label>

        <div className="text-sm text-gray-600">
          프로젝트 기간: <span className="font-bold text-gray-800">{projectEnd}일</span>
        </div>

        {connecting && (
          <div className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            연결 중: {connecting.task.name}
            <button
              className="ml-1 text-green-600 hover:text-green-800 font-medium"
              onClick={() => setConnecting(null)}
            >
              ✕
            </button>
          </div>
        )}

        {selectedDep !== null && (
          <button
            className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 text-sm"
            onClick={handleDeleteDep}
          >
            종속성 삭제
          </button>
        )}
      </div>

      {/* 범례 */}
      <div className="mb-4 flex gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-500 rounded"></div>
          <span>크리티컬 태스크</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-0.5 bg-gray-900"></div>
          <span>크리티컬 패스</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-0.5 bg-gray-400"></div>
          <span>일반 종속성</span>
        </div>
      </div>

      {/* 간트 차트 */}
      <div className="bg-white rounded-lg shadow overflow-auto">
        <svg
          width={chartWidth + LABEL_WIDTH + 100}
          height={chartHeight + 30}
          className="font-sans"
        >
          <defs>
            {/* 세련된 슬림 화살표 */}
            <marker id="arrow" markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto">
              <path d="M0.5,0.5 L4,2.5 L0.5,4.5" fill="none" stroke="#9CA3AF" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
            </marker>
            <marker id="arrow-critical" markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto">
              <path d="M0.5,0.5 L4,2.5 L0.5,4.5" fill="none" stroke="#111827" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
            </marker>
            <marker id="arrow-selected" markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto">
              <path d="M0.5,0.5 L4,2.5 L0.5,4.5" fill="none" stroke="#3B82F6" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
            </marker>
            <marker id="arrow-connecting" markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto">
              <path d="M0.5,0.5 L4,2.5 L0.5,4.5" fill="none" stroke="#10B981" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
            </marker>
          </defs>

          {/* 휴일 컬럼 배경 (3일) */}
          <rect
            x={LABEL_WIDTH + 2 * CELL_WIDTH}
            y={HEADER_HEIGHT}
            width={CELL_WIDTH}
            height={chartHeight - HEADER_HEIGHT}
            fill="#FEF2F2"
          />

          {/* 배경 그리드 */}
          <g>
            {Array.from({ length: totalDays + 1 }).map((_, i) => (
              <line
                key={`v-${i}`}
                x1={LABEL_WIDTH + i * CELL_WIDTH}
                y1={HEADER_HEIGHT}
                x2={LABEL_WIDTH + i * CELL_WIDTH}
                y2={chartHeight}
                stroke="#E5E7EB"
                strokeWidth="1"
              />
            ))}
            {Array.from({ length: tasks.length + 1 }).map((_, i) => (
              <line
                key={`h-${i}`}
                x1={0}
                y1={HEADER_HEIGHT + i * ROW_HEIGHT}
                x2={chartWidth + LABEL_WIDTH}
                y2={HEADER_HEIGHT + i * ROW_HEIGHT}
                stroke="#E5E7EB"
                strokeWidth="1"
              />
            ))}
          </g>

          {/* 헤더 */}
          <g>
            <rect x={0} y={0} width={LABEL_WIDTH} height={HEADER_HEIGHT} fill="#F3F4F6" />
            <text x={LABEL_WIDTH / 2} y={25} textAnchor="middle" className="text-sm font-medium fill-gray-700">
              작업명
            </text>
            {Array.from({ length: totalDays }).map((_, i) => {
              const isHoliday = i === 2; // 3일 (인덱스 2)
              return (
                <g key={`header-${i}`}>
                  <rect
                    x={LABEL_WIDTH + i * CELL_WIDTH}
                    y={0}
                    width={CELL_WIDTH}
                    height={HEADER_HEIGHT}
                    fill={isHoliday ? '#FEE2E2' : '#F3F4F6'}
                  />
                  <text
                    x={LABEL_WIDTH + i * CELL_WIDTH + CELL_WIDTH / 2}
                    y={25}
                    textAnchor="middle"
                    className={`text-xs ${isHoliday ? 'fill-red-400' : 'fill-gray-600'}`}
                  >
                    {i + 1}
                  </text>
                </g>
              );
            })}
          </g>

          {/* 작업명 + Float 정보 */}
          <g>
            {tasks.map((task) => {
              const data = taskData[task.id];

              return (
                <g key={`label-${task.id}`}>
                  <rect
                    x={0}
                    y={HEADER_HEIGHT + task.row * ROW_HEIGHT}
                    width={LABEL_WIDTH}
                    height={ROW_HEIGHT}
                    fill="white"
                  />
                  <text
                    x={10}
                    y={HEADER_HEIGHT + task.row * ROW_HEIGHT + TASK_TOP_MARGIN + TASK_HEIGHT / 2 + 4}
                    className="text-sm fill-gray-800"
                  >
                    {task.name}
                  </text>
                  <text
                    x={LABEL_WIDTH - 8}
                    y={HEADER_HEIGHT + task.row * ROW_HEIGHT + TASK_TOP_MARGIN + TASK_HEIGHT / 2 + 4}
                    textAnchor="end"
                    className={`text-xs ${data?.float === 0 ? 'fill-red-500' : 'fill-gray-400'}`}
                  >
                    F:{data?.float || 0}
                  </text>
                </g>
              );
            })}
          </g>

          {/* 차트 영역 */}
          <g transform={`translate(${LABEL_WIDTH}, 0)`}>

            {/* 1. 태스크 바 (맨 아래 레이어) */}
            {tasks.map((task) => {
              const taskX = task.start * CELL_WIDTH;
              const taskY = HEADER_HEIGHT + task.row * ROW_HEIGHT + TASK_TOP_MARGIN;
              const taskWidth = task.duration * CELL_WIDTH;
              const isCritical = showCriticalPath && criticalTasks.has(task.id);

              return (
                <g
                  key={`task-${task.id}`}
                  onMouseEnter={() => setHoveredTask(task.id)}
                  onMouseLeave={() => setHoveredTask(null)}
                >
                  <rect
                    x={taskX}
                    y={taskY}
                    width={taskWidth}
                    height={TASK_HEIGHT}
                    rx={4}
                    fill={isCritical ? '#EF4444' : task.color}
                    stroke={isCritical ? '#B91C1C' : 'transparent'}
                    strokeWidth={isCritical ? 2 : 0}
                  />
                  <text
                    x={taskX + taskWidth / 2}
                    y={taskY + TASK_HEIGHT / 2 + 4}
                    textAnchor="middle"
                    className="text-xs fill-white font-medium pointer-events-none"
                  >
                    {task.duration}일
                  </text>
                </g>
              );
            })}

            {/* 2. 태스크 바 내 앵커 연결선 (끝점 → 시작점) */}
            {tasks.map((task) => {
              // 이 태스크로 들어오는 종속성의 toDay 찾기
              const incomingAnchors = dependencies
                .filter(dep => dep.toTask === task.id)
                .map(dep => dep.toDay);

              // 이 태스크에서 나가는 종속성의 fromDay 찾기
              const outgoingAnchors = dependencies
                .filter(dep => dep.fromTask === task.id)
                .map(dep => dep.fromDay);

              // 연결이 필요한 쌍 찾기 (들어오는 앵커 → 나가는 앵커)
              const connections = [];
              incomingAnchors.forEach(inDay => {
                outgoingAnchors.forEach(outDay => {
                  if (inDay < outDay) {
                    connections.push({ from: inDay, to: outDay });
                  }
                });
              });

              if (connections.length === 0) return null;

              const isCritical = showCriticalPath && criticalTasks.has(task.id);

              return (
                <g key={`task-connections-${task.id}`}>
                  {connections.map((conn, idx) => {
                    const fromPos = getAnchorPosition(task, conn.from);
                    const toPos = getAnchorPosition(task, conn.to);

                    return (
                      <line
                        key={`conn-${task.id}-${idx}`}
                        x1={fromPos.x}
                        y1={fromPos.y}
                        x2={toPos.x}
                        y2={toPos.y}
                        stroke={isCritical ? '#111827' : '#9CA3AF'}
                        strokeWidth={isCritical ? 2.5 : 1.5}
                      />
                    );
                  })}
                </g>
              );
            })}

            {/* 3. 종속성 선 (태스크 바 위에 렌더링) */}
            {dependencies.map((dep, idx) => {
              const path = createDependencyPath(dep);
              if (!path) return null;

              const isSelected = selectedDep === idx;
              const isCritical = showCriticalPath && criticalDeps.has(dep.id);

              let strokeColor = '#9CA3AF';
              let markerEnd = 'url(#arrow)';

              if (isSelected) {
                strokeColor = '#3B82F6';
                markerEnd = 'url(#arrow-selected)';
              } else if (isCritical) {
                strokeColor = '#111827';
                markerEnd = 'url(#arrow-critical)';
              }

              return (
                <g key={`dep-${dep.id}`}>
                  <path
                    d={path}
                    fill="none"
                    stroke="transparent"
                    strokeWidth="12"
                    style={{ cursor: 'pointer' }}
                    onClick={() => setSelectedDep(isSelected ? null : idx)}
                  />
                  <path
                    d={path}
                    fill="none"
                    stroke={strokeColor}
                    strokeWidth={isCritical || isSelected ? 2.5 : 1.5}
                    markerEnd={markerEnd}
                    style={{ cursor: 'pointer' }}
                    onClick={() => setSelectedDep(isSelected ? null : idx)}
                  />
                </g>
              );
            })}

            {/* 4. 앵커 포인트 (종속성 선 위에 렌더링) */}
            {tasks.map((task) => {
              const anchorCount = task.duration + 1;
              const isCritical = showCriticalPath && criticalTasks.has(task.id);
              const isTaskHovered = hoveredTask === task.id;
              const showAnchors = isTaskHovered || connecting;

              return (
                <g key={`anchors-${task.id}`}>
                  {Array.from({ length: anchorCount }).map((_, dayIdx) => {
                    const anchorPos = getAnchorPosition(task, dayIdx);
                    const isConnectingFrom = connecting?.task.id === task.id && connecting?.dayIndex === dayIdx;
                    const isHovered = hoveredAnchor?.task.id === task.id && hoveredAnchor?.dayIndex === dayIdx;

                    const isAnchorCritical = showCriticalPath && dependencies.some(dep =>
                      criticalDeps.has(dep.id) && (
                        (dep.fromTask === task.id && dep.fromDay === dayIdx) ||
                        (dep.toTask === task.id && dep.toDay === dayIdx)
                      )
                    );

                    // 앵커 표시 조건: 태스크 호버, 연결 중, 또는 크리티컬 앵커
                    const isVisible = showAnchors || isAnchorCritical;

                    return (
                      <g key={`anchor-${task.id}-${dayIdx}`}>
                        {/* 클릭 영역 (항상 존재) */}
                        <circle
                          cx={anchorPos.x}
                          cy={anchorPos.y}
                          r={10}
                          fill="transparent"
                          style={{ cursor: 'pointer' }}
                          onClick={() => handleAnchorClick(task, dayIdx)}
                          onMouseEnter={() => setHoveredAnchor({ task, dayIndex: dayIdx })}
                          onMouseLeave={() => setHoveredAnchor(null)}
                        />
                        {/* 앵커 원 (조건부 표시) */}
                        <circle
                          cx={anchorPos.x}
                          cy={anchorPos.y}
                          r={isConnectingFrom ? 5 : isHovered ? 4 : isAnchorCritical ? 2.5 : ANCHOR_RADIUS}
                          fill={
                            isConnectingFrom ? '#10B981' :
                              isHovered ? (isCritical ? '#EF4444' : task.color) :
                                isAnchorCritical ? '#FEE2E2' :
                                  'white'
                          }
                          stroke={
                            isConnectingFrom ? '#10B981' :
                              isAnchorCritical ? '#111827' :
                                isCritical ? '#EF4444' :
                                  task.color
                          }
                          strokeWidth={isAnchorCritical ? 2.5 : 1.5}
                          opacity={isVisible ? 1 : 0}
                          style={{ cursor: 'pointer', transition: 'all 0.15s' }}
                          onClick={() => handleAnchorClick(task, dayIdx)}
                          onMouseEnter={() => setHoveredAnchor({ task, dayIndex: dayIdx })}
                          onMouseLeave={() => setHoveredAnchor(null)}
                        />
                        {(isHovered || isConnectingFrom) && (
                          <text
                            x={anchorPos.x}
                            y={anchorPos.y + 16}
                            textAnchor="middle"
                            className="text-xs fill-gray-500 pointer-events-none font-medium"
                          >
                            {task.start + dayIdx + 1}
                          </text>
                        )}
                      </g>
                    );
                  })}
                </g>
              );
            })}

            {/* 5. 연결 중인 선 미리보기 */}
            {connecting && hoveredAnchor && connecting.task.id !== hoveredAnchor.task.id && (
              <line
                x1={getAnchorPosition(connecting.task, connecting.dayIndex).x}
                y1={getAnchorPosition(connecting.task, connecting.dayIndex).y + ANCHOR_RADIUS}
                x2={getAnchorPosition(hoveredAnchor.task, hoveredAnchor.dayIndex).x}
                y2={getAnchorPosition(hoveredAnchor.task, hoveredAnchor.dayIndex).y + ANCHOR_RADIUS}
                stroke="#10B981"
                strokeWidth="2"
                strokeDasharray="5,3"
                markerEnd="url(#arrow-connecting)"
              />
            )}

            {/* 6. 툴팁 (맨 위 레이어) */}
            {hoveredTask !== null && taskData[hoveredTask] && (
              (() => {
                const task = tasks.find(t => t.id === hoveredTask);
                if (!task) return null;
                const taskX = task.start * CELL_WIDTH;
                const taskY = HEADER_HEIGHT + task.row * ROW_HEIGHT + TASK_TOP_MARGIN;
                const taskWidth = task.duration * CELL_WIDTH;
                const data = taskData[hoveredTask];

                return (
                  <g>
                    <rect
                      x={taskX + taskWidth + 5}
                      y={taskY - 5}
                      width={85}
                      height={50}
                      rx={4}
                      fill="white"
                      stroke="#E5E7EB"
                      strokeWidth={1}
                      filter="drop-shadow(0 2px 4px rgba(0,0,0,0.1))"
                    />
                    <text x={taskX + taskWidth + 12} y={taskY + 10} className="text-xs fill-gray-600">
                      ES: {data.ES} / EF: {data.EF}
                    </text>
                    <text x={taskX + taskWidth + 12} y={taskY + 24} className="text-xs fill-gray-600">
                      LS: {data.LS} / LF: {data.LF}
                    </text>
                    <text x={taskX + taskWidth + 12} y={taskY + 38} className={`text-xs font-medium ${data.float === 0 ? 'fill-red-600' : 'fill-gray-600'}`}>
                      Float: {data.float}
                    </text>
                  </g>
                );
              })()
            )}
          </g>
        </svg>
      </div>

      {/* 크리티컬 패스 요약 */}
      <div className="mt-4 p-4 bg-red-50 rounded-lg border border-red-200">
        <h3 className="font-medium text-red-800 mb-2">크리티컬 패스 요약</h3>
        <div className="text-sm text-red-700">
          <p className="mb-2">
            <span className="font-medium">크리티컬 태스크:</span>{' '}
            {tasks
              .filter(t => criticalTasks.has(t.id))
              .map(t => t.name)
              .join(' → ')}
          </p>
          <p>
            <span className="font-medium">총 프로젝트 기간:</span> {projectEnd}일
          </p>
        </div>
      </div>

      {/* 선택된 종속성 정보 */}
      {selectedDep !== null && (
        <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="font-medium text-blue-800 mb-2">선택된 종속성</h3>
          <div className="text-sm text-blue-700">
            {(() => {
              const dep = dependencies[selectedDep];
              const fromTask = tasks.find(t => t.id === dep.fromTask);
              const toTask = tasks.find(t => t.id === dep.toTask);
              const isCritical = criticalDeps.has(dep.id);
              return (
                <>
                  <p>
                    <span className="font-medium">{fromTask?.name}</span>
                    {' '}Day {fromTask?.start + dep.fromDay + 1}
                    {' → '}
                    <span className="font-medium">{toTask?.name}</span>
                    {' '}Day {toTask?.start + dep.toDay + 1}
                  </p>
                  {isCritical && (
                    <p className="mt-1 text-red-600 font-medium">⚠ 크리티컬 패스</p>
                  )}
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* 사용법 */}
      <div className="mt-4 p-3 bg-gray-100 rounded text-sm text-gray-600">
        <p className="font-medium mb-1">사용법:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>태스크 바에 마우스를 올리면 ES/EF/LS/LF/Float 정보 확인</li>
          <li>앵커(●)를 클릭하여 새 종속성 연결</li>
          <li>검은색 경로가 크리티컬 패스 (여유 시간 = 0)</li>
        </ul>
      </div>
    </div>
  );
}
