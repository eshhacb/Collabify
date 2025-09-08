export default function TaskModalCollaborator({ open, onClose, task, onSubmit }) {
  if (!open || !task) return null;

  const statusColor =
    task.status === "done" ? "bg-green-500" : task.status === "in_progress" ? "bg-blue-500" : "bg-gray-400";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white w-full max-w-md rounded-lg shadow-xl overflow-hidden">
        <div className="flex items-center gap-3 p-4 border-b">
          <span className={`w-2 h-6 rounded ${statusColor}`} />
          <h3 className="font-semibold text-lg flex-1 truncate">Your Task</h3>
          <button className="text-gray-500 hover:text-gray-700" onClick={onClose}>✕</button>
        </div>
        <div className="p-4 space-y-2">
          <div className="font-medium">{task.title}</div>
          {task.description && <div className="text-sm text-gray-600 whitespace-pre-wrap">{task.description}</div>}
          <div className="text-xs text-gray-500">Status: {task.status.replace("_"," ")}</div>
          <div className="text-xs text-gray-500">Due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '-'}</div>
          {task.submittedAt ? (
            <div className="text-xs text-gray-500">Submitted: {new Date(task.submittedAt).toLocaleString()}</div>
          ) : (
            <div className="text-xs text-gray-500">Not submitted</div>
          )}
          {task.submissionNote && <div className="text-xs text-gray-600 italic">Note: {task.submissionNote}</div>}
        </div>
        <div className="p-4 border-t flex justify-end gap-2">
          {task.status !== 'done' && (
            <button className="px-4 py-2 bg-green-600 text-white rounded" onClick={onSubmit}>Submit with note</button>
          )}
        </div>
      </div>
    </div>
  );
}


