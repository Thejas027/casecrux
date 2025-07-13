import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Chatbot from "./Chatbot/Chatbot";
import { RiRobot2Fill } from "react-icons/ri";
import { IoClose } from "react-icons/io5";
import { FaFileAlt, FaMagic } from "react-icons/fa";

// Feature Highlights Carousel - horizontal sliding row with 4 visible items
const FeatureHighlightsCarousel = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const scrollRef = React.useRef(null);

  // Combined features from both previous sections with sky blue styling
  const features = [
    {
      title: "AI-Powered",
      icon: (
        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      ),
      description: "Advanced algorithms for intelligent document analysis",
      color: "from-[#0ea5e9] to-[#0284c7]",
    },
    {
      title: "Multi-Level",
      icon: (
        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1V8zm8 0a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1h-4a1 1 0 01-1-1V8zm0 4a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1h-4a1 1 0 01-1-1v-2z"
            clipRule="evenodd"
          />
        </svg>
      ),
      description: "Detailed, concise, and executive analysis options",
      color: "from-[#0284c7] to-[#075985]",
    },
    {
      title: "Dual Methods",
      icon: (
        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M9.504 1.132a1 1 0 01.992 0l1.75 1a1 1 0 11-.992 1.736L10 3.152l-1.254.716a1 1 0 11-.992-1.736l1.75-1zM5.618 4.504a1 1 0 01-.372 1.364L5.016 6l.23.132a1 1 0 11-.992 1.736L3 7.723V8a1 1 0 01-2 0V6a.996.996 0 01.52-.878l1.734-.99a1 1 0 011.364.372zm8.764 0a1 1 0 011.364-.372l1.733.99A.996.996 0 0118 6v2a1 1 0 11-2 0v-.277l-1.254.145a1 1 0 11-.992-1.736L14.984 6l-.23-.132a1 1 0 01-.372-1.364zm-7 4a1 1 0 011.364-.372L10 8.848l1.254-.716a1 1 0 11.992 1.736L11 10.723V11a1 1 0 11-2 0v-.277l-1.246-.855a1 1 0 01-.372-1.364zM3 11a1 1 0 011 1v.277l1.254-.145a1 1 0 01.992 1.736L5.016 14l.23.132a1 1 0 11-.372 1.364l-1.733-.99A.996.996 0 013 14v-2a1 1 0 011-1zm14 0a1 1 0 011 1v2a.996.996 0 01-.52.878l-1.734.99a1 1 0 11-1.364-.372L14.984 14l-.23-.132a1 1 0 11.992-1.736L16.984 12V11a1 1 0 011-1zm-9.618 5.504a1 1 0 011.364.372L10 17.152l1.254-.716a1 1 0 11.992 1.736l-1.75 1a1 1 0 01-.992 0l-1.75-1a1 1 0 01.372-1.364z"
            clipRule="evenodd"
          />
        </svg>
      ),
      description: "Abstractive AI generation + extractive summarization",
      color: "from-[#075985] to-[#0369a1]",
    },
    {
      title: "Search & Batch",
      icon: (
        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
            clipRule="evenodd"
          />
        </svg>
      ),
      description: "Category-based document analysis and processing",
      color: "from-[#0369a1] to-[#0284c7]",
    },
    {
      title: "Lightning Fast",
      icon: (
        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z"
            clipRule="evenodd"
          />
        </svg>
      ),
      description:
        "Get instant results with our optimized AI processing pipeline",
      color: "from-[#0ea5e9] to-[#0284c7]",
    },
    {
      title: "Secure & Reliable",
      icon: (
        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
            clipRule="evenodd"
          />
        </svg>
      ),
      description:
        "Enterprise-grade security with confidentiality at every step",
      color: "from-[#0284c7] to-[#075985]",
    },
  ];

  const nextCard = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setActiveIndex((current) => (current + 1) % features.length);
    setTimeout(() => {
      setIsAnimating(false);
    }, 500);
  };

  const prevCard = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setActiveIndex(
      (current) => (current - 1 + features.length) % features.length
    );
    setTimeout(() => {
      setIsAnimating(false);
    }, 500);
  };

  useEffect(() => {
    let animationId;
    let scrollPosition = 0;
    const scrollSpeed = 0.5; // Adjust for faster or slower scrolling

    const smoothScroll = () => {
      if (!isPaused) {
        scrollPosition += scrollSpeed;

        // When we've scrolled far enough, move the first item to the end
        const baseWidth = 320; // Width of each card (increased from 250)
        const gap = 20; // Gap between cards

        if (scrollPosition >= baseWidth + gap) {
          scrollPosition = 0;
          setActiveIndex((current) => (current + 1) % features.length);
        }

        // Update the visual position of all cards
        if (scrollRef.current) {
          scrollRef.current.style.transform = `translateX(-${scrollPosition}px)`;
        }
      }

      animationId = requestAnimationFrame(smoothScroll);
    };

    // Start the animation
    animationId = requestAnimationFrame(smoothScroll);

    // Clean up
    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [features.length, isPaused]);

  return (
    <div className="relative w-full mx-auto">
      {" "}
      {/* Carousel container with transparent background */}
      <div
        className="relative h-[220px] overflow-hidden rounded-lg border border-[#38bdf8]/10"
        style={{ overflowX: "hidden" }}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* Background elements - removed solid background */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDU2LDE4OSwyNDgsMC4wMykiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIgLz48L3N2Zz4=')] opacity-5"></div>

        {/* Subtle sky blue light effect */}
        <div className="absolute top-0 right-0 w-1/4 h-1/4 bg-[#38bdf8]/5 blur-3xl rounded-full"></div>

        <div className="flex justify-center items-center w-full h-full relative z-10">
          <div
            ref={scrollRef}
            className="relative w-full max-w-[1150px] mx-auto pl-4 pr-4"
            style={{ willChange: "transform" }}
          >
            {features.map((feature, index) => {
              // Calculate position in the row (4 cards visible)
              // Ensure all cards get a position that will make them visible
              const position =
                (index - activeIndex + features.length) % features.length;

              // Animation classes
              let opacityClass = "opacity-100";

              // Base width and spacing for cards
              const baseWidth = 320; // Width of each card (increased from 250)
              const gap = 20; // Gap between cards
              const startOffset = 24; // Starting offset from left

              // For cards positioned far to the right or left, reduce opacity to create a fading effect
              if (position >= 4) {
                opacityClass = "opacity-50";
              } else if (position < 0) {
                opacityClass = "opacity-0";
              }

              return (
                <div
                  key={index}
                  className={`absolute ${opacityClass}`}
                  style={{
                    width: "320px",
                    left: `${startOffset + position * (baseWidth + gap)}px`,
                    top: "50%",
                    transform: "translateY(-50%)",
                    transition: "opacity 500ms ease-in-out",
                  }}
                >
                  <div className="w-full h-[170px] rounded-lg bg-[#0c1e40] border border-[#38bdf8]/10 shadow-[0_4px_25px_rgba(229,179,254,0.35)] hover:shadow-[0_8px_35px_rgba(229,179,254,0.55)] transition-all duration-300 overflow-hidden group cursor-pointer">
                    {/* Subtle background pattern */}
                    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMC4yIiBkPSJNMCAwaDYwdjYwSDB6Ii8+PC9nPjwvc3ZnPg==')] opacity-5"></div>

                    {/* Content with horizontal layout */}
                    <div className="flex h-full">
                      {/* Left side - Icon */}
                      <div className="flex items-center justify-center w-[80px] border-r border-[#38bdf8]/10">
                        <div className="p-3 bg-[#e5b3fe]/10 rounded-full transition-transform group-hover:scale-110 duration-500">
                          <div className="text-[#e5b3fe]">{feature.icon}</div>
                        </div>
                      </div>

                      {/* Right side - Content */}
                      <div className="flex-1 p-4 flex flex-col justify-center">
                        {/* Title */}
                        <h3 className="text-xl font-bold text-white mb-2 group-hover:text-[#d6b9e5] transition-colors duration-300">
                          {feature.title}
                        </h3>

                        {/* Description */}
                        <p className="text-white/80 text-sm leading-relaxed">
                          {feature.description}
                        </p>

                        {/* Bottom line indicator */}
                        <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#38bdf8] group-hover:w-full transition-all duration-500 ease-out"></div>
                      </div>
                    </div>

                    {/* Glow effect on hover */}
                    <div className="absolute -inset-1 bg-[#38bdf8]/5 rounded-lg opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-500"></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      {/* Navigation controls */}
      <div className="flex justify-center items-center mt-6 space-x-6">
        <button
          onClick={prevCard}
          className="p-2 rounded-md bg-[#0c1e40] hover:bg-[#102a55] border border-[#38bdf8]/10 text-[#38bdf8]/80 hover:text-[#38bdf8] transition-all duration-300 hover:shadow-[0_0_10px_rgba(56,189,248,0.3)]"
          aria-label="Previous feature"
          disabled={isAnimating}
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>

        {/* Indicator dots with simplified styling */}
        <div className="flex space-x-2">
          {features.map((_, idx) => {
            // Calculate if this feature is one of the 4 visible ones
            const position =
              (idx - activeIndex + features.length) % features.length;
            const isVisible = position >= 0 && position < 4;

            return (
              <button
                key={idx}
                onClick={() => {
                  if (!isAnimating) {
                    setActiveIndex(idx);
                  }
                }}
                className="relative"
                aria-label={`Go to feature ${idx + 1}`}
              >
                <span
                  className={`block w-2 h-2 rounded-full transition-all duration-300 ${
                    isVisible
                      ? "bg-[#f3c4fb]"
                      : "bg-[#f3c4fb]/20 hover:bg-[#f3c4fb]/40"
                  }`}
                ></span>
                {isVisible && (
                  <span className="absolute inset-0 rounded-full shadow-[0_0_4px_rgba(56,189,248,0.6)]"></span>
                )}
              </button>
            );
          })}
        </div>

        <button
          onClick={nextCard}
          className="p-2 rounded-md bg-[#0c1e40] hover:bg-[#102a55] border border-[#38bdf8]/10 text-[#38bdf8]/80 hover:text-[#38bdf8] transition-all duration-300 hover:shadow-[0_0_10px_rgba(56,189,248,0.3)]"
          aria-label="Next feature"
          disabled={isAnimating}
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      </div>
    </div>
  );
};

// Feature Carousel with vertical rectangle cards
const FeatureCarousel = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [direction, setDirection] = useState(1); // 1 for right, -1 for left

  const features = [
    {
      title: "Single PDF Summarizer",
      icon: (
        <svg
          className="w-6 h-6 text-white"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
            clipRule="evenodd"
          />
        </svg>
      ),
      description:
        "Upload and get instant AI-powered summaries of individual legal documents with key insights and analysis",
      color: "bg-gradient-to-r from-[#c188b2] to-[#7400b8]",
      link: "/pdf-summarizer",
    },
    {
      title: "Advanced PDF Summarizer",
      icon: (
        <svg
          className="w-6 h-6 text-white"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1V8zm8 0a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1h-4a1 1 0 01-1-1V8zm0 4a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1h-4a1 1 0 01-1-1v-2z"
            clipRule="evenodd"
          />
        </svg>
      ),
      description:
        "Multiple levels: Detailed, Concise, Executive analysis with AI-generated insights plus key extraction",
      color: "bg-gradient-to-r from-[#c188b2] to-[#7400b8]",
      isNew: true,
      link: "/advanced-pdf-summarizer",
    },
    {
      title: "Search and Summary",
      icon: (
        <svg
          className="w-6 h-6 text-white"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
            clipRule="evenodd"
          />
        </svg>
      ),
      description:
        "Search and process multiple legal documents by category with comprehensive analysis and final judgments",
      color: "bg-gradient-to-r from-[#c188b2] to-[#7400b8]",
      link: "/category-batch-pdf-summarizer",
    },
  ];

  const nextCard = () => {
    setDirection(1);
    setActiveIndex((current) => (current + 1) % features.length);
  };

  const prevCard = () => {
    setDirection(-1);
    setActiveIndex(
      (current) => (current - 1 + features.length) % features.length
    );
  };

  useEffect(() => {
    const interval = setInterval(() => {
      nextCard();
    }, 5000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [features.length]);

  return (
    <div className="relative w-full max-w-6xl mx-auto px-4">
      {/* Carousel container */}
      <div className="relative h-[550px] overflow-hidden">
        {/* Cards */}
        <div className="flex justify-center">
          {features.map((feature, index) => {
            const isActive = index === activeIndex;
            const isPrev =
              index === activeIndex - 1 ||
              (activeIndex === 0 && index === features.length - 1);
            const isNext =
              index === activeIndex + 1 ||
              (activeIndex === features.length - 1 && index === 0);

            let position = "";
            let opacity = "opacity-0";
            let scale = "scale-90";
            let zIndex = 0;

            if (isActive) {
              position = "translate-x-0";
              opacity = "opacity-100";
              scale = "scale-100";
              zIndex = 30;
            } else if (isPrev) {
              position = "-translate-x-[calc(100%+2rem)]";
              opacity = "opacity-80";
              scale = "scale-90";
              zIndex = 20;
            } else if (isNext) {
              position = "translate-x-[calc(100%+2rem)]";
              opacity = "opacity-80";
              scale = "scale-90";
              zIndex = 20;
            } else {
              position =
                direction > 0
                  ? "translate-x-[calc(200%+4rem)]"
                  : "-translate-x-[calc(200%+4rem)]";
              opacity = "opacity-0";
              zIndex = 10;
            }

            return (
              <Link
                key={index}
                to={feature.link}
                className="absolute inset-0 transition-all duration-500 ease-in-out transform flex justify-center"
                style={{ zIndex }}
              >
                <div
                  className={`w-[300px] h-[500px] ${opacity} ${position} ${scale} transition-all duration-500 bg-[#0f172a] border border-[#38bdf8]/20 rounded-xl overflow-hidden shadow-lg hover:shadow-[0_0_25px_rgba(14,165,233,0.3)] flex flex-col`}
                >
                  {/* Card background with grid pattern */}
                  <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMC41IiBkPSJNMCAwaDYwdjYwSDB6Ii8+PC9nPjwvc3ZnPg==')] opacity-10"></div>

                  {/* Card header with gradient */}
                  <div
                    className={`${feature.color} p-6 relative flex items-center space-x-3`}
                  >
                    <div className="p-3 bg-white/10 rounded-lg">
                      {feature.icon}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white flex items-center">
                        {feature.title}
                        {feature.isNew && (
                          <span className="ml-2 text-xs bg-white/20 text-white px-1.5 py-0.5 rounded-full">
                            New
                          </span>
                        )}
                      </h3>
                    </div>
                  </div>

                  {/* Card content */}
                  <div className="p-6 flex-grow flex flex-col">
                    <div className="mb-6 flex-grow">
                      <p className="text-white/80 text-lg leading-relaxed">
                        {feature.description}
                      </p>
                    </div>

                    {/* Card actions */}
                    <div className="mt-4 pb-4 flex items-center justify-between">
                      <div className="text-white/90 flex items-center group">
                        <span className="font-medium mr-2 group-hover:mr-3 transition-all">
                          Explore
                        </span>
                        <svg
                          className="w-5 h-5 transition-transform group-hover:translate-x-1"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M14 5l7 7m0 0l-7 7m7-7H3"
                          />
                        </svg>
                      </div>

                      {/* Card index */}
                      <span className="text-sm text-white/50">
                        {index + 1}/{features.length}
                      </span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="h-1 w-full bg-white/10 relative overflow-hidden">
                    <div
                      className="h-full bg-white/60 transition-all duration-5000 ease-linear"
                      style={{
                        width: isActive ? "100%" : "0%",
                        animation: isActive ? "progress 5s linear" : "none",
                      }}
                    ></div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Navigation controls */}
      <div className="flex justify-center items-center mt-6 space-x-4">
        <button
          onClick={prevCard}
          className="p-3 rounded-full bg-[#0f172a] hover:bg-[#1e293b] border border-[#38bdf8]/20 text-white/70 hover:text-white transition-colors"
          aria-label="Previous feature"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>

        {/* Indicator dots */}
        <div className="flex space-x-2">
          {features.map((_, idx) => (
            <button
              key={idx}
              onClick={() => {
                setDirection(idx > activeIndex ? 1 : -1);
                setActiveIndex(idx);
              }}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                idx === activeIndex
                  ? "bg-[#0ea5e9]"
                  : "bg-white/20 hover:bg-white/40"
              }`}
              aria-label={`Go to feature ${idx + 1}`}
            />
          ))}
        </div>

        <button
          onClick={nextCard}
          className="p-3 rounded-full bg-[#0f172a] hover:bg-[#1e293b] border border-[#38bdf8]/20 text-white/70 hover:text-white transition-colors"
          aria-label="Next feature"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      </div>
    </div>
  );
};

// Main Home Component

function Home() {
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);
  const navigate = useNavigate();

  const handleUploadPdf = () => {
    navigate("/category-download-summary");
  };

  const handleClickChatBot = () => {
    setIsChatbotOpen((prev) => !prev);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#000000] via-[#111827] to-[#1f2937] relative overflow-hidden">
      {/* Simple background with subtle grid pattern */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDU2LDE4OSwyNDgsMC4wMykiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIgLz48L3N2Zz4=')] opacity-5"></div>
      </div>

      {/* Upload button in top right corner */}
      <div className="absolute top-6 right-6 z-20">
        <button
          onClick={handleUploadPdf}
          className="bg-gradient-to-r from-[#38bdf8] to-[#b090d9] text-white px-6 py-3 rounded-xl font-semibold shadow-lg border border-[#38bdf8]/30"
        >
          Upload PDF
        </button>
      </div>

      {/* Main content - centered design, SVG removed */}
      <div className="min-h-screen px-8 pt-24 pb-12 flex items-center justify-center relative z-10 overflow-hidden">
        <div className="container mx-auto px-4 flex flex-col items-center justify-center relative">
          {/* Subtle grid background for main content */}
          <div
            className="absolute inset-0 pointer-events-none opacity-10 z-0"
            style={{
              backgroundImage:
                "url(data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Crect x='0.5' y='0.5' width='39' height='39' rx='2.5' stroke='%2338bdf8' stroke-opacity='0.15'/%3E%3C/svg%3E)",
              backgroundRepeat: "repeat",
            }}
          ></div>
          {/* Centered content */}
          <div className="space-y-8 text-center w-full max-w-4xl">
            <div>
              <h1 className="text-6xl md:text-7xl font-black mb-6 bg-gradient-to-r from-white via-white to-[#f8f8f8] bg-clip-text text-transparent drop-shadow-xl leading-tight">
                Welcome to{" "}
                <span className="bg-gradient-to-r from-[#64dfdf] to-[#6930c3] bg-clip-text text-transparent">
                  CaseCrux
                </span>
              </h1>
              <div className="h-1.5 w-64 bg-gradient-to-r from-[#0ea5e9] to-[#0284c7] rounded-full shadow-[0_0_15px_rgba(14,165,233,0.5)] mb-8 mx-auto"></div>
            </div>

            <div className="space-y-6">
              <div className="transform hover:scale-105 transition-all duration-300">
                <div className="rounded-xl p-4 bg-gradient-to-r from-slate-800/20 to-slate-900/20 backdrop-blur-sm border border-slate-700/30">
                  <div className="flex items-center justify-center">
                    <p className="text-1xl md:text-2xl text-white/90 leading-relaxed font-medium">
                      Your{" "}
                      <span className="text-[#e0fbfc] font-semibold mx-1">
                        intelligent companion
                      </span>{" "}
                      for legal document analysis
                    </p>
                  </div>
                </div>
              </div>

              <div className="transform hover:scale-105 transition-all duration-300">
                <div className="rounded-xl p-4 bg-gradient-to-r from-slate-800/15 to-slate-900/15 backdrop-blur-sm border border-slate-700/25">
                  <div className="flex items-center justify-center">
                    <p className="text-lg md:text-xl text-[#e2e8f0] leading-relaxed">
                      Powered by{" "}
                      <span className="text-[#0ea5e9] font-medium mx-1">
                        advanced AI
                      </span>{" "}
                      to transform complex legal documents into clear insights
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-6 flex justify-center">
              <button
                onClick={handleUploadPdf}
                className="bg-gradient-to-r from-[#ffcbf2] to-[#0284c7] text-white px-8 py-4 rounded-xl font-semibold text-xl shadow-lg border border-[#38bdf8]/30 hover:shadow-[0_0_30px_rgba(14,165,233,0.5)] hover:scale-105 transition-all duration-300 relative overflow-hidden group"
              >
                <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-[#38bdf8]/20 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-0 transition-transform duration-700 ease-in-out"></span>
                <span className="relative flex items-center space-x-3">
                  <span>Get Started</span>
                  <svg
                    className="w-3 h-3 group-hover:translate-x-1 transition-transform duration-300"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Cards Carousel */}
      <div className="pt-20 pb-20 max-w-7xl mx-auto px-6">
        <div className="text-center mb-10">
          <h2 className="text-6xl font-bold text-white mb-5">Our Features</h2>
          <div className="h-1 w-40 bg-gradient-to-r from-[#0ea5e9] to-[#0284c7] rounded-full mx-auto shadow-[0_0_15px_rgba(14,165,233,0.5)] mb-5"></div>
          <p className="text-[#e2e8f0]/70 max-w-2xl mx-auto">
            Discover the powerful tools that help legal professionals transform
            complex documents into clear insights
          </p>
        </div>
        <FeatureCarousel />
      </div>

      {/* Unified Features Carousel - combining highlights and additional features */}
      <div className="py-20 mb-16 mx-auto max-w-7xl px-6">
        <div className="text-center mb-10">
          <h2 className="text-6xl font-bold text-white mb-5">
            Why Choose CaseCrux
          </h2>
          <div className="h-1 w-40 bg-gradient-to-r from-[#0ea5e9] to-[#0284c7] rounded-full mx-auto shadow-[0_0_15px_rgba(14,165,233,0.5)] mb-5"></div>
          <p className="text-[#e2e8f0]/70 max-w-2xl mx-auto">
            Our platform combines cutting-edge AI with intuitive design to
            deliver an unmatched legal document analysis experience
          </p>
        </div>

        {/* Carousel for features */}
        <div className="relative">
          <FeatureHighlightsCarousel />
        </div>
      </div>

      {/* Footer */}
      <div className="text-center">
        <div className="flex justify-center mb-8">
          <div className="h-px w-80 bg-gradient-to-r from-transparent via-[#7f5af0]/30 to-transparent"></div>
        </div>
        <div className="flex flex-col items-center space-y-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-[#7f5af0] to-[#2cb67d] rounded-lg flex items-center justify-center">
              <svg
                className="w-4 h-4 text-[#18181b]"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <span className="text-lg font-semibold text-[#7f5af0]">
              CaseCrux
            </span>
          </div>
          <p className="text-[#a786df]/60 text-sm">
            &copy; {new Date().getFullYear()} CaseCrux. Transforming legal
            analysis with AI.
          </p>
          <div className="flex space-x-6 text-xs text-[#a786df]/50">
            <span>Privacy Policy</span>
            <span>•</span>
            <span>Terms of Service</span>
            <span>•</span>
            <span>Support</span>
          </div>
        </div>
      </div>
      <div className="fixed bottom-4 right-4 z-50">
        {isChatbotOpen ? (
          <>
            <button
              onClick={handleClickChatBot}
              className="p-3 bg-[#7f5af0] hover:bg-[#6b4fd4] rounded-full shadow-lg transition-all duration-300"
            >
              <IoClose className="w-6 h-6 text-white" />
            </button>
            <div
              onClick={(e) => e.stopPropagation()}
              className="mt-2 bg-[#18181b]/90 backdrop-blur-sm border border-[#7f5af0]/30 rounded-xl shadow-xl"
            >
              <Chatbot />
            </div>
          </>
        ) : (
          <button
            onClick={handleClickChatBot}
            className="p-3 bg-gradient-to-r from-[#7f5af0] to-[#2cb67d] hover:from-[#6b4fd4] hover:to-[#25a06c] rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <RiRobot2Fill className="w-6 h-6 text-white" />
          </button>
        )}
      </div>
    </div>
  );
}

export default Home;
