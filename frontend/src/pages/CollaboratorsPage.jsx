import { useEffect, useState, useMemo } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { listCollaborators, getDocumentById } from "../api/documentService";
import { getUsersByIds } from "../api/users";

export default function CollaboratorsPage() {
  const [params] = useSearchParams();
  const documentId = params.get("documentId");
  const [collaborators, setCollaborators] = useState([]);
  const [doc, setDoc] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!documentId) return;
    setLoading(true);
    Promise.all([
      getDocumentById(documentId),
      listCollaborators(documentId),
    ])
      .then(async ([docRes, collabRes]) => {
        setDoc(docRes.document);
        setRole(docRes.userRole);
        const raw = collabRes.collaborators || [];
        setCollaborators(raw);
        // Enrich with names/emails
        const ids = Array.from(new Set(raw.map(c => c.userId).filter(Boolean)));
        if (ids.length) {
          try {
            const { users } = await getUsersByIds(ids);
            const map = new Map(users.map(u => [u.id, u]));
            setCollaborators(raw.map(c => ({
              ...c,
              user: map.get(c.userId) || null,
            })));
          } catch {}
        }
      })
      .finally(() => setLoading(false));
  }, [documentId]);

  if (!documentId) {
    return (
      <div className="p-6">
        <p className="text-red-600">Missing documentId. Open from a document context.</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-semibold">Collaborators</h1>
          {doc && (
            <p className="text-sm text-gray-600">Document: {doc.title} • Your role: {role || "unknown"}</p>
          )}
        </div>
        <Link to={`/collaborate/${documentId}`} className="px-3 py-2 bg-gray-200 rounded">Back to editor</Link>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="overflow-x-auto bg-white shadow rounded">
          <table className="min-w-full">
            <thead>
              <tr className="text-left border-b">
                <th className="p-3">Name</th>
                <th className="p-3">Email</th>
                <th className="p-3">Role</th>
                <th className="p-3">Joined</th>
                <th className="p-3">Invited By</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(collaborators || []).map((c) => (
                <tr key={c.id} className="border-b">
                  <td className="p-3">{c.user?.name || "-"}</td>
                  <td className="p-3">
                    {c.user?.email ? (
                      <a className="text-blue-600 hover:underline" href={`mailto:${c.user.email}`}>{c.user.email}</a>
                    ) : "-"}
                  </td>
                  <td className="p-3">{c.role}</td>
                  <td className="p-3">{c.joined_at ? new Date(c.joined_at).toLocaleString() : "-"}</td>
                  <td className="p-3 font-mono text-xs">{c.invitedBy || "-"}</td>
                  <td className="p-3">
                    {c.user?.email && (
                      <a className="px-2 py-1 bg-gray-100 rounded hover:bg-gray-200 text-sm" href={`mailto:${c.user.email}`}>Send Email</a>
                    )}
                  </td>
                </tr>
              ))}
              {(!collaborators || collaborators.length === 0) && (
                <tr>
                  <td className="p-3" colSpan={4}>No collaborators yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}