import { useEffect, useState, useCallback } from "react";
import { io } from "socket.io-client";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import axios from "axios";
import { debounce } from "lodash";

const API_BASE_URL = 'http://localhost:8000';
console.log("this is api base url ",API_BASE_URL);
// initialized api connectijn to backend
const socket = io(API_BASE_URL, { transports: ["websocket"] });

const Editor = ({ documentId, onContentChange, externalContent  }) => {
  const [content, setContent] = useState("");
  const [documentTitle, setDocumentTitle] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!documentId) return;

    socket.emit("join-document", documentId);

    const handleDocumentUpdate = (newContent) => {
      setContent(newContent);
      onContentChange(newContent);
    };

    socket.on("document-updated", handleDocumentUpdate);

    axios
      .get(`${API_BASE_URL}/api/collaboration/${documentId}`)
      .then((res) => {
        setContent(res.data.content || "");
        setDocumentTitle(res.data.title || "Untitled Document");
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
      socket.emit("edit-document", { documentId, content: value });
      setIsSaving(false);
    }, 1000),
    [documentId]
  );


  const handleChange = (value) => {
    setContent(value);
    setIsSaving(true);
    emitChange(value);
    onContentChange(value); 
    
  };

  useEffect(() => {
    if (externalContent !== undefined && externalContent !== content) {
      setContent(externalContent);
      // onContentChange(externalContent);
    }
  }, [externalContent])


  return (
    <div className="h-full w-full p-4 border border-gray-300 rounded-md bg-white shadow-md">
      <h1 className="text-2xl font-bold mb-4 text-gray-800">{documentTitle}</h1>
      <div className="flex justify-between items-center mb-2 text-sm text-gray-600">
        <span>Editing: {documentId}</span>
        <span>{isSaving ? "Saving..." : "Saved"}</span>
      </div>
      <ReactQuill value={content} onChange={handleChange} className="h-[80vh]" />
    </div>
  );
};

export default Editor;