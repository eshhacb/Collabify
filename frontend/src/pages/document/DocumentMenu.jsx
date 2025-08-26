import React, { useState } from "react";
import { addCollaborator, updateCollaboratorRole, removeCollaborator } from "../../api/documentService";

// Simple menu that expects admin usage; hide/show based on user's role in parent
const DocumentMenu = ({ documentId, currentUserRole }) => {
  const [open, setOpen] = useState(false);

  const isAdmin = currentUserRole === "admin";

  const handleChangeRole = async (targetUserId, newRole) => {
    if (!isAdmin) return;
    try {
      await updateCollaboratorRole(documentId, targetUserId, newRole);
      setOpen(false);
    } catch (e) {
      console.error("Failed to update role:", e);
      alert(e?.response?.data?.message || "Failed to update role");
    }
  };

  const handleAddCollaborator = async (targetUserId, role) => {
    if (!isAdmin) return;
    try {
      await addCollaborator(documentId, { userId: targetUserId, role });
      setOpen(false);
    } catch (e) {
      console.error("Failed to add collaborator:", e);
      alert(e?.response?.data?.message || "Failed to add collaborator");
    }
  };

  const handleRemoveCollaborator = async (targetUserId) => {
    if (!isAdmin) return;
    try {
      await removeCollaborator(documentId, targetUserId);
      setOpen(false);
    } catch (e) {
      console.error("Failed to remove collaborator:", e);
      alert(e?.response?.data?.message || "Failed to remove collaborator");
    }
  };

  if (!isAdmin) return null; // Only admins see menu

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="text-gray-600 text-lg">⋮</button>
      {open && (
        <div className="absolute right-0 bg-white shadow-md rounded-lg p-2 w-64">
          <div className="text-sm text-gray-700 mb-2">Collaborator Management</div>
          {/* In a real app, replace inputs with a user picker */}
          <div className="flex gap-2 mb-2">
            <input id="user-id-input" className="border rounded p-1 flex-1" placeholder="User ID" />
            <button
              className="px-2 py-1 bg-green-500 text-white rounded"
              onClick={() => {
                const id = document.getElementById('user-id-input').value;
                handleAddCollaborator(id, 'viewer');
              }}
            >
              Add Viewer
            </button>
          </div>
          <div className="flex gap-2">
            <input id="user-id-change" className="border rounded p-1 flex-1" placeholder="User ID" />
            <button
              className="px-2 py-1 bg-blue-500 text-white rounded"
              onClick={() => {
                const id = document.getElementById('user-id-change').value;
                handleChangeRole(id, 'editor');
              }}
            >
              Make Editor
            </button>
            <button
              className="px-2 py-1 bg-purple-500 text-white rounded"
              onClick={() => {
                const id = document.getElementById('user-id-change').value;
                handleChangeRole(id, 'admin');
              }}
            >
              Make Admin
            </button>
          </div>
          <div className="flex gap-2 mt-2">
            <input id="user-id-remove" className="border rounded p-1 flex-1" placeholder="User ID" />
            <button
              className="px-2 py-1 bg-red-500 text-white rounded"
              onClick={() => {
                const id = document.getElementById('user-id-remove').value;
                handleRemoveCollaborator(id);
              }}
            >
              Remove
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentMenu;