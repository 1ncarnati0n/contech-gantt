'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { ConstructionTask, TaskData } from '../types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogBody,
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogBody,
  AlertDialogAction,
  AlertDialogCancel,
  Button,
  Input,
  Checkbox,
  cn,
} from './ui';

// ============================================
// 내부 컴포넌트: WorkDayInputRow
// ============================================
interface WorkDayInputRowProps {
  label: string;
  daysValue: string;
  nameValue?: string;
  onDaysChange: React.Dispatch<React.SetStateAction<string>>;
  onNameChange?: (value: string) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  onNumberChange: (setter: React.Dispatch<React.SetStateAction<string>>, value: string) => void;
  daysInputRef?: React.RefObject<HTMLInputElement | null>;
  variant?: 'blue' | 'red';
  showNameInput?: boolean;
}

const WorkDayInputRow: React.FC<WorkDayInputRowProps> = ({
  label,
  daysValue,
  nameValue = '',
  onDaysChange,
  onNameChange,
  onKeyDown,
  onNumberChange,
  daysInputRef,
  variant = 'blue',
  showNameInput = true,
}) => {
  const labelStyles = {
    blue: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    red: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  };

  return (
    <div className="flex items-center gap-3">
      <span
        className={cn(
          'w-20 shrink-0 rounded-md px-2 py-1.5 text-xs font-semibold text-center',
          labelStyles[variant]
        )}
      >
        {label}
      </span>
      <div className="flex flex-1 items-center gap-2">
        <Input
          ref={daysInputRef as React.RefObject<HTMLInputElement>}
          type="text"
          inputMode="decimal"
          value={daysValue}
          onChange={(e) => onNumberChange(onDaysChange, e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="0"
          className="w-20 text-center"
          endAdornment={<span className="text-xs">일</span>}
        />
        {showNameInput && onNameChange && (
          <Input
            type="text"
            value={nameValue}
            onChange={(e) => onNameChange(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="작업명 (선택사항)"
            className="flex-1"
          />
        )}
      </div>
    </div>
  );
};

// ============================================
// 삭제 확인 다이얼로그
// ============================================
interface DeleteConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskName: string;
  onConfirm: () => void;
}

const DeleteConfirmDialog: React.FC<DeleteConfirmDialogProps> = ({
  open,
  onOpenChange,
  taskName,
  onConfirm,
}) => (
  <AlertDialog open={open} onOpenChange={onOpenChange}>
    <AlertDialogContent>
      <AlertDialogHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
            <svg
              className="h-5 w-5 text-red-600 dark:text-red-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <div>
            <AlertDialogTitle>공정 삭제</AlertDialogTitle>
            <AlertDialogDescription>이 작업은 되돌릴 수 없습니다</AlertDialogDescription>
          </div>
        </div>
      </AlertDialogHeader>

      <AlertDialogBody>
        <div className="rounded-lg bg-red-50 dark:bg-red-900/20 p-4">
          <p className="text-sm mb-2 text-[var(--gantt-text-secondary)]">
            다음 공정을 삭제하시겠습니까?
          </p>
          <p className="flex items-center gap-2 text-sm font-semibold text-[var(--gantt-text-primary)]">
            <span className="h-2 w-2 rounded-full bg-red-500" />
            {taskName}
          </p>
        </div>
      </AlertDialogBody>

      <AlertDialogFooter>
        <AlertDialogCancel>취소</AlertDialogCancel>
        <AlertDialogAction onClick={onConfirm}>삭제</AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
);

// ============================================
// 메인 컴포넌트: TaskEditModal
// ============================================
interface TaskEditModalProps {
  task: ConstructionTask | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: ConstructionTask) => void;
  onDelete?: (taskId: string) => void;
}

/**
 * Task 편집 모달
 *
 * Task의 간접작업일/작업명과 순작업일을 편집할 수 있는 모달 컴포넌트입니다.
 * shadcn/ui Dialog 기반으로 접근성이 개선되었습니다.
 */
export const TaskEditModal: React.FC<TaskEditModalProps> = ({
  task,
  isOpen,
  onClose,
  onSave,
  onDelete,
}) => {
  // 일수 상태 (문자열로 관리하여 소수점 입력 허용)
  const [indirectWorkDaysPreStr, setIndirectWorkDaysPreStr] = useState('0');
  const [netWorkDaysStr, setNetWorkDaysStr] = useState('1');
  const [indirectWorkDaysPostStr, setIndirectWorkDaysPostStr] = useState('0');

  // 작업명 상태
  const [indirectWorkNamePre, setIndirectWorkNamePre] = useState('');
  const [indirectWorkNamePost, setIndirectWorkNamePost] = useState('');

  // 작업일 설정 상태 (기본값: 토요일 작업, 일요일/공휴일 휴무)
  const [saturdayOff, setSaturdayOff] = useState(false);
  const [sundayWork, setSundayWork] = useState(false);
  const [holidayWork, setHolidayWork] = useState(false);

  // 삭제 확인 다이얼로그
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // 시작일 상태
  const [startDateStr, setStartDateStr] = useState('');

  const preInputRef = useRef<HTMLInputElement>(null);

  // 문자열을 숫자로 파싱 (0.5 단위로 반올림)
  const parseToNumber = (str: string): number => {
    const parsed = parseFloat(str) || 0;
    return Math.round(parsed * 2) / 2;
  };

  // 숫자 값 계산용
  const indirectWorkDaysPre = parseToNumber(indirectWorkDaysPreStr);
  const netWorkDays = parseToNumber(netWorkDaysStr);
  const indirectWorkDaysPost = parseToNumber(indirectWorkDaysPostStr);

  // Task 데이터로 폼 초기화
  useEffect(() => {
    if (task && task.task && isOpen) {
      setIndirectWorkDaysPreStr(String(task.task.indirectWorkDaysPre));
      setNetWorkDaysStr(String(task.task.netWorkDays));
      setIndirectWorkDaysPostStr(String(task.task.indirectWorkDaysPost));
      setIndirectWorkNamePre(task.task.indirectWorkNamePre || '');
      setIndirectWorkNamePost(task.task.indirectWorkNamePost || '');

      setSaturdayOff(task.task.workOnSaturdays === false);
      setSundayWork(task.task.workOnSundays === true);
      setHolidayWork(task.task.workOnHolidays === true);

      setStartDateStr(format(task.startDate, 'yyyy-MM-dd'));
      setShowDeleteConfirm(false);

      // 모달 열릴 때 첫 입력란에 포커스
      setTimeout(() => {
        preInputRef.current?.focus();
      }, 100);
    }
  }, [task?.id, isOpen]);

  // 변경 감지: 현재 상태와 task props 비교
  const hasChanges = useMemo(() => {
    if (!task || !task.task || !isOpen) {
      return false;
    }

    const currentPre = parseToNumber(indirectWorkDaysPreStr);
    const currentNet = parseToNumber(netWorkDaysStr);
    const currentPost = parseToNumber(indirectWorkDaysPostStr);
    const currentStartDate = startDateStr;

    return (
      currentPre !== task.task.indirectWorkDaysPre ||
      currentNet !== task.task.netWorkDays ||
      currentPost !== task.task.indirectWorkDaysPost ||
      indirectWorkNamePre !== (task.task.indirectWorkNamePre || '') ||
      indirectWorkNamePost !== (task.task.indirectWorkNamePost || '') ||
      saturdayOff !== (task.task.workOnSaturdays === false) ||
      sundayWork !== (task.task.workOnSundays === true) ||
      holidayWork !== (task.task.workOnHolidays === true) ||
      currentStartDate !== format(task.startDate, 'yyyy-MM-dd')
    );
  }, [
    task,
    isOpen,
    indirectWorkDaysPreStr,
    netWorkDaysStr,
    indirectWorkDaysPostStr,
    indirectWorkNamePre,
    indirectWorkNamePost,
    saturdayOff,
    sundayWork,
    holidayWork,
    startDateStr,
  ]);

  const handleSave = () => {
    if (!task || !task.task) return;

    const newStartDate = startDateStr ? new Date(startDateStr + 'T00:00:00') : task.startDate;

    const updatedTaskData: TaskData = {
      ...task.task,
      indirectWorkDaysPre,
      netWorkDays,
      indirectWorkDaysPost,
      indirectWorkNamePre: indirectWorkNamePre.trim() || undefined,
      indirectWorkNamePost: indirectWorkNamePost.trim() || undefined,
      workOnSaturdays: saturdayOff ? false : undefined,
      workOnSundays: sundayWork ? true : undefined,
      workOnHolidays: holidayWork ? true : undefined,
    };

    const updatedTask: ConstructionTask = {
      ...task,
      startDate: newStartDate,
      task: updatedTaskData,
    };

    console.log('[TaskEditModal] Save button clicked:', updatedTask);
    onSave(updatedTask);
  };

  const handleDeleteConfirm = () => {
    if (task && onDelete) {
      onDelete(task.id);
    }
    setShowDeleteConfirm(false);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    }
  };

  const handleNumberChange = (
    setter: React.Dispatch<React.SetStateAction<string>>,
    value: string
  ) => {
    const cleaned = value.replace(/[^0-9.]/g, '');
    const parts = cleaned.split('.');
    const sanitized = parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : cleaned;
    setter(sanitized);
  };

  if (!task || !task.task) return null;

  const totalDays = indirectWorkDaysPre + netWorkDays + indirectWorkDaysPost;

  // 섹션 카드 스타일
  const SectionCard: React.FC<{ title: string; icon: string; children: React.ReactNode }> = ({
    title,
    icon,
    children,
  }) => (
    <div className="rounded-lg p-4 bg-[var(--gantt-bg-secondary)]">
      <h3 className="text-xs font-semibold uppercase tracking-wide mb-3 text-[var(--gantt-text-muted)]">
        {icon} {title}
      </h3>
      {children}
    </div>
  );

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>공정 설정</DialogTitle>
            <DialogDescription>{task.name}</DialogDescription>
          </DialogHeader>

          <DialogBody>
            {/* 시작일 섹션 */}
            <SectionCard title="시작일" icon="📅">
              <div className="flex items-center gap-3">
                <Input
                  type="date"
                  value={startDateStr}
                  onChange={(e) => setStartDateStr(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="w-44"
                />
                <span className="text-xs text-[var(--gantt-text-muted)]">→ 종료일 자동 계산</span>
              </div>
            </SectionCard>

            {/* 작업 기간 설정 섹션 */}
            <SectionCard title="작업 기간" icon="⏱️">
              <div className="space-y-3">
                <WorkDayInputRow
                  label="앞 간접"
                  daysValue={indirectWorkDaysPreStr}
                  nameValue={indirectWorkNamePre}
                  onDaysChange={setIndirectWorkDaysPreStr}
                  onNameChange={setIndirectWorkNamePre}
                  onKeyDown={handleKeyDown}
                  onNumberChange={handleNumberChange}
                  daysInputRef={preInputRef}
                  variant="blue"
                  showNameInput={true}
                />
                <WorkDayInputRow
                  label="순작업"
                  daysValue={netWorkDaysStr}
                  onDaysChange={setNetWorkDaysStr}
                  onKeyDown={handleKeyDown}
                  onNumberChange={handleNumberChange}
                  variant="red"
                  showNameInput={false}
                />
                <WorkDayInputRow
                  label="뒤 간접"
                  daysValue={indirectWorkDaysPostStr}
                  nameValue={indirectWorkNamePost}
                  onDaysChange={setIndirectWorkDaysPostStr}
                  onNameChange={setIndirectWorkNamePost}
                  onKeyDown={handleKeyDown}
                  onNumberChange={handleNumberChange}
                  variant="blue"
                  showNameInput={true}
                />
              </div>
            </SectionCard>

            {/* 작업일 설정 섹션 */}
            <SectionCard title="작업일 설정" icon="📆">
              <div className="flex flex-wrap gap-4">
                <Checkbox
                  label="토요일 휴무"
                  checked={saturdayOff}
                  onChange={(e) => setSaturdayOff(e.target.checked)}
                />
                <Checkbox
                  label="일요일 작업"
                  checked={sundayWork}
                  onChange={(e) => setSundayWork(e.target.checked)}
                />
                <Checkbox
                  label="공휴일 작업"
                  checked={holidayWork}
                  onChange={(e) => setHolidayWork(e.target.checked)}
                />
              </div>
            </SectionCard>

            {/* 총 일수 표시 */}
            <div
              className={cn(
                'flex items-center justify-between rounded-lg px-4 py-3',
                'bg-[var(--gantt-bg-tertiary)]',
                'border border-[var(--gantt-border)]'
              )}
            >
              <div className="flex items-center gap-2 text-sm text-[var(--gantt-text-secondary)]">
                <span className="font-medium text-blue-600">{indirectWorkDaysPre}</span>
                <span className="text-[var(--gantt-text-muted)]">+</span>
                <span className="font-medium text-red-600">{netWorkDays}</span>
                <span className="text-[var(--gantt-text-muted)]">+</span>
                <span className="font-medium text-blue-600">{indirectWorkDaysPost}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-[var(--gantt-text-muted)]">=</span>
                <span className="text-lg font-bold text-[var(--gantt-text-primary)]">
                  {totalDays}일
                </span>
              </div>
            </div>
          </DialogBody>

          <DialogFooter className="justify-between">
            {/* 삭제 버튼 (왼쪽) */}
            <div>
              {onDelete && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  <Trash2 className="h-4 w-4" />
                  삭제
                </Button>
              )}
            </div>

            {/* 저장/닫기 토글 버튼 (오른쪽) */}
            <Button
              variant={hasChanges ? 'primary' : 'secondary'}
              onClick={hasChanges ? handleSave : onClose}
            >
              {hasChanges ? '저장' : '닫기'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 삭제 확인 다이얼로그 */}
      <DeleteConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        taskName={task.name}
        onConfirm={handleDeleteConfirm}
      />
    </>
  );
};
