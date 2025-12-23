'use client';

import { forwardRef, useMemo, useCallback, useState } from 'react';
import { addDays, getDay } from 'date-fns';
import {
    ConstructionTask,
    Milestone,
    ViewMode,
    ZoomLevel,
    CalendarSettings,
    GANTT_LAYOUT,
    GANTT_COLORS,
    ZOOM_CONFIG,
    GroupDragResult,
    AnchorDependency,
    AnchorDependencyDragResult,
} from '../../types';
import { calculateDateRange, xToDate } from '../../utils/dateUtils';
import type { VirtualRow } from '../../hooks/useGanttVirtualization';

// Sub-components
import { TimelineHeader } from './TimelineHeader';
import { TimelineGrid } from './TimelineGrid';
import { MilestoneMarker, calculateMilestoneLabels } from './MilestoneMarker';
import { SvgDefs } from './SvgDefs';
import { TaskBar } from './TaskBar';
import { TimelineContextMenu } from './TimelineContextMenu';
import { DependencyLines, ConnectionPreviewLine, InBarConnectionLines } from './DependencyLines';
import { AnchorPoints, getAnchorPosition } from './AnchorPoints';

// Hooks
import { useBarDrag } from './hooks/useBarDrag';
import { useMilestoneDrag } from './hooks/useMilestoneDrag';
import { useGroupDrag } from './hooks/useGroupDrag';
import { useAnchorConnection } from './hooks/useAnchorConnection';
import { useDependencyDrag } from './hooks/useDependencyDrag';
import { useGanttSelection } from '../../store/useGanttStore';

// External components
import { CriticalPathBar } from '../CriticalPathBar';
import { GroupSummaryBar } from '../GroupSummaryBar';

// Types
import type { BarDragResult } from './types';

const { ROW_HEIGHT, MILESTONE_LANE_HEIGHT, BAR_HEIGHT } = GANTT_LAYOUT;

export type { BarDragResult };

interface GanttTimelineProps {
    tasks: ConstructionTask[];
    allTasks?: ConstructionTask[];
    milestones: Milestone[];
    viewMode: ViewMode;
    zoomLevel: ZoomLevel;
    holidays: Date[];
    calendarSettings: CalendarSettings;
    onTaskUpdate?: (task: ConstructionTask) => void;
    onBarDrag?: (result: BarDragResult) => void;
    onGroupDrag?: (result: GroupDragResult) => void;
    onMilestoneUpdate?: (milestone: Milestone) => void;
    onMilestoneDoubleClick?: (milestone: Milestone) => void;
    onTaskDoubleClick?: (task: ConstructionTask) => void;
    virtualRows?: VirtualRow[];
    totalHeight?: number;
    showCriticalPath?: boolean;
    onGroupToggle?: (taskId: string) => void;
    activeCPId?: string | null;
    onContextMenuAddTask?: (date: Date) => void;
    onContextMenuAddMilestone?: (date: Date) => void;
    // 앵커 종속성 관련 Props
    anchorDependencies?: AnchorDependency[];
    onAnchorDependencyCreate?: (dependency: AnchorDependency) => void;
    onAnchorDependencyDelete?: (depId: string) => void;
    onAnchorDependencyDrag?: (result: AnchorDependencyDragResult) => void;
    // 선택/포커스 관련
    focusedTaskId?: string | null;
}

