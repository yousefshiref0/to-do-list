import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { supabase } from "@/lib/supabase";

export type Priority = "urgent" | "medium" | "low";
export type TaskStatus = "pending" | "acknowledged" | "completed";

export interface Employee {
  id: string;
  name: string;
  role: string;
  avatar_seed: number;
}

export interface Task {
  id: string;
  ref: string;
  title: string;
  description: string;
  priority: Priority;
  status: TaskStatus;
  assignee_id: string | "all";
  created_at: string;
  due_date?: string;
  created_by: string;
}
export type Rating3 = "fair" | "good" | "excellent";
export type Caliper = "fair" | "fit" | "perfect";
export type StampedT = "stamped" | "not_stamped";
export type PalletNew = "new" | "used";
export type PalletStrength = "fair" | "strong" | "excellent";
export type FittingT = "strong" | "not_strong";
export type YesNo = "yes" | "no";

export interface InspectionReport {
  id: string;
  job_number: string;
  date: string;
  supervisor: string;
  arrival_time: string;
  departure_time: string;
  station_name: string;
  station_manager: string;
  order_summary: string;

  product_quality?: Rating3;
  product_quality_notes: string;

  caliper?: Caliper;
  caliper_notes: string;

  washing?: Rating3;
  washing_notes: string;

  packing_material?: Rating3;
  packing_material_notes: string;

  temperature_treatment?: Rating3;
  temperature_c: string;
  temperature_notes: string;

  packing_weight_size?: Rating3;
  packing_weight_size_notes: string;

  pallets_check?: StampedT;
  pallets_check_notes: string;

  pallets_condition_type?: PalletNew;
  pallets_condition_strength?: PalletStrength;
  pallets_condition_notes: string;

  pallets_prepared_weight: string;
  pallets_prepared_wrapping?: YesNo;
  pallets_prepared_notes: string;

  fitting?: FittingT;
  fitting_notes: string;

  storage_condition: string;

  loading_start: string;
  loading_end: string;

  container_washed?: YesNo;
  container_washed_notes: string;

  testing_temp_condition: string;
  final_loading_details: string;

  inspector_name: string;
  signature: string;

  submitted_at: string;
  submitted_by_id: string;
}

interface Store {
  tasks: Task[];
  employees: Employee[];
  reports: InspectionReport[];
  currentEmployeeId: string;
  setCurrentEmployeeId: (id: string) => void;
  addTask: (t: Omit<Task, "id" | "ref" | "created_at" | "status" | "created_by">) => void;
  updateTaskStatus: (id: string, status: TaskStatus) => void;
  deleteTask: (id: string) => void;
  addEmployee: (e: Omit<Employee, "id" | "avatar_seed">) => void;
  removeEmployee: (id: string) => void;
  addReport: (r: Omit<InspectionReport, "id" | "submitted_at">) => void;
  deleteReport: (id: string) => void;
}

const Ctx = createContext<Store | null>(null);

interface Persisted {
  tasks: Task[];
  employees: Employee[];
  reports: InspectionReport[];
  currentEmployeeId: string;
}
function genRef(): string {
  const codes = ["LHR", "HKG", "DXB", "RTM", "SGP", "JED", "NYC"];
  const code = codes[Math.floor(Math.random() * codes.length)];
  const num = Math.floor(1000 + Math.random() * 8999);
  return `${code}-${num}`;
}

const API_URL = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/$/, "") : "";

