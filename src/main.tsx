import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import User from "./User.tsx";
import Form from "./Form.tsx";
import DataTable from "./DataTable.tsx";
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="" element={<Navigate to="LogIn" />} />
        <Route path="LogIn" element={<App />} />
        <Route path="User" element={<User />}>
          <Route path="Form" element={<Form />}></Route>
          <Route path="Data" element={<DataTable />}></Route>
        </Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>
);
