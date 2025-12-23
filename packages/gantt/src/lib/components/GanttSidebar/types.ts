import type { ConstructionTask, ViewMode, DropPosition, CalendarSettings, CriticalPathSummary } from '../../types';
import type { VirtualRow } from '../../hooks/useGanttVirtualization';

export interface ColumnConfig {
    id: string;
    label: string;
    width: number;
    minWidth: number;
}

export interface GanttSidebarProps {
    tasks: ConstructionTask[];
    allTasks: ConstructionTask[];
    viewMode: ViewMode;
    expandedIds: Set<string>;
    onToggle: (taskId: string) => void;
    onTaskClick: (task: ConstructionTask) => void;
    onTaskUpdate?: (task: ConstructionTask) => void;
    onTaskCreate?: (task: Partial<ConstructionTask>) => void | Promise<void>;
    onTaskReorder?: (taskId: string, newIndex: number) => void;
    activeCPId?: string | null;
    holidays?: Date[];
    calendarSettings?: CalendarSettings;
    virtualRows?: VirtualRow[];
    totalHeight?: number;
    onTotalWidthChange?: (width: number) => void;
    onTaskGroup?: (taskIds: string[]) => void;
    onTaskUngroup?: (groupId: string) => void;
    onTaskDelete?: (taskId: string) => void;
    onTaskMove?: (taskId: string, targetId: string, position: DropPosition) => void;
    isAddingTask?: boolean;
    onCancelAddTask?: () => void;
    isAddingCP?: boolean;
    onCancelAddCP?: () => void;
    onTaskDoubleClick?: (task: ConstructionTask) => void;
}

export interface SidebarHeaderProps {
    viewMode: ViewMode;
    activeGroupName?: string;
    activeCPName?: string;
    columns: ColumnConfig[];
    resizingIndex: number | null;
    selectedTaskIds: Set<string>;
    tasks: ConstructionTask[];
    onColumnResizeStart: (e: React.MouseEvent, columnIndex: number) => void;
    onColumnResizeDoubleClick: (e: React.MouseEvent, columnIndex: number) => void;
    onTaskGroup?: (taskIds: string[]) => void;
    onTaskUngroup?: (groupId: string) => void;
    onClearSelection: () => void;
}

export interface SidebarRowProps {
    task: ConstructionTask;
    rowIndex: number;
    isVirtualized: boolean;
    rowStart: number;
    isDragging: boolean;
    isDragOver: boolean;
    dragOverPosition: DropPosition | null;
    isSelected: boolean;
    isFocused: boolean;           // 키보드 포커스 상태
    isExpanded: boolean;
    canExpand: boolean;
    indent: number;
    isGroup: boolean;
    // Drag handlers
    onDragStart: (e: React.DragEvent, taskId: string) => void;
    onDragOver: (e: React.DragEvent, taskId: string, isGroup: boolean) => void;
    onDragLeave: () => void;
    onDrop: (e: React.DragEvent, taskId: string) => void;
    onDragEnd: () => void;
    // Click handlers
    onRowClick: (e: React.MouseEvent, task: ConstructionTask, rowIndex: number) => void;
    onContextMenu: (e: React.MouseEvent, task: ConstructionTask) => void;
    onToggle: (taskId: string) => void;
    // Edit handlers
    editingTaskId: string | null;
    editingName: string;
    setEditingName: (name: string) => void;
    editInputRef: React.RefObject<HTMLInputElement | null>;
    onStartEdit: (task: ConstructionTask) => void;
    onSaveEdit: () => void;
    onEditKeyDown: (e: React.KeyboardEvent) => void;
    // Props
    columns: ColumnConfig[];
    dragHandleWidth: number;
    onTaskReorder?: (taskId: string, newIndex: number) => void;
    onTaskMove?: (taskId: string, targetId: string, position: DropPosition) => void;
    onTaskUpdate?: (task: ConstructionTask) => void;
}

export interface SidebarRowMasterProps extends SidebarRowProps {
    cpSummary: CriticalPathSummary | null;
    onTaskClick: (task: ConstructionTask) => void;
}

export interface SidebarRowDetailProps extends SidebarRowProps {
    onTaskDoubleClick?: (task: ConstructionTask) => void;
    editingDays: { taskId: string; field: string; value: string } | null;
    setEditingDays: (state: { taskId: string; field: string; value: string } | null) => void;
    onDurationChange: (task: ConstructionTask, field: 'indirectWorkDaysPre' | 'netWorkDays' | 'indirectWorkDaysPost', value: number) => void;
}

export interface DaysInputCellProps {
    task: ConstructionTask;
    field: 'indirectWorkDaysPre' | 'netWorkDays' | 'indirectWorkDaysPost';
    editingDays: { taskId: string; field: string; value: string } | null;
    setEditingDays: (state: { taskId: string; field: string; value: string } | null) => void;
    onDurationChange: (task: ConstructionTask, field: 'indirectWorkDaysPre' | 'netWorkDays' | 'indirectWorkDaysPost', value: number) => void;
    width: number;
}
