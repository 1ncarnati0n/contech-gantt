'use client';

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import type { ConstructionTask, ViewMode, CriticalPathSummary } from '../../../types';
import { DEFAULT_MASTER_COLUMNS, DEFAULT_DETAIL_COLUMNS } from '../../../types';

interface UseSidebarColumnsOptions {
    viewMode: ViewMode;
    tasks: ConstructionTask[];
    allTasks: ConstructionTask[];
    activeCPId?: string | null;
    cpSummaryMap: Map<string, CriticalPathSummary>;
    onTotalWidthChange?: (width: number) => void;
    onTaskReorder?: (taskId: string, newIndex: number) => void;
}

export const useSidebarColumns = ({
    viewMode,
    tasks,
    allTasks,
    activeCPId,
    cpSummaryMap,
    onTotalWidthChange,
    onTaskReorder,
}: UseSidebarColumnsOptions) => {
    const [masterColumnWidths, setMasterColumnWidths] = useState<number[]>(
        DEFAULT_MASTER_COLUMNS.map(col => col.width)
    );
    const [detailColumnWidths, setDetailColumnWidths] = useState<number[]>(
        DEFAULT_DETAIL_COLUMNS.map(col => col.width)
    );
    const [resizingIndex, setResizingIndex] = useState<number | null>(null);
    const isResizingRef = useRef(false);

    const baseColumns = viewMode === 'MASTER' ? DEFAULT_MASTER_COLUMNS : DEFAULT_DETAIL_COLUMNS;
    const columnWidths = viewMode === 'MASTER' ? masterColumnWidths : detailColumnWidths;
    const setColumnWidths = viewMode === 'MASTER' ? setMasterColumnWidths : setDetailColumnWidths;

    const columns = useMemo(() =>
        baseColumns.map((col, idx) => ({
            ...col,
            width: columnWidths[idx] ?? col.width,
        })),
        [baseColumns, columnWidths]
    );

    const dragHandleWidth = onTaskReorder ? 24 : 0;
    const totalWidth = columns.reduce((sum, col) => sum + col.width, 0) + dragHandleWidth;

    useEffect(() => {
        if (onTotalWidthChange) {
            onTotalWidthChange(totalWidth);
        }
    }, [totalWidth, onTotalWidthChange]);

    // 텍스트 너비 측정
    const measureTextWidth = useCallback((text: string, fontSize: number = 12, fontWeight: string = 'normal') => {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        if (!context) return 0;
        context.font = `${fontWeight} ${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
        return context.measureText(text).width;
    }, []);

    // 그룹 깊이 계산 (Detail View용)
    const getGroupDepth = useCallback((task: ConstructionTask): number => {
        if (!activeCPId || task.parentId === activeCPId) return 0;

        let depth = 0;
        let currentParentId = task.parentId;

        while (currentParentId && currentParentId !== activeCPId) {
            const parent = allTasks.find(t => t.id === currentParentId);
            if (parent?.type === 'GROUP') depth++;
            currentParentId = parent?.parentId || null;
        }
        return depth;
    }, [activeCPId, allTasks]);

    // 그룹 깊이 계산 (Master View용)
    const getMasterGroupDepth = useCallback((task: ConstructionTask): number => {
        if (!task.parentId) return 0;

        let depth = 0;
        let currentParentId: string | null | undefined = task.parentId;

        while (currentParentId) {
            const parent = allTasks.find(t => t.id === currentParentId);
            if (parent?.type === 'GROUP') depth++;
            currentParentId = parent?.parentId;
        }
        return depth;
    }, [allTasks]);

    // 컬럼 내용에 맞게 최적 너비 계산
    const calculateOptimalWidth = useCallback((columnIndex: number) => {
        const minWidth = baseColumns[columnIndex].minWidth;
        const isNameColumn = columnIndex === 0;
        const basePadding = isNameColumn ? 72 : 20;

        const headerText = baseColumns[columnIndex].label;
        let maxWidth = measureTextWidth(headerText, 12, '500') + 16;

        tasks.forEach(task => {
            let cellText = '';
            let extraPadding = 0;

            if (viewMode === 'MASTER') {
                if (isNameColumn) {
                    const depth = getMasterGroupDepth(task);
                    extraPadding = depth * 12;
                }

                const cpSummary = task.type === 'CP' ? cpSummaryMap.get(task.id) : null;
                const formatNum = (n: number) => Number.isInteger(n) ? n.toString() : n.toFixed(1);
                const isGroup = task.type === 'GROUP';

                switch (columnIndex) {
                    case 0:
                        cellText = task.name;
                        break;
                    case 1:
                        cellText = isGroup ? '-' : cpSummary ? `${cpSummary.totalDays}일` : '-';
                        break;
                    case 2:
                        cellText = isGroup ? '-' : cpSummary ? `${formatNum(cpSummary.workDays)}일` : '-';
                        break;
                    case 3:
                        cellText = isGroup ? '-' : cpSummary ? `${formatNum(cpSummary.nonWorkDays)}일` : '-';
                        break;
                }
            } else {
                if (isNameColumn) {
                    const depth = getGroupDepth(task);
                    extraPadding = depth * 12;
                }

                switch (columnIndex) {
                    case 0:
                        cellText = task.name;
                        break;
                    case 1:
                        cellText = task.task ? String(task.task.indirectWorkDaysPre) : '-';
                        break;
                    case 2:
                        cellText = task.task ? String(task.task.netWorkDays) : '-';
                        break;
                    case 3:
                        cellText = task.task ? String(task.task.indirectWorkDaysPost) : '-';
                        break;
                    case 4:
                        cellText = 'yyyy-MM-dd';
                        break;
                    case 5:
                        cellText = 'yyyy-MM-dd';
                        break;
                }
            }

            const fontWeight = isNameColumn ? '500' : 'normal';
            const fontSize = isNameColumn ? 14 : 12;
            const textWidth = measureTextWidth(cellText, fontSize, fontWeight) + basePadding + extraPadding;
            maxWidth = Math.max(maxWidth, textWidth);
        });

        return Math.max(minWidth, Math.ceil(maxWidth));
    }, [tasks, viewMode, baseColumns, measureTextWidth, getMasterGroupDepth, getGroupDepth, cpSummaryMap]);

    // 컬럼 리사이즈 핸들러
    const handleColumnResizeStart = useCallback((e: React.MouseEvent, columnIndex: number) => {
        if (e.detail >= 2) return;

        e.preventDefault();
        e.stopPropagation();
        isResizingRef.current = true;
        setResizingIndex(columnIndex);

        const startX = e.clientX;
        const startWidth = columnWidths[columnIndex];
        const minWidth = baseColumns[columnIndex].minWidth;

        const handleMouseMove = (e: MouseEvent) => {
            if (!isResizingRef.current) return;
            const delta = e.clientX - startX;
            const newWidth = Math.max(minWidth, startWidth + delta);

            setColumnWidths(prev => {
                const updated = [...prev];
                updated[columnIndex] = newWidth;
                return updated;
            });
        };

        const handleMouseUp = () => {
            isResizingRef.current = false;
            setResizingIndex(null);
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    }, [columnWidths, baseColumns, setColumnWidths]);

    // 더블클릭으로 컬럼 너비 자동 최적화
    const handleColumnResizeDoubleClick = useCallback((e: React.MouseEvent, columnIndex: number) => {
        e.preventDefault();
        e.stopPropagation();

        isResizingRef.current = false;
        setResizingIndex(null);

        const optimalWidth = calculateOptimalWidth(columnIndex);
        setColumnWidths(prev => {
            const updated = [...prev];
            updated[columnIndex] = optimalWidth;
            return updated;
        });
    }, [calculateOptimalWidth, setColumnWidths]);

    // 초기 로드 및 뷰 변경 시 컬럼 너비 자동 최적화
    const lastOptimizedKey = useRef({ master: '', detail: '' });

    useEffect(() => {
        if (tasks.length === 0) return;

        const optimizeColumns = () => {
            const currentColumns = viewMode === 'MASTER' ? DEFAULT_MASTER_COLUMNS : DEFAULT_DETAIL_COLUMNS;
            const newWidths = currentColumns.map((_, idx) => calculateOptimalWidth(idx));

            if (viewMode === 'MASTER') {
                setMasterColumnWidths(newWidths);
                lastOptimizedKey.current.master = `${allTasks.length}-${tasks.length}-${cpSummaryMap.size}`;
            } else {
                setDetailColumnWidths(newWidths);
                lastOptimizedKey.current.detail = `${activeCPId}-${tasks.length}`;
            }
        };

        if (viewMode === 'MASTER') {
            const currentKey = `${allTasks.length}-${tasks.length}-${cpSummaryMap.size}`;
            if (lastOptimizedKey.current.master !== currentKey) {
                optimizeColumns();
            }
        } else if (viewMode === 'DETAIL') {
            const currentKey = `${activeCPId}-${tasks.length}`;
            if (lastOptimizedKey.current.detail !== currentKey) {
                optimizeColumns();
            }
        }
    }, [tasks, allTasks.length, viewMode, activeCPId, calculateOptimalWidth, cpSummaryMap.size]);

    return {
        columns,
        totalWidth,
        dragHandleWidth,
        resizingIndex,
        handleColumnResizeStart,
        handleColumnResizeDoubleClick,
        getGroupDepth,
        getMasterGroupDepth,
    };
};
