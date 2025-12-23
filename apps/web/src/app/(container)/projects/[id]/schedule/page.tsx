'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  GanttChart,
  ThemeProvider,
  ConstructionTask,
  Milestone,
  AnchorDependency,
  DataService,
  createLocalStorageService,
  KOREAN_HOLIDAYS_ALL,
} from '@contech/gantt';
import '@contech/gantt/style.css';

interface SchedulePageProps {
  params: Promise<{ id: string }>;
}

export default function SchedulePage({ params }: SchedulePageProps) {
  const [projectId, setProjectId] = useState<string | null>(null);
  const [tasks, setTasks] = useState<ConstructionTask[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [anchorDeps, setAnchorDeps] = useState<AnchorDependency[]>([]);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [loading, setLoading] = useState(true);

  const serviceRef = useRef<DataService | null>(null);

  // Resolve params
  useEffect(() => {
    params.then((p) => setProjectId(p.id));
  }, [params]);

  // Initialize data service
  useEffect(() => {
    if (!projectId) return;

    const initializeData = async () => {
      setLoading(true);

      // Create LocalStorage service with project-specific key
      const service = createLocalStorageService({
        storagePrefix: `schedule-${projectId}`,
      });
      serviceRef.current = service;

      // Load saved data
      const savedData = await service.loadAll();

      if (savedData.tasks.length > 0) {
        setTasks(savedData.tasks);
        setMilestones(savedData.milestones);
        setAnchorDeps(savedData.dependencies || []);
      } else {
        // Initialize with default data
        setTasks(getDefaultTasks());
        setMilestones(getDefaultMilestones());
      }

      setLoading(false);
    };

    initializeData();
  }, [projectId]);

  // Auto-save on changes (3 second debounce)
  useEffect(() => {
    if (!hasUnsavedChanges || !serviceRef.current) return;

    const timeoutId = setTimeout(async () => {
      await handleSave();
    }, 3000);

    return () => clearTimeout(timeoutId);
  }, [tasks, milestones, anchorDeps, hasUnsavedChanges]);

  // Save handler
  const handleSave = useCallback(async () => {
    if (!serviceRef.current) return;

    setSaveStatus('saving');
    try {
      await serviceRef.current.saveAll({
        tasks,
        milestones,
        dependencies: anchorDeps,
      });
      setSaveStatus('saved');
      setHasUnsavedChanges(false);

      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      console.error('Save failed:', error);
      setSaveStatus('idle');
    }
  }, [tasks, milestones, anchorDeps]);

  // Reset handler
  const handleReset = useCallback(async () => {
    if (!confirm('모든 변경사항을 삭제하고 초기 상태로 되돌리시겠습니까?')) {
      return;
    }

    if (serviceRef.current) {
      await serviceRef.current.reset();
    }

    setTasks(getDefaultTasks());
    setMilestones(getDefaultMilestones());
    setAnchorDeps([]);
    setHasUnsavedChanges(false);
  }, []);

  // Export handler
  const handleExport = useCallback(async () => {
    if (!serviceRef.current) return;

    const json = await serviceRef.current.exportToJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `schedule-${projectId}-${new Date().toISOString().split('T')[0]}.json`;
    a.click();

    URL.revokeObjectURL(url);
  }, [projectId]);

  // Import handler
  const handleImport = useCallback(async (file: File) => {
    if (!serviceRef.current) return;

    try {
      const text = await file.text();
      const data = await serviceRef.current.importFromJSON(text);

      setTasks(data.tasks);
      setMilestones(data.milestones);
      setAnchorDeps(data.dependencies || []);
    } catch (error) {
      console.error('Import failed:', error);
      alert('파일 가져오기에 실패했습니다.');
    }
  }, []);

  // Task update handler
  const handleTaskUpdate = useCallback((task: ConstructionTask) => {
    setTasks((prev) => prev.map((t) => (t.id === task.id ? task : t)));
    setHasUnsavedChanges(true);
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-lg">공정표 로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full">
      <ThemeProvider defaultTheme="light">
        <GanttChart
          tasks={tasks}
          milestones={milestones}
          anchorDependencies={anchorDeps}
          holidays={KOREAN_HOLIDAYS_ALL}
          calendarSettings={{
            workOnSaturdays: true,
            workOnSundays: false,
            workOnHolidays: false,
          }}
          // Save/Reset
          onSave={handleSave}
          onReset={handleReset}
          hasUnsavedChanges={hasUnsavedChanges}
          saveStatus={saveStatus}
          // Export/Import
          onExport={handleExport}
          onImport={handleImport}
          // Events
          onTaskUpdate={handleTaskUpdate}
          onMilestoneUpdate={(ms) => {
            setMilestones((prev) => prev.map((m) => (m.id === ms.id ? ms : m)));
            setHasUnsavedChanges(true);
          }}
          onAnchorDependencyCreate={(dep) => {
            setAnchorDeps((prev) => [...prev, dep]);
            setHasUnsavedChanges(true);
          }}
          onAnchorDependencyDelete={(depId) => {
            setAnchorDeps((prev) => prev.filter((d) => d.id !== depId));
            setHasUnsavedChanges(true);
          }}
          initialView="DETAIL"
          initialZoomLevel="DAY"
        />
      </ThemeProvider>
    </div>
  );
}

// Default tasks for new projects
function getDefaultTasks(): ConstructionTask[] {
  return [
    {
      id: 'group-1',
      parentId: null,
      wbsLevel: 2,
      type: 'GROUP',
      name: '1. 가설공사',
      startDate: new Date(2025, 0, 6),
      endDate: new Date(2025, 1, 28),
      group: { progress: 0 },
      dependencies: [],
      isExpanded: true,
    },
    {
      id: 'task-1',
      parentId: 'group-1',
      wbsLevel: 2,
      type: 'TASK',
      name: '가설울타리 설치',
      startDate: new Date(2025, 0, 6),
      endDate: new Date(2025, 0, 17),
      task: {
        netWorkDays: 8,
        indirectWorkDaysPre: 1,
        indirectWorkDaysPost: 1,
      },
      dependencies: [],
    },
    {
      id: 'task-2',
      parentId: 'group-1',
      wbsLevel: 2,
      type: 'TASK',
      name: '현장사무소 설치',
      startDate: new Date(2025, 0, 13),
      endDate: new Date(2025, 0, 24),
      task: {
        netWorkDays: 7,
        indirectWorkDaysPre: 2,
        indirectWorkDaysPost: 1,
      },
      dependencies: [
        { id: 'dep-1', predecessorId: 'task-1', type: 'SS', lag: 3 },
      ],
    },
  ];
}

// Default milestones for new projects
function getDefaultMilestones(): Milestone[] {
  return [
    {
      id: 'ms-1',
      date: new Date(2025, 0, 6),
      name: '착공',
      milestoneType: 'MASTER',
    },
  ];
}
