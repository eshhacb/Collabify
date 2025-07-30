import { useState } from "react";
import { useNavigate } from "react-router-dom";

const DocumentList = () => {
  const [docId, setDocId] = useState("");
  const navigate = useNavigate();

  const openDocument = () => {
    if (!docId.trim()) {
      alert("Please enter a valid Document ID");
      return;
    }
    navigate(`/collaborate/${docId}`);
  };

  return (
    <div>
      <input
        type="text"
        placeholder="Enter Document ID"
        value={docId}
        onChange={(e) => setDocId(e.target.value)}
      />
      <button onClick={openDocument}>Open</button>
    </div>
  );
};

export default DocumentList;
