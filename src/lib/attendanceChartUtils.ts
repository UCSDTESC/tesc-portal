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
  const bottomMargin = 18;
  const rowHeight = 7;
  let y = startY;
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  doc.text(leftHeader, 14, y);
  doc.text("Count", pageW - 20, y);
  doc.setDrawColor(200, 200, 200);
  doc.line(14, y + 2, pageW - 14, y + 2);
  doc.setFontSize(10);
  y += 8;
  for (const row of rows) {
    const lines = doc.splitTextToSize(row.label, pageW - 50);
    const blockH = Math.max(rowHeight, lines.length * 5);
    if (y + blockH > pageH - bottomMargin) {
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
    doc.text(lines, 14, y);
    doc.text(row.value, pageW - 20, y, { align: "right" });
    y += blockH;
  }
  return y;
}

function collectedAtNow() {
  return new Date().toLocaleString(undefined, {
    dateStyle: "long",
    timeStyle: "short",
  });
}

function ensureSpace(doc: jsPDF, y: number, needed: number) {
  const pageH = doc.internal.pageSize.getHeight();
  if (y + needed > pageH - 18) {
    doc.addPage();
    return 20;
  }
  return y;
}

function addChartImage(doc: jsPDF, canvas: HTMLCanvasElement | null, y: number) {
  if (!canvas || canvas.width === 0 || canvas.height === 0) return y;
  const pageW = doc.internal.pageSize.getWidth();
  const imgW = Math.min(170, pageW - 28);
  const imgH = (canvas.height / canvas.width) * imgW;
  y = ensureSpace(doc, y, imgH + 8);
  doc.addImage(canvas.toDataURL("image/png"), "PNG", 14, y, imgW, imgH);
  return y + imgH + 10;
}

function writeSectionHeading(doc: jsPDF, title: string, y: number) {
  y = ensureSpace(doc, y, 16);
  doc.setFontSize(13);
  doc.setTextColor(15, 76, 129);
  doc.text(title, 14, y);
  doc.setTextColor(0, 0, 0);
  return y + 8;
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
  const collectedAt = collectedAtNow();

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
  const collectedAt = collectedAtNow();

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

export type InsightsReportStat = {
  label: string;
  value: string;
  hint?: string;
};

export type InsightsReportTable = {
  title: string;
  leftHeader: string;
  rows: { label: string; value: string }[];
};

export function exportInsightsReportPdf({
  scopeLabel,
  stats,
  pieTitle,
  pieCanvas,
  pieSlices,
  lineTitle,
  lineRangeLabel,
  lineCanvas,
  lineRows,
  extraTables,
}: {
  scopeLabel: string;
  stats: InsightsReportStat[];
  pieTitle: string;
  pieCanvas: HTMLCanvasElement | null;
  pieSlices: PieSlice[];
  lineTitle: string;
  lineRangeLabel?: string;
  lineCanvas: HTMLCanvasElement | null;
  lineRows: { label: string; count: number }[];
  extraTables: InsightsReportTable[];
}) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const collectedAt = collectedAtNow();

  doc.setFontSize(18);
  doc.setTextColor(15, 76, 129);
  doc.text("Attendance insights report", 14, 20);
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(11);
  doc.text(scopeLabel, 14, 28);
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Data collected: ${collectedAt}`, 14, 34);
  doc.setTextColor(0, 0, 0);

  let y = 46;
  y = writeSectionHeading(doc, "Summary", y);
  for (const stat of stats) {
    y = ensureSpace(doc, y, stat.hint ? 16 : 10);
    doc.setFontSize(11);
    const labelLines = doc.splitTextToSize(stat.label, pageW - 50);
    doc.text(labelLines, 14, y);
    doc.text(stat.value, pageW - 14, y, { align: "right" });
    y += Math.max(6, labelLines.length * 5);
    if (stat.hint) {
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      doc.text(stat.hint, 14, y);
      doc.setTextColor(0, 0, 0);
      y += 7;
    } else {
      y += 3;
    }
  }

  y += 4;
  y = writeSectionHeading(doc, pieTitle, y);
  y = addChartImage(doc, pieCanvas, y);
  if (pieSlices.length) {
    y = writePdfTable(
      doc,
      pieSlices.map((slice) => ({
        label: slice.label,
        value: String(Math.round(slice.value)),
      })),
      y,
      "Label",
    );
    y += 8;
  }

  y = writeSectionHeading(doc, lineTitle, y);
  if (lineRangeLabel) {
    y = ensureSpace(doc, y, 8);
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(lineRangeLabel, 14, y);
    doc.setTextColor(0, 0, 0);
    y += 8;
  }
  y = addChartImage(doc, lineCanvas, y);
  if (lineRows.length) {
    y = writePdfTable(
      doc,
      lineRows.map((row) => ({ label: row.label, value: String(row.count) })),
      y,
      "Period",
    );
    y += 8;
  }

  for (const table of extraTables) {
    if (!table.rows.length) continue;
    y = writeSectionHeading(doc, table.title, y);
    y = writePdfTable(doc, table.rows, y, table.leftHeader);
    y += 8;
  }

  doc.save("TESC_Attendance_Insights_Report.pdf");
}
