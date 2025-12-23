'use client';

import { useRef, useCallback, useMemo, useState, useEffect } from 'react';
import { addDays, differenceInDays } from 'date-fns';
import { isHoliday, snapToWorkingDay, KOREAN_HOLIDAYS_ALL } from '../../utils/dateUtils';
import { GanttSidebar } from '../GanttSidebar';
import { GanttTimeline, BarDragResult } from '../GanttTimeline';
import { MilestoneEditModal } from '../MilestoneEditModal';
import { TaskEditModal } from '../TaskEditModal';
import { useGanttViewState, useGanttViewActions, useGanttSidebar, useGanttExpansion, useGanttSelection } from '../../store/useGanttStore';
import { useGanttVirtualization } from '../../hooks/useGanttVirtualization';
import { useTaskFocus } from '../../hooks/useTaskFocus';
import { useKeyboardNavigation } from '../../hooks/useKeyboardNavigation';
import { calculateDateRange } from '../../utils/dateUtils';
import {
    GanttChartProps,
    ConstructionTask,
    Milestone,
    CalendarSettings,
    GroupDragResult,
    ZOOM_CONFIG,
} from '../../types';

// Sub-components
import { GanttHeader } from './GanttHeader';

// Hooks
import { useGanttInit, useScrollToDate, useSidebarResize } from './hooks';

export type { BarDragResult };

const DEFAULT_CALENDAR_SETTINGS: CalendarSettings = {
    workOnSaturdays: true,  // 건설 현장: 토요일 작업
    workOnSundays: false,   // 일요일 휴일
    workOnHolidays: false,  // 공휴일 휴일
};

