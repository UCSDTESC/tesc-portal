import { useContext, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useParams } from "react-router";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, Compass, MessagesSquare, Plus, Sparkles } from "lucide-react";

import UserContext from "@lib/UserContext";

import { BulletinContext, useBulletin } from "@lib/hooks/useBulletin";
import { useQrEventFlow } from "@lib/hooks/useQrEventFlow";
import { useEditModal } from "@lib/hooks/useEditModal";
import { formdata, PortalMode, type EventQuestion } from "@lib/constants";
import { compareEventsByRecency, parseEventTime } from "@lib/eventListOrder";
import type { EventQuestionAnswers } from "@lib/eventQuestions";
import PageHeader from "@components/shell/PageHeader";
import CheckBoxes from "./CheckBoxes";
import PortalToggle from "./PortalToggle";
import { EventsList } from "./EventsList";
import { SidebarClub } from "./SidebarItem";
import BulletinDisplay from "./BulletinDisplay";
import QrSlotPickerModal from "./QrSlotPickerModal";
import RegistrationQuestionsModal from "./RegistrationQuestionsModal";
import Form from "../adminUser/Form/Form";

type EventTimeFilter = "current" | "past";

export default function Bulletin() {
  const { User } = useContext(UserContext);
  const postId = useParams();
  const navigate = useNavigate();
  const [selection, setSelection] = useState<string>(String(postId.postId));
  const [eventTimeFilter, setEventTimeFilter] = useState<EventTimeFilter>("current");
  const [forumMode, setForumMode] = useState(false);
  const [portalMode, setPortalMode] = useState<PortalMode>("events");
  const [questionsModal, setQuestionsModal] = useState<{
    questions: EventQuestion[];
    initialAnswers: EventQuestionAnswers;
    submitLabel: string;
    onSubmit: (answers: EventQuestionAnswers) => Promise<void>;
  } | null>(null);
  const isRecruiterPortal = portalMode === "recruiter";
  const {
    data,
    People,
    isLoading,
    gradYears,
    tagFilters,
    rsvpByEvent,
    attendedByEvent,
    handleAttendance,
    handleRSVP,
    setTagFilters,
    setSearch,
    orgFilters,
    setOrgFilters,
    typeFilters,
    setTypeFilters,
    orgs,
    internalFilter,
    setInternalFilter,
    sortMethod,
    setSortMethod,
    fetchData,
    refreshEventView,
    applyUserRsvp,
    applyUserAttendance,
  } = useBulletin(User, portalMode, (url) => {
    window.open(url, "_blank", "noopener,noreferrer");
  });
  const {
    showEditModal,
    setShowEditModal,
    curID,
    currEdit,
    openEditModal,
    openCreateForumPostModal,
  } = useEditModal();

  // Sync selection with URL when navigating (e.g. direct link, browser back/forward)
  useEffect(() => {
    const id = String(postId.postId ?? "-1");
    setSelection(id);
  }, [postId.postId]);

  // Default portal mode when auth state changes
  useEffect(() => {
    if (User?.role === "company") {
      setPortalMode("recruiter");
    } else if (User?.id) {
      setPortalMode("events");
    }
  }, [User?.id, User?.role]);

  const handlePortalChange = (mode: PortalMode) => {
    setPortalMode(mode);
    setSelection("-1");
    if (mode === "events") {
      setForumMode(false);
      setTypeFilters([]);
    } else {
      setForumMode(false);
      setTypeFilters([]);
      setTagFilters([]);
      setOrgFilters([]);
    }
    navigate("/bulletin/-1");
  };

  // Auto-select Current/Past tab when loading an event from URL so it displays correctly
  useEffect(() => {
    if (isRecruiterPortal || !data) return;
    const eventId = postId.postId;
    if (!eventId || eventId === "-1") return;
    const event = data.find((e) => String(e.id) === String(eventId));
    if (event) {
      if (event.type === "forum") {
        setForumMode(true);
      } else {
        setForumMode(false);
        const now = Date.now();
        // Prefer end_date, but if it's missing/invalid, fall back to start_date.
        const endTime = parseEventTime(event.end_date) ?? parseEventTime(event.start_date);
        const isCurrent = endTime !== null ? endTime >= now : false;
        setEventTimeFilter(isCurrent ? "current" : "past"); // if we can't parse, treat as past
      }
    }
  }, [data, postId.postId, isRecruiterPortal]);

  const filteredData = useMemo(() => {
    if (!data || isRecruiterPortal) return data;
    const now = Date.now();
    const filtered = data.filter((event) => {
      if (forumMode) return event.type === "forum";
      // In Upcoming/Past mode, hide forum entries.
      if (event.type === "forum") return false;
      // Prefer end_date for classification; fall back to start_date when missing/invalid.
      const endTime = parseEventTime(event.end_date) ?? parseEventTime(event.start_date);
      const isCurrent = endTime !== null ? endTime >= now : false;
      return eventTimeFilter === "current" ? isCurrent : !isCurrent;
    });

    if (sortMethod === "Event Name (A-Z)") return filtered;

    return [...filtered].sort((a, b) => {
      if (forumMode) {
        return (parseEventTime(b.created_at) ?? 0) - (parseEventTime(a.created_at) ?? 0);
      }
      return compareEventsByRecency(a, b, eventTimeFilter);
    });
  }, [data, eventTimeFilter, forumMode, isRecruiterPortal, sortMethod]);

  const selectedEvent = useMemo(() => {
    if (!data || selection === "-1") return undefined;
    return data.find((e) => String(e.id) === String(selection));
  }, [data, selection]);

  const qrFlow = useQrEventFlow({
    eventId: selection,
    event: selectedEvent,
    rsvpSlotId: rsvpByEvent?.[selection],
    attendedSlotId: attendedByEvent?.[selection],
    onRefresh: refreshEventView,
    onRsvp: applyUserRsvp,
    onAttended: applyUserAttendance,
    onAsAttendanceForm: (url) => {
      window.open(url, "_blank", "noopener,noreferrer");
    },
  });

  const displayData = useMemo(() => {
    const base = filteredData ?? [];
    if (!qrFlow.activeEvent || selection === "-1") return base;
    if (base.some((e) => String(e.id) === String(selection))) return base;
    return [...base, qrFlow.activeEvent];
  }, [filteredData, qrFlow.activeEvent, selection]);

  // Featured card: the next upcoming event (soonest first in the sorted list).
  const featuredEvent = useMemo(() => {
    if (isRecruiterPortal || forumMode || eventTimeFilter !== "current") return undefined;
    return filteredData?.[0];
  }, [filteredData, forumMode, eventTimeFilter, isRecruiterPortal]);

  const goBackToDiscover = () => {
    setSelection("-1");
    navigate("/bulletin/-1");
  };

  return (
    <BulletinContext.Provider
      value={{
        data: displayData,
        isLoading,
        gradYears,
        People,
        tagFilters,
        rsvpByEvent,
        attendedByEvent,
        handleAttendance,
        handleRSVP,
        promptRegistrationQuestions: (options) => {
          setQuestionsModal({
            questions: options.questions,
            initialAnswers: options.initialAnswers ?? {},
            submitLabel: options.submitLabel ?? "Continue",
            onSubmit: async (answers) => {
              await options.onSubmit(answers);
              setQuestionsModal(null);
            },
          });
        },
        setTagFilters,
        setSearch,
        orgFilters,
        setOrgFilters,
        typeFilters,
        setTypeFilters,
        orgs,
        internalFilter,
        setInternalFilter,
        sortMethod,
        setSortMethod,
        portalMode,
        setPortalMode,
        eventTimeFilter,
        forumMode,
        openEditModal,
        showEditModal,
        setShowEditModal,
        qrBanner: qrFlow.banner,
      }}
    >
      <div className="font-DM">
        {selection !== "-1" ? (
          <div className="space-y-4">
            <button
              type="button"
              onClick={goBackToDiscover}
              className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-white px-3 py-2 text-sm font-medium text-ink-secondary shadow-sm transition-colors hover:bg-surface hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
            >
              <ArrowLeft className="h-4 w-4" />
              {isRecruiterPortal ? "Back to candidates" : "Back to Discover"}
            </button>
            <BulletinDisplay selection={selection} />
          </div>
        ) : (
          <div className="space-y-6">
            <PageHeader
              eyebrow="TESC Portal"
              title={isRecruiterPortal ? "Recruiter Portal" : "Discover"}
              subtitle={
                isRecruiterPortal
                  ? "Browse candidates from the TESC member resume bank."
                  : forumMode
                    ? "Discussions and announcements from the engineering community."
                    : "Find events, announcements, and opportunities from engineering orgs across campus."
              }
              actions={<PortalToggle portalMode={portalMode} onChange={handlePortalChange} />}
            />

            {!isRecruiterPortal && (
              <div className="flex flex-wrap items-center gap-3">
                <AnimatePresence mode="wait">
                  {!forumMode ? (
                    <motion.div
                      key="upPast"
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.25 }}
                      className="relative flex w-full max-w-[240px] items-center rounded-full border border-line bg-white p-1 shadow-sm"
                    >
                      <div
                        className="absolute bottom-1 top-1 rounded-full bg-navy-900 shadow-sm transition-transform duration-200 ease-out"
                        style={{
                          width: "calc(50% - 4px)",
                          left: "4px",
                          transform:
                            eventTimeFilter === "current" ? "translateX(0)" : "translateX(100%)",
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (eventTimeFilter !== "current") {
                            setEventTimeFilter("current");
                            setSelection("-1");
                            navigate("/bulletin/-1");
                          }
                        }}
                        className="relative z-10 flex flex-1 items-center justify-center rounded-full py-1.5 text-sm font-medium transition-colors duration-200"
                        style={{
                          color: eventTimeFilter === "current" ? "white" : "#5b6b80",
                        }}
                      >
                        Upcoming
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (eventTimeFilter !== "past") {
                            setEventTimeFilter("past");
                            setSelection("-1");
                            navigate("/bulletin/-1");
                          }
                        }}
                        className="relative z-10 flex flex-1 items-center justify-center rounded-full py-1.5 text-sm font-medium transition-colors duration-200"
                        style={{
                          color: eventTimeFilter === "past" ? "white" : "#5b6b80",
                        }}
                      >
                        Past
                      </button>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="forumPill"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 6 }}
                      transition={{ duration: 0.25 }}
                      className="relative flex w-full max-w-[240px] items-center rounded-full bg-navy-900 p-1 shadow-sm"
                      role="status"
                      aria-label="Forum"
                    >
                      <button
                        type="button"
                        className="absolute right-2 top-1/2 z-10 flex h-7 w-7 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-white text-navy-900 shadow-sm transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                        onClick={() => {
                          setSelection("-1");
                          openCreateForumPostModal();
                          navigate("/bulletin/-1");
                        }}
                        aria-label="Create forum post"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                      <div className="relative flex flex-1 items-center justify-center gap-1.5 rounded-full py-1.5 text-sm font-medium text-white">
                        <MessagesSquare className="h-4 w-4" />
                        Forum
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div
                  className="flex items-center rounded-full border border-line bg-white p-1 shadow-sm"
                  role="tablist"
                  aria-label="Bulletin mode"
                >
                  <button
                    type="button"
                    role="tab"
                    aria-selected={!forumMode}
                    onClick={() => {
                      if (forumMode) {
                        setForumMode(false);
                        setTypeFilters([]);
                        setSelection("-1");
                        navigate("/bulletin/-1");
                      }
                    }}
                    className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${
                      !forumMode
                        ? "bg-brand-50 text-brand-700"
                        : "text-ink-secondary hover:text-ink"
                    }`}
                  >
                    <Compass className="h-4 w-4" />
                    Events
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={forumMode}
                    onClick={() => {
                      if (!forumMode) {
                        setForumMode(true);
                        setTypeFilters(["forum"]);
                        setSelection("-1");
                        navigate("/bulletin/-1");
                      }
                    }}
                    className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${
                      forumMode
                        ? "bg-brand-50 text-brand-700"
                        : "text-ink-secondary hover:text-ink"
                    }`}
                  >
                    <MessagesSquare className="h-4 w-4" />
                    Forum
                  </button>
                </div>
              </div>
            )}

            {featuredEvent && (
              <section aria-label="Featured event">
                <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-brand-500">
                  <Sparkles className="h-3.5 w-3.5" />
                  Featured · Up next
                </p>
                <SidebarClub
                  daton={featuredEvent}
                  setSelection={setSelection}
                  selection={selection}
                  featured
                />
              </section>
            )}

            <CheckBoxes />

            <EventsList {...{ setSelection, selection }} />
          </div>
        )}
      </div>
      <QrSlotPickerModal
        open={qrFlow.showPicker}
        eventId={selection}
        eventTitle={qrFlow.activeEvent?.title ?? "Event"}
        slots={qrFlow.activeEvent?.slots ?? []}
        questions={qrFlow.activeEvent?.questions ?? []}
        userId={User?.id}
        flowState={qrFlow.flowState}
        initialSlotId={rsvpByEvent?.[selection]}
        rsvpRequired={Boolean(qrFlow.activeEvent?.rsvp_required)}
        onConfirm={qrFlow.handleSlotConfirm}
        onClose={qrFlow.closePicker}
      />
      <RegistrationQuestionsModal
        open={Boolean(questionsModal)}
        questions={questionsModal?.questions ?? []}
        initialAnswers={questionsModal?.initialAnswers}
        submitLabel={questionsModal?.submitLabel}
        onSubmit={async (answers) => {
          if (questionsModal) await questionsModal.onSubmit(answers);
        }}
        onClose={() => setQuestionsModal(null)}
      />
      {showEditModal &&
        createPortal(
          <BulletinEditModal
            setShowEditModal={setShowEditModal}
            fetchData={fetchData}
            currEdit={currEdit}
            curID={curID}
          />,
          document.body,
        )}
    </BulletinContext.Provider>
  );
}

