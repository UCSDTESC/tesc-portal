import { container, item, profile_picture_src, canAccessRecruiterData } from "@lib/constants";
import { BulletinContext } from "@lib/hooks/useBulletin";
import { getPdfPreviewUrl, isValidUrl } from "@lib/utils";
import { getResumeSignedUrl } from "@services/resume";
import { Card, CardContent } from "@mui/material";
import { motion } from "motion/react";
import { useContext, useEffect, useState } from "react";
import { FaDiamond } from "react-icons/fa6";
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

  if (!previewUrl) return null;

  return (
    <Card className="flex-1 shadow-lg h-fit">
      <CardContent className="h-full">
        <iframe
          src={previewUrl}
          title="Resume PDF preview"
          className="w-full aspect-[1/1.2] border rounded-md"
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
    return <p className="text-sm text-muted-foreground">Candidate not found.</p>;
  }

  return (
    <motion.span
      className="w-full grid grid-cols-[70px_1fr] grid-rows-[auto_auto] gap-4"
      variants={container}
      initial="hidden"
      animate="show"
    >
      <motion.img
        variants={item}
        src={profile_picture_src}
        alt=""
        className="h-full rounded-full object-cover aspect-square"
      />
      <motion.div className="flex flex-col h-full justify-center relative" variants={item}>
        <div className="flex gap-1 flex-wrap items-center">
          <h1 className="font-bold text-4xl">
            {selectedCandidate.first_name && selectedCandidate.last_name
              ? `${selectedCandidate.first_name} ${selectedCandidate.last_name}`
              : "Unknown"}
          </h1>
          <div className="w-fit flex items-center h-full p-1 rounded-2xl font-bold gap-1 px-4 text-navy text-xl">
            <FaDiamond className="text-lightBlue text-2xl" />
            {selectedCandidate.points ?? 0}
          </div>
        </div>
        <p className="text-lg text-[#898989]">
          {selectedCandidate.major || "Major not listed"}
          {selectedCandidate.expected_grad
            ? ` · Class of ${selectedCandidate.expected_grad}`
            : ""}
        </p>
        <p className="text-sm text-[#898989]">
          {selectedCandidate.points ?? 0} TESC events attended
        </p>
      </motion.div>
      <motion.div className="col-span-2 w-[95%] max-w-[800px] mx-auto space-y-8" variants={item}>
        <CandidateResumePreview
          resumeLink={selectedCandidate.resume_link}
          resumeStoragePath={selectedCandidate.resume_storage_path}
        />
        {selectedCandidate.uuid && (
          <ListAttendedEvents
            userId={selectedCandidate.uuid}
            title="Events Attended"
            showSeeAllLink={false}
          />
        )}
      </motion.div>
    </motion.span>
  );
}
