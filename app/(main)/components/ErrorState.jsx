"use client";
import React from "react";
import MainLayout from "../layout/MainLayout";

const ErrorState = ({ message, errorMessage }) => {
  const displayMessage = message || errorMessage || "An error occurred";

  return (
    <MainLayout>
      <div className="space-y-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {displayMessage}
        </div>
      </div>
    </MainLayout>
  );
};

export default ErrorState;

