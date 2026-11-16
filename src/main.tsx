import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router";

import Form from "@components/adminUser/Form/Form.tsx";
import Bulletin from "@components/Bulletin/Bulletin.tsx";
import Profile from "@components/adminUser/Profile/Profile.tsx";
import OrgManagement from "@components/adminUser/Profile/OrgManagement.tsx";
import MyEventsPage from "@components/User/MyEventsPage.tsx";
import PageAllAttendEvents from "@components/User/PageAllAttendEvents.tsx";
import { Toaster } from "react-hot-toast";

import { oauthLandingLocation } from "@lib/eventLinks";
import Page from "./pageRoot/Page.tsx";
import "./index.css";

function RedirectWithSearch({ to }: { to: string }) {
  const location = useLocation();
  return <Navigate to={oauthLandingLocation(to, location)} replace />;
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Toaster toastOptions={{ className: "mt-20" }} gutter={1} />
    <BrowserRouter>
      <Routes>
        <Route element={<Page />}>
          <Route path="" element={<RedirectWithSearch to="bulletin/-1" />} />
          <Route path="organization/:id" element={<Navigate to="/org-management" replace />} />
          <Route path="org-management" element={<OrgManagement />} />
          <Route path="form" element={<Form id={""} onSuccess={function (): void {}} />} />
          <Route path="bulletin">
            <Route path=":postId" element={<Bulletin />} />
            <Route path="" element={<RedirectWithSearch to="-1" />} />
          </Route>
          <Route path="profile">
            <Route path="" element={<Profile />} />
            <Route path="attendance-history" element={<PageAllAttendEvents />} />
            <Route
              path="all-attended-events"
              element={<Navigate to="/profile/attendance-history" replace />}
            />
          </Route>
          <Route path="my-events" element={<MyEventsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>,
);
