import { container, item, profile_picture_src, canAccessRecruiterData } from "@lib/constants";
import { BulletinContext } from "@lib/hooks/useBulletin";
import { getPdfPreviewUrl, isValidUrl } from "@lib/utils";
import { getResumeSignedUrl } from "@services/resume";
import { Card, CardContent } from "@mui/material";
import { motion } from "motion/react";
import { useContext, useEffect, useState } from "react";
import { FaDiamond } from "react-icons/fa6";
import { FileText } from "lucide-react";
import UserContext from "@lib/UserContext";
import ListAttendedEvents from "@components/ui/ListAttendedEvents";
import { WelcomePageCompany } from "./WelcomePage";

function CandidateResumePreview({
  resumeLink,
  resumeStoragePath,
}: {
  resumeLink?: string | null;
  resumeStoragePath?: string | null;
}) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);

  useEffect(() => {
    const loadSignedUrl = async () => {
      if (!resumeStoragePath) {
        setSignedUrl(null);
        return;
      }
      const { url } = await getResumeSignedUrl(resumeStoragePath);
      setSignedUrl(url);
    };
    loadSignedUrl();
  }, [resumeStoragePath]);

  const linkPreview =
    resumeLink && isValidUrl(resumeLink) ? getPdfPreviewUrl(resumeLink).previewUrl : null;
  const previewUrl = signedUrl || linkPreview;
  const openUrl = resumeLink && isValidUrl(resumeLink) ? resumeLink : signedUrl;

  if (!previewUrl) {
    return (
      <div className="rounded-2xl border border-line bg-surface px-4 py-10 text-center text-sm text-ink-secondary">
        <FileText className="mx-auto mb-2 h-6 w-6 text-ink-muted" />
        <p>This resume can’t be previewed here.</p>
        {openUrl && (
          <a
            href={openUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-2 inline-block font-medium text-brand-600 underline"
          >
            Open resume
          </a>
        )}
      </div>
    );
  }

  return (
    <Card className="card-shadow flex-1 rounded-2xl border border-line bg-white">
      <CardContent className="h-full">
        <iframe
          src={previewUrl}
          title="Resume PDF preview"
          className="aspect-[1/1.2] w-full rounded-xl border border-line"
        />
      </CardContent>
    </Card>
  );
}

export default function MemberResume({ selection }: { selection: string }) {
  const { People } = useContext(BulletinContext);
  const { User, setShowLoginModal, setLoginRecruiterMode } = useContext(UserContext);
  const hasRecruiterAccess = canAccessRecruiterData(User?.role);

  const openRecruiterLogin = () => {
    setLoginRecruiterMode(true);
    setShowLoginModal(true);
  };

  const selectedCandidate = People?.find((person) => person.email.toString() === selection);

  useEffect(() => {
    if (!hasRecruiterAccess) {
      document.title = "Recruiter Portal | TESC Portal";
      return;
    }
    document.title = selectedCandidate
      ? `${selectedCandidate.first_name} ${selectedCandidate.last_name} | TESC Portal`
      : "Welcome | TESC Portal";
  }, [selectedCandidate, hasRecruiterAccess]);

  if (!hasRecruiterAccess) {
    const accessState = !User?.id ? "logged_out" : "unauthorized";
    return (
      <WelcomePageCompany
        accessState={accessState}
        onLogin={accessState === "logged_out" ? openRecruiterLogin : undefined}
      />
    );
  }

  if (selection === "-1") {
    return <WelcomePageCompany accessState="authorized" />;
  }

  if (!selectedCandidate) {
    return <p className="text-sm text-ink-secondary">Candidate not found.</p>;
  }

  return (
    <motion.div
      className="mx-auto flex w-full max-w-4xl flex-col gap-6"
      variants={container}
      initial="hidden"
      animate="show"
    >
      <motion.div
        variants={item}
        className="card-shadow flex items-start gap-4 rounded-2xl border border-line bg-white p-5 sm:p-6"
      >
        <img
          src={profile_picture_src}
          alt=""
          className="h-[72px] w-[72px] shrink-0 rounded-full object-cover ring-1 ring-line"
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">
              {selectedCandidate.first_name && selectedCandidate.last_name
                ? `${selectedCandidate.first_name} ${selectedCandidate.last_name}`
                : "Unknown"}
            </h1>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-sm font-bold text-navy-900">
              <FaDiamond className="text-sm text-brand-500" />
              {selectedCandidate.points ?? 0}
            </span>
          </div>
          <p className="mt-1 text-[15px] text-ink-secondary">
            {selectedCandidate.major || "Major not listed"}
            {selectedCandidate.expected_grad
              ? ` · Class of ${selectedCandidate.expected_grad}`
              : ""}
          </p>
          <p className="mt-0.5 text-sm text-ink-muted">
            {selectedCandidate.points ?? 0} TESC events attended
          </p>
        </div>
      </motion.div>
      <motion.div variants={item} className="space-y-8">
        <CandidateResumePreview
          resumeLink={selectedCandidate.resume_link}
          resumeStoragePath={selectedCandidate.resume_storage_path}
        />
        {selectedCandidate.uuid && (
          <ListAttendedEvents
            userId={selectedCandidate.uuid}
            title="Events Attended"
          />
        )}
      </motion.div>
    </motion.div>
  );
}
