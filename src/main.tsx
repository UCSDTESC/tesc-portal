import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import Form from "./Admin/Form/Form.tsx";
import DataTable from "./Admin/Data/DataTable.tsx";
import Home from "./User/Home.tsx";
import Page from "./Page/Page.tsx";
import Bulletin from "./Bulletin/Bulletin.tsx";
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
        </Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>
);
