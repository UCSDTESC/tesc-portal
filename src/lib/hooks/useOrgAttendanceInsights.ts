import { useEffect, useMemo, useState } from "react";
import { fetchOrgAttendanceInsights } from "@services/attendanceInsights";
import { fetchOrgOptions } from "@services/adminUsers";
import {
  emptyInsightsPayload,
  filterDailyByDateRange,
  formatNextEventHint,
  formatStatNumber,
  groupDailyByPeriod,
  percentChangeHint,
  type LineChartGroupBy,
  type OrgAttendanceInsightsPayload,
} from "@lib/attendanceInsights";

export type InsightOrgOption = { id: string; name: string };

const ALL_ORGS = "all";
const ALL_EVENTS = "all";

export function useOrgAttendanceInsights({
  isSuperOrg,
  orgId,
  enabled,
}: {
  isSuperOrg: boolean;
  orgId?: string;
  enabled: boolean;
}) {
  const [selectedOrg, setSelectedOrgState] = useState(isSuperOrg ? ALL_ORGS : orgId ?? "");
  const [selectedEvent, setSelectedEvent] = useState(ALL_EVENTS);
  const [orgOptions, setOrgOptions] = useState<InsightOrgOption[]>([]);
  const [payload, setPayload] = useState<OrgAttendanceInsightsPayload>(emptyInsightsPayload());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [groupBy, setGroupBy] = useState<LineChartGroupBy>("weekly");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    if (!isSuperOrg) {
      setSelectedOrgState(orgId ?? "");
      return;
    }
    setSelectedOrgState((current) => current || ALL_ORGS);
  }, [isSuperOrg, orgId]);

  const setSelectedOrg = (value: string) => {
    setSelectedOrgState(value);
    setSelectedEvent(ALL_EVENTS);
  };

  useEffect(() => {
    if (!enabled || !isSuperOrg) return;
    let cancelled = false;
    const loadOrgs = async () => {
      const { orgs } = await fetchOrgOptions();
      if (cancelled) return;
      setOrgOptions(
        orgs
          .filter((org) => org.name !== "super_org")
          .map((org) => ({ id: String(org.uuid), name: org.name })),
      );
    };
    void loadOrgs();
    return () => {
      cancelled = true;
    };
  }, [enabled, isSuperOrg]);

  const queryOrgId = useMemo(() => {
    if (isSuperOrg) {
      if (selectedOrg === ALL_ORGS || !selectedOrg) return null;
      const parsed = Number(selectedOrg);
      return selectedOrg && Number.isFinite(parsed) ? parsed : null;
    }
    const parsed = Number(orgId);
    return orgId && Number.isFinite(parsed) ? parsed : null;
  }, [isSuperOrg, selectedOrg, orgId]);

  const queryEventId = useMemo(() => {
    if (selectedEvent === ALL_EVENTS || !selectedEvent) return null;
    const parsed = Number(selectedEvent);
    return Number.isFinite(parsed) ? parsed : null;
  }, [selectedEvent]);

  useEffect(() => {
    if (!enabled) return;
    if (!isSuperOrg && queryOrgId == null) return;
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      const { payload: next, error: fetchError } = await fetchOrgAttendanceInsights(
        queryOrgId,
        queryEventId,
      );
      if (cancelled) return;
      if (fetchError) {
        setError(fetchError.message);
        setPayload(emptyInsightsPayload());
        setLoading(false);
        return;
      }
      setPayload(next);
      setLoading(false);
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [enabled, isSuperOrg, queryOrgId, queryEventId]);

  const filteredDaily = useMemo(
    () => filterDailyByDateRange(payload.daily, startDate, endDate),
    [payload.daily, startDate, endDate],
  );

  const groupedData = useMemo(
    () => groupDailyByPeriod(filteredDaily, groupBy, "attended"),
    [filteredDaily, groupBy],
  );

  const viewingOneEvent = selectedEvent !== ALL_EVENTS && Boolean(selectedEvent);
  const selectedEventTitle =
    payload.events.find((event) => event.id === selectedEvent)?.title ?? "Event";

  const stats = useMemo(() => {
    const attendanceLabel = viewingOneEvent
      ? `${selectedEventTitle} attendance`
      : "Monthly Attendance";
    return {
      [attendanceLabel]: viewingOneEvent
        ? {
            value: formatStatNumber(payload.totalCheckins),
          }
        : {
            value: formatStatNumber(payload.attendedLast30),
            hint: percentChangeHint(payload.attendedLast30, payload.attendedPrev30),
          },
      "Unique Attendees": {
        value: formatStatNumber(payload.uniqueAttendees),
        hint: `${formatStatNumber(payload.totalCheckins)} check-ins`,
      },
      "RSVPs not checked in": {
        value: formatStatNumber(payload.totalRsvps),
        hint: "Registered, but have not attended yet",
      },
      ...(viewingOneEvent
        ? {}
        : {
            "Upcoming Events": {
              value: formatStatNumber(payload.upcomingEvents),
              hint: formatNextEventHint(payload.nextEventStart),
            },
          }),
    };
  }, [payload, selectedEventTitle, viewingOneEvent]);

  return {
    selectedOrg,
    setSelectedOrg,
    orgOptions,
    allOrgsValue: ALL_ORGS,
    selectedEvent,
    setSelectedEvent,
    eventOptions: payload.events,
    allEventsValue: ALL_EVENTS,
    viewingAllOrgs: isSuperOrg && (selectedOrg === ALL_ORGS || !selectedOrg),
    viewingOneEvent,
    payload,
    groupedData,
    groupBy,
    setGroupBy,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    loading,
    error,
    stats,
  };
}
