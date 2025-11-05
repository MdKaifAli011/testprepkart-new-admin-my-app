"use client";
import React from "react";
import MainLayout from "../layout/MainLayout";
import { FaSpinner } from "react-icons/fa";
import { PLACEHOLDERS } from "@/constants";

const LoadingState = () => {
  return (
    <MainLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <FaSpinner className="text-indigo-600 text-4xl animate-spin mx-auto mb-4" />
            <p className="text-gray-600">{PLACEHOLDERS.LOADING}</p>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default LoadingState;
