'use client';

import { forwardRef, useMemo, useState, useCallback, useEffect } from 'react';
import {
    ConstructionTask,
    GANTT_LAYOUT,
    CriticalPathSummary,
} from '../../types';
import { calculateCriticalPath } from '../../utils/criticalPathUtils';
import { GanttSidebarContextMenu } from '../GanttSidebarContextMenu';
import { GanttSidebarNewTaskForm } from '../GanttSidebarNewTaskForm';
import { GanttSidebarNewCPForm } from '../GanttSidebarNewCPForm';

// Sub-components
import { SidebarHeader } from './SidebarHeader';
import { SidebarRowMaster } from './SidebarRowMaster';
import { SidebarRowDetail } from './SidebarRowDetail';

// Hooks
import {
    useSidebarColumns,
    useSidebarDragDrop,
    useMultiSelect,
    useClipboard,
    useInlineEdit,
} from './hooks';

// Types
import type { GanttSidebarProps } from './types';

const { ROW_HEIGHT, MILESTONE_LANE_HEIGHT } = GANTT_LAYOUT;

export const GanttSidebar = forwardRef<HTMLDivElement, GanttSidebarProps>(
    ({
        tasks,
        allTasks,
        viewMode,
        expandedIds,
        onToggle,
        onTaskClick,
        onTaskUpdate,
        onTaskCreate,
        onTaskReorder,
        activeCPId,
        holidays = [],
        calendarSettings,
        virtualRows,
        totalHeight,
        onTotalWidthChange,
        onTaskGroup,
        onTaskUngroup,
        onTaskDelete,
        onTaskMove,
        isAddingTask = false,
        onCancelAddTask,
        isAddingCP = false,
        onCancelAddCP,
        onTaskDoubleClick,
    }, ref) => {
        const isVirtualized = virtualRows && virtualRows.length > 0;

        // CP별 Critical Path 요약 계산 (Master View용)
        const cpSummaryMap = useMemo(() => {
            const map = new Map<string, CriticalPathSummary>();
            if (viewMode !== 'MASTER') return map;

            const collectDescendantTasks = (parentId: string): ConstructionTask[] => {
                const result: ConstructionTask[] = [];
                allTasks.forEach(t => {
                    if (t.parentId === parentId) {
                        if (t.type === 'TASK' && t.wbsLevel === 2) {
                            result.push(t);
                        }
                        if (t.type === 'GROUP') {
                            result.push(...collectDescendantTasks(t.id));
                        }
                    }
                });
                return result;
            };

            allTasks.forEach(task => {
                if (task.type === 'CP') {
                    const childTasks = collectDescendantTasks(task.id);
                    const summary = calculateCriticalPath(
                        childTasks,
                        holidays,
                        calendarSettings || { workOnSaturdays: true, workOnSundays: false, workOnHolidays: false }
                    );
                    map.set(task.id, summary);
                }
            });

            return map;
        }, [viewMode, allTasks, holidays, calendarSettings]);

        // Hooks
        const {
            columns,
            totalWidth,
            dragHandleWidth,
            resizingIndex,
            handleColumnResizeStart,
            handleColumnResizeDoubleClick,
            getGroupDepth,
            getMasterGroupDepth,
        } = useSidebarColumns({
            viewMode,
            tasks,
            allTasks,
            activeCPId,
            cpSummaryMap,
            onTotalWidthChange,
            onTaskReorder,
        });

        const {
            draggedTaskId,
            dragOverTaskId,
            dragOverPosition,
            handleDragStart,
            handleDragOver,
            handleDragLeave,
            handleDrop,
            handleDragEnd,
        } = useSidebarDragDrop({ tasks, onTaskReorder, onTaskMove });

        const {
            selectedTaskIds,
            focusedTaskId,
            handleRowClick,
            clearSelection,
            selectTask,
        } = useMultiSelect({ tasks, draggedTaskId });

        useClipboard({
            selectedTaskIds,
            allTasks,
            viewMode,
            activeCPId,
            onTaskCreate,
        });

        const {
            editingTaskId,
            editingName,
            setEditingName,
            editInputRef,
            handleStartEdit,
            handleStartRename,
            handleSaveEdit,
            handleEditKeyDown,
        } = useInlineEdit({ tasks, onTaskUpdate });

        // 컨텍스트 메뉴 상태
        const [contextMenu, setContextMenu] = useState<{ x: number; y: number; taskId: string } | null>(null);

        // 일수 입력 필드 상태
        const [editingDays, setEditingDays] = useState<{ taskId: string; field: string; value: string } | null>(null);

        // 컨텍스트 메뉴 핸들러
        const handleContextMenu = useCallback((e: React.MouseEvent, task: ConstructionTask) => {
            e.preventDefault();
            if (!selectedTaskIds.has(task.id)) {
                selectTask(task.id);
            }
            setContextMenu({
                x: e.clientX,
                y: e.clientY,
                taskId: task.id,
            });
        }, [selectedTaskIds, selectTask]);

        // 외부 클릭 시 컨텍스트 메뉴 닫기
        useEffect(() => {
            const handleClickOutside = () => setContextMenu(null);
            if (contextMenu) {
                document.addEventListener('click', handleClickOutside);
                return () => document.removeEventListener('click', handleClickOutside);
            }
        }, [contextMenu]);

        // 키보드 단축키 (ESC)
        useEffect(() => {
            const handleKeyDown = (e: KeyboardEvent) => {
                if (e.key === 'Escape') {
                    clearSelection();
                    setContextMenu(null);
                }
            };
            document.addEventListener('keydown', handleKeyDown);
            return () => document.removeEventListener('keydown', handleKeyDown);
        }, [clearSelection]);

        // 일수 변경 핸들러
        const handleDurationChange = useCallback((
            task: ConstructionTask,
            field: 'indirectWorkDaysPre' | 'netWorkDays' | 'indirectWorkDaysPost',
            value: number
        ) => {
            if (!task.task || !onTaskUpdate) return;
            const updatedTask: ConstructionTask = {
                ...task,
                task: { ...task.task, [field]: value },
            };
            onTaskUpdate(updatedTask);
        }, [onTaskUpdate]);

        // Row data
        const rowData = isVirtualized
            ? virtualRows!
            : tasks.map((_, i) => ({ index: i, start: i * ROW_HEIGHT, size: ROW_HEIGHT, key: i }));

        // Active CP와 상위 그룹 정보 계산
        const { activeGroupName, activeCPName } = useMemo(() => {
            if (!activeCPId) return { activeGroupName: undefined, activeCPName: undefined };

            const activeCP = allTasks.find(t => t.id === activeCPId);
            if (!activeCP) return { activeGroupName: undefined, activeCPName: undefined };

            const cpName = activeCP.name;

            // CP의 parentId로 상위 GROUP 찾기
            if (!activeCP.parentId) {
                console.log('[GanttSidebar] activeCP has no parentId:', activeCP);
                return { activeGroupName: undefined, activeCPName: cpName };
            }

            const parentGroup = allTasks.find(t => t.id === activeCP.parentId);
            console.log('[GanttSidebar] parentGroup:', parentGroup?.name, 'for CP:', cpName);

            return {
                activeGroupName: parentGroup?.name,
                activeCPName: cpName,
            };
        }, [activeCPId, allTasks]);

        // Common container render
        const renderContainer = (content: React.ReactNode) => (
            <div
                className="flex h-full flex-col select-none"
                style={{ backgroundColor: 'var(--gantt-bg-primary)' }}
            >
                <SidebarHeader
                    viewMode={viewMode}
                    activeGroupName={activeGroupName}
                    activeCPName={activeCPName}
                    columns={columns}
                    resizingIndex={resizingIndex}
                    selectedTaskIds={selectedTaskIds}
                    tasks={tasks}
                    onColumnResizeStart={handleColumnResizeStart}
                    onColumnResizeDoubleClick={handleColumnResizeDoubleClick}
                    onTaskGroup={onTaskGroup}
                    onTaskUngroup={onTaskUngroup}
                    onClearSelection={clearSelection}
                />

                {resizingIndex !== null && (
                    <div className="fixed inset-0 z-50 cursor-col-resize" />
                )}

                <div
                    ref={ref}
                    className="relative flex-1"
                    onClick={clearSelection}
                >
                    {/* Milestone Lane Spacer */}
                    <div
                        className="flex items-center"
                        style={{
                            height: MILESTONE_LANE_HEIGHT,
                            minWidth: totalWidth,
                            backgroundColor: 'var(--gantt-bg-secondary)',
                        }}
                    >
                        {columns.map((col, idx) => (
                            <div
                                key={col.id}
                                className="flex shrink-0 items-center justify-center text-xs"
                                style={{
                                    width: col.width,
                                    color: 'var(--gantt-text-primary)',
                                    borderRight: '1px solid var(--gantt-border-light)',
                                }}
                            >
                                {idx === 0 && 'Milestone'}
                            </div>
                        ))}
                    </div>

                    {/* Task Rows */}
                    <div
                        style={{
                            minWidth: totalWidth,
                            height: isVirtualized ? totalHeight : tasks.length * ROW_HEIGHT + 100,
                            position: 'relative',
                        }}
                        onClick={clearSelection}
                    >
                        {content}
                    </div>
                </div>

                {contextMenu && (
                    <GanttSidebarContextMenu
                        x={contextMenu.x}
                        y={contextMenu.y}
                        taskId={contextMenu.taskId}
                        selectedTaskIds={selectedTaskIds}
                        tasks={tasks}
                        onTaskGroup={onTaskGroup}
                        onTaskUngroup={onTaskUngroup}
                        onTaskDelete={onTaskDelete}
                        onStartRename={handleStartRename}
                        onClose={() => setContextMenu(null)}
                        onDeselect={clearSelection}
                    />
                )}
            </div>
        );

        // Master View
        if (viewMode === 'MASTER') {
            return renderContainer(
                <>
                    {rowData.map((row) => {
                        const task = tasks[row.index];
                        if (!task) return null;

                        const isGroup = task.type === 'GROUP';
                        const canExpand = isGroup && allTasks.some(t => t.parentId === task.id);
                        const cpSummary = task.type === 'CP' ? cpSummaryMap.get(task.id) || null : null;

                        return (
                            <SidebarRowMaster
                                key={row.key}
                                task={task}
                                rowIndex={row.index}
                                isVirtualized={isVirtualized!}
                                rowStart={row.start}
                                isDragging={draggedTaskId === task.id}
                                isDragOver={dragOverTaskId === task.id}
                                dragOverPosition={dragOverPosition}
                                isSelected={selectedTaskIds.has(task.id)}
                                isFocused={focusedTaskId === task.id}
                                isExpanded={expandedIds.has(task.id)}
                                canExpand={canExpand}
                                indent={getMasterGroupDepth(task) * 12}
                                isGroup={isGroup}
                                onDragStart={handleDragStart}
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                                onDragEnd={handleDragEnd}
                                onRowClick={handleRowClick}
                                onContextMenu={handleContextMenu}
                                onToggle={onToggle}
                                editingTaskId={editingTaskId}
                                editingName={editingName}
                                setEditingName={setEditingName}
                                editInputRef={editInputRef}
                                onStartEdit={handleStartEdit}
                                onSaveEdit={handleSaveEdit}
                                onEditKeyDown={handleEditKeyDown}
                                columns={columns}
                                dragHandleWidth={dragHandleWidth}
                                onTaskReorder={onTaskReorder}
                                onTaskMove={onTaskMove}
                                onTaskUpdate={onTaskUpdate}
                                cpSummary={cpSummary}
                                onTaskClick={onTaskClick}
                            />
                        );
                    })}
                    {isAddingCP && (
                        <GanttSidebarNewCPForm
                            columns={columns}
                            tasks={tasks}
                            onTaskCreate={onTaskCreate}
                            onCancel={onCancelAddCP || (() => {})}
                            isVirtualized={isVirtualized!}
                            virtualRowIndex={tasks.length}
                            dragHandleWidth={dragHandleWidth}
                        />
                    )}
                </>
            );
        }

        // Detail View
        return renderContainer(
            <>
                {rowData.map((row) => {
                    const task = tasks[row.index];
                    if (!task) return null;

                    const isGroup = task.type === 'GROUP';
                    const canExpand = isGroup && allTasks.some(t => t.parentId === task.id);

                    return (
                        <SidebarRowDetail
                            key={row.key}
                            task={task}
                            rowIndex={row.index}
                            isVirtualized={isVirtualized!}
                            rowStart={row.start}
                            isDragging={draggedTaskId === task.id}
                            isDragOver={dragOverTaskId === task.id}
                            dragOverPosition={dragOverPosition}
                            isSelected={selectedTaskIds.has(task.id)}
                            isFocused={focusedTaskId === task.id}
                            isExpanded={expandedIds.has(task.id)}
                            canExpand={canExpand}
                            indent={getGroupDepth(task) * 12}
                            isGroup={isGroup}
                            onDragStart={handleDragStart}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            onDragEnd={handleDragEnd}
                            onRowClick={handleRowClick}
                            onContextMenu={handleContextMenu}
                            onToggle={onToggle}
                            editingTaskId={editingTaskId}
                            editingName={editingName}
                            setEditingName={setEditingName}
                            editInputRef={editInputRef}
                            onStartEdit={handleStartEdit}
                            onSaveEdit={handleSaveEdit}
                            onEditKeyDown={handleEditKeyDown}
                            columns={columns}
                            dragHandleWidth={dragHandleWidth}
                            onTaskReorder={onTaskReorder}
                            onTaskMove={onTaskMove}
                            onTaskUpdate={onTaskUpdate}
                            onTaskDoubleClick={onTaskDoubleClick}
                            editingDays={editingDays}
                            setEditingDays={setEditingDays}
                            onDurationChange={handleDurationChange}
                        />
                    );
                })}
                {isAddingTask && activeCPId && (
                    <GanttSidebarNewTaskForm
                        columns={columns}
                        tasks={tasks}
                        activeCPId={activeCPId}
                        onTaskCreate={onTaskCreate}
                        onCancel={onCancelAddTask || (() => {})}
                        isVirtualized={isVirtualized!}
                        virtualRowIndex={tasks.length}
                    />
                )}
            </>
        );
    }
);

GanttSidebar.displayName = 'GanttSidebar';
