import { BulletinContext } from "@lib/hooks/useBulletin";
import { container, item } from "@lib/constants";
import { memo, useContext } from "react";
import { motion } from "motion/react";
import { SidebarClub, SidebarCompany } from "./SidebarItem";
import UserContext from "@lib/UserContext";

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
  if (isLoading) {
    return <EventListSkeleton />;
  }

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
});
