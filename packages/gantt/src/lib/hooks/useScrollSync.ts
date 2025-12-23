/**
 * useScrollSync - 두 스크롤 컨테이너의 수평 스크롤 동기화 훅
 *
 * Detail View에서 FixedHeader와 ScrollableBody의 수평 스크롤을 동기화합니다.
 * requestAnimationFrame을 사용하여 성능을 최적화합니다.
 */

import { useEffect, useRef, RefObject } from 'react';

interface UseScrollSyncOptions {
    /** 고정 헤더 영역의 ref */
    headerRef: RefObject<HTMLDivElement | null>;
    /** 스크롤 가능한 본문 영역의 ref */
    bodyRef: RefObject<HTMLDivElement | null>;
    /** 동기화 활성화 여부 */
    enabled: boolean;
}

export function useScrollSync({
    headerRef,
    bodyRef,
    enabled,
}: UseScrollSyncOptions) {
    // 스크롤 이벤트 소스 추적 (무한 루프 방지)
    const isScrollingRef = useRef<'header' | 'body' | null>(null);
    const rafIdRef = useRef<number | null>(null);

    useEffect(() => {
        if (!enabled) return;

        const headerEl = headerRef.current;
        const bodyEl = bodyRef.current;

        if (!headerEl || !bodyEl) return;

        const syncScroll = (source: 'header' | 'body') => {
            // 이미 다른 소스에서 스크롤 중이면 무시
            if (isScrollingRef.current && isScrollingRef.current !== source) {
                return;
            }

            isScrollingRef.current = source;

            // 이전 RAF 취소
            if (rafIdRef.current) {
                cancelAnimationFrame(rafIdRef.current);
            }

            rafIdRef.current = requestAnimationFrame(() => {
                const sourceEl = source === 'header' ? headerEl : bodyEl;
                const targetEl = source === 'header' ? bodyEl : headerEl;

                if (targetEl.scrollLeft !== sourceEl.scrollLeft) {
                    targetEl.scrollLeft = sourceEl.scrollLeft;
                }

                // 스크롤 완료 후 상태 초기화
                requestAnimationFrame(() => {
                    isScrollingRef.current = null;
                });
            });
        };

        const handleHeaderScroll = () => syncScroll('header');
        const handleBodyScroll = () => syncScroll('body');

        headerEl.addEventListener('scroll', handleHeaderScroll, { passive: true });
        bodyEl.addEventListener('scroll', handleBodyScroll, { passive: true });

        return () => {
            headerEl.removeEventListener('scroll', handleHeaderScroll);
            bodyEl.removeEventListener('scroll', handleBodyScroll);

            if (rafIdRef.current) {
                cancelAnimationFrame(rafIdRef.current);
            }
        };
    }, [headerRef, bodyRef, enabled]);

    // 프로그래매틱 스크롤 함수 (외부에서 스크롤 위치 설정 시 사용)
    const scrollTo = (scrollLeft: number) => {
        const headerEl = headerRef.current;
        const bodyEl = bodyRef.current;

        if (headerEl) headerEl.scrollLeft = scrollLeft;
        if (bodyEl) bodyEl.scrollLeft = scrollLeft;
    };

    return { scrollTo };
}