function BulletinEditModal({
  setShowEditModal,
  fetchData,
  currEdit,
  curID,
}: {
  setShowEditModal: (show: boolean) => void;
  fetchData: () => void;
  currEdit: formdata;
  curID: string;
}) {
  // This modal is portaled to document.body, outside the AppShell, so the
  // overlay must account for the desktop sidebar (264px expanded, 76px
  // collapsed) or the panel centers on the full viewport and slides
  // underneath the sidebar. items-start (not center) keeps the top of a
  // tall form reachable by scrolling.
  const sidebarCollapsed =
    typeof window !== "undefined" &&
    window.localStorage.getItem("tesc-sidebar-collapsed") === "true";
  return (
    <div
      className={`fixed inset-0 z-100 flex items-start justify-center overflow-y-auto py-5 ${
        sidebarCollapsed ? "lg:pl-[76px]" : "lg:pl-[264px]"
      }`}
    >
      <div
        className="fixed top-0 w-full h-full bg-black opacity-35 cursor-pointer"
        onClick={() => setShowEditModal(false)}
      />
      <Form
        formdata={currEdit}
        id={curID}
        onSuccess={() => {
          setShowEditModal(false);
          fetchData();
        }}
        editEvent={curID !== ""}
        inModal
      />
    </div>
  );
}