export const GanttTimeline = forwardRef<HTMLDivElement, GanttTimelineProps>(
    ({
        tasks,
        allTasks,
        milestones,
        viewMode,
        zoomLevel,
        holidays,
        calendarSettings,
        onBarDrag,
        onGroupDrag,
        onMilestoneUpdate,
        onMilestoneDoubleClick,
        onTaskDoubleClick,
        virtualRows,
        totalHeight: virtualTotalHeight,
        showCriticalPath = true,
        onGroupToggle,
        activeCPId,
        onContextMenuAddTask,
        onContextMenuAddMilestone,
        anchorDependencies = [],
        onAnchorDependencyCreate,
        onAnchorDependencyDelete,
        onAnchorDependencyDrag,
        focusedTaskId,
    }, ref) => {
        const pixelsPerDay = ZOOM_CONFIG[zoomLevel].pixelsPerDay;
        const isMasterView = viewMode === 'MASTER';
        const isVirtualized = virtualRows && virtualRows.length > 0;

        // 태스크 선택 훅
        const { selectTask, clearSelection: clearTaskSelection } = useGanttSelection();

        // 컨텍스트 메뉴 상태
        const [contextMenu, setContextMenu] = useState<{
            x: number;
            y: number;
            clickedDate: Date;
        } | null>(null);


        // Calculate date range (allTasks 기준으로 계산하여 스크롤 위치와 일치시킴)
        const { minDate, totalDays } = useMemo(() => {
            return calculateDateRange(allTasks || tasks, milestones, 60);
        }, [allTasks, tasks, milestones]);

        // viewMode에 따라 마일스톤 필터링
        const filteredMilestones = useMemo(() => {
            if (isMasterView) {
                // Master View: MASTER 또는 타입 미지정 마일스톤만
                return milestones.filter(m => !m.milestoneType || m.milestoneType === 'MASTER');
            } else {
                // Detail View: 모든 마일스톤 표시 (MASTER + DETAIL)
                return milestones;
            }
        }, [milestones, isMasterView]);

        // 마일스톤 레이아웃 계산 (충돌 감지 적용)
        const milestoneLayouts = useMemo(() => {
            return calculateMilestoneLabels(filteredMilestones, minDate, pixelsPerDay);
        }, [filteredMilestones, minDate, pixelsPerDay]);

        const chartWidth = totalDays * pixelsPerDay;
        const chartHeight = isVirtualized
            ? Math.max((virtualTotalHeight || 0) + MILESTONE_LANE_HEIGHT + 100, 500)
            : Math.max(tasks.length * ROW_HEIGHT + MILESTONE_LANE_HEIGHT + 100, 500);

        // ====================================
        // Drag Hooks
        // ====================================
        const {
            handleBarMouseDown,
            getDragInfo,
        } = useBarDrag({
            pixelsPerDay,
            holidays,
            calendarSettings,
            onBarDrag,
        });

        const {
            handleMilestoneMouseDown,
            getMilestoneDragX,
            isMilestoneDragging,
        } = useMilestoneDrag({
            minDate,
            pixelsPerDay,
            milestones,
            onMilestoneUpdate,
        });

        const {
            handleGroupBarMouseDown,
            getGroupDragDeltaDays,
            getTaskGroupDragDeltaDays,
            getTaskDragInfo,
        } = useGroupDrag({
            pixelsPerDay,
            allTasks: allTasks || tasks,
            holidays,
            calendarSettings,
            onGroupDrag,
        });

        // ====================================
        // Anchor Dependency Hooks
        // ====================================
        const {
            connectingFrom,
            hoveredAnchor,
            selectedDepId,
            hoveredDepId,
            handleAnchorClick,
            handleAnchorHover,
            handleDependencyClick,
            handleDependencyHover,
            cancelConnection: _cancelConnection,
            clearSelection,
        } = useAnchorConnection({
            dependencies: anchorDependencies,
            onDependencyCreate: onAnchorDependencyCreate,
            onDependencyDelete: onAnchorDependencyDelete,
        });

        const {
            isDragging: isDependencyDragging,
            taskHasDependency,
            handleDependencyBarMouseDown,
            getTaskDeltaDays: getDependencyDragDeltaDays,
            getTaskDragInfo: getDependencyDragInfo,  // 신규: 스냅된 날짜 정보
            isDraggingTask: _isDependencyDraggingTask,
            getConnectedTaskIds,
        } = useDependencyDrag({
            pixelsPerDay,
            holidays,
            calendarSettings,
            allTasks: allTasks || tasks,
            dependencies: anchorDependencies,
            onDependencyDrag: onAnchorDependencyDrag,
        });

        // 통합 델타 함수: 종속성 드래그 + 그룹 드래그 델타 결합
        const getCombinedTaskDeltaDays = useCallback((taskId: string): number => {
            // 종속성 드래그 델타 확인
            const dependencyDelta = getDependencyDragDeltaDays(taskId);
            if (dependencyDelta !== 0) return dependencyDelta;

            // 그룹 드래그 델타 확인
            return getTaskGroupDragDeltaDays(taskId);
        }, [getDependencyDragDeltaDays, getTaskGroupDragDeltaDays]);

        // 호버된 태스크 ID 상태 (앵커 표시용) - 현재 미사용
        const [_hoveredTaskId, setHoveredTaskId] = useState<string | null>(null);

        const handleMilestoneDoubleClick = useCallback((milestone: Milestone) => {
            if (onMilestoneDoubleClick) {
                onMilestoneDoubleClick(milestone);
            }
        }, [onMilestoneDoubleClick]);

        // 타임라인 우클릭 핸들러
        const handleContextMenu = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
            // 컨텍스트 메뉴 콜백이 없으면 기본 동작
            if (!onContextMenuAddTask && !onContextMenuAddMilestone) return;

            e.preventDefault();

            // SVG 요소의 위치 계산
            const svg = e.currentTarget;
            const rect = svg.getBoundingClientRect();

            // 클릭한 X 좌표 (SVG 내부 좌표)
            const svgX = e.clientX - rect.left;

            // X 좌표를 날짜로 변환
            const clickedDate = xToDate(svgX, minDate, pixelsPerDay);

            setContextMenu({
                x: e.clientX,
                y: e.clientY,
                clickedDate,
            });
        }, [minDate, pixelsPerDay, onContextMenuAddTask, onContextMenuAddMilestone]);

        // 컨텍스트 메뉴 닫기 핸들러 (memoized)
        const handleContextMenuClose = useCallback(() => {
            setContextMenu(null);
        }, []);

        // 종속성 삭제 핸들러
        const handleDepDelete = useCallback((depId: string) => {
            onAnchorDependencyDelete?.(depId);
        }, [onAnchorDependencyDelete]);

        // SVG 빈 공간 클릭 시 선택 해제
        const handleSvgClick = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
            // 클릭된 요소가 SVG 자체일 때만 선택 해제 (task bar, anchor, dependency line 등이 아닐 때)
            if (e.target === e.currentTarget) {
                clearSelection();        // 앵커/종속성 선택 해제
                clearTaskSelection();    // 태스크 선택 해제
            }
        }, [clearSelection, clearTaskSelection]);

        // Row data (virtualized or full)
        const rowData = isVirtualized
            ? virtualRows!
            : tasks.map((_, i) => ({ index: i, start: i * ROW_HEIGHT, size: ROW_HEIGHT, key: i }));

        return (
            <div className="flex h-full w-full flex-col overflow-hidden" style={{ backgroundColor: 'var(--gantt-bg-primary)' }}>
                <div ref={ref} className="relative flex-1">
                    <TimelineHeader
                        minDate={minDate}
                        totalDays={totalDays}
                        pixelsPerDay={pixelsPerDay}
                        zoomLevel={zoomLevel}
                        holidays={holidays}
                        calendarSettings={calendarSettings}
                    />

                    <svg
                        width={chartWidth}
                        height={chartHeight}
                        className="block"
                        style={{ backgroundColor: 'var(--gantt-bg-primary)' }}
                        onContextMenu={handleContextMenu}
                        onClick={handleSvgClick}
                    >
                        <SvgDefs />

                        {/* Layer 1: 배경 */}
                        <TimelineGrid
                            minDate={minDate}
                            totalDays={totalDays}
                            chartHeight={chartHeight}
                            pixelsPerDay={pixelsPerDay}
                            holidays={holidays}
                            calendarSettings={calendarSettings}
                            zoomLevel={zoomLevel}
                        />

                        {/* GROUP Row Background */}
                        {rowData.map((row) => {
                            const task = tasks[row.index];
                            if (!task || task.type !== 'GROUP') return null;

                            const rowY = row.start + MILESTONE_LANE_HEIGHT;
                            return (
                                <rect
                                    key={`group-bg-${row.key}`}
                                    x={0}
                                    y={rowY}
                                    width={chartWidth}
                                    height={ROW_HEIGHT}
                                    fill={GANTT_COLORS.bgSecondary}
                                    fillOpacity={0.6}
                                    className="pointer-events-none"
                                />
                            );
                        })}

                        {/* Layer 2: 그리드 라인 */}
                        {Array.from({ length: totalDays }, (_, i) => {
                            const date = addDays(minDate, i);
                            const dayOfWeek = getDay(date);
                            // SVG strokeWidth=1은 중심선 기준 양쪽 0.5px 확장되므로 -0.5px 보정
                            const rightX = (i + 1) * pixelsPerDay - 0.5; // 날짜 오른쪽 경계
                            const leftX = i * pixelsPerDay - 0.5; // 날짜 왼쪽 경계

                            if (zoomLevel === 'DAY') {
                                if (dayOfWeek === 0) {
                                    // 일요일: 왼쪽 진한 선 (주 시작) + 오른쪽 일반 선 (날짜 구분)
                                    return (
                                        <g key={`vline-${i}`}>
                                            <line
                                                x1={leftX}
                                                y1={0}
                                                x2={leftX}
                                                y2={chartHeight}
                                                stroke={GANTT_COLORS.gridDark}
                                                strokeWidth={1}
                                            />
                                            <line
                                                x1={rightX}
                                                y1={0}
                                                x2={rightX}
                                                y2={chartHeight}
                                                stroke={GANTT_COLORS.grid}
                                                strokeWidth={1}
                                            />
                                        </g>
                                    );
                                } else {
                                    // 다른 요일: 오른쪽 일반 선만
                                    return (
                                        <line
                                            key={`vline-${i}`}
                                            x1={rightX}
                                            y1={0}
                                            x2={rightX}
                                            y2={chartHeight}
                                            stroke={GANTT_COLORS.grid}
                                            strokeWidth={1}
                                        />
                                    );
                                }
                            } else if (zoomLevel === 'WEEK' || zoomLevel === 'MONTH') {
                                // WEEK/MONTH: 일요일 왼쪽에 선만 (주의 시작 표시)
                                if (dayOfWeek === 0) {
                                    return (
                                        <line
                                            key={`vline-${i}`}
                                            x1={leftX}
                                            y1={0}
                                            x2={leftX}
                                            y2={chartHeight}
                                            stroke={GANTT_COLORS.grid}
                                            strokeWidth={1}
                                        />
                                    );
                                }
                            }

                            return null;
                        })}

                        {/* Horizontal Lines */}
                        {rowData.map((row) => (
                            <line
                                key={`line-${row.key}`}
                                x1={0}
                                y1={row.start + ROW_HEIGHT + MILESTONE_LANE_HEIGHT}
                                x2={chartWidth}
                                y2={row.start + ROW_HEIGHT + MILESTONE_LANE_HEIGHT}
                                stroke={GANTT_COLORS.borderLight}
                                strokeWidth={1}
                            />
                        ))}

                        {/* Layer 3: 마일스톤 */}
                        <rect x={0} y={0} width={chartWidth} height={MILESTONE_LANE_HEIGHT} fill="transparent" />
                        {milestoneLayouts.map((layout) => {
                            const isDragging = isMilestoneDragging(layout.milestone.id);
                            return (
                                <MilestoneMarker
                                    key={layout.milestone.id}
                                    milestone={layout.milestone}
                                    x={layout.x}
                                    labelLevel={layout.labelLevel}
                                    isDragging={isDragging}
                                    dragX={getMilestoneDragX(layout.milestone.id)}
                                    onMouseDown={onMilestoneUpdate ? handleMilestoneMouseDown : undefined}
                                    onDoubleClick={onMilestoneDoubleClick ? handleMilestoneDoubleClick : undefined}
                                />
                            );
                        })}
                        <line
                            x1={0}
                            y1={MILESTONE_LANE_HEIGHT}
                            x2={chartWidth}
                            y2={MILESTONE_LANE_HEIGHT}
                            stroke={GANTT_COLORS.grid}
                            strokeWidth={1}
                        />

                        {/* Layer 4: 태스크 바 (bar만) */}
                        {rowData.map((row) => {
                            const task = tasks[row.index];
                            if (!task) return null;

                            const y = row.start + (ROW_HEIGHT - BAR_HEIGHT) / 2 + MILESTONE_LANE_HEIGHT;

                            // Detail View에서 GROUP 타입이면 GroupSummaryBar 렌더링
                            if (!isMasterView && task.type === 'GROUP') {
                                return (
                                    <GroupSummaryBar
                                        key={`group-${row.key}`}
                                        group={task}
                                        allTasks={allTasks || tasks}
                                        y={y}
                                        minDate={minDate}
                                        pixelsPerDay={pixelsPerDay}
                                        isDraggable={!!onGroupDrag}
                                        currentDeltaDays={getGroupDragDeltaDays(task.id)}
                                        onDragStart={handleGroupBarMouseDown}
                                        onToggle={onGroupToggle}
                                        onClick={(e, groupId) => {
                                            selectTask(groupId, {
                                                ctrlKey: e.ctrlKey || e.metaKey,
                                                shiftKey: e.shiftKey,
                                                visibleTasks: tasks,
                                            });
                                        }}
                                        isFocused={focusedTaskId === task.id}
                                    />
                                );
                            }

                            return (
                                <TaskBar
                                    key={row.key}
                                    task={task}
                                    y={y}
                                    minDate={minDate}
                                    pixelsPerDay={pixelsPerDay}
                                    isMasterView={isMasterView}
                                    renderMode="bar"
                                    allTasks={allTasks || tasks}
                                    holidays={holidays}
                                    calendarSettings={calendarSettings}
                                    isDraggable={!isMasterView && !!onBarDrag}
                                    dragInfo={getDragInfo(task.id)}
                                    groupDragDeltaDays={getTaskGroupDragDeltaDays(task.id)}
                                    groupDragInfo={getTaskDragInfo(task.id)}
                                    dependencyDragDeltaDays={getDependencyDragDeltaDays(task.id)}
                                    dependencyDragInfo={getDependencyDragInfo(task.id)}
                                    onDragStart={handleBarMouseDown}
                                    onDependencyDragStart={handleDependencyBarMouseDown}
                                    hasDependency={taskHasDependency(task.id)}
                                    isFocused={focusedTaskId === task.id}
                                    onDoubleClick={!isMasterView && task.type === 'TASK' && onTaskDoubleClick
                                        ? () => onTaskDoubleClick(task)
                                        : undefined}
                                    onMouseEnter={() => setHoveredTaskId(task.id)}
                                    onMouseLeave={() => setHoveredTaskId(null)}
                                />
                            );
                        })}

                        {/* Layer 5: 종속성 선 */}
                        {!isMasterView && anchorDependencies.length > 0 && (
                            <DependencyLines
                                tasks={tasks}
                                dependencies={anchorDependencies}
                                minDate={minDate}
                                pixelsPerDay={pixelsPerDay}
                                selectedDepId={selectedDepId}
                                hoveredDepId={hoveredDepId}
                                onDependencyClick={handleDependencyClick}
                                onDependencyHover={handleDependencyHover}
                                holidays={holidays}
                                calendarSettings={calendarSettings}
                                getTaskDeltaDays={getCombinedTaskDeltaDays}
                            />
                        )}

                        {/* Layer 5.5: 바 내 앵커 연결선 (들어오는 끝점 → 나가는 시작점) */}
                        {!isMasterView && anchorDependencies.length > 0 && (
                            <InBarConnectionLines
                                tasks={tasks}
                                dependencies={anchorDependencies}
                                minDate={minDate}
                                pixelsPerDay={pixelsPerDay}
                                holidays={holidays}
                                calendarSettings={calendarSettings}
                                getTaskDeltaDays={getCombinedTaskDeltaDays}
                            />
                        )}

                        {/* Layer 6: 앵커 포인트 */}
                        {!isMasterView && rowData.map((row) => {
                            const task = tasks[row.index];
                            if (!task || task.type !== 'TASK') return null;

                            return (
                                <AnchorPoints
                                    key={`anchor-${row.key}`}
                                    task={task}
                                    rowIndex={row.index}
                                    minDate={minDate}
                                    pixelsPerDay={pixelsPerDay}
                                    connectingFrom={connectingFrom}
                                    dependencies={anchorDependencies}
                                    onAnchorClick={handleAnchorClick}
                                    onAnchorHover={handleAnchorHover}
                                    holidays={holidays}
                                    calendarSettings={calendarSettings}
                                    dependencyDragDeltaDays={getCombinedTaskDeltaDays(task.id)}
                                />
                            );
                        })}

                        {/* Layer 6.5: 태스크 라벨 (종속선 위에 표시) */}
                        {rowData.map((row) => {
                            const task = tasks[row.index];
                            if (!task) return null;
                            // GROUP은 별도 처리 (GroupSummaryBar에서 라벨 포함)
                            if (!isMasterView && task.type === 'GROUP') return null;

                            const y = row.start + (ROW_HEIGHT - BAR_HEIGHT) / 2 + MILESTONE_LANE_HEIGHT;

                            return (
                                <TaskBar
                                    key={`label-${row.key}`}
                                    task={task}
                                    y={y}
                                    minDate={minDate}
                                    pixelsPerDay={pixelsPerDay}
                                    isMasterView={isMasterView}
                                    renderMode="label"
                                    allTasks={allTasks || tasks}
                                    holidays={holidays}
                                    calendarSettings={calendarSettings}
                                    dragInfo={getDragInfo(task.id)}
                                    groupDragDeltaDays={getTaskGroupDragDeltaDays(task.id)}
                                    groupDragInfo={getTaskDragInfo(task.id)}
                                    dependencyDragDeltaDays={getDependencyDragDeltaDays(task.id)}
                                    dependencyDragInfo={getDependencyDragInfo(task.id)}
                                    isFocused={focusedTaskId === task.id}
                                />
                            );
                        })}

                        {/* Layer 7: 연결 프리뷰 선 */}
                        {!isMasterView && connectingFrom && hoveredAnchor && connectingFrom.taskId !== hoveredAnchor.taskId && (() => {
                            const sourceTask = tasks.find(t => t.id === connectingFrom.taskId);
                            const targetTask = tasks.find(t => t.id === hoveredAnchor.taskId);
                            const sourceIndex = tasks.findIndex(t => t.id === connectingFrom.taskId);
                            const targetIndex = tasks.findIndex(t => t.id === hoveredAnchor.taskId);

                            if (!sourceTask || !targetTask || sourceIndex < 0 || targetIndex < 0) return null;

                            const sourcePos = getAnchorPosition(sourceTask, connectingFrom.dayIndex, sourceIndex, minDate, pixelsPerDay, holidays, calendarSettings);
                            const targetPos = getAnchorPosition(targetTask, hoveredAnchor.dayIndex, targetIndex, minDate, pixelsPerDay, holidays, calendarSettings);

                            return (
                                <ConnectionPreviewLine
                                    sourceX={sourcePos.x}
                                    sourceY={sourcePos.y}
                                    targetX={targetPos.x}
                                    targetY={targetPos.y}
                                />
                            );
                        })()}

                        {/* Dependency Drag Info Indicator */}
                        {isDependencyDragging && (() => {
                            const connectedIds = getConnectedTaskIds();
                            if (connectedIds.length <= 1) return null;

                            return (
                                <g className="dependency-drag-indicator">
                                    <rect
                                        x={10}
                                        y={10}
                                        width={180}
                                        height={28}
                                        rx={6}
                                        fill={GANTT_COLORS.success}
                                        fillOpacity={0.9}
                                    />
                                    <text
                                        x={100}
                                        y={28}
                                        textAnchor="middle"
                                        fill="white"
                                        fontSize={12}
                                        fontWeight={600}
                                    >
                                        🔗 연결된 {connectedIds.length}개 태스크 이동 중
                                    </text>
                                </g>
                            );
                        })()}
                    </svg>

                    {/* Critical Path Bar (Level 2에서만 표시) */}
                    {!isMasterView && showCriticalPath && (
                        <CriticalPathBar
                            tasks={allTasks || tasks}
                            holidays={holidays}
                            calendarSettings={calendarSettings}
                            minDate={minDate}
                            pixelsPerDay={pixelsPerDay}
                            totalWidth={chartWidth}
                            activeCPId={activeCPId}
                        />
                    )}

                    {/* 컨텍스트 메뉴 */}
                    {contextMenu && onContextMenuAddMilestone && (
                        <TimelineContextMenu
                            x={contextMenu.x}
                            y={contextMenu.y}
                            clickedDate={contextMenu.clickedDate}
                            viewMode={viewMode}
                            onAddTask={onContextMenuAddTask}
                            onAddMilestone={onContextMenuAddMilestone}
                            onClose={handleContextMenuClose}
                            selectedDependencyId={selectedDepId}
                            onDeleteDependency={onAnchorDependencyDelete ? handleDepDelete : undefined}
                        />
                    )}
                </div>
            </div>
        );
    }
);

GanttTimeline.displayName = 'GanttTimeline';
