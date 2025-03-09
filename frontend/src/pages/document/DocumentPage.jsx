import React,{useEffect,useState} from "react";
import { createNewDocument,getAllDocuments } from "../../api/documentService";
import DocumentCard from "./DocumentCard";



const DocumentPage = () => {
    const [documents, setDocuments] = useState([]);
    const [showPopup, setShowPopup] = useState(false);
    const [newTitle, setNewTitle] = useState("");
  
    useEffect(() => {
      loadDocuments();
    }, []);
  
    const loadDocuments = async () => {
      try {
        const response = await getAllDocuments();
        setDocuments(response.documents);
      } catch (error) {
        console.error("Error loading documents:", error);
      }
    };
  
    const handleAddDocument = async () => {
      if (!newTitle.trim()) {
        alert("Please enter a title!");
        return;
      }
      try {
        const newDoc = await createNewDocument(newTitle);
        setDocuments([...documents, newDoc]);
        setShowPopup(false);
        setNewTitle(""); // Reset input field
      } catch (error) {
        console.error("Error creating document:", error);
      }
    };
  
    return (
      <div className="p-6">
        {/* Header with Plus (+) Button */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold">My Documents</h2>
          <button
            onClick={() => setShowPopup(true)}
            className="bg-green-500 text-white px-4 py-2 rounded-full hover:bg-green-600"
          >
            +
          </button>
        </div>
  
        {/* Document Cards */}
        <div className="grid grid-cols-3 gap-4">
          {documents.map((doc) => (
            <DocumentCard key={doc.id} document={doc} />
          ))}
        </div>
  
        {/* Popup Modal for Creating New Document */}
        {showPopup && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white p-6 rounded-lg shadow-lg w-96">
              <h3 className="text-xl font-semibold mb-4">Create a New Document</h3>
              <input
                type="text"
                placeholder="Enter document title..."
                className="w-full p-2 border rounded mb-4"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
              />
              <div className="flex justify-end">
                <button
                  className="bg-gray-400 text-white px-4 py-2 rounded mr-2"
                  onClick={() => setShowPopup(false)}
                >
                  Cancel
                </button>
                <button
                  className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                  onClick={handleAddDocument}
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };
  
  export default DocumentPage;