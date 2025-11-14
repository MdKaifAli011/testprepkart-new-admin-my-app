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
    return <FaCog className="text-3xl sm:text-4xl md:text-5xl text-gray-700" />;
  }
  if (name.includes("NEET")) {
    return (
      <FaSyringe className="text-3xl sm:text-4xl md:text-5xl text-white" />
    );
  }
  if (name.includes("SAT")) {
    return (
      <FaUniversity className="text-3xl sm:text-4xl md:text-5xl text-gray-700" />
    );
  }
  if (name.includes("IB")) {
    return (
      <FaLightbulb className="text-3xl sm:text-4xl md:text-5xl text-yellow-400" />
    );
  }
  return <FaBook className="text-3xl sm:text-4xl md:text-5xl text-gray-700" />;
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
      <section className="bg-linear-to-b from-purple-50 via-purple-50/50 to-white py-10 sm:py-12 md:py-16 lg:py-24 xl:py-28">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 md:gap-8 lg:gap-6 items-center">
            {/* Left Content */}
            <div className="order-1 md:order-1 lg:order-1 lg:col-span-5 space-y-5 md:space-y-6 max-w-2xl mx-auto md:mx-0">
              {/* Tag */}
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-sm mx-auto md:mx-0">
                <FaTrophy className="text-yellow-500 text-sm" />
                <span className="text-xs sm:text-sm font-medium text-gray-700">
                  Entrance Exam Preparation For Students Worldwide
                </span>
              </div>

              {/* Main Heading */}
              <h1 className="text-3xl sm:text-[2.35rem] md:text-4xl lg:text-5xl font-bold text-gray-900 leading-tight text-center md:text-left">
                Highest NRI Selections From USA & Middle East
              </h1>

              {/* Subheading */}
              <p className="text-base sm:text-lg text-gray-600 leading-relaxed text-center md:text-left">
                Helping NRI students prepare for JEE / NEET / SAT / IB with
                highest selection rate
              </p>

              {/* CTA Button */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-start gap-3 sm:gap-4 md:gap-3">
                <button className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl">
                  <span>Schedule Demo Session</span>
                  <FaArrowRight className="text-sm" />
                </button>
                <Link
                  href="#"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-blue-600 font-semibold rounded-lg border border-blue-100 hover:border-blue-200 hover:bg-blue-50 transition-colors shadow-sm"
                >
                  Learn More
                  <FaArrowRight className="text-sm" />
                </Link>
              </div>
            </div>

            {/* Center Image */}
            <div className="order-3 md:order-2 lg:order-2 lg:col-span-4 md:col-span-1 flex justify-center items-center relative w-full">
              <div className="relative w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-full">
                <div className="absolute inset-0 bg-pink-200 rounded-full blur-3xl opacity-40 md:opacity-30"></div>
                <div className="relative bg-white border border-gray-100 rounded-2xl aspect-5/6 sm:aspect-4/5 flex items-center justify-center shadow-lg">
                  <FaUsers className="text-5xl sm:text-6xl text-gray-300" />
                </div>
              </div>
            </div>

            {/* Right Featured Course Card */}
            <div className="order-2 md:order-3 lg:order-3 lg:col-span-3 md:col-span-2 w-full">
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-5 sm:p-6 hover:shadow-xl transition-shadow max-w-sm md:max-w-xl lg:max-w-none mx-auto md:mx-auto lg:mx-0">
                {/* Course Image */}
                <div className="relative w-full h-36 sm:h-40 bg-linear-to-br from-blue-100 to-purple-100 rounded-lg mb-4 flex items-center justify-center overflow-hidden">
                  <div className="absolute inset-0 bg-white/40"></div>
                  <FaBook className="text-3xl sm:text-4xl text-gray-400 relative z-10" />
                </div>

                {/* Stats */}
                <div className="flex flex-wrap items-center gap-3 sm:gap-4 mb-3 text-xs sm:text-sm text-gray-600">
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
                <div className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
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
      <section className="py-14 sm:py-16 md:py-20 lg:py-24 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Heading Section */}
          <div className="text-center mb-10 sm:mb-12">
            <p className="text-xs sm:text-sm md:text-base text-purple-600 font-medium mb-2">
              ONLINE PREP FOR
            </p>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 leading-tight">
              Mastered{" "}
              <span className="text-purple-600">Entrance Examinations</span>
            </h2>
            <p className="text-base sm:text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
              We help NRI students prepare for following entrance examination
              and provide an ecosystem from planning to admission.
            </p>
          </div>

          {/* Exam Category Cards */}
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6 xl:gap-8">
              {[...Array(4)].map((_, index) => (
                <div
                  key={index}
                  className="bg-gray-200 animate-pulse rounded-xl h-64 sm:h-72 xl:h-80"
                />
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-10 sm:py-12">
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg inline-block">
                {error}
              </div>
            </div>
          ) : memoizedExams.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6 xl:gap-8">
              {memoizedExams.map((exam) => (
                <Suspense
                  key={exam._id}
                  fallback={
                    <div className="bg-gray-200 animate-pulse rounded-xl h-64 sm:h-72 xl:h-80" />
                  }
                >
                  <ExamCard exam={exam} />
                </Suspense>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 sm:py-12 text-gray-500">
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
