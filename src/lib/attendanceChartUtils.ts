import { jsPDF } from "jspdf";
import type { LineChartGroupBy, PieSlice } from "./attendanceInsights";

export type PieChartGrouping = "tag" | "venue" | "timeOfDay" | "org" | "year" | "major";

export const PIE_GROUP_BY_LABELS: Record<PieChartGrouping, string> = {
  tag: "Tag",
  venue: "Venue",
  timeOfDay: "Time of Day",
  org: "Organization",
  year: "Year",
  major: "Major",
};

export const PIE_COLORS = [
  { bg: "rgba(15, 76, 129, 0.25)", border: "rgba(15, 76, 129, 1)" },
  { bg: "rgba(106, 151, 189, 0.25)", border: "rgba(106, 151, 189, 1)" },
  { bg: "rgba(255, 99, 132, 0.2)", border: "rgba(255, 99, 132, 1)" },
  { bg: "rgba(54, 162, 235, 0.2)", border: "rgba(54, 162, 235, 1)" },
  { bg: "rgba(255, 206, 86, 0.2)", border: "rgba(255, 206, 86, 1)" },
  { bg: "rgba(75, 192, 192, 0.2)", border: "rgba(75, 192, 192, 1)" },
  { bg: "rgba(153, 102, 255, 0.2)", border: "rgba(153, 102, 255, 1)" },
  { bg: "rgba(255, 159, 64, 0.2)", border: "rgba(255, 159, 64, 1)" },
];

export const EVENT_ATTENDANCE_GROUP_BY: { value: PieChartGrouping; label: string }[] = [
  { value: "tag", label: "Tag" },
  { value: "venue", label: "Venue" },
  { value: "timeOfDay", label: "Time of Day" },
  { value: "org", label: "Organization" },
];

export const MEMBERS_GROUP_BY: { value: PieChartGrouping; label: string }[] = [
  { value: "year", label: "Year" },
  { value: "major", label: "Major" },
];

export const LINE_GROUP_BY_LABELS: Record<LineChartGroupBy, string> = {
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
  quarterly: "Quarterly",
};

export const LINE_GROUP_BY_OPTIONS: { value: LineChartGroupBy; label: string }[] = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
];

export const LINE_CHART_OPTIONS = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: "bottom" as const,
    },
  },
};

function writePdfTable(
  doc: jsPDF,
  rows: { label: string; value: string }[],
  startY: number,
  leftHeader: string,
) {
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const bottomMargin = 25;
  const rowHeight = 7;
  let y = startY;
  doc.setFontSize(11);
  doc.text(leftHeader, 14, y);
  doc.text("Count", pageW - 20, y);
  doc.setDrawColor(200, 200, 200);
  doc.line(14, y + 2, pageW - 14, y + 2);
  doc.setFontSize(10);
  y += 8;
  for (const row of rows) {
    if (y + rowHeight > pageH - bottomMargin) {
      doc.addPage();
      y = 20;
      doc.setFontSize(11);
      doc.text(leftHeader, 14, y);
      doc.text("Count", pageW - 20, y);
      doc.setDrawColor(200, 200, 200);
      doc.line(14, y + 2, pageW - 14, y + 2);
      doc.setFontSize(10);
      y += 8;
    }
    doc.text(row.label, 14, y);
    doc.text(row.value, pageW - 20, y, { align: "right" });
    y += rowHeight;
  }
}

export function exportPieChartPdf({
  category,
  groupBy,
  canvas,
  slices,
}: {
  category: "eventAttendance" | "members";
  groupBy: PieChartGrouping;
  canvas: HTMLCanvasElement | null;
  slices: PieSlice[];
}) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const categoryTitle = category === "members" ? "Attendees" : "Events";
  const title = `${categoryTitle} by ${PIE_GROUP_BY_LABELS[groupBy]}`;
  const collectedAt = new Date().toLocaleString(undefined, {
    dateStyle: "long",
    timeStyle: "short",
  });

  doc.setFontSize(16);
  doc.text(title, 14, 20);
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Data collected: ${collectedAt}`, 14, 26);
  doc.setTextColor(0, 0, 0);

  let imgH = 0;
  const chartTop = 32;
  if (canvas) {
    const imgW = Math.min(160, pageW - 28);
    imgH = (canvas.height / canvas.width) * imgW;
    doc.addImage(canvas.toDataURL("image/png"), "PNG", 14, chartTop, imgW, imgH);
  }
  writePdfTable(
    doc,
    slices.map((slice) => ({ label: slice.label, value: String(Math.round(slice.value)) })),
    canvas ? chartTop + imgH + 12 : 40,
    "Label",
  );
  doc.save(`${title.replace(/\s+/g, "_")}.pdf`);
}

export function exportLineChartPdf({
  groupBy,
  startDate,
  endDate,
  canvas,
  groupedData,
}: {
  groupBy: LineChartGroupBy;
  startDate: string;
  endDate: string;
  canvas: HTMLCanvasElement | null;
  groupedData: { label: string; count: number }[];
}) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const title = `Attendance by ${LINE_GROUP_BY_LABELS[groupBy]}`;
  const collectedAt = new Date().toLocaleString(undefined, {
    dateStyle: "long",
    timeStyle: "short",
  });

  doc.setFontSize(16);
  doc.text(title, 14, 20);
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Data collected: ${collectedAt}`, 14, 26);
  if (startDate || endDate) {
    doc.text(`Range: ${startDate || "…"} – ${endDate || "…"}`, 14, 32);
  }
  doc.setTextColor(0, 0, 0);

  let imgH = 0;
  const chartTop = startDate || endDate ? 38 : 32;
  if (canvas) {
    const imgW = Math.min(160, pageW - 28);
    imgH = (canvas.height / canvas.width) * imgW;
    doc.addImage(canvas.toDataURL("image/png"), "PNG", 14, chartTop, imgW, imgH);
  }
  writePdfTable(
    doc,
    groupedData.map((row) => ({ label: row.label, value: String(row.count) })),
    canvas ? chartTop + imgH + 12 : 44,
    "Period",
  );
  doc.save(`${title.replace(/\s+/g, "_")}.pdf`);
}
