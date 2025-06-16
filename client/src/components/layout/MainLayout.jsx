import React from "react";
import { Outlet } from "react-router-dom";
import OverallSummarySidebar from "./OverallSummarySidebar"; // Corrected path

const MainLayout = () => {
  return (
    <div className="flex h-screen bg-gray-900 text-white">
      <OverallSummarySidebar />
      <main className="flex-1 overflow-y-auto p-4 md:p-8">
        <Outlet /> {/* This is where the routed page components will render */}
      </main>
    </div>
  );
};

export default MainLayout;
