import React, { useContext, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@components/components/ui/card";
import { Label } from "@components/components/ui/label";
import { Input } from "@components/components/ui/input";
import { Button } from "@components/components/ui/button";
import UserContext from "@lib/UserContext";
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

import { isValidUrl, currentYear, getPdfPreviewUrl } from "@lib/utils";
import supabase from "@server/supabase";
import DisplayToast from "@lib/hooks/useToast";
import { useNavigate } from "react-router";
import { getResumeSignedUrl, uploadResumePdf } from "@services/resume";

import ListAttendedEvents from "@components/ui/ListAttendedEvents";

export type EditMemberProfileProps = {
  initialFirstName?: string;
  initialLastName?: string;
  initialMajor?: string;
  initialGradYear?: number;
  initialResumeUrl?: string;
  mode?: "default" | "onboarding";
  onCancel?: () => void;
  onComplete?: () => void;
};

export default function EditMemberProfile({
  initialFirstName = "",
  initialLastName = "",
  initialMajor = "",
  initialGradYear,
  initialResumeUrl = "",
  mode = "default",
  onCancel,
  onComplete,
}: EditMemberProfileProps) {
  const isOnboarding = mode === "onboarding";
  const { User } = useContext(UserContext);
  const [firstName, setFirstName] = useState(initialFirstName);
  const [lastName, setLastName] = useState(initialLastName);
  const [major, setMajor] = useState(initialMajor);
  const [gradYear, setGradYear] = useState<string>(initialGradYear ? String(initialGradYear) : "");
  const [resumeUrl, setResumeUrl] = useState(initialResumeUrl);
  const [resumeStoragePath, setResumeStoragePath] = useState("");
  const [resumeVisible, setResumeVisible] = useState(true);
  const [initialResumeVisible, setInitialResumeVisible] = useState(true);
  const [pendingResumeFile, setPendingResumeFile] = useState<File | null>(null);
  const [storagePreviewUrl, setStoragePreviewUrl] = useState<string | null>(null);
  const [touched, setTouched] = useState<{ [k: string]: boolean }>({});
  const yearMin = currentYear() - 1;
  const yearMax = currentYear() + 15;
  const navigate = useNavigate();

  useEffect(() => {
    if (!User) return;
    const fetchMemberData = async () => {
      console.log(User.email);
      const { data, error } = await supabase
        .from("users")
        .select(
          "first_name, last_name, major, expected_grad, resume_link, resume_storage_path, resume_visible",
        )
        .eq("email", User.email)
        .limit(1)
        .single();
      if (data) {
        setFirstName(data.first_name ? data.first_name : "");
        setLastName(data.last_name ? data.last_name : "");
        setMajor(data.major ? data.major : "");
        setGradYear(data.expected_grad ? data.expected_grad : "");
        setResumeUrl(data.resume_link ? data.resume_link : "");
        setResumeStoragePath(data.resume_storage_path ? data.resume_storage_path : "");
        setResumeVisible(data.resume_visible ?? true);
        setInitialResumeVisible(data.resume_visible ?? true);
      }
      if (error) {
        DisplayToast("Error grabbing profile information", "error");
      }
    };
    fetchMemberData();
    fetchMemberData();
  }, [User]);

  useEffect(() => {
    const loadStoragePreview = async () => {
      if (!resumeStoragePath) {
        setStoragePreviewUrl(null);
        return;
      }
      const { url } = await getResumeSignedUrl(resumeStoragePath);
      setStoragePreviewUrl(url);
    };
    loadStoragePreview();
  }, [resumeStoragePath]);

  const hasResumeSource = Boolean(
    pendingResumeFile || resumeStoragePath || (resumeUrl && isValidUrl(resumeUrl)),
  );

  const errors = useMemo(() => {
    const e: {
      firstName?: string;
      lastName?: string;
      major?: string;
      gradYear?: string;
      resumeUrl?: string;
      resumeVisible?: string;
    } = {};

    if (!firstName.trim()) e.firstName = "Please enter your first name.";
    if (!lastName.trim()) e.lastName = "Please enter your last name.";

    if (!major) e.major = "Please select your major.";

    const gy = Number(gradYear);
    if (!gradYear) e.gradYear = "Enter your expected graduation year.";
    else if (!Number.isInteger(gy)) e.gradYear = "Graduation year must be an integer.";
    else if (gy < yearMin || gy > yearMax)
      e.gradYear = `Year should be between ${yearMin} and ${yearMax}.`;

    if (resumeUrl && !isValidUrl(resumeUrl)) e.resumeUrl = "Enter a valid URL (http/https).";
    if (!isOnboarding && resumeVisible && !hasResumeSource) {
      e.resumeVisible = "Add a resume link or upload a PDF before sharing with recruiters.";
    }

    return e;
  }, [
    firstName,
    lastName,
    major,
    gradYear,
    resumeUrl,
    resumeVisible,
    hasResumeSource,
    yearMin,
    yearMax,
    isOnboarding,
  ]);

  const isDirty = useMemo(() => {
    const a = initialFirstName ?? "";
    const b = initialLastName ?? "";
    const c = initialMajor ?? "";
    const d = initialGradYear ? String(initialGradYear) : "";
    const e = initialResumeUrl ?? "";
    const f = initialResumeVisible;
    return (
      firstName !== a ||
      lastName !== b ||
      major !== c ||
      gradYear !== d ||
      resumeUrl !== e ||
      resumeVisible !== f ||
      Boolean(pendingResumeFile)
    );
  }, [
    firstName,
    lastName,
    major,
    gradYear,
    resumeUrl,
    resumeVisible,
    initialResumeVisible,
    pendingResumeFile,
    initialFirstName,
    initialLastName,
    initialMajor,
    initialGradYear,
    initialResumeUrl,
  ]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (Object.keys(errors).length > 0) {
      setTouched({
        firstName: true,
        lastName: true,
        major: true,
        gradYear: true,
        resumeUrl: true,
        resumeVisible: true,
      });
      return;
    }

    let nextStoragePath = resumeStoragePath;
    if (pendingResumeFile && User?.id) {
      const { path, error: uploadError } = await uploadResumePdf(pendingResumeFile, User.id);
      if (uploadError || !path) {
        DisplayToast("Error uploading resume PDF", "error");
        return;
      }
      nextStoragePath = path;
    }

    const { error } = await supabase
      .from("users")
      .update({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        resume_link: resumeUrl.trim() || null,
        resume_storage_path: nextStoragePath || null,
        resume_visible: resumeVisible,
        major: major,
        expected_grad: Number(gradYear),
      })
      .eq("email", User?.email);
    if (error) {
      setTouched({
        firstName: true,
        lastName: true,
        major: true,
        gradYear: true,
        resumeUrl: true,
        resumeVisible: true,
      });
      DisplayToast("Error updating profile info", "error");
    } else {
      setResumeStoragePath(nextStoragePath);
      setPendingResumeFile(null);
      DisplayToast("Successfully updated profile info", "success");
      if (onComplete) {
        onComplete();
      } else {
        navigate("/");
      }
    }
  };

  const linkPreview = resumeUrl && isValidUrl(resumeUrl) ? getPdfPreviewUrl(resumeUrl).previewUrl : null;
  const previewUrl = pendingResumeFile
    ? URL.createObjectURL(pendingResumeFile)
    : storagePreviewUrl || linkPreview;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <div
        className={`flex flex-col gap-6 mx-auto ${isOnboarding ? "max-w-3xl" : "lg:flex-row max-w-6xl"}`}
      >
        {/* Left: Edit Card */}
        <Card className="flex-1 shadow-lg h-fit">
          <CardHeader>
            <CardTitle className="text-2xl">
              {isOnboarding ? "Complete your profile" : "Edit Profile"}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {isOnboarding
                ? "Tell us a bit about yourself so you can RSVP to events and connect with recruiters."
                : "Update your profile, resume, and recruiter sharing preferences."}
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name fields */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="firstName">First name</Label>
                  <Input
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    onBlur={() => setTouched((t) => ({ ...t, firstName: true }))}
                    aria-invalid={!!(touched.firstName && errors.firstName)}
                  />
                  {touched.firstName && errors.firstName && (
                    <p className="text-sm text-destructive">{errors.firstName}</p>
                  )}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="lastName">Last name</Label>
                  <Input
                    id="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    onBlur={() => setTouched((t) => ({ ...t, lastName: true }))}
                    aria-invalid={!!(touched.lastName && errors.lastName)}
                  />
                  {touched.lastName && errors.lastName && (
                    <p className="text-sm text-destructive">{errors.lastName}</p>
                  )}
                </div>
              </div>

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
                <Label htmlFor="resumeUrl">Resume Link (optional)</Label>
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

              <div className="grid gap-2">
                <Label htmlFor="resumeFile">Upload Resume PDF (optional)</Label>
                <Input
                  id="resumeFile"
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0] ?? null;
                    setPendingResumeFile(file);
                  }}
                />
                {resumeStoragePath && !pendingResumeFile && (
                  <p className="text-xs text-muted-foreground">
                    A resume PDF is stored on TESC Portal.
                  </p>
                )}
              </div>

              <div className="flex items-start gap-3 rounded-lg border p-3">
                <input
                  id="resumeVisible"
                  type="checkbox"
                  className="mt-1"
                  checked={resumeVisible}
                  onChange={(e) => {
                    setResumeVisible(e.target.checked);
                    setTouched((t) => ({ ...t, resumeVisible: true }));
                  }}
                />
                <div className="grid gap-1">
                  <Label htmlFor="resumeVisible" className="cursor-pointer">
                    Share my resume with TESC recruiting partners
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Approved recruiters can view your resume, major, graduation year, and TESC
                    events you have attended.
                  </p>
                  {touched.resumeVisible && errors.resumeVisible && (
                    <p className="text-sm text-destructive">{errors.resumeVisible}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <Button
                  type="submit"
                  disabled={Object.keys(errors).length > 0 || (!isOnboarding && !isDirty)}
                  className="bg-blue"
                >
                  {isOnboarding ? "Save profile" : "Save changes"}
                </Button>
                {!isOnboarding && (
                  <Button type="button" variant="secondary" onClick={() => onCancel?.()}>
                    Cancel
                  </Button>
                )}
                {!isOnboarding && (
                  <span className="ml-auto text-xs text-muted-foreground">
                    {isDirty ? "Unsaved changes" : "All changes saved"}
                  </span>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Right: PDF Preview */}
        {previewUrl && (
          <Card className="flex-1 shadow-lg h-full">
            <CardHeader>
              <CardTitle className="text-2xl">Resume Preview</CardTitle>
            </CardHeader>
            <CardContent className="h-full">
              <iframe
                src={previewUrl}
                title="Resume PDF preview"
                className="h-[640px] aspect-[1/1.2] border rounded-md"
              />
            </CardContent>
          </Card>
        )}
      </div>

      {/* recently attended events list */}
      {!isOnboarding && User && User.id && (
        <div className="max-w-6xl mx-auto pt-12">
          <ListAttendedEvents userId={User.id} />
        </div>
      )}

    </motion.div>
  );
}
