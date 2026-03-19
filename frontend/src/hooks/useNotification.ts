import { useEffect, useRef, useCallback } from 'react';
import type { PlanSummary, GitCommit } from '@/types';

interface UseNotificationOptions {
  projectName: string | null;
  timeline: GitCommit[];
  plan: PlanSummary | null;
}

export function useNotification({ projectName, timeline, plan }: UseNotificationOptions) {
  const prevTimelineLengthRef = useRef<number>(timeline.length);
  const prevProgressRef = useRef<number>(plan?.progressPercent ?? 0);
  const permissionRef = useRef<NotificationPermission>('default');
  const initializedRef = useRef(false);

  // Request permission on first call
  useEffect(() => {
    if (typeof Notification === 'undefined') return;
    permissionRef.current = Notification.permission;
    if (Notification.permission === 'default') {
      Notification.requestPermission().then((perm) => {
        permissionRef.current = perm;
      });
    }
  }, []);

  const sendNotification = useCallback((title: string, body: string) => {
    if (typeof Notification === 'undefined') return;
    if (permissionRef.current !== 'granted') return;
    try {
      new Notification(title, { body, icon: '/favicon.ico' });
    } catch {
      // Notification API not available
    }
  }, []);

  // Watch for new commits
  useEffect(() => {
    if (!initializedRef.current) {
      prevTimelineLengthRef.current = timeline.length;
      initializedRef.current = true;
      return;
    }

    const prevLen = prevTimelineLengthRef.current;
    if (timeline.length > prevLen && prevLen > 0) {
      const newCount = timeline.length - prevLen;
      const name = projectName ?? '프로젝트';
      sendNotification(
        `${name} - 새 커밋 감지`,
        `${newCount}개의 새로운 커밋이 추가되었습니다.`
      );
    }
    prevTimelineLengthRef.current = timeline.length;
  }, [timeline.length, projectName, sendNotification]);

  // Watch for plan progress changes
  useEffect(() => {
    if (!initializedRef.current) return;

    const currentProgress = plan?.progressPercent ?? 0;
    const prevProgress = prevProgressRef.current;

    if (currentProgress !== prevProgress && prevProgress > 0) {
      const name = projectName ?? '프로젝트';
      if (currentProgress > prevProgress) {
        sendNotification(
          `${name} - 진행률 업데이트`,
          `진행률이 ${prevProgress}%에서 ${currentProgress}%로 변경되었습니다.`
        );
      }
    }
    prevProgressRef.current = currentProgress;
  }, [plan?.progressPercent, projectName, sendNotification]);
}
