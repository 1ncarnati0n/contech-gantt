'use client';

import { format } from 'date-fns';
import { ZOOM_CONFIG } from '../../types';
import type { GanttHeaderProps } from './types';

export const GanttHeader: React.FC<GanttHeaderProps> = ({
    viewMode,
    zoomLevel,
    isAddingTask,
    isAddingCP,
    hasUnsavedChanges,
    saveStatus,
    onViewChange,
    onZoomChange,
    onStartAddTask,
    onStartAddCP,
    onStartAddMilestone,
    onScrollToFirst,
    onCollapseAll,
    onExpandAll,
    onSave,
    onReset,
    onExport,
    onImport,
    canCreateTask,
    canCreateMilestone,
}) => {
    return (
        <header
            className="flex h-[60px] shrink-0 items-center justify-between px-4 shadow-sm"
            style={{
                backgroundColor: 'var(--gantt-bg-primary)',
                borderBottom: '1px solid var(--gantt-border)',
            }}
        >
            {/* 왼쪽: 상위 공정표로 버튼 + 추가 버튼 */}
            <div className="flex items-center gap-3 shrink-0">
                {viewMode === 'DETAIL' ? (
                    <>
                        <button
                            onClick={() => onViewChange('MASTER')}
                            className="rounded px-3 py-1.5 text-xs font-medium transition-colors"
                            style={{
                                backgroundColor: 'var(--gantt-bg-tertiary)',
                                color: 'var(--gantt-text-secondary)',
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = 'var(--gantt-bg-hover)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'var(--gantt-bg-tertiary)';
                            }}
                        >
                            ← 상위 공정표로
                        </button>
                        {canCreateTask && onStartAddTask && !isAddingTask && (
                            <button
                                onClick={onStartAddTask}
                                className="flex items-center gap-1 rounded px-2 py-1.5 text-xs font-medium transition-colors"
                                style={{
                                    backgroundColor: 'var(--gantt-focus)',
                                    color: 'var(--gantt-text-inverse)',
                                }}
                                title="새 공정 추가"
                            >
                                + Task 추가
                            </button>
                        )}
                    </>
                ) : (
                    <>
                        {canCreateTask && onStartAddCP && !isAddingCP && (
                            <button
                                onClick={onStartAddCP}
                                className="flex items-center gap-1 rounded px-2 py-1.5 text-xs font-medium transition-colors"
                                style={{
                                    backgroundColor: 'var(--gantt-focus)',
                                    color: 'var(--gantt-text-inverse)',
                                }}
                                title="새 CP 추가"
                            >
                                + CP 추가
                            </button>
                        )}
                        {canCreateMilestone && onStartAddMilestone && (
                            <button
                                onClick={onStartAddMilestone}
                                className="flex items-center gap-1 rounded px-2 py-1.5 text-xs font-medium transition-colors"
                                style={{
                                    backgroundColor: 'var(--gantt-milestone-detail)',
                                    color: 'var(--gantt-text-inverse)',
                                }}
                                title="새 마일스톤 추가"
                            >
                                + 마일스톤
                            </button>
                        )}
                        {isAddingCP && (
                            <span className="text-xs italic" style={{ color: 'var(--gantt-text-muted)' }}>
                                CP 추가 중... (Enter 저장 / Esc 취소)
                            </span>
                        )}
                    </>
                )}
            </div>

            {/* 중앙: 펼치기/접기 + Focusing 버튼 + 줌 컨트롤 + 기준일 */}
            <div className="flex items-center gap-4">
                {(onCollapseAll || onExpandAll) && (
                    <div
                        className="flex rounded p-0.5 gap-0.5"
                        style={{ backgroundColor: 'var(--gantt-bg-tertiary)' }}
                    >
                        {onExpandAll && (
                            <button
                                onClick={onExpandAll}
                                className="flex items-center gap-1 rounded px-2 py-1 text-xs font-medium transition-colors"
                                style={{ color: 'var(--gantt-text-secondary)' }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = 'var(--gantt-bg-hover)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = 'transparent';
                                }}
                                title="모든 그룹 펼치기"
                            >
                                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                </svg>
                                펼치기
                            </button>
                        )}
                        {onCollapseAll && (
                            <button
                                onClick={onCollapseAll}
                                className="flex items-center gap-1 rounded px-2 py-1 text-xs font-medium transition-colors"
                                style={{ color: 'var(--gantt-text-secondary)' }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = 'var(--gantt-bg-hover)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = 'transparent';
                                }}
                                title="모든 그룹 접기"
                            >
                                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                                </svg>
                                접기
                            </button>
                        )}
                    </div>
                )}

                <button
                    onClick={onScrollToFirst}
                    className="flex items-center gap-1 rounded px-2 py-1 text-xs font-medium transition-colors"
                    style={{
                        backgroundColor: 'var(--gantt-bg-tertiary)',
                        color: 'var(--gantt-text-secondary)',
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--gantt-bg-hover)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--gantt-bg-tertiary)';
                    }}
                    title={viewMode === 'MASTER' ? '진행 중인 CP로 스크롤' : '진행 중인 작업으로 스크롤'}
                >
                    Focusing
                </button>

                <div
                    className="flex rounded p-1"
                    style={{ backgroundColor: 'var(--gantt-bg-tertiary)' }}
                >
                    {(viewMode === 'MASTER'
                        ? (['WEEK', 'MONTH'] as const)
                        : (['DAY', 'WEEK'] as const)
                    ).map((level) => (
                        <button
                            key={level}
                            onClick={() => onZoomChange(level)}
                            className="rounded px-3 py-1 text-xs font-medium transition-colors"
                            style={{
                                backgroundColor: zoomLevel === level ? 'var(--gantt-bg-primary)' : 'transparent',
                                color: zoomLevel === level ? 'var(--gantt-text-primary)' : 'var(--gantt-text-muted)',
                                boxShadow: zoomLevel === level ? '0 1px 2px rgba(0,0,0,0.1)' : 'none',
                            }}
                        >
                            {ZOOM_CONFIG[level].label}
                        </button>
                    ))}
                </div>

                <div className="text-sm" style={{ color: 'var(--gantt-text-muted)' }}>
                    기준일: {format(new Date(), 'yyyy-MM-dd')}
                </div>
            </div>

            {/* 오른쪽: 저장/초기화 버튼 */}
            <div className="flex items-center gap-2">
                {onSave && (
                    <button
                        onClick={onSave}
                        disabled={!hasUnsavedChanges || saveStatus === 'saving'}
                        className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors"
                        style={{
                            backgroundColor: hasUnsavedChanges ? 'var(--gantt-focus)' : 'var(--gantt-bg-tertiary)',
                            color: hasUnsavedChanges ? 'var(--gantt-text-inverse)' : 'var(--gantt-text-muted)',
                            cursor: hasUnsavedChanges ? 'pointer' : 'not-allowed',
                        }}
                    >
                        {saveStatus === 'saving' ? (
                            <>
                                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                저장 중...
                            </>
                        ) : (
                            <>
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                                </svg>
                                저장
                            </>
                        )}
                    </button>
                )}

                {onReset && (
                    <button
                        onClick={onReset}
                        className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors"
                        style={{
                            backgroundColor: 'var(--gantt-bg-tertiary)',
                            color: 'var(--gantt-text-secondary)',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'var(--gantt-bg-hover)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'var(--gantt-bg-tertiary)';
                        }}
                    >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        초기화
                    </button>
                )}

                {(onExport || onImport) && (
                    <div
                        className="h-6 w-px"
                        style={{ backgroundColor: 'var(--gantt-border)' }}
                    />
                )}

                {onExport && (
                    <button
                        onClick={onExport}
                        className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors"
                        style={{
                            backgroundColor: 'var(--gantt-success)',
                            color: 'var(--gantt-text-inverse)',
                        }}
                        title="현재 데이터를 JSON 파일로 내보내기"
                    >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        내보내기
                    </button>
                )}

                {onImport && (
                    <label
                        className="flex cursor-pointer items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors"
                        style={{
                            backgroundColor: 'var(--gantt-milestone-detail)',
                            color: 'var(--gantt-text-inverse)',
                        }}
                    >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                        가져오기
                        <input
                            type="file"
                            accept=".json"
                            className="hidden"
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file && onImport) {
                                    onImport(file);
                                    e.target.value = '';
                                }
                            }}
                        />
                    </label>
                )}
            </div>
        </header>
    );
};
