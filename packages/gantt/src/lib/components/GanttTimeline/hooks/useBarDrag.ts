'use client';

import { useCallback, useRef, useEffect } from 'react';
import { addDays } from 'date-fns';
import { isHoliday, snapToWorkingDay, addWorkingDays } from '../../../utils/dateUtils';
import {
    calculateDragDirection,
    calculateDeltaDays,
    getDragCursor,
} from './dragUtils';
import { useDragState } from './useDragState';
import type { CalendarSettings } from '../../../types';
import type { DragType, DragInfo, BarDragResult, BarDragState, BaseDragOptions } from '../types';

// ============================================
// Hook Options
// ============================================

interface UseBarDragOptions extends BaseDragOptions {
    holidays: Date[];
    calendarSettings: CalendarSettings;
    onBarDrag?: (result: BarDragResult) => void;
}

// ============================================
// 드래그 타입별 상태 계산 (분리된 순수 함수)
// ============================================
const calculateDragResult = (
    state: BarDragState,
    deltaDays: number,
    direction: 'left' | 'right',
    holidays: Date[],
    calendarSettings: CalendarSettings
): Partial<BarDragState> => {
    let newStartDate = state.originalStartDate;
    let newEndDate = state.originalEndDate;
    let newPreDays = state.originalIndirectWorkDaysPre;
    let newNetDays = state.originalNetWorkDays;
    let newPostDays = state.originalIndirectWorkDaysPost;

    switch (state.dragType) {
        case 'move': {
            // 1. 새 시작일 계산 (델타만큼 이동)
            const tentativeStart = addDays(state.originalStartDate, deltaDays);

            // 2. 시작일이 휴일이면 드래그 방향으로 스냅
            const snappedStart = isHoliday(tentativeStart, holidays, calendarSettings)
                ? snapToWorkingDay(tentativeStart, direction, holidays, calendarSettings)
                : tentativeStart;

            // 3. 종료일 재계산: 선간접(달력일) + 순작업(작업일, 휴일건너뛰기) + 후간접(달력일)
            let currentDate = snappedStart;

            // 3-1. 선간접 (달력일 기준)
            if (state.originalIndirectWorkDaysPre > 0) {
                currentDate = addDays(currentDate, state.originalIndirectWorkDaysPre);
            }

            // 3-2. 순작업 (작업일 기준, 휴일 건너뛰기)
            // addWorkingDays는 시작일 포함해서 N일째 작업일을 반환
            const netEndDate = addWorkingDays(currentDate, state.originalNetWorkDays, holidays, calendarSettings);
            currentDate = addDays(netEndDate, 1); // 순작업 종료일 다음날

            // 3-3. 후간접 (달력일 기준)
            if (state.originalIndirectWorkDaysPost > 0) {
                currentDate = addDays(currentDate, state.originalIndirectWorkDaysPost - 1);
            } else {
                currentDate = netEndDate; // 후간접 없으면 순작업 종료일이 전체 종료일
            }

            newStartDate = snappedStart;
            newEndDate = currentDate;
            break;
        }

        case 'move-net': {
            const maxPreIncrease = state.originalIndirectWorkDaysPost;
            const maxPreDecrease = state.originalIndirectWorkDaysPre;
            const constrainedDelta = Math.max(-maxPreDecrease, Math.min(maxPreIncrease, deltaDays));
            newPreDays = state.originalIndirectWorkDaysPre + constrainedDelta;
            newPostDays = state.originalIndirectWorkDaysPost - constrainedDelta;
            break;
        }

        case 'resize-pre': {
            if (state.originalIndirectWorkDaysPre > 0) {
                // 선간접 조정 (달력일 기준)
                newPreDays = Math.max(0, state.originalIndirectWorkDaysPre - deltaDays);
                const netWorkStartDate = addDays(state.originalStartDate, state.originalIndirectWorkDaysPre);
                newStartDate = addDays(netWorkStartDate, -newPreDays);
            } else {
                // 순작업일 조정 (작업일 기준)
                // 왼쪽으로 드래그: deltaDays < 0 → 순작업일 증가
                // 오른쪽으로 드래그: deltaDays > 0 → 순작업일 감소
                newNetDays = Math.max(1, state.originalNetWorkDays - deltaDays);

                // 종료일로부터 역산하여 새 시작일 계산
                // 후간접이 있으면 그것을 빼고 순작업 종료일 구함
                const postDays = state.originalIndirectWorkDaysPost;
                const netEndDate = postDays > 0
                    ? addDays(state.originalEndDate, -postDays)
                    : state.originalEndDate;

                // 순작업 종료일에서 newNetDays만큼 역산 (휴일 건너뛰기)
                // 순작업 N일이면, 종료일에서 N-1 작업일 전이 시작일
                let current = netEndDate;
                let workDaysCount = 1; // 종료일은 이미 1일
                while (workDaysCount < newNetDays) {
                    current = addDays(current, -1);
                    if (!isHoliday(current, holidays, calendarSettings)) {
                        workDaysCount++;
                    }
                }
                // 휴일이면 앞으로 더 이동
                while (isHoliday(current, holidays, calendarSettings)) {
                    current = addDays(current, -1);
                }
                newStartDate = current;
            }
            newEndDate = state.originalEndDate;
            break;
        }

        case 'resize-post': {
            if (state.originalIndirectWorkDaysPost > 0) {
                // 후간접 조정 (달력일 기준)
                newPostDays = Math.max(0, state.originalIndirectWorkDaysPost + deltaDays);
                const netWorkEndDate = addDays(state.originalEndDate, -state.originalIndirectWorkDaysPost);
                newEndDate = addDays(netWorkEndDate, newPostDays);
            } else {
                // 순작업일 조정 (작업일 기준, 휴일 건너뛰기)
                newNetDays = Math.max(1, state.originalNetWorkDays + deltaDays);

                // 순작업 시작일 계산
                const netStartDate = addDays(state.originalStartDate, state.originalIndirectWorkDaysPre);

                // addWorkingDays로 종료일 계산 (휴일 건너뛰기)
                newEndDate = addWorkingDays(netStartDate, newNetDays, holidays, calendarSettings);
            }
            newStartDate = state.originalStartDate;
            break;
        }

        case 'resize-pre-net': {
            const maxPreIncrease = state.originalNetWorkDays - 1;
            const maxPreDecrease = state.originalIndirectWorkDaysPre;
            const constrainedDelta = Math.max(-maxPreDecrease, Math.min(maxPreIncrease, deltaDays));
            newPreDays = state.originalIndirectWorkDaysPre + constrainedDelta;
            newNetDays = state.originalNetWorkDays - constrainedDelta;
            break;
        }

        case 'resize-net-post': {
            const maxNetIncrease = state.originalIndirectWorkDaysPost;
            const maxNetDecrease = state.originalNetWorkDays - 1;
            const constrainedDelta = Math.max(-maxNetDecrease, Math.min(maxNetIncrease, deltaDays));
            newNetDays = state.originalNetWorkDays + constrainedDelta;
            newPostDays = state.originalIndirectWorkDaysPost - constrainedDelta;
            break;
        }
    }

    return {
        currentStartDate: newStartDate,
        currentEndDate: newEndDate,
        currentIndirectWorkDaysPre: newPreDays,
        currentNetWorkDays: newNetDays,
        currentIndirectWorkDaysPost: newPostDays,
    };
};

