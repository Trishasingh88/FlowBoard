
import { useEffect, useState } from "react";
import { X, Plus, Trash2 } from "lucide-react";

const emptyTask = {
  title: "",
  description: "",
  priority: "Medium",
  assignee: "",
  dueDate: "",
  status: "todo",
  tags: [],
  comments: [],
};

export default function TaskModal({
  open,
  initialTask,
  defaultStatus,
  onClose,
  onSave,
}) {
  const [form, setForm] = useState(emptyTask);
  const [tagInput, setTagInput] = useState("");

  useEffect(() => {
    if (open) {
      setForm({
        ...emptyTask,
        ...initialTask,
        tags: initialTask?.tags || [],
        comments: initialTask?.comments || [],
        status: initialTask?.status || defaultStatus || "todo",
      });
      setTagInput("");
    }
  }, [open, initialTask, defaultStatus]);

  if (!open) return null;

  const update = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const addTag = () => {
    const tag = tagInput.trim();
    if (tag && !form.tags.includes(tag)) {
      update("tags", [...form.tags, tag]);
    }
    setTagInput("");
  };

  const submit = (event) => {
    event.preventDefault();
    if (!form.title.trim()) return;

    onSave({
      ...form,
      title: form.title.trim(),
      description: form.description.trim(),
    });
  };

  const field =
    "w-full rounded-xl border border-white/10 bg-[#0d1120] px-3 py-2.5 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-indigo-400";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/75 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <form
        onSubmit={submit}
        className="my-auto w-full max-w-xl rounded-2xl border border-white/10 bg-[#13182a] p-5 shadow-2xl sm:p-7"
      >
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-[0.2em] text-indigo-400">
              Task management
            </p>
            <h2 className="text-xl font-bold text-white">
              {initialTask ? "Edit task" : "Create a task"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-white/10 hover:text-white"
          >
            <X size={19} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-xs text-slate-400">
              Task title *
            </label>
            <input
              autoFocus
              required
              maxLength={150}
              className={field}
              placeholder="e.g. Build responsive dashboard"
              value={form.title}
              onChange={(e) => update("title", e.target.value)}
            />
          </div>

          <div>
            <label className="mb-2 block text-xs text-slate-400">
              Description
            </label>
            <textarea
              rows={3}
              maxLength={2000}
              className={field}
              placeholder="What needs to be done?"
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-xs text-slate-400">
                Priority
              </label>
              <select
                className={field}
                value={form.priority}
                onChange={(e) => update("priority", e.target.value)}
              >
                <option>Low</option>
                <option>Medium</option>
                <option>High</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-xs text-slate-400">
                Status
              </label>
              <select
                className={field}
                value={form.status}
                onChange={(e) => update("status", e.target.value)}
              >
                <option value="todo">To Do</option>
                <option value="progress">In Progress</option>
                <option value="review">Review</option>
                <option value="done">Done</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-xs text-slate-400">
                Assignee
              </label>
              <input
                maxLength={80}
                className={field}
                placeholder="e.g. Trisha"
                value={form.assignee}
                onChange={(e) => update("assignee", e.target.value)}
              />
            </div>

            <div>
              <label className="mb-2 block text-xs text-slate-400">
                Due date
              </label>
              <input
                type="date"
                className={field}
                value={form.dueDate}
                onChange={(e) => update("dueDate", e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-xs text-slate-400">
              Tags
            </label>
            <div className="flex gap-2">
              <input
                maxLength={30}
                className={field}
                placeholder="Design, Frontend, Bug..."
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addTag();
                  }
                }}
              />
              <button
                type="button"
                onClick={addTag}
                className="rounded-xl bg-indigo-500 px-3 text-white hover:bg-indigo-400"
              >
                <Plus size={17} />
              </button>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {form.tags.map((tag) => (
                <button
                  type="button"
                  key={tag}
                  onClick={() =>
                    update(
                      "tags",
                      form.tags.filter((item) => item !== tag)
                    )
                  }
                  className="flex items-center gap-1 rounded-lg bg-indigo-500/10 px-2 py-1 text-xs text-indigo-300"
                  title="Remove tag"
                >
                  {tag} <Trash2 size={11} />
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-7 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-white/10 px-4 py-2.5 text-sm text-slate-300 hover:bg-white/5"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rounded-xl bg-indigo-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 hover:bg-indigo-400"
          >
            {initialTask ? "Save changes" : "Create task"}
          </button>
        </div>
      </form>
    </div>
  );
}
