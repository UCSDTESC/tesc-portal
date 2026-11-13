import {
  EVENT_ATTENDANCE_GROUP_BY,
  LINE_CHART_OPTIONS,
  LINE_GROUP_BY_LABELS,
  LINE_GROUP_BY_OPTIONS,
  MEMBERS_GROUP_BY,
  PIE_GROUP_BY_LABELS,
  exportLineChartPdf,
  exportPieChartPdf,
  exportInsightsReportPdf,
  type PieChartGrouping,
} from "@lib/attendanceChartUtils";
import { useOrgAttendanceInsights } from "@lib/hooks/useOrgAttendanceInsights";
import type { InsightEventOption, OrgAttendanceInsightsPayload, PieSlice } from "@lib/attendanceInsights";
import { Button } from "@components/components/ui/button";
import { Input } from "@components/components/ui/input";
import { Label } from "@components/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@components/components/ui/select";
import StatCard from "@components/shell/StatCard";
import {
  ArcElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Title,
  Tooltip,
} from "chart.js";
import { useMemo, useRef, useState } from "react";
import { Line, Pie } from "react-chartjs-2";
import { CalendarCheck, CalendarDays, ChartLine, ChartPie, ClipboardList, Download, Users } from "lucide-react";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
);

/** Navy / brand sequential palette for the pie chart (presentation only). */
const PIE_PALETTE = [
  "#0f2440",
  "#11426b",
  "#1d5c8a",
  "#2f7fc1",
  "#5ea3d6",
  "#a1c7e7",
  "#7c8ba1",
  "#c2d3e5",
];

function slicesForGroup(
  payload: OrgAttendanceInsightsPayload,
  groupBy: PieChartGrouping,
): PieSlice[] {
  if (groupBy === "tag") return payload.tags;
  if (groupBy === "venue") return payload.venues;
  if (groupBy === "timeOfDay") return payload.timeOfDay;
  if (groupBy === "org") return payload.orgs;
  if (groupBy === "year") return payload.years;
  return payload.majors;
}

function eventOptionLabel(event: InsightEventOption) {
  if (!event.startDate) return event.title;
  const date = new Date(event.startDate);
  if (Number.isNaN(date.getTime())) return event.title;
  return `${event.title} (${date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  })})`;
}

function statIcon(label: string) {
  if (label.includes("Upcoming")) return <CalendarDays className="h-5 w-5" />;
  if (label.includes("Unique")) return <Users className="h-5 w-5" />;
  if (label.includes("RSVP")) return <ClipboardList className="h-5 w-5" />;
  return <CalendarCheck className="h-5 w-5" />;
}

