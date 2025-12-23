'use client';

import React, { useMemo } from 'react';
import { differenceInDays, addDays } from 'date-fns';
import { GANTT_LAYOUT, GANTT_COLORS, GANTT_ANCHOR } from '../../types';
import type { ConstructionTask, AnchorDependency, CalendarSettings } from '../../types';
import { getTaskCalendarSettings, getHolidayOffsetsInDateRange } from '../../utils/dateUtils';

/** 앵커 위치 정보 (dayIndex 기반) */
export interface AnchorPosition {
    taskId: string;
    dayIndex: number;         // 작업일 기준 오프셋 (휴일 제외 카운트)
    x: number;
    y: number;
}

/**
 * 순작업 구간 내 휴일의 달력 오프셋 Set 반환
 * (Pre 시작 기준으로 변환된 값)
 */
const getHolidayDayOffsets = (
    task: ConstructionTask,
    holidays: Date[] = [],
    calendarSettings?: CalendarSettings
): Set<number> => {
    if (!task.task || !calendarSettings || !holidays.length) {
        return new Set();
    }

    const { indirectWorkDaysPre, indirectWorkDaysPost } = task.task;
    const taskSettings = getTaskCalendarSettings(task.task, calendarSettings);

    const netStartDate = addDays(task.startDate, indirectWorkDaysPre);
    const netEndDate = indirectWorkDaysPost > 0
        ? addDays(task.endDate, -indirectWorkDaysPost)
        : task.endDate;

    const holidayOffsets = getHolidayOffsetsInDateRange(
        netStartDate, netEndDate, holidays, taskSettings
    );

    // Pre 시작 기준으로 오프셋 변환
    return new Set(holidayOffsets.map(h => indirectWorkDaysPre + h.offset));
};

/**
 * 작업일 기준 dayIndex → 달력일 오프셋 변환
 * (0.5일 소수점 포함 가능)
 */
export const workingDayToCalendarOffset = (
    task: ConstructionTask,
    workingDayIndex: number,
    holidays: Date[] = [],
    calendarSettings?: CalendarSettings
): number => {
    // 0.5일 처리: 정수 부분과 소수 부분 분리
    const intPart = Math.floor(workingDayIndex);
    const fractionalPart = workingDayIndex - intPart;

    if (!task.task || !calendarSettings) {
        return workingDayIndex;
    }

    const holidayDayOffsets = getHolidayDayOffsets(task, holidays, calendarSettings);

    if (holidayDayOffsets.size === 0) {
        return workingDayIndex;
    }

    // 작업일 → 달력일 변환 (휴일 건너뛰기)
    let calendarOffset = 0;
    let workingDaysCount = 0;

    while (workingDaysCount < intPart) {
        if (!holidayDayOffsets.has(calendarOffset)) {
            workingDaysCount++;
        }
        calendarOffset++;
    }

    // 현재 위치가 휴일이면 다음 작업일로 이동
    while (holidayDayOffsets.has(calendarOffset)) {
        calendarOffset++;
    }

    // 소수 부분 더하기 (0.5일 등)
    return calendarOffset + fractionalPart;
};

interface AnchorPointsProps {
    task: ConstructionTask;
    rowIndex: number;
    minDate: Date;
    pixelsPerDay: number;
    connectingFrom?: { taskId: string; dayIndex: number } | null;
    dependencies: AnchorDependency[];
    onAnchorClick?: (taskId: string, dayIndex: number) => void;
    onAnchorHover?: (taskId: string, dayIndex: number | null) => void;
    holidays?: Date[];
    calendarSettings?: CalendarSettings;
    /** 종속성 드래그 중 델타 (일 단위) - 앵커 실시간 동기화용 */
    dependencyDragDeltaDays?: number;
}

/**
 * 태스크 바 하단에 표시되는 앵커 포인트
 * - 모든 Day 경계에 앵커 배치 (0.5일 단위)
 * - N일 태스크 → (N * 2) + 1개 앵커
 */
