import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router";

import UserContext from "@lib/UserContext";
import { Event } from "@lib/constants";
import { parseQrSearchParams, qrFlowSessionKey } from "@lib/eventLinks";
import { resolveQrFlowState, type QrFlowState } from "@lib/resolveQrEventAction";
import { getSlotQrAction, isSlotFull } from "@lib/slotTime";
import { fetchEventById } from "@services/event";
import { editRSVP, logAttendanceWithToken } from "@services/user";
import DisplayToast from "@lib/hooks/useToast";

type QrBanner = {
  type: "success" | "info" | "error";
  message: string;
} | null;

export function useQrEventFlow(options: {
  eventId: string;
  event: Event | null | undefined;
  rsvpSlotId?: string;
  attendedSlotId?: string;
  onRefresh: (eventId?: string) => Promise<void>;
  onRsvp?: (eventId: string, slotId: string) => void;
  onAttended?: (eventId: string, slotId: string) => void;
}) {
  const { eventId, event, rsvpSlotId, attendedSlotId, onRefresh, onRsvp, onAttended } = options;
  const { User, authReady, setShowLoginModal, setPendingQrFlow, setLoginModalContext } = useContext(UserContext);
  const [searchParams, setSearchParams] = useSearchParams();

  const { fromQr, token } = useMemo(
    () => parseQrSearchParams(searchParams.toString()),
    [searchParams],
  );

  const [showPicker, setShowPicker] = useState(false);
  const [flowState, setFlowState] = useState<QrFlowState | null>(null);
  const [banner, setBanner] = useState<QrBanner>(null);
  const [deepLinkEvent, setDeepLinkEvent] = useState<Event | null>(null);
  const [loadingEvent, setLoadingEvent] = useState(false);

  const activeEvent = event ?? deepLinkEvent;
  const slots = activeEvent?.slots ?? [];

  const clearQrParams = useCallback(() => {
    const next = new URLSearchParams(searchParams);
    next.delete("from");
    next.delete("token");
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    if (!fromQr || !token || eventId === "-1") return;
    if (event || deepLinkEvent || loadingEvent) return;

    const load = async () => {
      setLoadingEvent(true);
      const { event: fetched, error } = await fetchEventById(eventId);
      setLoadingEvent(false);
      if (fetched) setDeepLinkEvent(fetched as unknown as Event);
      else if (error) DisplayToast(error.message ?? "Could not load event", "error");
    };
    load();
  }, [fromQr, token, eventId, event, deepLinkEvent, loadingEvent]);

  useEffect(() => {
    if (!fromQr || !token || eventId === "-1" || !activeEvent || !authReady) return;

    const completed = sessionStorage.getItem(qrFlowSessionKey(eventId)) === "1";
    const state = resolveQrFlowState({
      isLoggedIn: Boolean(User?.id),
      hasAttended: Boolean(attendedSlotId),
      slots,
      alreadyCompletedSession: completed,
    });
    setFlowState(state);

    if (state.mode === "auth-required") {
      setPendingQrFlow({ eventId, token });
      setLoginModalContext(`Sign in to register or check in to ${activeEvent.title}`);
      setShowLoginModal(true);
      return;
    }

    if (state.mode === "done") {
      if (state.reason === "already-attended") {
        setBanner({ type: "success", message: "You are already checked in for this event." });
      } else if (state.reason === "event-ended") {
        setBanner({ type: "info", message: "This event has ended." });
      }
      return;
    }

    setShowPicker(true);
  }, [
    fromQr,
    token,
    eventId,
    activeEvent,
    authReady,
    User?.id,
    attendedSlotId,
    slots,
    setPendingQrFlow,
    setLoginModalContext,
    setShowLoginModal,
  ]);

  const handleSlotConfirm = useCallback(
    async (slotId: string) => {
      if (!User?.id || !token || !activeEvent) return;

      const slot = slots.find((s) => s.id === slotId);
      if (!slot) return;

      if (isSlotFull(slot) && rsvpSlotId !== slotId) {
        DisplayToast("This time slot is full", "error");
        return;
      }

      const now = new Date();

      try {
        const action = getSlotQrAction(slot, now);

        if (action === "ended") {
          DisplayToast("This time slot has ended", "error");
          return;
        }

        if (action === "register") {
          if (rsvpSlotId !== slotId) {
            const rsvpAction = rsvpSlotId ? "switch" : "rsvp";
            const error = await editRSVP(eventId, slotId, rsvpAction);
            if (error) {
              DisplayToast(error.message ?? "Unable to register", "error");
              return;
            }
          }
          setBanner({ type: "success", message: "You are registered for this event." });
          DisplayToast("Successfully registered", "success");
          onRsvp?.(eventId, slotId);
          setShowPicker(false);
          clearQrParams();
          await onRefresh(eventId);
          return;
        }

        // Slot has started — check in
        if (!rsvpSlotId) {
          const rsvpError = await editRSVP(eventId, slotId, "rsvp");
          if (rsvpError) {
            DisplayToast(rsvpError.message ?? "Unable to register before check-in", "error");
            return;
          }
        } else if (rsvpSlotId !== slotId) {
          const switchError = await editRSVP(eventId, slotId, "switch");
          if (switchError) {
            DisplayToast(switchError.message ?? "Unable to switch slot", "error");
            return;
          }
        }

        const attendError = await logAttendanceWithToken(eventId, User.id, token, slotId);
        if (attendError) {
          DisplayToast(attendError.message ?? "Unable to check in", "error");
          return;
        }

        setBanner({ type: "success", message: "Attendance recorded. You're checked in!" });
        DisplayToast("Successfully checked in", "success");
        sessionStorage.setItem(qrFlowSessionKey(eventId), "1");
        onAttended?.(eventId, slotId);
        setShowPicker(false);
        clearQrParams();
        await onRefresh(eventId);
      } catch (err) {
        console.error(err);
        DisplayToast("Something went wrong", "error");
      }
    },
    [
      User?.id,
      token,
      activeEvent,
      slots,
      rsvpSlotId,
      eventId,
      clearQrParams,
      onRefresh,
      onRsvp,
      onAttended,
    ],
  );

  const closePicker = useCallback(() => {
    setShowPicker(false);
    clearQrParams();
  }, [clearQrParams]);

  return {
    fromQr,
    showPicker,
    flowState,
    banner,
    activeEvent,
    loadingEvent,
    handleSlotConfirm,
    closePicker,
  };
}
