import React from "react";

const FileInput = ({ id, onChange, accept, className = "" }) => {
  return (
    <input
      id={id}
      type="file"
      accept={accept}
      onChange={onChange}
      className={`shadow appearance-none border border-[#7f5af0] rounded w-full py-2 px-3 bg-[#18181b] text-[#e0e7ef] leading-tight focus:outline-none focus:ring-2 focus:ring-[#7f5af0] text-lg ${className}`}
    />
  );
};

export default FileInput;