export const AnchorPoints: React.FC<AnchorPointsProps> = ({
    task,
    rowIndex,
    minDate,
    pixelsPerDay,
    connectingFrom,
    dependencies,
    onAnchorClick,
    onAnchorHover,
    holidays,
    calendarSettings,
    dependencyDragDeltaDays = 0,
}) => {
    // 앵커 위치 계산 (작업일 기준, 휴일 위치 건너뛰기)
    const anchors = useMemo((): AnchorPosition[] => {
        const startOffset = differenceInDays(task.startDate, minDate);

        // Y 좌표: 바 하단에 위치
        const y =
            GANTT_LAYOUT.MILESTONE_LANE_HEIGHT +
            rowIndex * GANTT_LAYOUT.ROW_HEIGHT +
            (GANTT_LAYOUT.ROW_HEIGHT - GANTT_LAYOUT.BAR_HEIGHT) / 2 +
            GANTT_LAYOUT.BAR_HEIGHT;

        const result: AnchorPosition[] = [];

        if (task.task) {
            const { netWorkDays, indirectWorkDaysPre, indirectWorkDaysPost } = task.task;

            // 휴일 오프셋 계산 (순작업 구간만)
            const holidayDayOffsets = getHolidayDayOffsets(task, holidays, calendarSettings);
            const holidayCount = holidayDayOffsets.size;

            // 총 달력일 수 (휴일 포함)
            const totalCalendarDays = indirectWorkDaysPre + netWorkDays + holidayCount + indirectWorkDaysPost;
            const totalCalendarDaysInt = Math.floor(totalCalendarDays);

            // 작업일 기준 dayIndex로 앵커 생성 (휴일 위치 건너뛰기)
            let workingDayIndex = 0;

            for (let calendarOffset = 0; calendarOffset <= totalCalendarDaysInt; calendarOffset++) {
                // 휴일이면 건너뛰기 (앵커 생성 안 함)
                if (holidayDayOffsets.has(calendarOffset)) {
                    continue;
                }

                // 앵커 생성 (workingDayIndex = 작업일 기준)
                result.push({
                    taskId: task.id,
                    dayIndex: workingDayIndex,
                    x: (startOffset + calendarOffset) * pixelsPerDay,
                    y,
                });
                workingDayIndex++;
            }

            // 0.5일로 끝나는 경우 마지막 앵커 추가
            const fractionalPart = totalCalendarDays - totalCalendarDaysInt;
            if (fractionalPart >= 0.5) {
                result.push({
                    taskId: task.id,
                    dayIndex: workingDayIndex,
                    x: (startOffset + totalCalendarDays) * pixelsPerDay,
                    y,
                });
            }
        } else {
            // task.task 없는 경우 (Level 1): 기존 방식
            const totalDays = differenceInDays(task.endDate, task.startDate) + 1;

            for (let dayIndex = 0; dayIndex <= Math.floor(totalDays); dayIndex++) {
                result.push({
                    taskId: task.id,
                    dayIndex,
                    x: (startOffset + dayIndex) * pixelsPerDay,
                    y,
                });
            }

            // 0.5일로 끝나는 경우 마지막 앵커 추가
            const fractionalPart = totalDays - Math.floor(totalDays);
            if (fractionalPart >= 0.5) {
                result.push({
                    taskId: task.id,
                    dayIndex: totalDays,
                    x: (startOffset + totalDays) * pixelsPerDay,
                    y,
                });
            }
        }

        // 종속성 드래그 중 앵커 위치 실시간 동기화
        if (dependencyDragDeltaDays !== 0) {
            const dragOffset = dependencyDragDeltaDays * pixelsPerDay;
            result.forEach(anchor => {
                anchor.x += dragOffset;
            });
        }

        return result;
    }, [task, rowIndex, minDate, pixelsPerDay, holidays, calendarSettings, dependencyDragDeltaDays]);

    // 이 태스크의 특정 dayIndex에 종속성이 연결되어 있는지 확인
    const isAnchorConnected = (dayIndex: number): boolean => {
        return dependencies.some(
            (dep) =>
                (dep.sourceTaskId === task.id && dep.sourceDayIndex === dayIndex) ||
                (dep.targetTaskId === task.id && dep.targetDayIndex === dayIndex)
        );
    };

    // 종속성 선 경로상에 있는 앵커인지 확인 (중간 앵커 비활성화)
    // 동일 task 내에서 종속성의 source와 target dayIndex 사이의 앵커들
    const connectedAnchorRanges = useMemo(() => {
        const ranges: { from: number; to: number }[] = [];

        dependencies.forEach(dep => {
            // 이 task 내에서 시작하고 끝나는 종속성 (In-bar connection)
            if (dep.sourceTaskId === task.id && dep.targetTaskId === task.id) {
                const minDay = Math.min(dep.sourceDayIndex, dep.targetDayIndex);
                const maxDay = Math.max(dep.sourceDayIndex, dep.targetDayIndex);
                ranges.push({ from: minDay, to: maxDay });
            }

            // 들어오는 종속성의 target과 나가는 종속성의 source 사이
            // (task를 통과하는 종속성 체인)
        });

        // InBarConnectionLines에서 그리는 범위도 추가
        // 들어오는 종속성(target)과 나가는 종속성(source) 사이의 연결선
        const incomingAnchors = dependencies
            .filter(dep => dep.targetTaskId === task.id)
            .map(dep => dep.targetDayIndex);
        const outgoingAnchors = dependencies
            .filter(dep => dep.sourceTaskId === task.id)
            .map(dep => dep.sourceDayIndex);

        // 연결이 필요한 쌍 찾기 (들어오는 앵커 -> 나가는 앵커)
        incomingAnchors.forEach(inDay => {
            outgoingAnchors.forEach(outDay => {
                if (inDay !== outDay) {
                    const minDay = Math.min(inDay, outDay);
                    const maxDay = Math.max(inDay, outDay);
                    ranges.push({ from: minDay, to: maxDay });
                }
            });
        });

        return ranges;
    }, [dependencies, task.id]);

    // 앵커가 종속성 경로상에 있는지 확인 (중간 지점)
    const isInDependencyPath = (dayIndex: number): boolean => {
        return connectedAnchorRanges.some(
            range => dayIndex > range.from && dayIndex < range.to
        );
    };

    // 현재 연결 시작점인지 확인
    const isConnectingFromThis = (dayIndex: number): boolean => {
        return connectingFrom?.taskId === task.id && connectingFrom?.dayIndex === dayIndex;
    };

    return (
        <g className="anchor-points">
            {anchors.map((anchorPos) => {
                const isConnectingStart = isConnectingFromThis(anchorPos.dayIndex);
                const isConnected = isAnchorConnected(anchorPos.dayIndex);
                const isPathBlocked = isInDependencyPath(anchorPos.dayIndex);
                // 연결된 앵커 또는 경로상의 앵커는 비활성화
                const isDisabled = isConnected || isPathBlocked;
                // 연결된 앵커 또는 연결 시작점(초록 점)만 표시
                const isVisible = isConnected || isConnectingStart;

                return (
                    <g key={`anchor-${task.id}-${anchorPos.dayIndex}`}>
                        {/* 클릭 영역 (비활성화된 앵커는 상호작용 비활성화) */}
                        <circle
                            cx={anchorPos.x}
                            cy={anchorPos.y}
                            r={GANTT_ANCHOR.HIT_AREA}
                            fill="transparent"
                            style={{ cursor: isDisabled ? 'default' : 'pointer' }}
                            onClick={isDisabled ? undefined : () => onAnchorClick?.(task.id, anchorPos.dayIndex)}
                            onMouseEnter={isDisabled ? undefined : () => onAnchorHover?.(task.id, anchorPos.dayIndex)}
                            onMouseLeave={isDisabled ? undefined : () => onAnchorHover?.(task.id, null)}
                            pointerEvents={isDisabled ? 'none' : 'auto'}
                        />
                        {/* 앵커 원 (조건부 표시) */}
                        <circle
                            cx={anchorPos.x}
                            cy={anchorPos.y}
                            r={isConnectingStart
                                ? GANTT_ANCHOR.RADIUS_ACTIVE
                                : isConnected
                                    ? GANTT_ANCHOR.RADIUS_CONNECTED
                                    : GANTT_ANCHOR.RADIUS
                            }
                            fill={
                                isConnectingStart
                                    ? GANTT_COLORS.success // 연결 시작점: 초록
                                    : isConnected
                                        ? GANTT_COLORS.textPrimary // 연결됨: 검은/흰 점
                                        : isPathBlocked
                                            ? GANTT_COLORS.dependency // 경로상: 회색
                                            : GANTT_COLORS.anchorFill
                            }
                            stroke={
                                isConnectingStart
                                    ? GANTT_COLORS.success
                                    : isDisabled
                                        ? 'none' // 비활성화: 아웃라인 없음
                                        : GANTT_COLORS.anchorStroke
                            }
                            strokeWidth={isDisabled ? 0 : GANTT_ANCHOR.STROKE_WIDTH}
                            opacity={isVisible ? 1 : 0}
                            style={{
                                cursor: isDisabled ? 'default' : 'pointer',
                                transition: 'all 0.15s ease',
                                pointerEvents: isDisabled ? 'none' : 'auto',
                            }}
                            onClick={isDisabled ? undefined : () => onAnchorClick?.(task.id, anchorPos.dayIndex)}
                            onMouseEnter={isDisabled ? undefined : () => onAnchorHover?.(task.id, anchorPos.dayIndex)}
                            onMouseLeave={isDisabled ? undefined : () => onAnchorHover?.(task.id, null)}
                        />
                    </g>
                );
            })}
        </g>
    );
};

/**
 * 앵커 위치 계산 유틸리티 함수
 * 외부에서 종속성 선 그리기에 사용
 * dayIndex는 작업일 기준, 렌더링 시 달력일로 변환
 */
export const getAnchorPosition = (
    task: ConstructionTask,
    workingDayIndex: number,
    rowIndex: number,
    minDate: Date,
    pixelsPerDay: number,
    holidays: Date[] = [],
    calendarSettings?: CalendarSettings
): AnchorPosition => {
    const startOffset = differenceInDays(task.startDate, minDate);
    const calendarOffset = workingDayToCalendarOffset(task, workingDayIndex, holidays, calendarSettings);
    const x = (startOffset + calendarOffset) * pixelsPerDay;

    const y =
        GANTT_LAYOUT.MILESTONE_LANE_HEIGHT +
        rowIndex * GANTT_LAYOUT.ROW_HEIGHT +
        (GANTT_LAYOUT.ROW_HEIGHT - GANTT_LAYOUT.BAR_HEIGHT) / 2 +
        GANTT_LAYOUT.BAR_HEIGHT;

    return {
        taskId: task.id,
        dayIndex: workingDayIndex,
        x,
        y,
    };
};
