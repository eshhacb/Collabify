import { useEffect, useMemo, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { getDocumentById, listCollaborators } from "../api/documentService";
import { listTasks, createTask, updateTask, deleteTask, submitTask } from "../api/tasks";
import { getUsersByIds } from "../api/users";
import TaskModalAdmin from "../components/TaskModalAdmin";
import TaskModalCollaborator from "../components/TaskModalCollaborator";

const STATUS = ["todo", "in_progress", "done"];

export default function TasksPage() {
  const [params] = useSearchParams();
  const documentId = params.get("documentId");

  const [doc, setDoc] = useState(null);
  const [role, setRole] = useState(null);
  const [meId, setMeId] = useState(null);
  const [collaborators, setCollaborators] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);

  const canEdit = role === "admin";

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
        setMeId(docRes.userId || docRes.meId || null); // may be null if backend doesn't send it
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

  const users = useMemo(
    () => collaborators
      .filter(c => c.userId && c.userId !== meId)
      .map(c => ({ value: c.userId, label: c.user?.name ? `${c.user.name} (${c.user.email || c.userId})` : c.userId })),
    [collaborators, meId]
  );

  const userById = useMemo(() => {
    const map = new Map();
    for (const c of collaborators) {
      if (c.userId && c.user) map.set(c.userId, c.user);
    }
    return map;
  }, [collaborators]);

  const getInitials = (name, email) => {
    const source = name || email || "?";
    const parts = source.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return source[0]?.toUpperCase() || "?";
  };

  const renderAssignee = (assigneeId) => {
    if (!assigneeId) return { label: "Unassigned", initials: "-" };
    const u = userById.get(assigneeId);
    if (!u) return { label: "Unassigned", initials: "-" };
    const name = u.name || (u.email ? u.email.split("@")[0] : "User");
    const email = u.email || "";
    const label = email ? `${name} • ${email}` : name;
    return { label, initials: getInitials(u.name, u.email) };
  };

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

  const handleSubmitTask = async (taskId) => {
    const note = window.prompt("Add a submission note (optional):") || "";
    const { task } = await submitTask(documentId, taskId, note);
    setTasks(prev => prev.map(t => t.id === taskId ? task : t));
  };

  const isAssignee = (task) => meId && task.assigneeId === meId;

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

      {/* Task cards list with status indicated by color */}
      <div className="space-y-3">
        {tasks.map((t) => {
          const statusClasses =
            t.status === "done"
              ? "border-green-400 bg-green-50"
              : t.status === "in_progress"
              ? "border-blue-400 bg-blue-50"
              : "border-gray-300 bg-white"; // todo
          const statusBadgeClasses =
            t.status === "done"
              ? "bg-green-500 text-white"
              : t.status === "in_progress"
              ? "bg-blue-500 text-white"
              : "bg-gray-300 text-gray-800";
          return (
            <div
              key={t.id}
              className={`border rounded p-3 cursor-pointer ${statusClasses}`}
              onClick={() => setSelected(t)}
            >
              <div className="flex items-start gap-3">
                <span className={`px-2 py-0.5 text-xs rounded capitalize ${statusBadgeClasses}`}>{t.status.replace("_", " ")}</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-medium">{t.title}</div>
                    <div className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{t.dueDate ? new Date(t.dueDate).toLocaleDateString() : "No due"}</div>
                  </div>
                  {t.description && <div className="text-sm text-gray-600 mt-0.5">{t.description}</div>}
                  <div className="flex items-center gap-2 mt-2">
                    {(() => { const a = renderAssignee(t.assigneeId); return (
                      <>
                        <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-[11px] text-gray-700">{a.initials}</div>
                        <div className="text-xs text-gray-700">{a.label}</div>
                      </>
                    ); })()}
                  </div>
                  <div className="text-xs text-gray-500">
                    {t.submittedAt ? `Submitted: ${new Date(t.submittedAt).toLocaleString()}` : "Not submitted"}
                  </div>
                  {t.submissionNote && (
                    <div className="text-xs text-gray-600 italic">Note: {t.submissionNote}</div>
                  )}
                </div>
                {/* Controls moved to modal */}
              </div>
            </div>
          );
        })}
        {tasks.length === 0 && (
          <div className="text-sm text-gray-500">No tasks</div>
        )}
      </div>

      {canEdit ? (
        <TaskModalAdmin
          open={!!selected}
          task={selected}
          users={users}
          onClose={() => setSelected(null)}
          onUpdate={async (fields) => {
            if (!selected) return;
            const { task } = await updateTask(documentId, selected.id, fields);
            setTasks(prev => prev.map(x => x.id === selected.id ? task : x));
          }}
          onDelete={async () => {
            if (!selected) return;
            await deleteTask(documentId, selected.id);
            setTasks(prev => prev.filter(x => x.id !== selected.id));
            setSelected(null);
          }}
        />
      ) : (
        <TaskModalCollaborator
          open={!!selected}
          task={selected}
          onClose={() => setSelected(null)}
          onSubmit={async () => {
            if (!selected) return;
            const note = window.prompt("Add a submission note (optional):") || "";
            const { task } = await submitTask(documentId, selected.id, note);
            setTasks(prev => prev.map(x => x.id === selected.id ? task : x));
            setSelected(null);
          }}
        />
      )}

      {loading && <div>Loading...</div>}
    </div>
  );
}