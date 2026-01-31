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

import ListAttendedEvents from "@components/ui/ListAttendedEvents";

export type EditMemberProfileProps = {
  initialFirstName?: string;
  initialLastName?: string;
  initialMajor?: string;
  initialGradYear?: number;
  initialResumeUrl?: string;
  onCancel?: () => void;
};

export default function EditMemberProfile({
  initialFirstName = "",
  initialLastName = "",
  initialMajor = "",
  initialGradYear,
  initialResumeUrl = "",
  onCancel
}: EditMemberProfileProps) {
  const { User } = useContext(UserContext);
  const [firstName, setFirstName] = useState(initialFirstName);
  const [lastName, setLastName] = useState(initialLastName);
  const [major, setMajor] = useState(initialMajor);
  const [gradYear, setGradYear] = useState<string>(initialGradYear ? String(initialGradYear) : "");
  const [resumeUrl, setResumeUrl] = useState(initialResumeUrl);
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
        .select("first_name, last_name, major, expected_grad, resume_link")
        .eq("email", User.email)
        .limit(1)
        .single();
      if (data) {
        setFirstName(data.first_name ? data.first_name : "");
        setLastName(data.last_name ? data.last_name : "");
        setMajor(data.major ? data.major : "");
        setGradYear(data.expected_grad ? data.expected_grad : "");
        setResumeUrl(data.resume_link ? data.resume_link : "");
      }
      if (error) {
        DisplayToast("Error grabbing profile information", "error");
      }
    };
    fetchMemberData();
  }, [User]);
  console.log("rerender");
  const errors = useMemo(() => {
    const e: {
      firstName?: string;
      lastName?: string;
      major?: string;
      gradYear?: string;
      resumeUrl?: string;
    } = {};

    if (!firstName.trim()) e.firstName = "Please enter your first name.";
    if (!lastName.trim()) e.lastName = "Please enter your last name.";

    if (!major) e.major = "Please select your major.";

    const gy = Number(gradYear);
    if (!gradYear) e.gradYear = "Enter your expected graduation year.";
    else if (!Number.isInteger(gy)) e.gradYear = "Graduation year must be an integer.";
    else if (gy < yearMin || gy > yearMax)
      e.gradYear = `Year should be between ${yearMin} and ${yearMax}.`;

    if (!resumeUrl) e.resumeUrl = "Paste a link to your resume (PDF, Drive, etc.).";
    else if (!isValidUrl(resumeUrl)) e.resumeUrl = "Enter a valid URL (http/https).";

    return e;
  }, [firstName, lastName, major, gradYear, resumeUrl, yearMin, yearMax]);

  const isDirty = useMemo(() => {
    const a = initialFirstName ?? "";
    const b = initialLastName ?? "";
    const c = initialMajor ?? "";
    const d = initialGradYear ? String(initialGradYear) : "";
    const e = initialResumeUrl ?? "";
    return firstName !== a || lastName !== b || major !== c || gradYear !== d || resumeUrl !== e;
  }, [
    firstName,
    lastName,
    major,
    gradYear,
    resumeUrl,
    initialFirstName,
    initialLastName,
    initialMajor,
    initialGradYear,
    initialResumeUrl
  ]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (Object.keys(errors).length === 0) {
      const { error } = await supabase
        .from("users")
        .update({
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          resume_link: resumeUrl,
          major: major,
          expected_grad: Number(gradYear)
        })
        .eq("email", User?.email);
      if (error) {
        setTouched({
          firstName: true,
          lastName: true,
          major: true,
          gradYear: true,
          resumeUrl: true
        });
        DisplayToast("Error updating profile info", "error");
      } else {
        DisplayToast("Successfully updated profile info", "success");
        navigate("/");
      }
    } else {
      setTouched({
        firstName: true,
        lastName: true,
        major: true,
        gradYear: true,
        resumeUrl: true
      });
    }
  };

  const { previewUrl } = getPdfPreviewUrl(resumeUrl);

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <div className="flex flex-col lg:flex-row gap-6 max-w-6xl mx-auto">
        {/* Left: Edit Card */}
        <Card className="flex-1 shadow-lg h-fit">
          <CardHeader>
            <CardTitle className="text-2xl">Edit Profile</CardTitle>
            <p className="text-sm text-muted-foreground">
              Update your name, major, graduation year, and resume link.
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
                <Button
                  type="submit"
                  disabled={Object.keys(errors).length > 0 || !isDirty}
                  className="bg-blue"
                >
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
      {User && User.id && (
        <div className="max-w-6xl mx-auto pt-12">
            <ListAttendedEvents userId={User.id} />
        </div>
      )}

    </motion.div>
  );
}
