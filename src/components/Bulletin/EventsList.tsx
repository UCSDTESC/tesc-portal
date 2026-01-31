import { BulletinContext } from "@lib/hooks/useBulletin";
import { container, item } from "@lib/constants";
import { memo, useContext, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { SidebarClub, SidebarCompany } from "./SidebarItem";
import UserContext from "@lib/UserContext";

const MIN_SKELETON_DURATION_MS = 500;
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
  const { data, People, eventTimeFilter, isLoading } = useContext(BulletinContext);
  const { User } = useContext(UserContext);
  const [showSkeleton, setShowSkeleton] = useState(isLoading);
  const skeletonStartRef = useRef<number | null>(isLoading ? Date.now() : null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (isLoading) {
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

  const renderContent = () => {
    if (User?.role === "company") {
      return (
        <motion.div
          className="flex flex-col"
          variants={{ ...container, show: { opacity: 1, transition: { staggerChildren: 0.06 } } }}
          initial="hidden"
          animate="show"
        >
          {People?.map((daton) => (
            <motion.div key={daton.email} variants={item}>
              <SidebarCompany {...{ daton, setSelection, selection }} />
            </motion.div>
          ))}
        </motion.div>
      );
    }
    if (eventTimeFilter === "current" && (!data || data.length === 0)) {
      return (
        <p className="px-4 py-6 text-center text-sm text-slate-600">
          There are no upcoming events right now. Please check back later!
        </p>
      );
    }
    return (
      <motion.div
        className="flex flex-col"
        variants={{ ...container, show: { opacity: 1, transition: { staggerChildren: 0.06 } } }}
        initial="hidden"
        animate="show"
      >
        {data?.map((daton) => (
          <motion.div key={daton.id} variants={item}>
            <SidebarClub {...{ daton, setSelection, selection }} />
          </motion.div>
        ))}
      </motion.div>
    );
  };

  return (
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
  );
});
