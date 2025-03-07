import React, { useState } from "react";

const DocumentMenu = ({ documentId }) => {
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState("viewer");

  const handleChangeRole = (newRole) => {
    setRole(newRole);
    console.log(`Updated document ${documentId} role to: ${newRole}`);
    setOpen(false);
  };

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="text-gray-600 text-lg">⋮</button>
      
      {open && (
        <div className="absolute right-0 bg-white shadow-md rounded-lg p-2">
          <button onClick={() => handleChangeRole("admin")} className="block w-full text-left p-2 hover:bg-gray-200">
            Admin
          </button>
          <button onClick={() => handleChangeRole("editor")} className="block w-full text-left p-2 hover:bg-gray-200">
            Editor
          </button>
          <button onClick={() => handleChangeRole("viewer")} className="block w-full text-left p-2 hover:bg-gray-200">
            Viewer
          </button>
        </div>
      )}
    </div>
  );
};

export default DocumentMenu;
