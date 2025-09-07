import { useEffect, useMemo, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { getDocumentById, listCollaborators } from "../api/documentService";
import { listTasks, createTask, updateTask, deleteTask } from "../api/tasks";
import { getUsersByIds } from "../api/users";

const STATUS = ["todo", "in_progress", "done"];

export default function TasksPage() {
  const [params] = useSearchParams();
  const documentId = params.get("documentId");

  const [doc, setDoc] = useState(null);
  const [role, setRole] = useState(null);
  const [collaborators, setCollaborators] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);

  const canEdit = role === "editor" || role === "admin";

  useEffect(() => {
    if (!documentId) return;
    setLoading(true);
    Promise.all([
      getDocumentById(documentId),
      listCollaborators(documentId),
      listTasks(documentId),
    ])
      .then(async ([docRes, collabRes, tasksRes]) => {
        setDoc(docRes.document);
        setRole(docRes.userRole);
        const raw = collabRes.collaborators || [];
        setCollaborators(raw);
        setTasks(tasksRes.tasks || []);
        // enrich collaborator ids with names for dropdown labels
        const ids = Array.from(new Set(raw.map(c => c.userId).filter(Boolean)));
        if (ids.length) {
          try {
            const { users } = await getUsersByIds(ids);
            const map = new Map(users.map(u => [u.id, u]));
            setCollaborators(raw.map(c => ({ ...c, user: map.get(c.userId) || null })));
          } catch {}
        }
      })
      .finally(() => setLoading(false));
  }, [documentId]);

  const users = useMemo(() => collaborators.map(c => ({ value: c.userId, label: c.user?.name ? `${c.user.name} (${c.user.email || c.userId})` : c.userId })), [collaborators]);

  const handleCreate = async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    const title = form.title.value.trim();
    const description = form.description.value.trim();
    const assigneeId = form.assigneeId.value || null;
    const dueDate = form.dueDate.value || null;
    if (!title) return;
    const { task } = await createTask(documentId, { title, description, assigneeId, dueDate });
    setTasks(prev => [task, ...prev]);
    form.reset();
  };

  const updateField = async (taskId, field, value) => {
    const { task } = await updateTask(documentId, taskId, { [field]: value });
    setTasks(prev => prev.map(t => t.id === taskId ? task : t));
  };

  const handleDelete = async (taskId) => {
    await deleteTask(documentId, taskId);
    setTasks(prev => prev.filter(t => t.id !== taskId));
  };

  if (!documentId) {
    return (
      <div className="p-6">
        <p className="text-red-600">Missing documentId. Open from a document context.</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Tasks</h1>
          {doc && (
            <p className="text-sm text-gray-600">Document: {doc.title} • Your role: {role || "unknown"}</p>
          )}
        </div>
        <Link to={`/collaborate/${documentId}`} className="px-3 py-2 bg-gray-200 rounded">Back to editor</Link>
      </div>

      {canEdit && (
        <form onSubmit={handleCreate} className="bg-white p-4 rounded shadow space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input name="title" placeholder="Task title" className="border p-2 rounded" />
            <input name="description" placeholder="Description (optional)" className="border p-2 rounded" />
            <select name="assigneeId" className="border p-2 rounded">
              <option value="">Unassigned</option>
              {users.map(u => <option key={u.value} value={u.value}>{u.label}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input type="date" name="dueDate" className="border p-2 rounded" />
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Create</button>
          </div>
        </form>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        {STATUS.map((s) => (
          <div key={s} className="bg-white rounded shadow p-3">
            <h2 className="font-semibold capitalize mb-3">{s.replace("_", " ")}</h2>
            <div className="space-y-2">
              {tasks.filter(t => t.status === s).map((t) => (
                <div key={t.id} className="border rounded p-2">
                  <div className="font-medium">{t.title}</div>
                  {t.description && <div className="text-sm text-gray-600">{t.description}</div>}
                  <div className="text-xs text-gray-500">Assignee: {t.assigneeId || "Unassigned"}</div>
                  <div className="text-xs text-gray-500">Due: {t.dueDate ? new Date(t.dueDate).toLocaleDateString() : "-"}</div>
                  {canEdit && (
                    <div className="flex items-center gap-2 mt-2">
                      <select value={t.status} onChange={e => updateField(t.id, "status", e.target.value)} className="border p-1 rounded text-sm">
                        {STATUS.map(x => <option key={x} value={x}>{x}</option>)}
                      </select>
                      <select value={t.assigneeId || ""} onChange={e => updateField(t.id, "assigneeId", e.target.value || null)} className="border p-1 rounded text-sm">
                        <option value="">Unassigned</option>
                        {users.map(u => <option key={u.value} value={u.value}>{u.label}</option>)}
                      </select>
                      <button onClick={() => handleDelete(t.id)} className="text-red-600 text-sm ml-auto">Delete</button>
                    </div>
                  )}
                </div>
              ))}
              {tasks.filter(t => t.status === s).length === 0 && (
                <div className="text-sm text-gray-500">No tasks</div>
              )}
            </div>
          </div>
        ))}
      </div>

      {loading && <div>Loading...</div>}
    </div>
  );
}