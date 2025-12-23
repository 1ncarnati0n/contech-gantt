import { useVirtualizer, Virtualizer } from '@tanstack/react-virtual';
import { RefObject, useMemo } from 'react';
import { GANTT_LAYOUT } from '../types';

const { ROW_HEIGHT } = GANTT_LAYOUT;

export interface UseGanttVirtualizationOptions {
    /** 스크롤 컨테이너 ref */
    containerRef: RefObject<HTMLDivElement | null>;
    /** 총 행 개수 */
    count: number;
    /** 행 높이 (기본값: GANTT_LAYOUT.ROW_HEIGHT) */
    rowHeight?: number;
    /** 오버스캔 (화면 밖에 미리 렌더링할 행 수, 기본값: 5) */
    overscan?: number;
}

export interface VirtualRow {
    index: number;
    start: number;
    size: number;
    key: string | number;
}

/**
 * 간트 차트용 가상화 훅
 * 
 * 대규모 공정표에서 성능 최적화를 위해 화면에 보이는 행만 렌더링합니다.
 * 
 * @example
 * ```tsx
 * const containerRef = useRef<HTMLDivElement>(null);
 * const virtualizer = useGanttVirtualization({
 *     containerRef,
 *     count: tasks.length,
 * });
 * 
 * // 가상화된 행만 렌더링
 * {virtualizer.virtualRows.map((virtualRow) => {
 *     const task = tasks[virtualRow.index];
 *     return (
 *         <div
 *             key={virtualRow.key}
 *             style={{
 *                 position: 'absolute',
 *                 top: 0,
 *                 left: 0,
 *                 width: '100%',
 *                 height: virtualRow.size,
 *                 transform: `translateY(${virtualRow.start}px)`,
 *             }}
 *         >
 *             {task.name}
 *         </div>
 *     );
 * })}
 * ```
 */
export function useGanttVirtualization({
    containerRef,
    count,
    rowHeight = ROW_HEIGHT,
    overscan = 5,
}: UseGanttVirtualizationOptions) {
    const rowVirtualizer = useVirtualizer({
        count,
        getScrollElement: () => containerRef.current,
        estimateSize: () => rowHeight,
        overscan,
    });

    const virtualItems = rowVirtualizer.getVirtualItems();
    
    const virtualRows = useMemo(() => {
        return virtualItems.map((item) => ({
            index: item.index,
            start: item.start,
            size: item.size,
            key: item.index, // index는 항상 number이므로 타입 안전
        }));
    }, [virtualItems]);

    return {
        /** 가상화된 행 목록 */
        virtualRows,
        /** 전체 높이 (스크롤 영역) */
        totalHeight: rowVirtualizer.getTotalSize(),
        /** 원본 virtualizer 인스턴스 */
        virtualizer: rowVirtualizer as Virtualizer<HTMLDivElement, Element>,
    };
}
