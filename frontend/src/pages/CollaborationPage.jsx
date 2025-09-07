import { useEffect, useState } from "react";
import Editor from "../components/Editor";
import Sidebar from "../components/Sidebar";
import { useParams } from "react-router-dom";
import AISuggestionModal from "../components/AISuggestionModal";
import InviteModal from "../components/InviteModal";
import InvitationsList from "../components/InvitationsList";
import axios from "axios";
import { getDocumentById } from "../api/documentService";
import { Mail, Users } from "lucide-react";
import { config } from "../config.js";

const CollaborationPage = () => {
  const { documentId } = useParams();
  const [showModal, setShowModal] = useState(false);
  const [suggestion, setSuggestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [documentContent, setDocumentContent] = useState("");
  const [userRole, setUserRole] = useState(null);
  const [document, setDocument] = useState(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showInvitationsList, setShowInvitationsList] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    try { return Number(localStorage.getItem('sidebarWidth')) || 240; } catch { return 240; }
  });

  useEffect(() => {
    if (!documentId) return;
    getDocumentById(documentId)
      .then(({ document, userRole }) => {
        setDocument(document);
        setUserRole(userRole);
      })
      .catch(() => {
        setDocument(null);
        setUserRole(null);
      });
  }, [documentId]);

  useEffect(() => {
    try { localStorage.setItem('sidebarWidth', String(sidebarWidth)); } catch {}
  }, [sidebarWidth]);

  const handleAISuggestion = async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${config.API_URL}/api/ai-suggestion`, {
        documentText: documentContent,
      });
      setSuggestion(response.data.suggestion);
      setShowModal(true);
    } catch (error) {
      console.error("Error getting AI suggestion:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-full min-h-0">
      <Sidebar width={sidebarWidth} onResize={setSidebarWidth} />
      <div className="flex-1 min-w-0 p-6 bg-gray-100 flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-4xl font-semibold">
              {document?.title || 'Collaborate on Document'}
            </h1>
            {userRole && (
              <span className={`inline-block mt-2 text-sm px-2 py-1 rounded ${
                userRole === 'admin' ? 'bg-purple-100 text-purple-700' :
                userRole === 'editor' ? 'bg-blue-100 text-blue-700' :
                'bg-gray-100 text-gray-700'
              }`}>
                Role: {userRole}
              </span>
            )}
          </div>
          {(userRole === 'admin' || userRole === 'editor') && (
            <div className="flex space-x-3">
              <button
                onClick={() => setShowInviteModal(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <Mail className="w-4 h-4" />
                <span>Invite</span>
              </button>
              <button
                onClick={() => setShowInvitationsList(!showInvitationsList)}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                <Users className="w-4 h-4" />
                <span>Invitations</span>
              </button>
            </div>
          )}
        </div>

        {showInvitationsList && (userRole === 'admin' || userRole === 'editor') && (
          <div className="mb-6">
            <InvitationsList 
              documentId={documentId} 
              userRole={userRole}
            />
          </div>
        )}

        {(userRole === 'editor' || userRole === 'admin') && (
          <button
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition mb-4 self-start"
            onClick={handleAISuggestion}
            disabled={loading}
          >
            {loading ? "Generating..." : "Get AI Suggestion"}
          </button>
        )}

        <div className="flex-1 min-h-0">
          <Editor
            documentId={documentId}
            externalContent={documentContent}
            onContentChange={setDocumentContent}
          />
        </div>

        {showInviteModal && (
          <InviteModal
            isOpen={showInviteModal}
            onClose={() => setShowInviteModal(false)}
            documentId={documentId}
            documentTitle={document?.title || 'Untitled Document'}
            onInviteSent={() => {
              if (showInvitationsList) {
                setShowInvitationsList(false);
                setTimeout(() => setShowInvitationsList(true), 100);
              }
            }}
          />
        )}

        {showModal && (
          <AISuggestionModal
            suggestion={suggestion}
            onClose={() => setShowModal(false)}
            onAdd={() => {
              setDocumentContent(suggestion);
              setShowModal(false);
            }}
          />
        )}
      </div>
    </div>
  );
};

export default CollaborationPage;