'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { Milestone, MilestoneType } from '../types';
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
  Label,
  cn,
} from './ui';

// ============================================
// 삭제 확인 다이얼로그
// ============================================
interface DeleteConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  milestoneName: string;
  onConfirm: () => void;
}

const DeleteConfirmDialog: React.FC<DeleteConfirmDialogProps> = ({
  open,
  onOpenChange,
  milestoneName,
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
            <AlertDialogTitle>마일스톤 삭제</AlertDialogTitle>
            <AlertDialogDescription>이 작업은 되돌릴 수 없습니다</AlertDialogDescription>
          </div>
        </div>
      </AlertDialogHeader>

      <AlertDialogBody>
        <div className="rounded-lg bg-red-50 dark:bg-red-900/20 p-4">
          <p className="text-sm mb-2 text-[var(--gantt-text-secondary)]">
            다음 마일스톤을 삭제하시겠습니까?
          </p>
          <p className="flex items-center gap-2 text-sm font-semibold text-[var(--gantt-text-primary)]">
            <span className="h-2 w-2 rounded-full bg-purple-500" />
            {milestoneName}
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
// 섹션 카드 컴포넌트
// ============================================
const SectionCard: React.FC<{
  title: string;
  icon: string;
  children: React.ReactNode;
}> = ({ title, icon, children }) => (
  <div className="rounded-lg p-4 bg-[var(--gantt-bg-secondary)]">
    <h3 className="text-xs font-semibold uppercase tracking-wide mb-3 text-[var(--gantt-text-muted)]">
      {icon} {title}
    </h3>
    {children}
  </div>
);

// ============================================
// 메인 컴포넌트: MilestoneEditModal
// ============================================
interface MilestoneEditModalProps {
  milestone: Milestone | null;
  isOpen: boolean;
  isNew?: boolean;
  onClose: () => void;
  onSave: (milestone: Milestone) => void;
  onDelete?: (milestoneId: string) => void;
}

/**
 * 마일스톤 편집 모달
 *
 * 마일스톤의 이름, 설명, 날짜를 편집할 수 있는 모달 컴포넌트입니다.
 * shadcn/ui Dialog 기반으로 접근성이 개선되었습니다.
 */
export const MilestoneEditModal: React.FC<MilestoneEditModalProps> = ({
  milestone,
  isOpen,
  isNew = false,
  onClose,
  onSave,
  onDelete,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [dateStr, setDateStr] = useState('');
  const [milestoneType, setMilestoneType] = useState<MilestoneType>('MASTER');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // 마일스톤 데이터로 폼 초기화
  useEffect(() => {
    if (milestone && isOpen) {
      setName(milestone.name);
      setDescription(milestone.description || '');
      setDateStr(format(milestone.date, 'yyyy-MM-dd'));
      setMilestoneType(milestone.milestoneType || 'MASTER');
      setShowDeleteConfirm(false);
    }
  }, [milestone, isOpen]);

  // 변경 감지: 현재 상태와 milestone props 비교
  const hasChanges = useMemo(() => {
    if (!milestone || !isOpen) return false;

    return (
      name !== milestone.name ||
      description !== (milestone.description || '') ||
      dateStr !== format(milestone.date, 'yyyy-MM-dd') ||
      milestoneType !== (milestone.milestoneType || 'MASTER')
    );
  }, [milestone, isOpen, name, description, dateStr, milestoneType]);

  const handleSave = () => {
    if (!milestone || !name.trim()) return;

    const updatedMilestone: Milestone = {
      ...milestone,
      name: name.trim(),
      description: description.trim() || undefined,
      date: new Date(dateStr),
      milestoneType,
    };

    onSave(updatedMilestone);
  };

  const handleDeleteConfirm = () => {
    if (milestone && onDelete) {
      onDelete(milestone.id);
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

  if (!milestone) return null;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{isNew ? '새 마일스톤' : '마일스톤 설정'}</DialogTitle>
            {!isNew && <DialogDescription>{milestone.name}</DialogDescription>}
          </DialogHeader>

          <DialogBody>
            {/* 기본 정보 섹션 */}
            <SectionCard title="기본 정보" icon="📌">
              <div className="space-y-4">
                {/* 이름 */}
                <div className="space-y-2">
                  <Label htmlFor="milestone-name">마일스톤 이름</Label>
                  <Input
                    id="milestone-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="마일스톤 이름을 입력하세요"
                    autoFocus
                  />
                </div>

                {/* 날짜 */}
                <div className="space-y-2">
                  <Label htmlFor="milestone-date">날짜</Label>
                  <Input
                    id="milestone-date"
                    type="date"
                    value={dateStr}
                    onChange={(e) => setDateStr(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="w-44"
                  />
                </div>
              </div>
            </SectionCard>

            {/* 표시 설정 섹션 */}
            <SectionCard title="표시 설정" icon="👁️">
              <div className="flex gap-3">
                {/* Master View 옵션 */}
                <label
                  className={cn(
                    'flex-1 flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all',
                    milestoneType === 'MASTER'
                      ? 'border-[var(--gantt-milestone)] bg-[var(--gantt-bg-tertiary)]'
                      : 'border-[var(--gantt-border)] bg-transparent hover:bg-[var(--gantt-bg-hover)]'
                  )}
                >
                  <input
                    type="radio"
                    name="milestoneType"
                    value="MASTER"
                    checked={milestoneType === 'MASTER'}
                    onChange={() => setMilestoneType('MASTER')}
                    className="h-4 w-4 text-gray-600 focus:ring-gray-500"
                  />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: 'var(--gantt-milestone)' }}
                      />
                      <span className="text-sm font-medium text-[var(--gantt-text-primary)]">
                        Master View
                      </span>
                    </div>
                    <p className="text-xs mt-0.5 text-[var(--gantt-text-muted)]">
                      전체 공정표에 표시
                    </p>
                  </div>
                </label>

                {/* Detail View 옵션 */}
                <label
                  className={cn(
                    'flex-1 flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all',
                    milestoneType === 'DETAIL'
                      ? 'border-[var(--gantt-milestone-detail)] bg-[color-mix(in_srgb,var(--gantt-milestone-detail)_15%,transparent)]'
                      : 'border-[var(--gantt-border)] bg-transparent hover:bg-[var(--gantt-bg-hover)]'
                  )}
                >
                  <input
                    type="radio"
                    name="milestoneType"
                    value="DETAIL"
                    checked={milestoneType === 'DETAIL'}
                    onChange={() => setMilestoneType('DETAIL')}
                    className="h-4 w-4 text-amber-500 focus:ring-amber-500"
                  />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: 'var(--gantt-milestone-detail)' }}
                      />
                      <span className="text-sm font-medium text-[var(--gantt-text-primary)]">
                        Detail View
                      </span>
                    </div>
                    <p className="text-xs mt-0.5 text-[var(--gantt-text-muted)]">
                      상세 공정표에 표시
                    </p>
                  </div>
                </label>
              </div>
            </SectionCard>

            {/* 설명 섹션 */}
            <SectionCard title="설명 (선택)" icon="📝">
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="마일스톤에 대한 설명을 입력하세요"
                rows={3}
                className={cn(
                  'w-full rounded-md border px-3 py-2 text-sm resize-none',
                  'bg-[var(--gantt-bg-primary)] border-[var(--gantt-border)] text-[var(--gantt-text-secondary)]',
                  'focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20'
                )}
              />
            </SectionCard>
          </DialogBody>

          <DialogFooter className="justify-between">
            {/* 삭제 버튼 (왼쪽, 기존 마일스톤만) */}
            <div>
              {!isNew && onDelete && (
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
              disabled={hasChanges && !name.trim()}
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
        milestoneName={name || milestone.name}
        onConfirm={handleDeleteConfirm}
      />
    </>
  );
};
