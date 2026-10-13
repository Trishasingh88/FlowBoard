import { Plus } from "lucide-react";
import TaskCard from "./TaskCard";

const columnStyles = {
  todo: {
    dot: "bg-slate-400",
    badge: "bg-slate-500/10 text-slate-300",
  },
  progress: {
    dot: "bg-sky-400",
    badge: "bg-sky-500/10 text-sky-300",
  },
  review: {
    dot: "bg-amber-400",
    badge: "bg-amber-500/10 text-amber-300",
  },
  done: {
    dot: "bg-emerald-400",
    badge: "bg-emerald-500/10 text-emerald-300",
  },
};

export default function KanbanColumn({
  column,
  tasks = [],
  onAdd,
  onDropTask,
  onDragStart,
  onEdit,
  onDelete,
  onComments,
}) {
  const style = columnStyles[column.id] || columnStyles.todo;

  return (
    <section className="flex min-w-[280px] flex-1 flex-col rounded-2xl border border-white/[0.06] bg-white/[0.018] p-3 sm:min-w-[300px]">
      {/* Column header */}
      <header className="mb-4 flex items-center justify-between px-1">
        <div className="flex items-center gap-2.5">
          <span
            className={`h-2.5 w-2.5 rounded-full ${style.dot}`}
          />

          <h2 className="text-sm font-semibold text-slate-200">
            {column.title}
          </h2>

          <span
            className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${style.badge}`}
          >
            {tasks.length}
          </span>
        </div>

        <button
          type="button"
          onClick={() => onAdd?.(column.id)}
          title={`Add task to ${column.title}`}
          aria-label={`Add task to ${column.title}`}
          className="rounded-lg p-1.5 text-slate-400 transition hover:bg-indigo-500/20 hover:text-indigo-300"
        >
          <Plus size={17} />
        </button>
      </header>

      {/* Tasks and drag-and-drop area */}
      <div
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();

          const taskId = event.dataTransfer.getData("taskId");

          if (taskId) {
            onDropTask?.(taskId, column.id);
          }
        }}
        className="custom-scrollbar flex min-h-[220px] flex-1 flex-col gap-3 overflow-y-auto pb-3"
      >
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onDragStart={onDragStart}
            onEdit={onEdit}
            onDelete={onDelete}
            onComments={onComments}
          />
        ))}

        {/* Empty column state */}
        {tasks.length === 0 && (
          <div className="flex min-h-28 flex-col items-center justify-center rounded-xl border border-dashed border-white/10 text-xs text-slate-600">
            <Plus size={18} className="mb-2" />
            Drop a task here
          </div>
        )}

        {/* Add task button */}
        <button
          type="button"
          onClick={() => onAdd?.(column.id)}
          className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-white/[0.08] py-3 text-xs text-slate-500 transition hover:border-indigo-400/40 hover:text-indigo-300"
        >
          <Plus size={14} />
          Add a task
        </button>
      </div>
    </section>
  );
}
