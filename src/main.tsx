import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import User from "./User/User.tsx";
import Form from "./User/Form.tsx";
import DataTable from "./User/DataTable.tsx";
import Home from "./User/Home.tsx";
import Page from "./Page/Page.tsx";
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="" element={<Page />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
);