export default function OrgAttendanceInsights({
  isSuperOrg,
  orgId,
  orgName,
}: {
  isSuperOrg: boolean;
  orgId?: string;
  orgName?: string;
}) {
  const insights = useOrgAttendanceInsights({
    isSuperOrg,
    orgId,
    enabled: isSuperOrg || Boolean(orgId),
  });
  const lineRef = useRef<ChartJS<"line", number[], string> | null>(null);
  const pieRef = useRef<ChartJS<"pie", number[], string> | null>(null);
  const [pieCategory, setPieCategory] = useState<"eventAttendance" | "members">("eventAttendance");
  const [pieGroupBy, setPieGroupBy] = useState<PieChartGrouping>("tag");

  const pieOptions = pieCategory === "members" ? MEMBERS_GROUP_BY : EVENT_ATTENDANCE_GROUP_BY.filter((option) => {
    if (option.value !== "org") return true;
    return insights.viewingAllOrgs;
  });
  const effectivePieGroup = pieOptions.some((option) => option.value === pieGroupBy)
    ? pieGroupBy
    : pieOptions[0]?.value ?? "tag";
  const pieSlices = slicesForGroup(insights.payload, effectivePieGroup);

  const lineData = useMemo(
    () => ({
      labels: insights.groupedData.map((row) => row.label),
      datasets: [
        {
          label: "Attendance",
          data: insights.groupedData.map((row) => row.count),
          borderColor: "#1d5c8a",
          backgroundColor: "rgba(47, 127, 193, 0.18)",
          pointBackgroundColor: "#1d5c8a",
          pointBorderColor: "#ffffff",
        },
      ],
    }),
    [insights.groupedData],
  );

  const pieData = useMemo(
    () => ({
      labels: pieSlices.map((slice) => slice.label),
      datasets: [
        {
          label: pieCategory === "members" ? "Attendees" : "Events",
          data: pieSlices.map((slice) => slice.value),
          backgroundColor: pieSlices.map((_, index) => PIE_PALETTE[index % PIE_PALETTE.length]),
          borderColor: "#ffffff",
          borderWidth: 2,
        },
      ],
    }),
    [pieCategory, pieSlices],
  );

  const pieTitle = `${pieCategory === "members" ? "Attendees" : "Events"} by ${PIE_GROUP_BY_LABELS[effectivePieGroup]}`;
  const lineTitle = `Attendance by ${LINE_GROUP_BY_LABELS[insights.groupBy]}`;
  const orgScope = isSuperOrg
    ? insights.viewingAllOrgs
      ? "All organizations"
      : insights.orgOptions.find((org) => org.id === insights.selectedOrg)?.name ?? "Organization"
    : orgName ?? "Organization";
  const eventScope = insights.viewingOneEvent
    ? insights.eventOptions.find((event) => event.id === insights.selectedEvent)?.title ?? "Event"
    : "All events";

  const extraReportTables = useMemo(() => {
    const tables: { title: string; key: PieChartGrouping; rows: PieSlice[] }[] = [
      { title: "Events by Tag", key: "tag", rows: insights.payload.tags },
      { title: "Events by Venue", key: "venue", rows: insights.payload.venues },
      { title: "Events by Time of Day", key: "timeOfDay", rows: insights.payload.timeOfDay },
      { title: "Events by Organization", key: "org", rows: insights.payload.orgs },
      { title: "Attendees by Year", key: "year", rows: insights.payload.years },
      { title: "Attendees by Major", key: "major", rows: insights.payload.majors },
    ];
    return tables
      .filter((table) => {
        if (table.key === effectivePieGroup) return false;
        if (table.key === "org" && !insights.viewingAllOrgs) return false;
        return table.rows.length > 0;
      })
      .map((table) => ({
        title: table.title,
        leftHeader: "Label",
        rows: table.rows.map((row) => ({
          label: row.label,
          value: String(Math.round(row.value)),
        })),
      }));
  }, [effectivePieGroup, insights.payload, insights.viewingAllOrgs]);

  const exportFullReport = () => {
    const lineRangeLabel =
      insights.startDate || insights.endDate
        ? `Range: ${insights.startDate || "…"} – ${insights.endDate || "…"}`
        : undefined;
    exportInsightsReportPdf({
      scopeLabel: `${orgScope} · ${eventScope}`,
      stats: Object.entries(insights.stats).map(([label, stat]) => ({
        label,
        value: stat.value,
        hint: stat.hint,
      })),
      pieTitle,
      pieCanvas: pieRef.current?.canvas ?? null,
      pieSlices,
      lineTitle,
      lineRangeLabel,
      lineCanvas: lineRef.current?.canvas ?? null,
      lineRows: insights.groupedData,
      extraTables: extraReportTables,
    });
  };

  return (
    <section className="flex w-full flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-ink">Attendance insights</h2>
          <p className="mt-0.5 text-sm text-ink-secondary">
            Check-ins, RSVPs, and attendee makeup for{" "}
            {insights.viewingOneEvent
              ? "this event"
              : insights.viewingAllOrgs
                ? "all organizations"
                : "this organization"}
            .
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          {isSuperOrg && (
            <div className="flex min-w-[220px] flex-col gap-1.5">
              <Label htmlFor="insights-org">Organization</Label>
              <Select value={insights.selectedOrg} onValueChange={insights.setSelectedOrg}>
                <SelectTrigger id="insights-org" className="w-[min(100%,280px)]">
                  <SelectValue placeholder="Select organization" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={insights.allOrgsValue}>All organizations</SelectItem>
                  {insights.orgOptions.map((org) => (
                    <SelectItem key={org.id} value={org.id}>
                      {org.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="flex min-w-[220px] flex-col gap-1.5">
            <Label htmlFor="insights-event">Event</Label>
            <Select value={insights.selectedEvent} onValueChange={insights.setSelectedEvent}>
              <SelectTrigger id="insights-event" className="w-[min(100%,320px)]">
                <SelectValue placeholder="Select event" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={insights.allEventsValue}>All events</SelectItem>
                {insights.eventOptions.map((event) => (
                  <SelectItem key={event.id} value={event.id}>
                    {eventOptionLabel(event)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            type="button"
            variant="outline"
            className="rounded-xl"
            title="Export full report to PDF"
            disabled={insights.loading}
            onClick={exportFullReport}
          >
            <Download className="h-4 w-4" />
            Export report
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Object.entries(insights.stats).map(([label, stat]) => (
          <StatCard
            key={label}
            label={label}
            value={insights.loading ? "…" : stat.value}
            hint={stat.hint}
            icon={statIcon(label)}
          />
        ))}
      </div>

      {insights.error && <p className="text-sm text-destructive">{insights.error}</p>}

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="card-shadow flex flex-col gap-4 rounded-2xl border border-line bg-white p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                <ChartPie className="h-4 w-4" />
              </span>
              <h3 className="text-base font-semibold text-ink">{pieTitle}</h3>
            </div>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="rounded-xl"
              title="Export to PDF"
              disabled={insights.loading || pieSlices.length === 0}
              onClick={() =>
                exportPieChartPdf({
                  category: pieCategory,
                  groupBy: effectivePieGroup,
                  canvas: pieRef.current?.canvas ?? null,
                  slices: pieSlices,
                })
              }
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex min-w-[150px] flex-col gap-1.5">
              <Label>Category</Label>
              <Select
                value={pieCategory}
                onValueChange={(value) => {
                  const next = value === "members" ? "members" : "eventAttendance";
                  setPieCategory(next);
                  setPieGroupBy(next === "members" ? "year" : "tag");
                }}
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="eventAttendance">Events</SelectItem>
                  <SelectItem value="members">Attendees</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex min-w-[150px] flex-col gap-1.5">
              <Label>Group by</Label>
              <Select
                value={effectivePieGroup}
                onValueChange={(value) => setPieGroupBy(value as PieChartGrouping)}
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {pieOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {insights.loading ? (
            <p className="text-sm text-ink-muted">Loading chart…</p>
          ) : pieSlices.length === 0 ? (
            <p className="text-sm text-ink-muted">No attendance data yet.</p>
          ) : (
            <div className="h-[320px] w-full">
              <Pie
                ref={pieRef}
                data={pieData}
                options={{
                  plugins: {
                    legend: {
                      position: "bottom",
                      labels: {
                        filter: (item) => (item.index != null ? item.index < 5 : true),
                      },
                    },
                  },
                }}
              />
            </div>
          )}
        </div>

        <div className="card-shadow flex flex-col gap-4 rounded-2xl border border-line bg-white p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                <ChartLine className="h-4 w-4" />
              </span>
              <h3 className="text-base font-semibold text-ink">{lineTitle}</h3>
            </div>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="rounded-xl"
              title="Export to PDF"
              disabled={insights.loading || insights.groupedData.length === 0}
              onClick={() =>
                exportLineChartPdf({
                  groupBy: insights.groupBy,
                  startDate: insights.startDate,
                  endDate: insights.endDate,
                  canvas: lineRef.current?.canvas ?? null,
                  groupedData: insights.groupedData,
                })
              }
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex min-w-[150px] flex-col gap-1.5">
              <Label htmlFor="insights-start">Start date</Label>
              <Input
                id="insights-start"
                type="date"
                value={insights.startDate}
                onChange={(event) => insights.setStartDate(event.target.value)}
                className="w-[180px]"
              />
            </div>
            <div className="flex min-w-[150px] flex-col gap-1.5">
              <Label htmlFor="insights-end">End date</Label>
              <Input
                id="insights-end"
                type="date"
                value={insights.endDate}
                onChange={(event) => insights.setEndDate(event.target.value)}
                className="w-[180px]"
              />
            </div>
            <div className="flex min-w-[150px] flex-col gap-1.5">
              <Label>Group by</Label>
              <Select
                value={insights.groupBy}
                onValueChange={(value) =>
                  insights.setGroupBy(value as (typeof insights)["groupBy"])
                }
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LINE_GROUP_BY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {LINE_GROUP_BY_LABELS[option.value]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {insights.loading ? (
            <p className="text-sm text-ink-muted">Loading chart…</p>
          ) : insights.groupedData.length === 0 ? (
            <p className="text-sm text-ink-muted">No attendance data in this range.</p>
          ) : (
            <div className="h-[320px] w-full">
              <Line ref={lineRef} data={lineData} options={LINE_CHART_OPTIONS} />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
