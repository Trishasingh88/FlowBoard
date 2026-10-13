
import { useCallback, useEffect, useMemo, useState } from "react";
import { io } from "socket.io-client";
import {
  Activity,
  Bell,
  CheckCircle2,
  ChevronDown,
  CircleHelp,
  Command,
  Filter,
  LayoutDashboard,
  LogOut,
  MoreHorizontal,
  Plus,
  Search,
  Settings2,
  Sparkles,
  Users,
  X,
  Zap,
} from "lucide-react";

import KanbanColumn from "./components/KanbanColumn";
import TaskModal from "./components/TaskModal";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const COLUMNS = [
  { id: "todo", title: "To Do" },
  { id: "progress", title: "In Progress" },
  { id: "review", title: "Review" },
  { id: "done", title: "Done" },
];

const INITIAL_TASKS = [
  {
    id: "1",
    title: "Design the dashboard UI",
    description: "Create a clean, responsive layout with reusable components.",
    status: "todo",
    priority: "High",
    assignee: "Trisha",
    dueDate: "2026-10-18",
    tags: ["Design", "UI/UX"],
    comments: [],
  },
  {
    id: "2",
    title: "Set up project repository",
    description: "Configure Git, project folders and development scripts.",
    status: "todo",
    priority: "Low",
    assignee: "Alex",
    dueDate: "2026-10-20",
    tags: ["Setup"],
    comments: [],
  },
  {
    id: "3",
    title: "Build reusable task cards",
    description: "Create cards with priority, labels and assignee information.",
    status: "progress",
    priority: "High",
    assignee: "Trisha",
    dueDate: "2026-10-16",
    tags: ["Frontend", "React"],
    comments: [],
  },
  {
    id: "4",
    title: "Connect REST API",
    description: "Integrate the React app with Express endpoints.",
    status: "progress",
    priority: "Medium",
    assignee: "Jordan",
    dueDate: "2026-10-19",
    tags: ["API", "Backend"],
    comments: [],
  },
  {
    id: "5",
    title: "Review mobile responsiveness",
    description: "Check layouts at mobile, tablet and desktop breakpoints.",
    status: "review",
    priority: "Medium",
    assignee: "Alex",
    dueDate: "2026-10-17",
    tags: ["Testing"],
    comments: [],
  },
  {
    id: "6",
    title: "Create project documentation",
    description: "Document setup steps and API usage.",
    status: "done",
    priority: "Low",
    assignee: "Jordan",
    dueDate: "2026-10-12",
    tags: ["Docs"],
    comments: [],
  },
];

const getId = () =>
  globalThis.crypto?.randomUUID?.() ||
  `${Date.now()}-${Math.random().toString(36).slice(2)}`;

function Metric({ icon: Icon, label, value, note, color }) {
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-[#111627] p-4 sm:p-5">
      <div className="mb-4 flex items-center justify-between">
        <span className="text-xs text-slate-400">{label}</span>
        <span className={`rounded-xl p-2 ${color}`}>
          <Icon size={17} />
        </span>
      </div>
      <div className="flex items-end justify-between gap-2">
        <span className="text-2xl font-bold tracking-tight text-white">
          {value}
        </span>
        <span className="text-[10px] text-slate-500">{note}</span>
      </div>
    </div>
  );
}

