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

function getPdfPreviewUrl(url: string): { previewUrl: string | null; note?: string } {
  if (!url) return { previewUrl: null };
  try {
    const u = new URL(url);
    const href = u.href;

    if (/\.pdf($|\?|#)/i.test(href)) {
      return { previewUrl: href };
    }

    if (u.hostname.includes("drive.google.com")) {
      const fileIdMatch = href.match(/\/d\/([^/]+)/) || href.match(/[?&]id=([^&]+)/);
      const fileId = fileIdMatch?.[1];
      if (fileId) {
        return { previewUrl: `https://drive.google.com/file/d/${fileId}/preview` };
      }
      return {
        previewUrl: `https://drive.google.com/viewerng/viewer?embedded=true&url=${encodeURIComponent(
          href
        )}`
      };
    }

    if (u.hostname.includes("dropbox.com")) {
      const raw = href.replace(/\?dl=0$/, "?raw=1");
      return { previewUrl: raw };
    }

    if (u.hostname.includes("onedrive.live.com")) {
      return { previewUrl: href.replace("redir?", "embed?") };
    }

    return { previewUrl: null };
  } catch {
    return { previewUrl: null };
  }
}

export default function EditProfileForm({
  initialMajor = "",
  initialGradYear,
  initialResumeUrl = "",
  onSubmit,
  onCancel
}: EditProfileFormProps) {
  const [major, setMajor] = useState(initialMajor);
  const [gradYear, setGradYear] = useState<string>(initialGradYear ? String(initialGradYear) : "");
  const [resumeUrl, setResumeUrl] = useState(initialResumeUrl);
  const [touched, setTouched] = useState<{ [k: string]: boolean }>({});

  const yearMin = currentYear() - 1;
  const yearMax = currentYear() + 15;

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
      setTouched({ major: true, gradYear: true, resumeUrl: true });
    }
  }

  const { previewUrl } = getPdfPreviewUrl(resumeUrl);

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <div className="flex flex-col lg:flex-row gap-6 max-w-6xl mx-auto">
        {/* Left: Edit Card */}
        <Card className="flex-1 shadow-lg h-fit">
          <CardHeader>
            <CardTitle className="text-2xl">Edit Profile</CardTitle>
            <p className="text-sm text-muted-foreground">
              Update your major, graduation year, and resume link.
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-2">
                <Label htmlFor="major">Major</Label>
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

              <div className="grid gap-2">
                <Label htmlFor="gradYear">Graduation Year</Label>
                <Input
                  id="gradYear"
                  type="number"
                  inputMode="numeric"
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

              <div className="grid gap-2">
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
                {touched.resumeUrl && errors.resumeUrl && (
                  <p className="text-sm text-destructive">{errors.resumeUrl}</p>
                )}
              </div>

              <div className="flex items-center gap-3 pt-2">
                <Button type="submit" disabled={Object.keys(errors).length > 0 || !isDirty}>
                  Save changes
                </Button>
                <Button type="button" variant="secondary" onClick={() => onCancel?.()}>
                  Cancel
                </Button>
                <span className="ml-auto text-xs text-muted-foreground">
                  {isDirty ? "Unsaved changes" : "All changes saved"}
                </span>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Right: PDF Preview */}
        {resumeUrl && isValidUrl(resumeUrl) && previewUrl && (
          <Card className="flex-1 shadow-lg h-full">
            <CardHeader>
              <CardTitle className="text-lg">Resume Preview</CardTitle>
            </CardHeader>
            <CardContent className="h-full">
              <iframe
                src={previewUrl}
                title="Resume PDF preview"
                className=" h-[640px] aspect-[1/1.2] border rounded-md"
              />
            </CardContent>
          </Card>
        )}
      </div>
    </motion.div>
  );
}
