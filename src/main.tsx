import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router";

import Form from "@components/adminUser/Form/Form.tsx";
import DataTable from "@components/adminUser/Data/DataTable.tsx";
import Home from "@components/User/Home.tsx";
import Bulletin from "@components/Bulletin/Bulletin.tsx";
import Profile from "@components/adminUser/Profile/Profile.tsx";

import Page from "./pageRoot/Page.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route element={<Page />}>
          <Route path="" element={<Home />} />
          <Route
            path="form"
            element={<Form id={0} onSuccess={function (): void {}} />}
          />
          <Route path="data" element={<DataTable />} />
          <Route path="" element={<Page />} />
          <Route path="bulletin">
            <Route path=":postId" element={<Bulletin />} />
            <Route path="" element={<Navigate to="-1" />} />
          </Route>
          <Route path="profile" element={<Profile />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>
);
