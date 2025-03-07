import { useState } from "react";
import Editor from "../components/Editor";
import Sidebar from "../components/Sidebar";
import { useParams } from "react-router-dom";
import AISuggestionModal from "../components/AISuggestionModal";
import axios from "axios";


const CollaborationPage = () => {
    const { documentId } = useParams();
    console.log("this is documentID",documentId);
    const [showModal, setShowModal] = useState(false);
    const [suggestion, setSuggestion] = useState("");
    const [loading, setLoading] = useState(false);
    const [documentContent, setDocumentContent] = useState(""); 

    const handleAISuggestion = async () => {
      console.log("Sending documentContent to backend:", documentContent); // Debugging

      setLoading(true);  //set loading indicator
      try {
          const response = await axios.post("http://localhost:7000/api/ai-suggestion", {
              documentText:documentContent,
          });
          setSuggestion(response.data.suggestion);  // Store AI suggestion
          setShowModal(true); // Show suggestion modal
      } catch (error) {
          console.error("Error getting AI suggestion:", error);
      } finally {
          setLoading(false);
      }
  };

  const handleContentChange = (newContent) => {
    setDocumentContent(newContent); // Update state when content changes
};

const applySuggestion = () => {
  setDocumentContent(suggestion);
  setShowModal(false);
};

  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 p-6 bg-gray-100">
        <h1 className="text-4xl font-semibold mb-6">Collaborate on Document</h1>
        <button 
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition mb-4"
                    onClick={handleAISuggestion}
                    disabled={loading}
                >
                    {loading ? "Generating..." : "Get AI Suggestion"}
                </button>
        <Editor documentId={documentId} externalContent={documentContent} onContentChange={setDocumentContent}/>
        {showModal && (
                    <AISuggestionModal 
                        suggestion={suggestion} 
                        onClose={() => setShowModal(false)} 
                        onAdd={applySuggestion} 
                    />
                )}

      </div>
    </div>
  );
};

export default CollaborationPage;