// ============================================
// useBarDrag Hook (리팩토링됨)
// ============================================

export const useBarDrag = ({
    pixelsPerDay,
    holidays,
    calendarSettings,
    onBarDrag,
}: UseBarDragOptions) => {
    // 커서 cleanup ref (동적 커서 처리를 위해)
    const cleanupRef = useRef<(() => void) | null>(null);

    // ========================================
    // 공통 드래그 상태 관리 훅 사용
    // ========================================
    const { state: dragState, start, isDragging } = useDragState<BarDragState>({
        // 드래그 중 처리
        onMove: (e, state, setState) => {
            if (!onBarDrag) return;

            const deltaX = e.clientX - state.startX;
            const deltaDays = calculateDeltaDays(deltaX, pixelsPerDay);
            const direction = calculateDragDirection(deltaX);

            // 순수 함수로 드래그 결과 계산
            const result = calculateDragResult(state, deltaDays, direction, holidays, calendarSettings);

            setState(prev => prev ? {
                ...prev,
                ...result,
                lastDeltaX: deltaX,
            } : null);
        },
        // 드래그 완료 처리
        onEnd: (state) => {
            if (!onBarDrag) return;

            const direction = calculateDragDirection(state.lastDeltaX);
            let finalStartDate = state.currentStartDate;
            let finalEndDate = state.currentEndDate;

            // 'move' 타입일 때 최종 휴일 회피 + 종료일 재계산
            if (state.dragType === 'move' && isHoliday(finalStartDate, holidays, calendarSettings)) {
                const snappedStart = snapToWorkingDay(finalStartDate, direction, holidays, calendarSettings);
                finalStartDate = snappedStart;

                // 종료일 재계산: 선간접 + 순작업(휴일건너뛰기) + 후간접
                let currentDate = snappedStart;
                if (state.currentIndirectWorkDaysPre > 0) {
                    currentDate = addDays(currentDate, state.currentIndirectWorkDaysPre);
                }
                const netEndDate = addWorkingDays(currentDate, state.currentNetWorkDays, holidays, calendarSettings);
                if (state.currentIndirectWorkDaysPost > 0) {
                    finalEndDate = addDays(netEndDate, state.currentIndirectWorkDaysPost);
                } else {
                    finalEndDate = netEndDate;
                }
            }

            const hasDateChange =
                finalStartDate.getTime() !== state.originalStartDate.getTime() ||
                finalEndDate.getTime() !== state.originalEndDate.getTime();
            const hasDaysChange =
                state.currentIndirectWorkDaysPre !== state.originalIndirectWorkDaysPre ||
                state.currentNetWorkDays !== state.originalNetWorkDays ||
                state.currentIndirectWorkDaysPost !== state.originalIndirectWorkDaysPost;

            if (hasDateChange || hasDaysChange) {
                onBarDrag({
                    taskId: state.taskId,
                    dragType: state.dragType,
                    newStartDate: finalStartDate,
                    newEndDate: finalEndDate,
                    newIndirectWorkDaysPre: state.currentIndirectWorkDaysPre,
                    newIndirectWorkDaysPost: state.currentIndirectWorkDaysPost,
                    newNetWorkDays: state.currentNetWorkDays,
                });
            }
        },
        // 기본 커서 (동적 커서는 별도 처리)
        cursor: 'grabbing',
    });

    // ========================================
    // 동적 커서 처리 (dragType에 따라)
    // ========================================
    useEffect(() => {
        if (dragState) {
            const cursor = getDragCursor(dragState.dragType);
            document.body.style.cursor = cursor;
        }
        return () => {
            if (cleanupRef.current) {
                cleanupRef.current();
                cleanupRef.current = null;
            }
        };
    }, [dragState?.dragType]);

    // ========================================
    // 드래그 시작
    // ========================================
    const handleMouseDown = useCallback((
        e: React.MouseEvent,
        taskId: string,
        dragType: DragType,
        taskData: {
            startDate: Date;
            endDate: Date;
            indirectWorkDaysPre: number;
            netWorkDays: number;
            indirectWorkDaysPost: number;
        }
    ) => {
        if (!onBarDrag) return;
        e.preventDefault();
        e.stopPropagation();

        start({
            taskId,
            dragType,
            startX: e.clientX,
            originalStartDate: taskData.startDate,
            originalEndDate: taskData.endDate,
            originalIndirectWorkDaysPre: taskData.indirectWorkDaysPre,
            originalNetWorkDays: taskData.netWorkDays,
            originalIndirectWorkDaysPost: taskData.indirectWorkDaysPost,
            currentStartDate: taskData.startDate,
            currentEndDate: taskData.endDate,
            currentIndirectWorkDaysPre: taskData.indirectWorkDaysPre,
            currentNetWorkDays: taskData.netWorkDays,
            currentIndirectWorkDaysPost: taskData.indirectWorkDaysPost,
            lastDeltaX: 0,
        });
    }, [onBarDrag, start]);

    // ========================================
    // 드래그 정보 조회
    // ========================================
    const getDragInfo = useCallback((taskId: string): DragInfo | null => {
        if (dragState && dragState.taskId === taskId) {
            return {
                startDate: dragState.currentStartDate,
                endDate: dragState.currentEndDate,
                indirectWorkDaysPre: dragState.currentIndirectWorkDaysPre,
                indirectWorkDaysPost: dragState.currentIndirectWorkDaysPost,
                netWorkDays: dragState.currentNetWorkDays,
            };
        }
        return null;
    }, [dragState]);

    return {
        isDragging,
        handleBarMouseDown: handleMouseDown,
        getDragInfo,
    };
};
