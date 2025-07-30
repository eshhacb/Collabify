import React from "react";

const DocumentCard = ({ document }) => {
  return (
    <div
      className="relative bg-white shadow-md rounded-lg hover:shadow-lg p-4 flex flex-col justify-between"
      style={{ width: "200px", height: "200px" }} // ✅ Square shape
    >
      <h3 className="text-lg font-semibold text-center">{document.title}</h3>
      <p className="text-gray-500 text-sm text-center">Click to open</p>
    </div>
  );
};

export default DocumentCard;