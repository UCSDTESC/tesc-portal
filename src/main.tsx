import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router";

import Form from "@components/adminUser/Form/Form.tsx";
import Bulletin from "@components/Bulletin/Bulletin.tsx";
import Profile from "@components/adminUser/Profile/Profile.tsx";
import { Toaster } from "react-hot-toast";

import Page from "./pageRoot/Page.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Toaster toastOptions={{ className: "mt-[calc(10vh+3.5rem)] " }} gutter={1} />
    <BrowserRouter>
      <Routes>
        <Route element={<Page />}>
          <Route path="" element={<Navigate to="bulletin" />} />
          <Route path="form" element={<Form id={0} onSuccess={function (): void {}} />} />
          <Route path="bulletin">
            <Route path=":postId" element={<Bulletin />} />
            <Route path="" element={<Navigate to="-1" />} />
          </Route>
          <Route path="profile">
            <Route path="" element={<Profile />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>
);
