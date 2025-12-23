import { differenceInDays } from 'date-fns';
import { ConstructionTask } from '../types';

// ============================================
// GROUP 관련 유틸리티 함수
// ============================================

/**
 * 재귀적으로 GROUP의 모든 자손 TASK 수집
 *
 * @param parentId - 부모 ID (GROUP 또는 CP)
 * @param allTasks - 전체 Task 배열
 * @returns 하위의 모든 TASK 타입 배열
 */
export const collectDescendantTasks = (
    parentId: string,
    allTasks: ConstructionTask[]
): ConstructionTask[] => {
    const result: ConstructionTask[] = [];

    allTasks.forEach(task => {
        if (task.parentId === parentId) {
            if (task.type === 'TASK') {
                result.push(task);
            }
            if (task.type === 'GROUP') {
                // 재귀적으로 GROUP 하위 탐색
                result.push(...collectDescendantTasks(task.id, allTasks));
            }
        }
    });

    return result;
};

/**
 * GROUP의 하위 Task들로부터 시작일/종료일 계산
 *
 * @param groupId - GROUP ID
 * @param allTasks - 전체 Task 배열
 * @returns { startDate, endDate, totalDays } 또는 하위 Task가 없으면 null
 */
export const calculateGroupDateRange = (
    groupId: string,
    allTasks: ConstructionTask[]
): { startDate: Date; endDate: Date; totalDays: number } | null => {
    const descendantTasks = collectDescendantTasks(groupId, allTasks);

    if (descendantTasks.length === 0) return null;

    const startDates = descendantTasks.map(t => t.startDate);
    const endDates = descendantTasks.map(t => t.endDate);

    const minStart = new Date(Math.min(...startDates.map(d => d.getTime())));
    const maxEnd = new Date(Math.max(...endDates.map(d => d.getTime())));
    const totalDays = differenceInDays(maxEnd, minStart) + 1;

    return { startDate: minStart, endDate: maxEnd, totalDays };
};
