import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router";

import Form from "@components/adminUser/Form/Form.tsx";
import Home from "@components/User/Home.tsx";
import Bulletin from "@components/Bulletin/Bulletin.tsx";
import Profile from "@components/adminUser/Profile/Profile.tsx";
import { Toaster } from "react-hot-toast";

import Page from "./pageRoot/Page.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Toaster />
    <BrowserRouter>
      <Routes>
        <Route element={<Page />}>
          <Route path="" element={<Home />} />
          <Route
            path="form"
            element={<Form id={0} onSuccess={function (): void {}} />}
          />
          <Route path="" element={<Page />} />
          <Route path="bulletin">
            <Route path=":postId" element={<Bulletin />} />
            <Route path="" element={<Navigate to="-1" />} />
          </Route>
          <Route path="profile">
            <Route path="" element={<Profile />}></Route>
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>
);
