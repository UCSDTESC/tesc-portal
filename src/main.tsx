import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import User from "./user.tsx";
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="" element={<Navigate to="LogIn" />} />
        <Route path="LogIn" element={<App />} />
        <Route path="User" element={<User />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
);