export function GanttChart({
    tasks,
    milestones = [],
    holidays = KOREAN_HOLIDAYS_ALL,
    calendarSettings = DEFAULT_CALENDAR_SETTINGS,
    initialView = 'MASTER',
    initialZoomLevel = 'MONTH',
    initialExpandedIds,
    onTaskUpdate,
    onTaskCreate,
    onTaskDelete,
    onTaskReorder,
    onTaskGroup,
    onTaskUngroup,
    onTaskMove,
    onGroupDrag,
    onViewChange,
    // 앵커 종속성 Props
    anchorDependencies = [],
    onAnchorDependencyCreate,
    onAnchorDependencyDelete,
    onAnchorDependencyDrag,
    onMilestoneCreate,
    onMilestoneUpdate,
    onMilestoneDelete,
    onSave,
    onReset,
    hasUnsavedChanges,
    saveStatus,
    onExport,
    onImport,
    onError,
    className,
    style,
}: GanttChartProps) {
    // Store State & Actions
    const { viewMode, activeCPId, zoomLevel } = useGanttViewState();
    const { setViewMode, setZoomLevel } = useGanttViewActions();
    const { sidebarWidth, setSidebarWidth } = useGanttSidebar();
    const { expandedTaskIds, toggleTask, expandAll, collapseAll } = useGanttExpansion();
    const { focusedTaskId } = useGanttSelection();

    // Refs
    const containerRef = useRef<HTMLDivElement>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Local States
    const [isAddingTask, setIsAddingTask] = useState(false);
    const [isAddingCP, setIsAddingCP] = useState(false);
    const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isNewMilestone, setIsNewMilestone] = useState(false);
    const [editingTask, setEditingTask] = useState<ConstructionTask | null>(null);
    const [isTaskEditModalOpen, setIsTaskEditModalOpen] = useState(false);
    const [sidebarTotalWidth, setSidebarTotalWidth] = useState<number | null>(null);

    // Initialize
    useGanttInit({
        tasks,
        initialView,
        initialZoomLevel,
        initialExpandedIds,
        setViewMode,
        setZoomLevel,
        expandAll,
        collapseAll,
    });

    // Parent → Children 맵
    const childrenMap = useMemo(() => {
        const map = new Map<string | null, ConstructionTask[]>();
        tasks.forEach(task => {
            const parentId = task.parentId;
            if (!map.has(parentId)) {
                map.set(parentId, []);
            }
            map.get(parentId)!.push(task);
        });
        return map;
    }, [tasks]);

    // 뷰에 따른 태스크 필터링
    const visibleTasks = useMemo(() => {
        if (viewMode === 'MASTER') {
            const visible: ConstructionTask[] = [];
            const collectVisible = (parentId: string | null) => {
                const children = childrenMap.get(parentId) || [];
                children.forEach(task => {
                    if (task.wbsLevel !== 1) return;
                    if (parentId === null || expandedTaskIds.has(parentId)) {
                        visible.push(task);
                        if (task.type === 'GROUP') {
                            collectVisible(task.id);
                        }
                    }
                });
            };
            collectVisible(null);
            return visible;
        } else {
            const visible: ConstructionTask[] = [];
            const collectVisible = (parentId: string | null) => {
                const children = childrenMap.get(parentId) || [];
                children.forEach(task => {
                    if (task.wbsLevel !== 2) return;
                    if (parentId === activeCPId || expandedTaskIds.has(parentId!)) {
                        visible.push(task);
                        if (task.type === 'GROUP') {
                            collectVisible(task.id);
                        }
                    }
                });
            };
            collectVisible(activeCPId!);
            return visible;
        }
    }, [childrenMap, viewMode, activeCPId, expandedTaskIds]);

    // Virtualization
    const { virtualRows, totalHeight, virtualizer } = useGanttVirtualization({
        containerRef: scrollRef,
        count: visibleTasks.length,
    });

    // 날짜 범위 계산 (포커싱에 필요)
    const { minDate } = useMemo(() =>
        calculateDateRange(tasks, milestones, 60),
        [tasks, milestones]
    );

    // Task 포커스 훅
    const { focusTask } = useTaskFocus({
        scrollContainerRef: scrollRef,
        virtualizer,
        visibleTasks,
        allTasks: tasks,
        minDate,
        pixelsPerDay: ZOOM_CONFIG[zoomLevel].pixelsPerDay,
        sidebarWidth,
    });

    // Sidebar Resize
    const { isResizing, handleResizeStart, handleResizeDoubleClick } = useSidebarResize({
        sidebarWidth,
        setSidebarWidth,
        viewMode,
        sidebarTotalWidth,
    });

    // Scroll
    const { scrollToFirstTask } = useScrollToDate({
        scrollRef,
        viewMode,
        activeCPId,
        zoomLevel,
        sidebarWidth,
        tasks,
        visibleTasks,
        milestones,
    });

    // Handlers
    const handleViewChange = useCallback((mode: 'MASTER' | 'DETAIL', cpId?: string) => {
        setViewMode(mode, cpId);
        onViewChange?.(mode, cpId);
    }, [setViewMode, onViewChange]);

    const handleTaskClick = useCallback((task: ConstructionTask) => {
        if (viewMode === 'MASTER' && task.type === 'CP') {
            handleViewChange('DETAIL', task.id);
        }
    }, [viewMode, handleViewChange]);

    const handleMilestoneDoubleClick = useCallback((milestone: Milestone) => {
        setEditingMilestone(milestone);
        setIsNewMilestone(false);
        setIsEditModalOpen(true);
    }, []);

    const handleStartAddMilestone = useCallback(() => {
        const newMilestone: Milestone = {
            id: `milestone-${Date.now()}`,
            name: '',
            date: new Date(),
            description: '',
        };
        setEditingMilestone(newMilestone);
        setIsNewMilestone(true);
        setIsEditModalOpen(true);
    }, []);

    // 컨텍스트 메뉴에서 Task 추가 (날짜 지정)
    const handleContextMenuAddTask = useCallback((date: Date) => {
        if (!activeCPId || !onTaskCreate) return;

        const newTask: Partial<ConstructionTask> = {
            id: `task-${Date.now()}`,
            parentId: activeCPId,
            wbsLevel: 2,
            type: 'TASK',
            name: '새 공정',
            startDate: date,
            endDate: date,
            task: {
                netWorkDays: 1,
                indirectWorkDaysPre: 0,
                indirectWorkDaysPost: 0,
            },
            dependencies: [],
        };
        onTaskCreate(newTask);
    }, [activeCPId, onTaskCreate]);

    // 컨텍스트 메뉴에서 마일스톤 추가 (날짜 지정)
    const handleContextMenuAddMilestone = useCallback((date: Date) => {
        const newMilestone: Milestone = {
            id: `milestone-${Date.now()}`,
            name: '',
            date: date,
            description: '',
            milestoneType: viewMode === 'MASTER' ? 'MASTER' : 'DETAIL',
        };
        setEditingMilestone(newMilestone);
        setIsNewMilestone(true);
        setIsEditModalOpen(true);
    }, [viewMode]);

    const handleCloseEditModal = useCallback(() => {
        setIsEditModalOpen(false);
        setEditingMilestone(null);
        setIsNewMilestone(false);
    }, []);

    const handleMilestoneSave = useCallback((updatedMilestone: Milestone) => {
        if (isNewMilestone && onMilestoneCreate) {
            onMilestoneCreate(updatedMilestone);
            // 새 마일스톤 저장 후 isNew를 false로 변경 (삭제 버튼 활성화)
            setIsNewMilestone(false);
        } else if (onMilestoneUpdate) {
            onMilestoneUpdate(updatedMilestone);
        }
        // 모달 닫기는 MilestoneEditModal 내부에서 처리
    }, [isNewMilestone, onMilestoneCreate, onMilestoneUpdate]);

    const handleMilestoneDelete = useCallback((milestoneId: string) => {
        if (onMilestoneDelete) {
            onMilestoneDelete(milestoneId);
        }
        handleCloseEditModal();
    }, [onMilestoneDelete, handleCloseEditModal]);

    const handleTaskDoubleClick = useCallback((task: ConstructionTask) => {
        setEditingTask(task);
        setIsTaskEditModalOpen(true);
    }, []);

    // 키보드 네비게이션 훅 (handleTaskDoubleClick 정의 후에 호출)
    useKeyboardNavigation({
        visibleTasks,
        viewMode,
        onViewChange: handleViewChange,
        focusTask,
        onTaskEdit: handleTaskDoubleClick,
    });

    const handleCloseTaskEditModal = useCallback(() => {
        setIsTaskEditModalOpen(false);
        setEditingTask(null);
    }, []);

    const handleTaskEditSave = useCallback((updatedTask: ConstructionTask) => {
        if (onTaskUpdate) {
            onTaskUpdate(updatedTask);
        }
    }, [onTaskUpdate]);

    const handleTaskEditDelete = useCallback((taskId: string) => {
        if (onTaskDelete) {
            onTaskDelete(taskId);
        }
        handleCloseTaskEditModal();
    }, [onTaskDelete, handleCloseTaskEditModal]);

    // tasks가 변경될 때 editingTask 동기화
    // 의도적으로 tasks만 의존성으로 설정 - 저장 후 hasChanges 계산을 위해
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => {
        if (editingTask && isTaskEditModalOpen) {
            const updatedTask = tasks.find(t => t.id === editingTask.id);
            if (updatedTask) {
                setEditingTask(updatedTask);
            }
        }
    }, [tasks]);

    // milestones가 변경될 때 editingMilestone 동기화
    // 의도적으로 milestones만 의존성으로 설정 - 저장 후 hasChanges 계산을 위해
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => {
        if (editingMilestone && isEditModalOpen) {
            const updatedMilestone = milestones.find(m => m.id === editingMilestone.id);
            if (updatedMilestone) {
                setEditingMilestone(updatedMilestone);
            }
        }
    }, [milestones]);

    // Bar Drag Handler
    const handleBarDrag = useCallback(async (result: BarDragResult) => {
        if (!onTaskUpdate) return;

        try {
            const task = tasks.find(t => t.id === result.taskId);
            if (!task || !task.task) return;

            const updatedTask: ConstructionTask = {
                ...task,
                startDate: result.newStartDate,
                endDate: result.newEndDate,
                task: {
                    ...task.task,
                    indirectWorkDaysPre: result.newIndirectWorkDaysPre,
                    indirectWorkDaysPost: result.newIndirectWorkDaysPost,
                    netWorkDays: result.newNetWorkDays,
                },
            };

            await onTaskUpdate(updatedTask);
        } catch (error) {
            console.error('Failed to update task:', error);
            onError?.(error as Error, { action: 'bar_drag', taskId: result.taskId });
        }
    }, [tasks, onTaskUpdate, onError]);

    // Group Drag Handler
    // 통합 스냅: taskUpdates에 이미 계산된 새 시작일을 사용
    const handleGroupDrag = useCallback(async (result: GroupDragResult) => {
        if (!onTaskUpdate && !onGroupDrag) return;

        try {
            if (onGroupDrag) {
                await onGroupDrag(result);
                return;
            }

            if (onTaskUpdate) {
                // taskUpdates가 있으면 그대로 사용 (이미 통합 스냅 적용됨)
                if (result.taskUpdates && result.taskUpdates.length > 0) {
                    for (const update of result.taskUpdates) {
                        const task = tasks.find(t => t.id === update.taskId);
                        if (!task) continue;

                        // 종료일은 시작일 기준으로 동일한 기간 유지
                        const duration = differenceInDays(task.endDate, task.startDate);
                        const newEndDate = addDays(update.newStartDate, duration);

                        const updatedTask: ConstructionTask = {
                            ...task,
                            startDate: update.newStartDate,
                            endDate: newEndDate,
                        };

                        await onTaskUpdate(updatedTask);
                    }
                } else {
                    // fallback: taskUpdates가 없으면 기존 방식 (호환성 유지)
                    const dragDirection: 'left' | 'right' = result.deltaDays >= 0 ? 'right' : 'left';

                    for (const taskId of result.affectedTaskIds) {
                        const task = tasks.find(t => t.id === taskId);
                        if (!task) continue;

                        let newStartDate = addDays(task.startDate, result.deltaDays);

                        if (isHoliday(newStartDate, holidays, calendarSettings)) {
                            newStartDate = snapToWorkingDay(newStartDate, dragDirection, holidays, calendarSettings);
                        }

                        const duration = differenceInDays(task.endDate, task.startDate);
                        const newEndDate = addDays(newStartDate, duration);

                        const updatedTask: ConstructionTask = {
                            ...task,
                            startDate: newStartDate,
                            endDate: newEndDate,
                        };

                        await onTaskUpdate(updatedTask);
                    }
                }
            }
        } catch (error) {
            console.error('Failed to update group tasks:', error);
            onError?.(error as Error, {
                action: 'bar_drag',
                taskId: result.groupId,
                details: { affectedTaskIds: result.affectedTaskIds },
            });
        }
    }, [tasks, onTaskUpdate, onGroupDrag, onError, holidays, calendarSettings]);

    return (
        <div
            ref={containerRef}
            className={`flex h-full w-full flex-col ${className || ''}`}
            style={{ backgroundColor: 'var(--gantt-bg-secondary)', ...style }}
        >
            <GanttHeader
                viewMode={viewMode}
                zoomLevel={zoomLevel}
                activeCPId={activeCPId}
                isAddingTask={isAddingTask}
                isAddingCP={isAddingCP}
                hasUnsavedChanges={hasUnsavedChanges}
                saveStatus={saveStatus}
                onViewChange={handleViewChange}
                onZoomChange={setZoomLevel}
                onStartAddTask={() => setIsAddingTask(true)}
                onStartAddCP={() => setIsAddingCP(true)}
                onStartAddMilestone={handleStartAddMilestone}
                onScrollToFirst={scrollToFirstTask}
                onCollapseAll={collapseAll}
                onExpandAll={() => {
                    const groupIds = tasks
                        .filter(t => t.type === 'GROUP')
                        .map(t => t.id);
                    expandAll(groupIds);
                }}
                onSave={onSave}
                onReset={onReset}
                onExport={onExport}
                onImport={onImport}
                canCreateTask={!!onTaskCreate}
                canCreateMilestone={!!onMilestoneCreate}
            />

            <div ref={scrollRef} className="relative flex flex-1 overflow-auto">
                <div
                    className="sticky left-0 z-10 flex shrink-0 relative"
                    style={{ width: sidebarWidth + 4 }}
                >
                    <div
                        className="flex shrink-0 flex-col overflow-hidden"
                        style={{ width: sidebarWidth, backgroundColor: 'var(--gantt-bg-primary)' }}
                    >
                        <GanttSidebar
                            tasks={visibleTasks}
                            allTasks={tasks}
                            viewMode={viewMode}
                            expandedIds={expandedTaskIds}
                            onToggle={toggleTask}
                            onTaskClick={handleTaskClick}
                            onTaskUpdate={onTaskUpdate}
                            onTaskCreate={onTaskCreate}
                            onTaskReorder={onTaskReorder}
                            onTaskGroup={onTaskGroup}
                            onTaskUngroup={onTaskUngroup}
                            onTaskDelete={onTaskDelete}
                            onTaskMove={onTaskMove}
                            activeCPId={activeCPId}
                            holidays={holidays}
                            calendarSettings={calendarSettings}
                            virtualRows={virtualRows}
                            totalHeight={totalHeight}
                            onTotalWidthChange={setSidebarTotalWidth}
                            isAddingTask={isAddingTask}
                            onCancelAddTask={() => setIsAddingTask(false)}
                            isAddingCP={isAddingCP}
                            onCancelAddCP={() => setIsAddingCP(false)}
                            onTaskDoubleClick={handleTaskDoubleClick}
                        />
                    </div>

                    <div
                        className="absolute top-0 right-0 h-full w-1 cursor-col-resize z-20 transition-colors"
                        style={{
                            backgroundColor: isResizing
                                ? 'var(--gantt-resizer-active)'
                                : 'var(--gantt-resizer)',
                        }}
                        onMouseDown={handleResizeStart}
                        onDoubleClick={handleResizeDoubleClick}
                        onMouseEnter={(e) => {
                            if (!isResizing) {
                                e.currentTarget.style.backgroundColor = 'var(--gantt-resizer-hover)';
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (!isResizing) {
                                e.currentTarget.style.backgroundColor = 'var(--gantt-resizer)';
                            }
                        }}
                        title="드래그하여 너비 조절 / 더블클릭으로 초기화"
                    />
                </div>

                <div
                    className="relative flex flex-1 flex-col"
                    style={{ backgroundColor: 'var(--gantt-bg-primary)' }}
                >
                    <GanttTimeline
                        tasks={visibleTasks}
                        allTasks={tasks}
                        milestones={milestones}
                        viewMode={viewMode}
                        zoomLevel={zoomLevel}
                        holidays={holidays}
                        calendarSettings={calendarSettings}
                        onTaskUpdate={onTaskUpdate}
                        onBarDrag={handleBarDrag}
                        onGroupDrag={handleGroupDrag}
                        onMilestoneUpdate={onMilestoneUpdate}
                        onMilestoneDoubleClick={handleMilestoneDoubleClick}
                        onTaskDoubleClick={handleTaskDoubleClick}
                        virtualRows={virtualRows}
                        totalHeight={totalHeight}
                        onGroupToggle={toggleTask}
                        activeCPId={activeCPId}
                        onContextMenuAddTask={
                            viewMode === 'DETAIL' && activeCPId && onTaskCreate
                                ? handleContextMenuAddTask
                                : undefined
                        }
                        onContextMenuAddMilestone={
                            onMilestoneCreate ? handleContextMenuAddMilestone : undefined
                        }
                        anchorDependencies={anchorDependencies}
                        onAnchorDependencyCreate={onAnchorDependencyCreate}
                        onAnchorDependencyDelete={onAnchorDependencyDelete}
                        onAnchorDependencyDrag={onAnchorDependencyDrag}
                        focusedTaskId={focusedTaskId}
                    />
                </div>

                {isResizing && (
                    <div className="fixed inset-0 z-50 cursor-col-resize" />
                )}
            </div>

            <MilestoneEditModal
                milestone={editingMilestone}
                isOpen={isEditModalOpen}
                isNew={isNewMilestone}
                onClose={handleCloseEditModal}
                onSave={handleMilestoneSave}
                onDelete={handleMilestoneDelete}
            />

            <TaskEditModal
                task={editingTask}
                isOpen={isTaskEditModalOpen}
                onClose={handleCloseTaskEditModal}
                onSave={handleTaskEditSave}
                onDelete={onTaskDelete ? handleTaskEditDelete : undefined}
            />
        </div>
    );
}
