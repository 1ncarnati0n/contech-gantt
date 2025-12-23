'use client';

import { useState, useCallback } from 'react';
import type { AnchorDependency } from '../../../types';

/** 연결 시작 상태 (dayIndex 기반) */
export interface ConnectingState {
    taskId: string;
    dayIndex: number;
}

/** 훅 옵션 */
interface UseAnchorConnectionOptions {
    dependencies: AnchorDependency[];
    onDependencyCreate?: (dependency: AnchorDependency) => void;
    onDependencyDelete?: (depId: string) => void;
}

/** 훅 반환 타입 */
interface UseAnchorConnectionReturn {
    connectingFrom: ConnectingState | null;
    hoveredAnchor: { taskId: string; dayIndex: number } | null;
    selectedDepId: string | null;
    hoveredDepId: string | null;
    isConnecting: boolean;
    handleAnchorClick: (taskId: string, dayIndex: number) => void;
    handleAnchorHover: (taskId: string, dayIndex: number | null) => void;
    handleDependencyClick: (depId: string) => void;
    handleDependencyHover: (depId: string | null) => void;
    cancelConnection: () => void;
    deleteSelectedDependency: () => void;
    clearSelection: () => void;
}

/**
 * 앵커 연결 관리 훅
 * - 앵커 클릭으로 종속성 생성 (dayIndex 기반)
 * - 종속성 선택/삭제
 */
export const useAnchorConnection = ({
    dependencies,
    onDependencyCreate,
    onDependencyDelete,
}: UseAnchorConnectionOptions): UseAnchorConnectionReturn => {
    const [connectingFrom, setConnectingFrom] = useState<ConnectingState | null>(null);
    const [hoveredAnchor, setHoveredAnchor] = useState<{
        taskId: string;
        dayIndex: number;
    } | null>(null);
    const [selectedDepId, setSelectedDepId] = useState<string | null>(null);
    const [hoveredDepId, setHoveredDepId] = useState<string | null>(null);

    // 앵커 클릭 핸들러 (dayIndex 기반)
    const handleAnchorClick = useCallback(
        (taskId: string, dayIndex: number) => {
            if (!connectingFrom) {
                // 연결 시작
                setConnectingFrom({ taskId, dayIndex });
                setSelectedDepId(null);
            } else {
                // 연결 완료
                if (connectingFrom.taskId !== taskId) {
                    // 다른 태스크 앵커 클릭 시 종속성 생성
                    // 이미 존재하는 종속성인지 확인
                    const exists = dependencies.some(
                        (dep) =>
                            (dep.sourceTaskId === connectingFrom.taskId &&
                                dep.targetTaskId === taskId &&
                                dep.sourceDayIndex === connectingFrom.dayIndex &&
                                dep.targetDayIndex === dayIndex) ||
                            (dep.sourceTaskId === taskId &&
                                dep.targetTaskId === connectingFrom.taskId &&
                                dep.sourceDayIndex === dayIndex &&
                                dep.targetDayIndex === connectingFrom.dayIndex)
                    );

                    if (!exists && onDependencyCreate) {
                        const newDep: AnchorDependency = {
                            id: `dep-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                            sourceTaskId: connectingFrom.taskId,
                            targetTaskId: taskId,
                            sourceDayIndex: connectingFrom.dayIndex,
                            targetDayIndex: dayIndex,
                        };
                        onDependencyCreate(newDep);
                    }
                }
                // 연결 상태 초기화
                setConnectingFrom(null);
            }
        },
        [connectingFrom, dependencies, onDependencyCreate]
    );

    // 앵커 호버 핸들러
    const handleAnchorHover = useCallback(
        (taskId: string, dayIndex: number | null) => {
            if (dayIndex === null) {
                setHoveredAnchor(null);
            } else {
                setHoveredAnchor({ taskId, dayIndex });
            }
        },
        []
    );

    // 종속성 선 클릭 핸들러
    const handleDependencyClick = useCallback((depId: string) => {
        setSelectedDepId((prev) => (prev === depId ? null : depId));
        setConnectingFrom(null);
    }, []);

    // 종속성 선 호버 핸들러
    const handleDependencyHover = useCallback((depId: string | null) => {
        setHoveredDepId(depId);
    }, []);

    // 연결 취소
    const cancelConnection = useCallback(() => {
        setConnectingFrom(null);
    }, []);

    // 선택 해제 (빈 공간 클릭 시)
    const clearSelection = useCallback(() => {
        setSelectedDepId(null);
        setConnectingFrom(null);
    }, []);

    // 선택된 종속성 삭제
    const deleteSelectedDependency = useCallback(() => {
        if (selectedDepId && onDependencyDelete) {
            onDependencyDelete(selectedDepId);
            setSelectedDepId(null);
        }
    }, [selectedDepId, onDependencyDelete]);

    return {
        connectingFrom,
        hoveredAnchor,
        selectedDepId,
        hoveredDepId,
        isConnecting: connectingFrom !== null,
        handleAnchorClick,
        handleAnchorHover,
        handleDependencyClick,
        handleDependencyHover,
        cancelConnection,
        deleteSelectedDependency,
        clearSelection,
    };
};
