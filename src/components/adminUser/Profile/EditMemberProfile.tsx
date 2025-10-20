import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@components/components/ui/card";
import { Label } from "@components/components/ui/label";
import { Input } from "@components/components/ui/input";
import { Button } from "@components/components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue
} from "@components/components/ui/select";
import { majors } from "@lib/constants";
/**
 * EditProfileForm — production‑ready, accessible form to edit Major, Graduation Year, and Resume Link.
 *
 * Props
 * - majors: string[] — list of available majors (displayed in a searchable select fallback).
 * - initialMajor?: string
 * - initialGradYear?: number
 * - initialResumeUrl?: string
 * - onSubmit: (data: { major: string; gradYear: number; resumeUrl: string }) => void
 * - onCancel?: () => void
 *
 * Styling: Tailwind + shadcn/ui. Animation: framer‑motion.
 */

export type EditProfileFormProps = {
  initialMajor?: string;
  initialGradYear?: number;
  initialResumeUrl?: string;
  onSubmit: (data: { major: string; gradYear: number; resumeUrl: string }) => void;
  onCancel?: () => void;
};

function isValidUrl(url: string) {
  try {
    const u = new URL(url);
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
}

function currentYear() {
  return new Date().getFullYear();
}

export default function EditProfileForm({
  initialMajor = "",
  initialGradYear,
  initialResumeUrl = "",
  onSubmit
}: EditProfileFormProps) {
  const [major, setMajor] = useState(initialMajor);
  const [gradYear, setGradYear] = useState<string>(initialGradYear ? String(initialGradYear) : "");
  const [resumeUrl, setResumeUrl] = useState(initialResumeUrl);
  const [touched, setTouched] = useState<{ [k: string]: boolean }>({});

  const yearMin = currentYear() - 1; // allow near‑term backdating
  const yearMax = currentYear() + 15; // reasonable planning horizon

  const errors = useMemo(() => {
    const e: { major?: string; gradYear?: string; resumeUrl?: string } = {};
    if (!major) e.major = "Please select your major.";

    const gy = Number(gradYear);
    if (!gradYear) e.gradYear = "Enter your expected graduation year.";
    else if (!Number.isInteger(gy)) e.gradYear = "Graduation year must be an integer.";
    else if (gy < yearMin || gy > yearMax)
      e.gradYear = `Year should be between ${yearMin} and ${yearMax}.`;

    if (!resumeUrl) e.resumeUrl = "Paste a link to your resume (PDF, Drive, etc.).";
    else if (!isValidUrl(resumeUrl)) e.resumeUrl = "Enter a valid URL (http/https).";

    return e;
  }, [major, gradYear, resumeUrl, yearMin, yearMax]);

  const isDirty = useMemo(() => {
    const a = initialMajor ?? "";
    const b = initialGradYear ? String(initialGradYear) : "";
    const c = initialResumeUrl ?? "";
    return major !== a || gradYear !== b || resumeUrl !== c;
  }, [major, gradYear, resumeUrl, initialMajor, initialGradYear, initialResumeUrl]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (Object.keys(errors).length === 0) {
      onSubmit({ major, gradYear: Number(gradYear), resumeUrl });
    } else {
      // mark all touched to reveal errors
      setTouched({ major: true, gradYear: true, resumeUrl: true });
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="w-full">
      <Card className="max-w-2xl mx-auto shadow-lg w-fit">
        <CardHeader>
          <CardTitle className="text-2xl">Edit Profile</CardTitle>
          <p className="text-sm text-muted-foreground">
            Update your <span className="font-medium">major</span>,
            <span className="font-medium"> graduation year</span>, and
            <span className="font-medium"> resume link</span>.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex items-start gap-4">
              {/* Major */}
              <div className="grid gap-2">
                <Label htmlFor="major">Major</Label>
                {/* shadcn Select */}
                <Select value={major} onValueChange={setMajor}>
                  <SelectTrigger id="major" aria-invalid={!!(touched.major && errors.major)}>
                    <SelectValue placeholder="Select your major" />
                  </SelectTrigger>
                  <SelectContent className="max-h-72">
                    <SelectGroup>
                      <SelectLabel>Majors</SelectLabel>
                      {majors.map((m) => (
                        <SelectItem key={m} value={m} className="truncate">
                          {m}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                {touched.major && errors.major && (
                  <p className="text-sm text-destructive">{errors.major}</p>
                )}
              </div>

              {/* Graduation Year */}
              <div className="grid gap-2 ">
                <Label htmlFor="gradYear">Graduation Year</Label>
                <Input
                  id="gradYear"
                  type="number"
                  inputMode="numeric"
                  className="w-fit"
                  min={yearMin}
                  max={yearMax}
                  placeholder={`${yearMin}–${yearMax}`}
                  value={gradYear}
                  onChange={(e) => setGradYear(e.target.value)}
                  onBlur={() => setTouched((t) => ({ ...t, gradYear: true }))}
                  aria-invalid={!!(touched.gradYear && errors.gradYear)}
                />
                <p className="text-xs text-muted-foreground">
                  Suggested range: {yearMin}–{yearMax}
                </p>
                {touched.gradYear && errors.gradYear && (
                  <p className="text-sm text-destructive">{errors.gradYear}</p>
                )}
              </div>
            </div>

            {/* Resume Link */}
            <div className="grid gap-2 w-fit">
              <Label htmlFor="resumeUrl">Resume Link</Label>
              <Input
                id="resumeUrl"
                type="url"
                placeholder="https://... (PDF, Drive, Dropbox, personal site)"
                value={resumeUrl}
                onChange={(e) => setResumeUrl(e.target.value)}
                onBlur={() => setTouched((t) => ({ ...t, resumeUrl: true }))}
                aria-invalid={!!(touched.resumeUrl && errors.resumeUrl)}
              />
              {resumeUrl && isValidUrl(resumeUrl) && (
                <a
                  href={resumeUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs underline text-muted-foreground truncate"
                >
                  Preview resume link
                </a>
              )}
              {touched.resumeUrl && errors.resumeUrl && (
                <p className="text-sm text-destructive">{errors.resumeUrl}</p>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-2">
              <Button
                type="submit"
                disabled={Object.keys(errors).length > 0 || !isDirty}
                className="bg-blue cursor-pointer hover:bg-blue/90"
              >
                Save changes
              </Button>
              <span className="ml-auto text-xs text-muted-foreground">
                {isDirty ? "Unsaved changes" : "All changes saved"}
              </span>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}
