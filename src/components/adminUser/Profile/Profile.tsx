import UserContext from "@lib/UserContext";
import { useContext, useEffect } from "react";
import EditProfileForm from "./EditMemberProfile";

export default function Profile() {
  const { User } = useContext(UserContext);

  useEffect(() => {
    document.title = "My Profile | TESC Portal";
  }, []);

  return (
    <div className="flex min-h-screen w-full flex-col gap-10 px-[min(15px,2vw)] pb-12 mt-8">
      {User?.role !== "company" && (
        <section className="w-full">
          <EditProfileForm />
        </section>
      )}
    </div>
  );
}
