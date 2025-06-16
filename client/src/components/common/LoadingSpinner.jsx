import React from "react";

const LoadingSpinner = ({ className = "" }) => {
  return (
    <div className={`flex justify-center items-center ${className}`}>
      <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-[#7f5af0]"></div>
    </div>
  );
};

export default LoadingSpinner;
