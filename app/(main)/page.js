"use client";
import React, { useState, useEffect, useMemo, Suspense, lazy } from "react";
import Link from "next/link";
import {
  FaTrophy,
  FaBook,
  FaUsers,
  FaStar,
  FaArrowRight,
  FaFlag,
  FaCog,
  FaSyringe,
  FaUniversity,
  FaLightbulb,
  FaSpinner,
} from "react-icons/fa";
import Navbar from "./layout/Navbar";
import Footer from "./layout/Footer";
import { fetchExams, createSlug } from "./lib/api";
import { ERROR_MESSAGES, PLACEHOLDERS, SEO_DEFAULTS } from "@/constants";

// Lazy load components
const ExamCard = lazy(() => import("./components/ExamCard"));

// Default exam icons and styling
const getExamIcon = (examName) => {
  const name = examName?.toUpperCase() || "";
  if (name.includes("JEE")) {
    return <FaCog className="text-4xl md:text-5xl text-gray-700" />;
  }
  if (name.includes("NEET")) {
    return <FaSyringe className="text-4xl md:text-5xl text-white" />;
  }
  if (name.includes("SAT")) {
    return <FaUniversity className="text-4xl md:text-5xl text-gray-700" />;
  }
  if (name.includes("IB")) {
    return <FaLightbulb className="text-4xl md:text-5xl text-yellow-400" />;
  }
  return <FaBook className="text-4xl md:text-5xl text-gray-700" />;
};

const getExamStyle = (examName) => {
  const name = examName?.toUpperCase() || "";
  if (name.includes("JEE")) {
    return {
      bgColor: "bg-yellow-400",
      gradient: "from-yellow-400 to-yellow-500",
    };
  }
  if (name.includes("NEET")) {
    return {
      bgColor: "bg-purple-300",
      gradient: "from-purple-300 to-purple-400",
    };
  }
  if (name.includes("SAT")) {
    return {
      bgColor: "bg-pink-200",
      gradient: "from-pink-200 to-pink-300",
    };
  }
  if (name.includes("IB")) {
    return {
      bgColor: "bg-blue-300",
      gradient: "from-blue-300 to-blue-400",
    };
  }
  return {
    bgColor: "bg-gray-300",
    gradient: "from-gray-300 to-gray-400",
  };
};

const getDefaultServices = (examName) => {
  const name = examName?.toUpperCase() || "";
  if (name.includes("JEE")) {
    return [
      "JEE Prep Courses",
      "NRIs Admission & Help",
      "NRI Quota Application",
      "JEE Prep Resources",
      "JEE Analysis Session",
    ];
  }
  if (name.includes("NEET")) {
    return [
      "NEET Prep Courses",
      "NRIs Admission & Help",
      "NRI Quota Application",
      "NEET Prep Resources",
      "NEET Analysis Session",
    ];
  }
  if (name.includes("SAT")) {
    return [
      "SAT Prep Courses",
      "College Shortlisting",
      "Scholarship Help",
      "Rush Reports",
      "SAT Analysis Session",
    ];
  }
  if (name.includes("IB")) {
    return [
      "IB Prep Courses",
      "MYP & DP Courses",
      "Exam Compatibility",
      "IB Prep Resources",
      "IB Analysis Session",
    ];
  }
  return ["Exam Prep Courses", "Study Materials", "Practice Tests"];
};

