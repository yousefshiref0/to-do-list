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
  avatarSeed: number;
}

export interface Task {
  id: string;
  ref: string;
  title: string;
  description: string;
  priority: Priority;
  status: TaskStatus;
  assigneeId: string | "all";
  createdAt: string;
  dueDate?: string;
  createdBy: string;
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
  jobNumber: string;
  date: string;
  supervisor: string;
  arrivalTime: string;
  departureTime: string;
  stationName: string;
  stationManager: string;
  orderSummary: string;

  productQuality?: Rating3;
  productQualityNotes: string;

  caliper?: Caliper;
  caliperNotes: string;

  washing?: Rating3;
  washingNotes: string;

  packingMaterial?: Rating3;
  packingMaterialNotes: string;

  temperatureTreatment?: Rating3;
  temperatureC: string;
  temperatureNotes: string;

  packingWeightSize?: Rating3;
  packingWeightSizeNotes: string;

  palletsCheck?: StampedT;
  palletsCheckNotes: string;

  palletsConditionType?: PalletNew;
  palletsConditionStrength?: PalletStrength;
  palletsConditionNotes: string;

  palletsPreparedWeight: string;
  palletsPreparedWrapping?: YesNo;
  palletsPreparedNotes: string;

  fitting?: FittingT;
  fittingNotes: string;

  storageCondition: string;

  loadingStart: string;
  loadingEnd: string;

  containerWashed?: YesNo;
  containerWashedNotes: string;

  testingTempCondition: string;
  finalLoadingDetails: string;

  inspectorName: string;
  signature: string;

  submittedAt: string;
  submittedById: string;
}

interface Store {
  tasks: Task[];
  employees: Employee[];
  reports: InspectionReport[];
  currentEmployeeId: string;
  setCurrentEmployeeId: (id: string) => void;
  addTask: (t: Omit<Task, "id" | "ref" | "createdAt" | "status" | "createdBy">) => void;
  updateTaskStatus: (id: string, status: TaskStatus) => void;
  deleteTask: (id: string) => void;
  addEmployee: (e: Omit<Employee, "id" | "avatarSeed">) => void;
  removeEmployee: (id: string) => void;
  addReport: (r: Omit<InspectionReport, "id" | "submittedAt">) => void;
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
      { id: "e1", name: "Ahmed", role: "Driver", avatarSeed: 1 },
      { id: "e2", name: "Mohamed", role: "Dispatcher", avatarSeed: 2 },
    ],
    reports: [],
    currentEmployeeId: "e1",
  });

  useEffect(() => {
    async function fetchData() {
      try {
        const { data: tasks, error: tErr } = await supabase.auth.getSession().then(() => 
          supabase.from("tasks").select("*").order("createdAt", { ascending: false })
        );
        const { data: employees, error: eErr } = await supabase.from("employees").select("*");
        const { data: reports, error: rErr } = await supabase.from("reports").select("*").order("submittedAt", { ascending: false });

        if (tErr || eErr || rErr) {
          console.warn("Error fetching from Supabase, using local state:", { tErr, eErr, rErr });
          return;
        }

        setState((prev) => ({
          ...prev,
          tasks: tasks || prev.tasks,
          employees: employees || prev.employees,
          reports: reports || prev.reports,
          currentEmployeeId: (employees && employees.length > 0) ? employees[0].id : prev.currentEmployeeId,
        }));
      } catch (error) {
        console.error("فشل الاتصال بسوبابيس:", error);
      }
    }
    fetchData();
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
            dueDate: t.dueDate,
            assigneeId: t.assigneeId,
            ref,
            status: "pending",
            createdBy: "Admin",
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
    }
  }, []);

  const updateTaskStatus: Store["updateTaskStatus"] = useCallback(async (id, status) => {
    await supabase.from("tasks").update({ status }).eq("id", id);

    setState((s) => ({
      ...s,
      tasks: s.tasks.map((t) => (t.id === id ? { ...t, status } : t)),
    }));
  }, []);

  const deleteTask: Store["deleteTask"] = useCallback(async (id) => {
    await supabase.from("tasks").delete().eq("id", id);

    setState((s) => ({
      ...s,
      tasks: s.tasks.filter((t) => t.id !== id),
    }));
  }, []);

  const addEmployee: Store["addEmployee"] = useCallback(async (e) => {
    const { data, error } = await supabase
      .from("employees")
      .insert([
        {
          ...e,
          avatarSeed: Math.floor(Math.random() * 100),
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Error adding employee:", error);
      return;
    }

    setState((s) => ({
      ...s,
      employees: [...s.employees, data],
    }));
  }, []);

  const removeEmployee: Store["removeEmployee"] = useCallback(async (id) => {
    await supabase.from("employees").delete().eq("id", id);

    setState((s) => ({
      ...s,
      employees: s.employees.filter((e) => e.id !== id),
    }));
  }, []);

  const addReport: Store["addReport"] = useCallback(async (r) => {
    try {
      const { data, error } = await supabase
        .from("reports")
        .insert([
          {
            ...r,
            submittedAt: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (error) throw error;

      setState((s) => ({
        ...s,
        reports: [data, ...s.reports],
      }));

      alert("تم إرسال التقرير بنجاح!");
    } catch (error) {
      console.error("Error adding report:", error);
      alert("فشل إرسال التقرير، راجعي الكونسول.");
    }
  }, []);

  const deleteReport: Store["deleteReport"] = useCallback(async (id) => {
    await supabase.from("reports").delete().eq("id", id);

    setState((s) => ({
      ...s,
      reports: s.reports.filter((r) => r.id !== id),
    }));
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
