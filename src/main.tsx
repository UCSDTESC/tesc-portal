import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { BrowserRouter, Routes, Route } from "react-router";
import Form from "./User/Form.tsx";
import DataTable from "./User/DataTable.tsx";
import Home from "./User/Home.tsx";
import Page from "./Page/Page.tsx";
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route element={<Page />}>
          <Route path="" element={<Home />} />
          <Route path="form" element={<Form />} />
          <Route path="data" element={<DataTable />} />
          <Route path="" element={<Page />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>
);
