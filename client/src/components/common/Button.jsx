import React from "react";

const Button = ({
  onClick,
  type = "button",
  disabled = false,
  children,
  variant = "primary",
  className = "",
}) => {
  const baseStyle =
    "font-bold py-3 px-8 rounded-lg focus:outline-none focus:shadow-outline text-lg transition-all duration-200 cursor-pointer";

  let variantStyle = "";
  switch (variant) {
    case "primary":
      variantStyle =
        "bg-gradient-to-r from-[#7f5af0] to-[#2cb67d] hover:from-[#a786df] hover:to-[#7f5af0] text-white";
      break;
    case "secondary":
      variantStyle = "bg-gray-500 hover:bg-gray-600 text-white";
      break;
    case "danger":
      variantStyle = "bg-red-500 hover:bg-red-600 text-white";
      break;
    case "outline":
      variantStyle =
        "bg-transparent border-2 border-[#7f5af0] text-[#7f5af0] hover:bg-[#7f5af0] hover:text-white";
      break;
    default:
      variantStyle =
        "bg-gradient-to-r from-[#7f5af0] to-[#2cb67d] hover:from-[#a786df] hover:to-[#7f5af0] text-white";
  }

  const disabledStyle = disabled ? "opacity-50 cursor-not-allowed" : "";

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyle} ${variantStyle} ${disabledStyle} ${className}`}
    >
      {children}
    </button>
  );
};

export default Button;
