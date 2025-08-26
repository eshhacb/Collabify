import React from "react";
import { useNavigate } from "react-router-dom";

const roleBadgeClass = (role) => {
  switch (role) {
    case "admin":
      return "bg-purple-100 text-purple-700";
    case "editor":
      return "bg-blue-100 text-blue-700";
    case "viewer":
      return "bg-gray-100 text-gray-700";
    default:
      return "bg-gray-50 text-gray-600";
  }
};

const DocumentCard = ({ document }) => {
  const navigate = useNavigate();

  const openDoc = () => {
    if (!document?.id) return;
    navigate(`/collaborate/${document.id}`);
  };

  return (
    <div
      className="relative bg-white shadow-md rounded-lg hover:shadow-lg p-4 flex flex-col justify-between cursor-pointer"
      style={{ width: "200px", height: "200px" }}
      onClick={openDoc}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && openDoc()}
    >
      <div className="flex justify-between items-start">
        <h3 className="text-lg font-semibold">{document.title}</h3>
        {document.userRole && (
          <span className={`text-xs px-2 py-1 rounded ${roleBadgeClass(document.userRole)}`}>
            {document.userRole}
          </span>
        )}
      </div>
      <p className="text-gray-500 text-sm text-center">Click to open</p>
    </div>
  );
};

export default DocumentCard;