export default function App() {
  const [tasks, setTasks] = useState(INITIAL_TASKS);
  const [connected, setConnected] = useState(false);
  const [query, setQuery] = useState("");
  const [priority, setPriority] = useState("All");
  const [assignee, setAssignee] = useState("All");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [defaultStatus, setDefaultStatus] = useState("todo");
  const [toast, setToast] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [commentsTask, setCommentsTask] = useState(null);
  const [commentText, setCommentText] = useState("");
  const [socket, setSocket] = useState(null);

  const notify = useCallback((message) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2500);
  }, []);

  useEffect(() => {
    const connection = io(API_URL, {
      reconnection: true,
      timeout: 3000,
    });

    setSocket(connection);

    connection.on("connect", () => setConnected(true));
    connection.on("disconnect", () => setConnected(false));

    connection.on("board:update", (incoming) => {
      if (Array.isArray(incoming)) setTasks(incoming);
    });

   connection.on("board:initial", (incoming) => {
  if (Array.isArray(incoming) && incoming.length > 0) {
    setTasks(incoming);
  } else if (Array.isArray(incoming)) {
    connection.emit("board:update", INITIAL_TASKS);
  }
});

    return () => {
      connection.disconnect();
    };
  }, [notify]);

  const publishTasks = (nextTasks) => {
    setTasks(nextTasks);

    if (socket?.connected) {
      socket.emit("board:update", nextTasks);
    }
  };

  const filteredTasks = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    return tasks.filter((task) => {
      const matchesQuery =
        !normalized ||
        [task.title, task.description, task.assignee, ...(task.tags || [])]
          .join(" ")
          .toLowerCase()
          .includes(normalized);

      const matchesPriority =
        priority === "All" || task.priority === priority;

      const matchesAssignee =
        assignee === "All" || task.assignee === assignee;

      return matchesQuery && matchesPriority && matchesAssignee;
    });
  }, [tasks, query, priority, assignee]);

  const doneCount = tasks.filter((task) => task.status === "done").length;
  const progress = tasks.length
    ? Math.round((doneCount / tasks.length) * 100)
    : 0;

  const members = useMemo(
    () => [...new Set(tasks.map((task) => task.assignee).filter(Boolean))],
    [tasks]
  );

  const openCreate = (status = "todo") => {
    setEditingTask(null);
    setDefaultStatus(status);
    setModalOpen(true);
  };

  const openEdit = (task) => {
    setEditingTask(task);
    setDefaultStatus(task.status);
    setModalOpen(true);
  };

  const saveTask = (form) => {
    const exists = tasks.some((task) => task.id === editingTask?.id);

    const nextTasks = exists
      ? tasks.map((task) =>
          task.id === editingTask.id ? { ...task, ...form } : task
        )
      : [...tasks, { ...form, id: getId() }];

    publishTasks(nextTasks);
    setModalOpen(false);
    setEditingTask(null);
    notify(exists ? "Task updated" : "Task created");
  };

  const deleteTask = (id) => {
    const nextTasks = tasks.filter((task) => task.id !== id);
    publishTasks(nextTasks);
    notify("Task deleted");
  };

  const dragStart = (event, task) => {
    event.dataTransfer.setData("taskId", task.id);
    event.dataTransfer.effectAllowed = "move";
  };

  const moveTask = (id, status) => {
    const task = tasks.find((item) => item.id === id);
    if (!task || task.status === status) return;

    publishTasks(
      tasks.map((item) =>
        item.id === id ? { ...item, status } : item
      )
    );
    notify(`Moved to ${COLUMNS.find((col) => col.id === status)?.title}`);
  };

  const addComment = () => {
    const text = commentText.trim();
    if (!text || !commentsTask) return;

    const comment = {
      id: getId(),
      text,
      author: "You",
      createdAt: new Date().toISOString(),
    };

    const nextTasks = tasks.map((task) =>
      task.id === commentsTask.id
        ? { ...task, comments: [...(task.comments || []), comment] }
        : task
    );

    publishTasks(nextTasks);
    setCommentsTask({
      ...commentsTask,
      comments: [...(commentsTask.comments || []), comment],
    });
    setCommentText("");
  };

  return (
    <div className="min-h-screen bg-[#080b16] text-slate-200">
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <aside className="hidden w-[245px] shrink-0 flex-col border-r border-white/[0.06] bg-[#0c1020] px-4 py-5 lg:flex">
          <a href="#" className="mb-10 flex items-center gap-3 px-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-400 to-violet-600 shadow-lg shadow-indigo-500/20">
              <Command size={22} className="text-white" />
            </span>
            <span>
              <span className="block text-sm font-bold text-white">
                FlowBoard
              </span>
              <span className="text-[10px] text-slate-500">
                PROJECT WORKSPACE
              </span>
            </span>
          </a>

          <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-600">
            Workspace
          </p>

          <button className="mb-1 flex items-center gap-3 rounded-xl bg-indigo-500/10 px-3 py-3 text-left text-sm font-medium text-indigo-300">
            <LayoutDashboard size={17} />
            My workspace
          </button>

          <button
            onClick={() => notify("Activity feed coming soon")}
            className="mb-1 flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-slate-400 hover:bg-white/5 hover:text-white"
          >
            <Activity size={17} />
            Activity
          </button>

          <button
            onClick={() => notify("Team management coming soon")}
            className="mb-7 flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-slate-400 hover:bg-white/5 hover:text-white"
          >
            <Users size={17} />
            Team members
          </button>

          <div className="mb-3 flex items-center justify-between px-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-600">
              Projects
            </p>
            <button
              onClick={() => notify("Create-workspace feature coming soon")}
              title="Create project"
              className="text-slate-500 hover:text-white"
            >
              <Plus size={16} />
            </button>
          </div>

          <button className="flex items-center gap-3 rounded-xl bg-white/[0.035] px-3 py-3 text-sm text-slate-200">
            <span className="h-2 w-2 rounded-full bg-violet-400" />
            Website Redesign
          </button>

          <button
            onClick={() => notify("More projects can be added in the next step")}
            className="mt-1 flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-slate-500 hover:bg-white/5 hover:text-white"
          >
            <Plus size={16} />
            Add a project
          </button>

          <div className="mt-auto rounded-2xl border border-indigo-400/15 bg-gradient-to-br from-indigo-500/10 to-violet-500/5 p-4">
            <Sparkles size={19} className="mb-3 text-indigo-300" />
            <p className="text-sm font-semibold text-white">
              Keep work flowing
            </p>
            <p className="mt-1 text-xs leading-5 text-slate-400">
              Break down big ideas into small, actionable tasks.
            </p>
            <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-indigo-400 transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="mt-2 text-[10px] text-slate-500">
              {progress}% of tasks completed
            </p>
          </div>

          <button
            onClick={() => notify("Settings coming soon")}
            className="mt-5 flex items-center gap-3 px-3 py-2 text-sm text-slate-500 hover:text-white"
          >
            <Settings2 size={17} />
            Settings
          </button>
        </aside>

        {/* Main area */}
        <main className="min-w-0 flex-1">
          <header className="sticky top-0 z-20 flex min-h-[70px] items-center justify-between gap-3 border-b border-white/[0.06] bg-[#080b16]/90 px-4 backdrop-blur-xl sm:px-7">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                Workspace <span>/</span> Projects <span>/</span>
                <span className="truncate text-slate-300">Website Redesign</span>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2 sm:gap-4">
              <span
                className={`hidden items-center gap-1.5 text-[10px] sm:flex ${
                  connected ? "text-emerald-400" : "text-amber-400"
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    connected ? "bg-emerald-400" : "bg-amber-400"
                  }`}
                />
                {connected ? "Live sync" : "Connecting"}
              </span>

              <button
                onClick={() => notify("You're all caught up")}
                title="Notifications"
                className="relative rounded-xl p-2 text-slate-400 hover:bg-white/5 hover:text-white"
              >
                <Bell size={18} />
                <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-indigo-400" />
              </button>

              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-pink-400 to-violet-500 text-[10px] font-bold text-white">
                TS
              </span>
            </div>
          </header>

          <div className="mx-auto max-w-[1800px] p-4 sm:p-7">
            {/* Project heading */}
            <section className="mb-7 flex flex-col justify-between gap-5 xl:flex-row xl:items-end">
              <div>
                <div className="mb-3 flex items-center gap-2">
                  <span className="rounded-lg bg-violet-500/15 p-2 text-violet-300">
                    <Zap size={17} />
                  </span>
                  <span className="text-xs font-medium text-violet-300">
                    PRODUCT DEVELOPMENT
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                    Website Redesign
                  </h1>
                  <button
                    onClick={() => notify("Project options coming soon")}
                    title="Project options"
                    className="rounded-lg p-2 text-slate-500 hover:bg-white/5 hover:text-white"
                  >
                    <MoreHorizontal size={20} />
                  </button>
                </div>

                <p className="mt-2 max-w-xl text-sm leading-6 text-slate-400">
                  Plan, track and ship great work together. Every task takes
                  your team one step closer to launch.
                </p>

                <div className="mt-4 flex items-center gap-3">
                  <div className="flex -space-x-2">
                    {members.slice(0, 4).map((member, index) => (
                      <span
                        key={member}
                        title={member}
                        className={`flex h-7 w-7 items-center justify-center rounded-full border-2 border-[#080b16] text-[9px] font-bold text-white ${
                          [
                            "bg-violet-500",
                            "bg-sky-500",
                            "bg-pink-500",
                            "bg-emerald-500",
                          ][index]
                        }`}
                      >
                        {member.slice(0, 2).toUpperCase()}
                      </span>
                    ))}
                  </div>
                  <span className="text-xs text-slate-500">
                    {members.length} contributors
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => notify("Workspace settings coming soon")}
                  className="flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2.5 text-xs font-medium text-slate-300 hover:bg-white/5"
                >
                  <Settings2 size={15} /> Customize
                </button>

                <button
                  onClick={() => openCreate()}
                  className="flex items-center gap-2 rounded-xl bg-indigo-500 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-indigo-500/20 transition hover:bg-indigo-400"
                >
                  <Plus size={16} /> Create task
                </button>
              </div>
            </section>

            {/* Metrics */}
            <section className="mb-7 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <Metric
                icon={LayoutDashboard}
                label="Total tasks"
                value={tasks.length}
                note="All project tasks"
                color="bg-indigo-500/10 text-indigo-300"
              />
              <Metric
                icon={Activity}
                label="In progress"
                value={tasks.filter((task) => task.status === "progress").length}
                note="Currently active"
                color="bg-sky-500/10 text-sky-300"
              />
              <Metric
                icon={CheckCircle2}
                label="Completed"
                value={doneCount}
                note={`${progress}% completion`}
                color="bg-emerald-500/10 text-emerald-300"
              />
              <Metric
                icon={Users}
                label="Team members"
                value={members.length}
                note="Unique assignees"
                color="bg-violet-500/10 text-violet-300"
              />
            </section>

            {/* Toolbar */}
            <section className="mb-5 flex flex-col justify-between gap-3 md:flex-row md:items-center">
              <div className="flex flex-wrap items-center gap-2">
                <button className="flex items-center gap-2 rounded-xl bg-white/[0.07] px-3 py-2.5 text-xs font-medium text-white">
                  <LayoutDashboard size={15} /> Board view
                </button>
                <span className="hidden h-5 w-px bg-white/10 sm:block" />
                <span className="text-xs text-slate-500">
                  {filteredTasks.length} tasks displayed
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-white/[0.08] bg-[#111627] px-3 py-2.5 sm:w-52 sm:flex-none">
                  <Search size={15} className="shrink-0 text-slate-500" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search tasks..."
                    className="w-full min-w-0 bg-transparent text-xs text-white outline-none placeholder:text-slate-600"
                  />
                  {query && (
                    <button onClick={() => setQuery("")} title="Clear search">
                      <X size={13} className="text-slate-500" />
                    </button>
                  )}
                </div>

                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-xs ${
                    showFilters || priority !== "All" || assignee !== "All"
                      ? "border-indigo-400/40 bg-indigo-500/10 text-indigo-300"
                      : "border-white/[0.08] text-slate-400 hover:bg-white/5"
                  }`}
                >
                  <Filter size={14} /> Filters
                </button>

                <button
                  onClick={() => {
                    setQuery("");
                    setPriority("All");
                    setAssignee("All");
                  }}
                  className="rounded-xl px-2 py-2.5 text-xs text-slate-500 hover:text-white"
                >
                  Reset
                </button>
              </div>
            </section>

            {showFilters && (
              <section className="mb-5 flex flex-wrap gap-3 rounded-xl border border-white/[0.06] bg-[#111627] p-4">
                <label className="flex items-center gap-2 text-xs text-slate-400">
                  Priority
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="rounded-lg border border-white/10 bg-[#0c1020] px-3 py-2 text-white outline-none"
                  >
                    <option>All</option>
                    <option>High</option>
                    <option>Medium</option>
                    <option>Low</option>
                  </select>
                </label>

                <label className="flex items-center gap-2 text-xs text-slate-400">
                  Assignee
                  <select
                    value={assignee}
                    onChange={(e) => setAssignee(e.target.value)}
                    className="max-w-40 rounded-lg border border-white/10 bg-[#0c1020] px-3 py-2 text-white outline-none"
                  >
                    <option>All</option>
                    {members.map((member) => (
                      <option key={member}>{member}</option>
                    ))}
                  </select>
                </label>
              </section>
            )}

            {/* Board */}
            <section className="custom-scrollbar -mx-1 flex items-stretch gap-4 overflow-x-auto px-1 pb-5">
              {COLUMNS.map((column) => (
                <KanbanColumn
                  key={column.id}
                  column={column}
                  tasks={filteredTasks.filter(
                    (task) => task.status === column.id
                  )}
                  onAdd={openCreate}
                  onDropTask={moveTask}
                  onDragStart={dragStart}
                  onEdit={openEdit}
                  onDelete={deleteTask}
                  onComments={setCommentsTask}
                />
              ))}
            </section>

            <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.06] py-5 text-[10px] text-slate-600">
              <span>FlowBoard · Team productivity workspace</span>
              <span className="flex items-center gap-2">
                <CircleHelp size={13} />
                Drag tasks between columns to update their status
              </span>
            </footer>
          </div>
        </main>
      </div>

      {/* Create/edit modal */}
      <TaskModal
        open={modalOpen}
        initialTask={editingTask}
        defaultStatus={defaultStatus}
        onClose={() => setModalOpen(false)}
        onSave={saveTask}
      />

      {/* Comments drawer */}
      {commentsTask && (
        <div className="fixed inset-0 z-40 flex justify-end bg-black/60 backdrop-blur-sm">
          <aside className="flex h-full w-full max-w-md flex-col border-l border-white/10 bg-[#111627] p-5 sm:p-7">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-xs text-indigo-300">TASK DISCUSSION</p>
                <h2 className="mt-1 text-lg font-bold text-white">
                  Comments
                </h2>
              </div>
              <button
                onClick={() => setCommentsTask(null)}
                className="rounded-lg p-2 text-slate-400 hover:bg-white/10"
              >
                <X size={18} />
              </button>
            </div>

            <h3 className="mb-2 text-sm font-semibold text-slate-200">
              {commentsTask.title}
            </h3>
            <div className="custom-scrollbar flex-1 space-y-3 overflow-y-auto py-4">
              {(tasks.find((task) => task.id === commentsTask.id)?.comments || [])
                .map((comment) => (
                  <div
                    key={comment.id}
                    className="rounded-xl border border-white/[0.06] bg-white/[0.025] p-3"
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-xs font-semibold text-indigo-300">
                        {comment.author}
                      </span>
                      <span className="text-[10px] text-slate-600">
                        {new Date(comment.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="whitespace-pre-wrap break-words text-sm text-slate-300">
                      {comment.text}
                    </p>
                  </div>
                ))}

              {!(tasks.find((task) => task.id === commentsTask.id)?.comments || []).length && (
                <p className="py-10 text-center text-xs text-slate-500">
                  No comments yet. Start the conversation.
                </p>
              )}
            </div>

            <form
              onSubmit={(event) => {
                event.preventDefault();
                addComment();
              }}
              className="mt-4 border-t border-white/[0.07] pt-4"
            >
              <textarea
                rows={3}
                maxLength={2000}
                value={commentText}
                onChange={(event) => setCommentText(event.target.value)}
                placeholder="Write a comment..."
                className="w-full resize-none rounded-xl border border-white/10 bg-[#0c1020] p-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-indigo-400"
              />
              <button
                type="submit"
                disabled={!commentText.trim()}
                className="mt-3 w-full rounded-xl bg-indigo-500 py-3 text-sm font-semibold text-white hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Post comment
              </button>
            </form>
          </aside>
        </div>
      )}

      {/* Toast notification */}
      {toast && (
        <div
          role="status"
          className="fixed bottom-5 right-5 z-[70] flex items-center gap-3 rounded-xl border border-indigo-400/20 bg-[#191f34] px-4 py-3 text-sm text-white shadow-2xl"
        >
          <CheckCircle2 size={17} className="text-emerald-400" />
          {toast}
        </div>
      )}
    </div>
  );
}
