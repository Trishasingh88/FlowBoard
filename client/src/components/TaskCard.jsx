import {
  CalendarDays,
  MessageCircle,
  GripVertical,
  Trash2,
  Pencil,
} from "lucide-react";

const priorityStyles = {
  High: "bg-rose-500/10 text-rose-400 border-rose-500/20",
  Medium: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  Low: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
};

const avatars = [
  "bg-violet-500",
  "bg-sky-500",
  "bg-pink-500",
  "bg-emerald-500",
];

export default function TaskCard({
  task,
  onDragStart,
  onEdit,
  onDelete,
  onComments,
}) {
  const avatarColor =
    avatars[(task.assignee || "").length % avatars.length];

  return (
    <article
      draggable
      onDragStart={(event) => onDragStart?.(event, task)}
      className="group rounded-2xl border border-white/[0.07] bg-[#151a2b] p-4 shadow-lg shadow-black/10 transition duration-200 hover:-translate-y-1 hover:border-indigo-400/40 hover:bg-[#191f34]"
    >
      {/* Priority and actions */}
      <div className="mb-3 flex items-start justify-between gap-2">
        <span
          className={`rounded-md border px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${
            priorityStyles[task.priority] ||
            priorityStyles.Medium
          }`}
        >
          {task.priority || "Medium"}
        </span>

        <div className="flex items-center gap-1">
          <button
            type="button"
            title="Edit task"
            onClick={() => onEdit?.(task)}
            className="rounded-lg p-1.5 text-slate-500 opacity-70 transition hover:bg-white/10 hover:text-white"
          >
            <Pencil size={14} />
          </button>

          <button
            type="button"
            title="Delete task"
            onClick={() => onDelete?.(task.id)}
            className="rounded-lg p-1.5 text-slate-500 opacity-70 transition hover:bg-rose-500/10 hover:text-rose-400"
          >
            <Trash2 size={14} />
          </button>

          <GripVertical
            size={17}
            className="cursor-grab text-slate-600"
          />
        </div>
      </div>

      {/* Task title */}
      <h3 className="mb-2 text-sm font-semibold leading-6 text-slate-100">
        {task.title}
      </h3>

      {/* Task description */}
      <p className="mb-4 text-xs leading-5 text-slate-400">
        {task.description || "No description provided."}
      </p>

      {/* Task tags */}
      <div className="mb-4 flex flex-wrap gap-1.5">
        {(task.tags || []).map((tag, index) => (
          <span
            key={`${tag}-${index}`}
            className="rounded-md bg-indigo-400/10 px-2 py-1 text-[10px] font-medium text-indigo-300"
          >
            {tag}
          </span>
        ))}
      </div>

      {/* Assignee, due date, and comments */}
      <div className="flex items-center justify-between gap-2 border-t border-white/[0.06] pt-3">
        <div className="flex min-w-0 items-center gap-2">
          <span
            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white ${avatarColor}`}
          >
            {(task.assignee || "U").slice(0, 2).toUpperCase()}
          </span>

          <span className="max-w-24 truncate text-xs text-slate-400">
            {task.assignee || "Unassigned"}
          </span>
        </div>

        <div className="flex shrink-0 items-center gap-3 text-slate-500">
          {task.dueDate && (
            <span className="flex items-center gap-1 text-[10px]">
              <CalendarDays size={12} />
              {task.dueDate}
            </span>
          )}

          <button
            type="button"
            onClick={() => onComments?.(task)}
            title="View comments"
            aria-label={`View comments for ${task.title}`}
            className="flex items-center gap-1 rounded-md text-[10px] transition hover:text-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          >
            <MessageCircle size={13} />
            {task.comments?.length || 0}
          </button>
        </div>
      </div>
    </article>
  );
}
