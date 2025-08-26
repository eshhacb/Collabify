import { useEffect, useState, useCallback } from "react";
import { io } from "socket.io-client";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import axios from "axios";
import { debounce } from "lodash";
import CustomEditor from "./CustomEditor"; 
import { getDocumentById } from "../api/documentService";
import { config } from "../config.js";

const API_BASE_URL = config.API_URL;
const SOCKET_URL = config.SOCKET_URL;

// Initialize socket to collaboration service
const socket = io(SOCKET_URL, { transports: ["websocket", "polling"], withCredentials: true });

const Editor = ({ documentId, onContentChange, externalContent  }) => {
  const [content, setContent] = useState("");
  const [documentTitle, setDocumentTitle] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [userRole, setUserRole] = useState(null); // viewer | editor | admin

  // Fetch role from document service
  useEffect(() => {
    if (!documentId) return;
    getDocumentById(documentId)
      .then(({ document, userRole }) => {
        setUserRole(userRole);
        if (document?.title) setDocumentTitle(document.title);
      })
      .catch((err) => {
        console.error("Error fetching document role/title:", err);
      });
  }, [documentId]);

  useEffect(() => {
    if (!documentId) return;

    socket.emit("join-document", documentId);

    const handleDocumentUpdate = (newContent) => {
      setContent(newContent);
      onContentChange(newContent);
    };

    socket.on("document-updated", handleDocumentUpdate);

    axios
      .get(`${API_BASE_URL}/api/collaboration/${documentId}`, { withCredentials: false })
      .then((res) => {
        setContent(res.data.content || "");
        setDocumentTitle((prev) => prev || res.data.title || "Untitled Document");
        onContentChange(res.data.content || "");
      })
      .catch((err) => console.error("Error fetching document:", err));

    return () => {
      socket.off("document-updated", handleDocumentUpdate);
      socket.emit("leave-document", documentId);
    };
  }, [documentId,onContentChange]);

  const emitChange = useCallback(
    debounce((value) => {
      console.log("Sending updated content to backend:", value);
      socket.emit("edit-document", { documentId, content: value });
      setIsSaving(false);
    }, 1000),
    [documentId]
  );


  const handleChange = (value) => {
    setContent(value);
    setIsSaving(true);
    // Only emit change if user can edit
    if (userRole === "editor" || userRole === "admin") {
      emitChange(value);
    }
    onContentChange(value); 
    
  };

  useEffect(() => {
    console.log("Received externalContent in Editor:", externalContent);
    if (externalContent !== undefined && externalContent !== content) {
      setContent(externalContent);
      console.log("Updated editor content:", externalContent);
      // onContentChange(externalContent);
    }
  }, [externalContent])


  const readOnly = userRole === "viewer";

  return (
    <div className="h-full w-full p-4 border border-gray-300 rounded-md bg-white shadow-md">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-gray-800">{documentTitle || "Untitled Document"}</h1>
        <div className="text-sm text-gray-600 flex items-center gap-2">
          <span className={`px-2 py-1 rounded ${
            userRole === 'admin' ? 'bg-purple-100 text-purple-700' :
            userRole === 'editor' ? 'bg-blue-100 text-blue-700' :
            userRole === 'viewer' ? 'bg-gray-100 text-gray-700' : ''
          }`}>
            Role: {userRole || 'unknown'}
          </span>
          <span>{isSaving ? "Saving..." : "Saved"}</span>
        </div>
      </div>
      {/* <ReactQuill value={content} onChange={handleChange} className="h-[80vh]" /> */}
      <CustomEditor value={content} onChange={handleChange} readOnly={readOnly} />
      {readOnly && (
        <p className="mt-2 text-sm text-gray-500">You have view-only access to this document.</p>
      )}
    </div>
  );
};

export default Editor;