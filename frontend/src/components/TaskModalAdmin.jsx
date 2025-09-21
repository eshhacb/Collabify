import { useMemo, useState } from "react";

export default function TaskModalAdmin({ open, onClose, task, users, onUpdate, onDelete }) {
  const [local, setLocal] = useState(task || null);

  useMemo(() => {
    setLocal(task || null);
  }, [task]);

  if (!open || !task) return null;

  const STATUS = ["todo", "in_progress", "done"];
  const statusColor =
    task.status === "done" ? "bg-green-500" : task.status === "in_progress" ? "bg-blue-500" : "bg-gray-400";

  const updateField = (field, value) => setLocal(prev => ({ ...prev, [field]: value }));

  const handleSave = async () => {
    if (!local) return;
    const fields = {};
    if (local.status !== task.status) fields.status = local.status;
    if (local.assigneeId !== task.assigneeId) fields.assigneeId = local.assigneeId || null;
    if (local.title !== task.title) fields.title = local.title;
    if (local.description !== task.description) fields.description = local.description || null;
    await onUpdate(fields);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white w-full max-w-2xl rounded-lg shadow-xl overflow-hidden">
        <div className="flex items-center gap-3 p-4 border-b">
          <span className={`w-2 h-6 rounded ${statusColor}`} />
          <h3 className="font-semibold text-lg flex-1 truncate">Admin: Manage Task</h3>
          <button className="text-gray-500 hover:text-gray-700" onClick={onClose}>✕</button>
        </div>

        <div className="p-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-600">Title</label>
              <input className="mt-1 w-full border rounded p-2" value={local?.title || ""} onChange={(e) => updateField("title", e.target.value)} />
            </div>
            <div>
              <label className="text-sm text-gray-600">Status</label>
              <select className="mt-1 w-full border rounded p-2" value={local?.status || "todo"} onChange={(e) => updateField("status", e.target.value)}>
                {STATUS.map(s => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="text-sm text-gray-600">Description</label>
              <textarea className="mt-1 w-full border rounded p-2" rows={4} value={local?.description || ""} onChange={(e) => updateField("description", e.target.value)} />
            </div>
            <div>
              <label className="text-sm text-gray-600">Assignee</label>
              <select className="mt-1 w-full border rounded p-2" value={local?.assigneeId || ""} onChange={(e) => updateField("assigneeId", e.target.value || null)}>
                <option value="">Unassigned</option>
                {users.map(u => <option key={u.value} value={u.value}>{u.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm text-gray-600">Due Date</label>
              <input className="mt-1 w-full border rounded p-2" type="date" disabled value={task.dueDate ? new Date(task.dueDate).toISOString().slice(0,10) : ""} readOnly />
            </div>
          </div>

          <div className="text-xs text-gray-500">
            {task.submittedAt ? <div>Submitted: {new Date(task.submittedAt).toLocaleString()}</div> : <div>Not submitted</div>}
            {task.submissionNote && <div className="italic">Note: {task.submissionNote}</div>}
          </div>
        </div>

        <div className="p-4 border-t flex flex-wrap gap-2 justify-end">
          <button className="px-4 py-2 text-red-600" onClick={() => { onDelete(); onClose(); }}>Delete</button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={handleSave}>Save changes</button>
        </div>
      </div>
    </div>
  );
}



