import UserContext from "@lib/UserContext";
import { useContext, useEffect } from "react";
import PageHeader from "@components/shell/PageHeader";
import EditProfileForm from "./EditMemberProfile";

export default function Profile() {
  const { User } = useContext(UserContext);

  useEffect(() => {
    document.title = "My Profile | TESC Portal";
  }, []);

  return (
    <div>
      {User?.role !== "company" && (
        <>
          <PageHeader
            eyebrow="Account"
            title="My Profile"
            subtitle="Update your personal details, resume, and recruiter sharing preferences."
          />
          <EditProfileForm />
        </>
      )}
    </div>
  );
}