export function TaskProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<Persisted>({
    tasks: [],
    employees: [
      { id: "e1", name: "Ahmed", role: "Driver", avatar_seed: 1 },
      { id: "e2", name: "Mohamed", role: "Dispatcher", avatar_seed: 2 },
    ],
    reports: [],
    currentEmployeeId: "e1",
  });

  useEffect(() => {
    let mounted = true;

    async function fetchData() {
      try {
        if (!mounted) return;

        const [tasksRes, employeesRes, reportsRes] = await Promise.all([
          supabase.from("tasks").select("*").order("created_at", { ascending: false }),
          supabase.from("employees").select("*"),
          supabase.from("reports").select("*").order("submitted_at", { ascending: false }),
        ]);

        // Background auth check without blocking data render
        supabase.auth.getUser().then(({ data: { user } }) => {
          if (mounted && user) {
             // Optional: handle user-specific state if needed
          }
        });

        if (!mounted) return;

        if (tasksRes.error || employeesRes.error || reportsRes.error) {
          console.warn("Supabase fetch mismatch/error:", {
            tErr: tasksRes.error,
            eErr: employeesRes.error,
            rErr: reportsRes.error,
          });
        }

        const tasks = tasksRes.data ?? [];
        const employees = employeesRes.data ?? [];
        const reports = reportsRes.data ?? [];

        setState((prev) => ({
          ...prev,
          tasks,
          employees,
          reports,
          currentEmployeeId: employees.length > 0 ? employees[0].id : prev.currentEmployeeId,
        }));
      } catch (error) {
        console.error("Connection failure:", error);
      }
    }
    fetchData();

    // Set up realtime subscriptions
    const tasksSub = supabase
      .channel("tasks-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "tasks" }, () => fetchData())
      .subscribe();

    return () => {
      mounted = false;
      tasksSub.unsubscribe();
    };
  }, []);

  const addTask: Store["addTask"] = useCallback(async (t) => {
    try {
      const ref = genRef();
      const { data, error } = await supabase
        .from("tasks")
        .insert([
          {
            title: t.title,
            description: t.description,
            priority: t.priority,
            due_date: t.due_date,
            assignee_id: t.assignee_id,
            ref,
            status: "pending",
            created_by: "Admin",
          },
        ])
        .select()
        .single();

      if (error) throw error;

      setState((s) => ({
        ...s,
        tasks: [data, ...s.tasks],
      }));
    } catch (error) {
      console.error("Error adding task:", error);
      alert("Failed to add task. Please try again.");
    }
  }, []);

  const updateTaskStatus: Store["updateTaskStatus"] = useCallback(async (id, status) => {
    try {
      const { error } = await supabase.from("tasks").update({ status }).eq("id", id);
      if (error) throw error;

      setState((s) => ({
        ...s,
        tasks: s.tasks.map((t) => (t.id === id ? { ...t, status } : t)),
      }));
    } catch (error) {
      console.error("Error updating task:", error);
      alert("Failed to update status.");
    }
  }, []);

  const deleteTask: Store["deleteTask"] = useCallback(async (id) => {
    try {
      const { error } = await supabase.from("tasks").delete().eq("id", id);
      if (error) throw error;

      setState((s) => ({
        ...s,
        tasks: s.tasks.filter((t) => t.id !== id),
      }));
    } catch (error) {
      console.error("Error deleting task:", error);
      alert("Failed to delete task.");
    }
  }, []);

  const addEmployee: Store["addEmployee"] = useCallback(async (e) => {
    try {
      const { data, error } = await supabase
        .from("employees")
        .insert([
          {
            ...e,
            avatar_seed: Math.floor(Math.random() * 100),
          },
        ])
        .select()
        .single();

      if (error) throw error;

      setState((s) => ({
        ...s,
        employees: [...s.employees, data],
      }));
    } catch (error) {
      console.error("Error adding employee:", error);
      alert("Failed to add employee.");
    }
  }, []);

  const removeEmployee: Store["removeEmployee"] = useCallback(async (id) => {
    try {
      const { error } = await supabase.from("employees").delete().eq("id", id);
      if (error) throw error;

      setState((s) => ({
        ...s,
        employees: s.employees.filter((e) => e.id !== id),
      }));
    } catch (error) {
      console.error("Error removing employee:", error);
      alert("Failed to remove employee. They might have assigned tasks.");
    }
  }, []);

  const addReport: Store["addReport"] = useCallback(async (r) => {
    try {
      const { data, error } = await supabase
        .from("reports")
        .insert([
          {
            ...r,
            submitted_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (error) throw error;

      setState((s) => ({
        ...s,
        reports: [data, ...s.reports],
      }));

      alert("Success!");
    } catch (error) {
      console.error("Error adding report:", error);
      alert("Failed to submit report.");
    }
  }, []);

  const deleteReport: Store["deleteReport"] = useCallback(async (id) => {
    try {
      const { error } = await supabase.from("reports").delete().eq("id", id);
      if (error) throw error;

      setState((s) => ({
        ...s,
        reports: s.reports.filter((r) => r.id !== id),
      }));
    } catch (error) {
      console.error("Error deleting report:", error);
      alert("Failed to delete report.");
    }
  }, []);

  const setCurrentEmployeeId: Store["setCurrentEmployeeId"] = useCallback(
    (currentEmployeeId) => setState((s) => ({ ...s, currentEmployeeId })),
    [],
  );

  const value = useMemo<Store>(
    () => ({
      ...state,
      setCurrentEmployeeId,
      addTask,
      updateTaskStatus,
      deleteTask,
      addEmployee,
      removeEmployee,
      addReport,
      deleteReport,
    }),
    [
      state,
      setCurrentEmployeeId,
      addTask,
      updateTaskStatus,
      deleteTask,
      addEmployee,
      removeEmployee,
      addReport,
      deleteReport,
    ],
  );

  return createElement(Ctx.Provider, { value }, children);
}

export function useStore() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useStore must be used within TaskProvider");
  return ctx;
}