const HomePage = () => {
  const [exams, setExams] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Memoize exam data to prevent unnecessary re-renders
  const memoizedExams = useMemo(() => exams, [exams]);

  useEffect(() => {
    let isMounted = true;

    const loadExams = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const fetchedExams = await fetchExams({ limit: 100 });
        if (isMounted) {
          setExams(fetchedExams);
        }
      } catch (err) {
        if (isMounted) {
          setError(ERROR_MESSAGES.FETCH_FAILED);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadExams();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <>
      <Navbar />

      {/* Hero Section */}
      <section className="bg-gradient-to-b from-purple-50 via-purple-50/50 to-white py-12 md:py-20 lg:py-28">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-6 items-center">
            {/* Left Content */}
            <div className="lg:col-span-5 space-y-6">
              {/* Tag */}
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-sm">
                <FaTrophy className="text-yellow-500 text-sm" />
                <span className="text-sm font-medium text-gray-700">
                  Entrance Exam Preparation For Students Worldwide
                </span>
              </div>

              {/* Main Heading */}
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 leading-tight">
                Highest NRI Selections From USA & Middle East
              </h1>

              {/* Subheading */}
              <p className="text-base md:text-lg text-gray-600 leading-relaxed">
                Helping NRI students prepare for JEE / NEET / SAT / IB with
                highest selection rate
              </p>

              {/* CTA Button */}
              <button className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl">
                <span>Schedule Demo Session</span>
                <FaArrowRight className="text-sm" />
              </button>
            </div>

            {/* Center Image */}
            <div className="lg:col-span-4 flex justify-center items-center relative">
              <div className="relative w-full max-w-md">
                <div className="absolute inset-0 bg-pink-200 rounded-full blur-3xl opacity-30"></div>
                <div className="relative bg-gray-200 rounded-2xl aspect-[4/5] flex items-center justify-center">
                  <FaUsers className="text-6xl text-gray-400" />
                </div>
              </div>
            </div>

            {/* Right Featured Course Card */}
            <div className="lg:col-span-3">
              <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-5 hover:shadow-xl transition-shadow">
                {/* Course Image */}
                <div className="relative w-full h-40 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg mb-4 flex items-center justify-center">
                  <div className="absolute inset-0 bg-gray-200 rounded-lg"></div>
                  <FaBook className="text-4xl text-gray-400 relative z-10" />
                </div>

                {/* Stats */}
                <div className="flex items-center gap-4 mb-3 text-sm text-gray-600">
                  <div className="flex items-center gap-1.5">
                    <FaBook className="text-xs" />
                    <span>63 Lessons</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <FaUsers className="text-xs" />
                    <span>1872 Students</span>
                  </div>
                </div>

                {/* Course Title */}
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  JEE Preparation
                </h3>

                {/* Description */}
                <p className="text-sm text-gray-600 mb-3 leading-relaxed">
                  Batch & 1 on 1 Session For NRI Students Worldwide. Get In
                  Touch!
                </p>

                {/* Rating */}
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex items-center gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <FaStar key={i} className="text-yellow-400 text-xs" />
                    ))}
                  </div>
                  <span className="text-xs text-gray-500">(208 Reviews)</span>
                </div>

                {/* Price */}
                <div className="text-2xl font-bold text-gray-900 mb-4">
                  $2136
                </div>

                {/* Explore Link */}
                <Link
                  href="#"
                  className="flex items-center justify-end gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
                >
                  <span>Explore Courses</span>
                  <FaArrowRight className="text-xs" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mastered Entrance Examinations Section */}
      <section className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-4">
          {/* Heading Section */}
          <div className="text-center mb-12">
            <p className="text-sm md:text-base text-purple-600 font-medium mb-2">
              ONLINE PREP FOR
            </p>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Mastered{" "}
              <span className="text-purple-600">Entrance Examinations</span>
            </h2>
            <p className="text-base md:text-lg text-gray-600 max-w-3xl mx-auto">
              We help NRI students prepare for following entrance examination
              and provide an ecosystem from planning to admission.
            </p>
          </div>

          {/* Exam Category Cards */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, index) => (
                <div
                  key={index}
                  className="bg-gray-200 animate-pulse rounded-xl h-96"
                />
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg inline-block">
                {error}
              </div>
            </div>
          ) : memoizedExams.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {memoizedExams.map((exam) => (
                <Suspense
                  key={exam._id}
                  fallback={
                    <div className="bg-gray-200 animate-pulse rounded-xl h-96" />
                  }
                >
                  <ExamCard exam={exam} />
                </Suspense>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <p>{PLACEHOLDERS.NO_DATA}</p>
            </div>
          )}
        </div>
      </section>
      <Footer />
    </>
  );
};

export default HomePage;
