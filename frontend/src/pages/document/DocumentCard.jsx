import React from "react";
import { useNavigate } from "react-router-dom";

const DocumentCard = ({ document }) => {
  const navigate = useNavigate(); // ✅ Hook for navigation

  const handleClick = () => {
    navigate(`/collaborate/${document.id}`); // ✅ Navigate to editor with documentId
  };

  return (
    <div
      className="relative bg-white shadow-md rounded-lg hover:shadow-lg p-4 flex flex-col justify-between cursor-pointer transition-all"
      style={{ width: "200px", height: "200px" }} // ✅ Square shape
      onClick={handleClick} // ✅ Navigate on click
    >
      <h3 className="text-lg font-semibold text-center">{document.title}</h3>
      <p className="text-gray-500 text-sm text-center">Click to open</p>
    </div>
  );
};

export default DocumentCard;
