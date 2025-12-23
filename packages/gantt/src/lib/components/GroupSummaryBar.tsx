'use client';

import React, { useMemo } from 'react';
import { addDays } from 'date-fns';
import { ConstructionTask, GANTT_LAYOUT, GANTT_COLORS, GANTT_SUMMARY } from '../types';
import { dateToX } from '../utils/dateUtils';
import { calculateGroupDateRange, collectDescendantTasks } from '../utils/groupUtils';

const { BAR_HEIGHT } = GANTT_LAYOUT;
const { BAR_HEIGHT: SUMMARY_BAR_HEIGHT, VERTICAL_OFFSET } = GANTT_SUMMARY;

interface GroupSummaryBarProps {
    group: ConstructionTask;
    allTasks: ConstructionTask[];
    y: number;
    minDate: Date;
    pixelsPerDay: number;
    isDraggable?: boolean;
    currentDeltaDays?: number;
    onDragStart?: (
        e: React.MouseEvent,
        groupId: string,
        taskData: {
            startDate: Date;
            endDate: Date;
            affectedTaskIds: string[];
        }
    ) => void;
    onToggle?: (groupId: string) => void;
    onClick?: (e: React.MouseEvent, groupId: string) => void;
    isFocused?: boolean;
}

export const GroupSummaryBar: React.FC<GroupSummaryBarProps> = React.memo(({
    group,
    allTasks,
    y,
    minDate,
    pixelsPerDay,
    isDraggable = false,
    currentDeltaDays = 0,
    onDragStart,
    onToggle,
    onClick,
    isFocused = false,
}) => {
    // 그룹의 날짜 범위 계산
    const dateRange = useMemo(
        () => calculateGroupDateRange(group.id, allTasks),
        [group.id, allTasks]
    );

    // 하위 Task ID 목록 (groupUtils의 collectDescendantTasks 재사용)
    const affectedTaskIds = useMemo(
        () => collectDescendantTasks(group.id, allTasks).map(t => t.id),
        [group.id, allTasks]
    );

    if (!dateRange) return null;

    const { startDate, endDate, totalDays } = dateRange;
    const progress = group.group?.progress ?? 0;

    // 드래그 중이면 deltaDays 적용
    const adjustedStartDate = currentDeltaDays !== 0
        ? addDays(startDate, currentDeltaDays)
        : startDate;

    const startX = dateToX(adjustedStartDate, minDate, pixelsPerDay);
    const totalWidth = totalDays * pixelsPerDay;
    const progressWidth = totalWidth * (progress / 100);

    // Summary 바 Y 위치 (행 중앙 아래에 배치)
    // VERTICAL_OFFSET: TaskBar보다 살짝 아래에 위치시켜 그룹 구분을 명확하게 함
    const barY = (BAR_HEIGHT - SUMMARY_BAR_HEIGHT) / 2 + VERTICAL_OFFSET;

    const handleMouseDown = (e: React.MouseEvent) => {
        if (!isDraggable || !onDragStart) return;
        e.preventDefault();
        e.stopPropagation();

        onDragStart(e, group.id, {
            startDate,
            endDate,
            affectedTaskIds,
        });
    };

    const handleDoubleClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        onToggle?.(group.id);
    };

    return (
        <g
            transform={`translate(${startX}, ${y})`}
            className={isDraggable ? 'cursor-grab active:cursor-grabbing' : ''}
        >
            {/* Focus Highlight Effect */}
            {isFocused && (
                <rect
                    x={-3}
                    y={barY - 3}
                    width={totalWidth + 6}
                    height={SUMMARY_BAR_HEIGHT + 6}
                    fill="none"
                    stroke={GANTT_COLORS.focus}
                    strokeWidth={2}
                    rx={4}
                    ry={4}
                    className="animate-pulse"
                    style={{ filter: `drop-shadow(0 0 6px ${GANTT_COLORS.focus})` }}
                />
            )}

            {/* Summary 바 배경 (전체 기간) */}
            <rect
                x={0}
                y={barY}
                width={totalWidth}
                height={SUMMARY_BAR_HEIGHT}
                fill={GANTT_COLORS.summaryBar}
                rx={2}
                ry={2}
                opacity={0.4}
            />

            {/* 진행도 바 */}
            {progress > 0 && (
                <rect
                    x={0}
                    y={barY}
                    width={progressWidth}
                    height={SUMMARY_BAR_HEIGHT}
                    fill={GANTT_COLORS.summaryProgress}
                    rx={2}
                    ry={2}
                />
            )}

            {/* 그룹명 (바 위에 표시 - 중앙 정렬) */}
            <text
                x={totalWidth / 2}
                y={barY - 3}
                textAnchor="middle"
                className="font-bold"
                fill={GANTT_COLORS.textSecondary}
                style={{ fontSize: '11px' }}
            >
                {group.name}
            </text>

            {/* 진행도 텍스트 (바 오른쪽) */}
            <text
                x={totalWidth + 8}
                y={barY + SUMMARY_BAR_HEIGHT / 2 + 3}
                fill={GANTT_COLORS.textMuted}
                style={{ fontSize: '9px' }}
            >
                {progress}%
            </text>

            {/* 히트 영역 (투명) - 클릭, 더블클릭 및 드래그 */}
            <rect
                x={0}
                y={0}
                width={totalWidth}
                height={BAR_HEIGHT}
                fill="transparent"
                className={isDraggable ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'}
                onClick={(e) => {
                    e.stopPropagation();
                    onClick?.(e, group.id);
                }}
                onMouseDown={handleMouseDown}
                onDoubleClick={handleDoubleClick}
            />
        </g>
    );
});
