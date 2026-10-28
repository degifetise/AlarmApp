import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

interface Task {
  id: number;
  title: string;
  description: string;
  reminder_at?: string; // Optional reminder timestamp
  created_at?: string;
}

export default function TaskManagerApp() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [reminderAt, setReminderAt] = useState("");
  const [loading, setLoading] = useState(true);

  // State for tracking editing
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editReminderAt, setEditReminderAt] = useState("");

  // Request browser notification permissions on mount
  useEffect(() => {
    if ("Notification" in window && Notification.permission !== "granted") {
      Notification.requestPermission();
    }
    fetchTasks();
  }, []);

  // Alarm / Reminder checker interval
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date().getTime();
      tasks.forEach((task) => {
        if (task.reminder_at) {
          const reminderTime = new Date(task.reminder_at).getTime();
          // Check if current time matches or has passed the reminder time (within a 1-second window)
          if (now >= reminderTime && now - reminderTime < 2000) {
            // Trigger browser notification
            if (
              "Notification" in window &&
              Notification.permission === "granted"
            ) {
              new Notification(`⏰ Alarm: ${task.title}`, {
                body: task.description || "It's time for your scheduled task!",
              });
            }
            // Trigger popup fallback alert
            alert(
              `⏰ ALARM / REMINDER!\n\nTask: ${task.title}\n${task.description ? "Description: " + task.description : ""}`,
            );
          }
        }
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [tasks]);

  async function fetchTasks() {
    setLoading(true);
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .order("id", { ascending: false });

    if (error) {
      console.error("Error fetching tasks:", error);
    } else {
      setTasks(data || []);
    }
    setLoading(false);
  }

  // 2. CREATE - Add a new task with reminder
  async function addTask(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    const newTaskData = {
      title,
      description,
      reminder_at: reminderAt ? new Date(reminderAt).toISOString() : null,
    };

    const { error } = await supabase.from("tasks").insert([newTaskData]);

    if (error) {
      console.error("Error adding task:", error);
    } else {
      setTitle("");
      setDescription("");
      setReminderAt("");
      fetchTasks();
    }
  }

  // 3. UPDATE - Save changes to a task
  function startEditing(task: Task) {
    setEditingId(task.id);
    setEditTitle(task.title);
    setEditDescription(task.description || "");
    setEditReminderAt(task.reminder_at ? task.reminder_at.slice(0, 16) : "");
  }

  async function saveEdit(id: number) {
    if (!editTitle.trim()) return;

    const updatedData = {
      title: editTitle,
      description: editDescription,
      reminder_at: editReminderAt
        ? new Date(editReminderAt).toISOString()
        : null,
    };

    const { error } = await supabase
      .from("tasks")
      .update(updatedData)
      .eq("id", id);

    if (error) {
      console.error("Error updating task:", error);
    } else {
      setEditingId(null);
      fetchTasks();
    }
  }

  // 4. DELETE - Remove a task
  async function deleteTask(id: number) {
    const { error } = await supabase.from("tasks").delete().eq("id", id);
    if (error) {
      console.error("Error deleting task:", error);
    } else {
      fetchTasks();
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 py-10 px-4">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Header */}
        <header className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-blue-400">
            Task Manager with Alarms
          </h1>
          <p className="text-slate-400 text-sm">
            Manage your daily tasks and set fixed alarms powered by React &
            Supabase
          </p>
        </header>

        {/* CREATE Form */}
        <form
          onSubmit={addTask}
          className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg space-y-4"
        >
          <h2 className="text-lg font-semibold text-slate-200">Add New Task</h2>
          <div className="space-y-3">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Task Title (required)..."
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Task Description (optional)..."
              rows={2}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div>
              <label className="block text-xs text-slate-400 mb-1">
                Set Alarm / Reminder Time:
              </label>
              <input
                type="datetime-local"
                value={reminderAt}
                onChange={(e) => setReminderAt(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-2 rounded-lg transition-colors"
          >
            Create Task & Set Alarm
          </button>
        </form>

        {/* READ & UPDATE / DELETE Section */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-200">Your Tasks</h2>

          {loading ? (
            <p className="text-center py-6 text-slate-500">Loading tasks...</p>
          ) : tasks.length === 0 ? (
            <p className="text-center py-6 text-slate-500">
              No tasks created yet. Add one above!
            </p>
          ) : (
            <div className="space-y-3">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className="bg-slate-800 p-5 rounded-xl border border-slate-700 flex flex-col justify-between gap-4"
                >
                  {editingId === task.id ? (
                    /* EDITING MODE */
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-1.5 text-slate-100"
                      />
                      <textarea
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-1.5 text-slate-100"
                        rows={2}
                      />
                      <input
                        type="datetime-local"
                        value={editReminderAt}
                        onChange={(e) => setEditReminderAt(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-1.5 text-slate-100 text-xs"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => saveEdit(task.id)}
                          className="bg-green-600 hover:bg-green-500 text-xs text-white px-3 py-1.5 rounded font-medium"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="bg-slate-700 hover:bg-slate-600 text-xs text-slate-300 px-3 py-1.5 rounded"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* DISPLAY MODE */
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <h3 className="font-semibold text-slate-100">
                          {task.title}
                        </h3>
                        {task.description && (
                          <p className="text-sm text-slate-400">
                            {task.description}
                          </p>
                        )}
                        {task.reminder_at && (
                          <p className="text-xs text-yellow-400 flex items-center gap-1 mt-1">
                            ⏰ Alarm Set for:{" "}
                            {new Date(task.reminder_at).toLocaleString()}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-3">
                        <button
                          onClick={() => startEditing(task)}
                          className="text-xs text-blue-400 hover:text-blue-300 font-medium"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteTask(task.id)}
                          className="text-xs text-red-400 hover:text-red-300 font-medium"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
