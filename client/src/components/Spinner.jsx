import React from "react";

const Spinner = ({ 
  size = "medium", 
  color = "primary", 
  text = "", 
  className = "" 
}) => {
  const sizeClasses = {
    small: "h-4 w-4",
    medium: "h-6 w-6", 
    large: "h-8 w-8",
    xl: "h-12 w-12"
  };

  const colorClasses = {
    primary: "border-[#7f5af0]",
    secondary: "border-[#2cb67d]",
    white: "border-white",
    gray: "border-gray-400"
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className="flex items-center space-x-2">
        <div
          className={`${sizeClasses[size]} animate-spin rounded-full border-2 border-transparent ${colorClasses[color]} border-t-transparent`}
          style={{
            borderTopColor: 'transparent',
            borderRightColor: 'currentColor',
            borderBottomColor: 'currentColor', 
            borderLeftColor: 'currentColor'
          }}
        ></div>
        {text && (
          <span className="text-sm font-medium text-[#e0e7ef]">
            {text}
          </span>
        )}
      </div>
    </div>
  );
};

// Full page spinner overlay
const FullPageSpinner = ({ text = "Loading..." }) => {
  return (
    <div className="fixed inset-0 bg-[#18181b]/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-[#23272f] rounded-xl p-8 border border-[#7f5af0]/30 shadow-2xl">
        <Spinner size="xl" text={text} className="text-[#7f5af0]" />
      </div>
    </div>
  );
};

// Inline loading state
const InlineSpinner = ({ text = "Loading...", className = "" }) => {
  return (
    <div className={`flex items-center justify-center py-8 ${className}`}>
      <Spinner size="medium" text={text} className="text-[#7f5af0]" />
    </div>
  );
};

// Button spinner
const ButtonSpinner = ({ size = "small" }) => {
  return (
    <div
      className={`${size === 'small' ? 'h-4 w-4' : 'h-5 w-5'} animate-spin rounded-full border-2 border-current border-t-transparent`}
    ></div>
  );
};

export { Spinner, FullPageSpinner, InlineSpinner, ButtonSpinner };
export default Spinner;
