import { BulletinContext } from "@lib/hooks/useBulletin";
import { container, item, canAccessRecruiterData, type Event, type Member } from "@lib/constants";
import {
  SIDEBAR_PAGE_SIZE,
  sidebarPageForIndex,
  sidebarPageSlice,
} from "@lib/sidebarPage";
import { memo, useContext, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { SidebarClub, SidebarCompany } from "./SidebarItem";
import UserContext from "@lib/UserContext";

const MIN_SKELETON_DURATION_MS = 100;
const FADE_OUT_DURATION_MS = 300;

function EventListSkeleton() {
  return (
    <div className="flex flex-col gap-2 p-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className="h-[100px] shrink-0 rounded-lg bg-white/80 animate-pulse w-full"
          style={{ animationDelay: `${(i - 1) * 100}ms` }}
        />
      ))}
    </div>
  );
}

export const EventsList = memo(function ({
  setSelection,
  selection,
}: {
  setSelection: (selection: string) => void;
  selection: string;
}) {
  const { data, People, eventTimeFilter, forumMode, isLoading, portalMode } =
    useContext(BulletinContext);
  const { User } = useContext(UserContext);
  const showRecruiterList =
    portalMode === "recruiter" && canAccessRecruiterData(User?.role);
  const [showSkeleton, setShowSkeleton] = useState(isLoading);
  const [sidebarHasAnimated, setSidebarHasAnimated] = useState(false);
  const hasLoadedOnceRef = useRef(!isLoading);
  const skeletonStartRef = useRef<number | null>(isLoading ? Date.now() : null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isLoading) hasLoadedOnceRef.current = true;
  }, [isLoading]);

  useEffect(() => {
    // Keep the loaded sidebar mounted; only skeleton on the first fetch.
    if (isLoading && !hasLoadedOnceRef.current) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      setShowSkeleton(true);
      skeletonStartRef.current = Date.now();
    } else if (skeletonStartRef.current !== null) {
      const elapsed = Date.now() - skeletonStartRef.current;
      const remaining = Math.max(0, MIN_SKELETON_DURATION_MS - elapsed);

      timeoutRef.current = setTimeout(() => {
        setShowSkeleton(false);
        skeletonStartRef.current = null;
        timeoutRef.current = null;
      }, remaining);
    } else {
      setShowSkeleton(false);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [isLoading]);

  const fadeTransition = { duration: FADE_OUT_DURATION_MS / 1000 };
  const items: Array<Member | Event> = showRecruiterList ? (People ?? []) : (data ?? []);
  const rows = showRecruiterList ? People : data;
  const [page, setPage] = useState(1);
  const listRef = useRef<HTMLDivElement>(null);
  const rowsRef = useRef<typeof rows>(undefined);
  const selectionRef = useRef<string | null>(null);
  const slice = sidebarPageSlice(items, page, SIDEBAR_PAGE_SIZE);

  useEffect(() => {
    const listChanged = rowsRef.current !== rows;
    const selectionChanged = selectionRef.current !== selection;
    rowsRef.current = rows;
    selectionRef.current = selection;
    if (!rows?.length) {
      setPage(1);
      return;
    }

    const index = showRecruiterList
      ? (rows as Member[]).findIndex((person) => person.email === selection)
      : (rows as Event[]).findIndex((event) => String(event.id) === String(selection));

    if (listChanged) {
      setPage(index >= 0 ? sidebarPageForIndex(index, SIDEBAR_PAGE_SIZE) : 1);
      return;
    }
    if (selectionChanged && index >= 0) {
      setPage(sidebarPageForIndex(index, SIDEBAR_PAGE_SIZE));
    }
  }, [rows, selection, showRecruiterList]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: 0 });
  }, [slice.page]);

  const renderContent = () => {
    if (portalMode === "recruiter" && !showRecruiterList) {
      return (
        <p className="px-4 py-6 text-center text-sm text-slate-600">
          Log in with an approved recruiter account to browse candidates.
        </p>
      );
    }
    if (showRecruiterList) {
      return (
        <motion.div
          key={`company-${forumMode}-${eventTimeFilter}`}
          className="flex flex-col"
          variants={{ ...container, show: { opacity: 1, transition: { staggerChildren: 0.06 } } }}
          initial={sidebarHasAnimated ? false : "hidden"}
          animate="show"
          onAnimationComplete={() => setSidebarHasAnimated(true)}
        >
          {(slice.items as Member[]).map((daton) => (
            <motion.div key={daton.email} variants={item}>
              <SidebarCompany {...{ daton, setSelection, selection }} />
            </motion.div>
          ))}
        </motion.div>
      );
    }
    if (!data || data.length === 0) {
      return (
        <p className="px-4 py-6 text-center text-sm text-slate-600">
          {forumMode
            ? "There are no forum posts right now. Please check back later!"
            : eventTimeFilter === "current"
              ? "There are no upcoming events right now. Please check back later!"
              : "There are no past events right now. Please check back later!"}
        </p>
      );
    }
    return (
      <motion.div
        key={`events-${forumMode}-${eventTimeFilter}`}
        className="flex flex-col"
        variants={{ ...container, show: { opacity: 1, transition: { staggerChildren: 0.06 } } }}
        initial={sidebarHasAnimated ? false : "hidden"}
        animate="show"
        onAnimationComplete={() => setSidebarHasAnimated(true)}
      >
        {(slice.items as Event[]).map((daton) => (
          <motion.div key={daton.id} variants={item}>
            <SidebarClub {...{ daton, setSelection, selection }} />
          </motion.div>
        ))}
      </motion.div>
    );
  };

  return (
    <div ref={listRef} className="h-full min-h-0 overflow-y-auto">
      <AnimatePresence mode="wait">
        {showSkeleton ? (
          <motion.div
            key="skeleton"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={fadeTransition}
          >
            <EventListSkeleton />
          </motion.div>
        ) : (
          <motion.div
            key="content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={fadeTransition}
          >
            {renderContent()}
          </motion.div>
        )}
      </AnimatePresence>
      {!showSkeleton && items.length > SIDEBAR_PAGE_SIZE && (
        <div className="flex items-center justify-between gap-1 px-2 py-2">
          <button
            type="button"
            className="rounded px-2 py-1 text-xs font-medium text-slate-700 disabled:opacity-40"
            onClick={() => setPage(slice.page - 1)}
            disabled={slice.page <= 1}
            aria-label="Previous page"
          >
            Prev
          </button>
          <span className="text-xs text-slate-600">
            {slice.start}–{slice.end} of {items.length}
          </span>
          <button
            type="button"
            className="rounded px-2 py-1 text-xs font-medium text-slate-700 disabled:opacity-40"
            onClick={() => setPage(slice.page + 1)}
            disabled={slice.page >= slice.totalPages}
            aria-label="Next page"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
});
