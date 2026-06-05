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

export function TaskProvider({ children }: { children: ReactNode }) {
const API_URL = "https://to-do-list-of-modern-company-it9r.vercel.app";

const [state, setState] = useState<Persisted>({
  tasks: [],
  employees: [],
  reports: [],
  currentEmployeeId: "e1",
});

useEffect(() => {
  async function fetchData() {
    try {
      const [tasksRes, employeesRes, reportsRes] = await Promise.all([
        fetch(`${API_URL}/tasks`),
        fetch(`${API_URL}/employees`),
        fetch(`${API_URL}/reports`),
      ]);

      if (!tasksRes.ok || !employeesRes.ok || !reportsRes.ok) {
        throw new Error("حدث خطأ في جلب البيانات من السيرفر");
      }

      const tasks = await tasksRes.json();
      const employees = await employeesRes.json();
      const reports = await reportsRes.json(); // نستخدم المتغير النهائي هنا

      setState({
        tasks,
        employees,
        reports,
        currentEmployeeId: employees.length > 0 ? employees[0].id : "", 
      });
    } catch (error) {
      console.error("فشل الاتصال بالسيرفر:", error);
    }
  }
  fetchData();
}, []);
const addTask: Store["addTask"] = useCallback(async (t) => {
  try {
    const response = await fetch(`${API_URL}/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: t.title,
        description: t.description,
        priority: t.priority,
        dueDate: t.dueDate,
        assigneeId: t.assigneeId, // التأكيد على إرساله بشكل صريح للـ Backend
        ref: genRef(),
        status: "pending",
        createdBy: "Admin",
        createdAt: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to add task");
    }

    const newTask = await response.json();

    setState((s) => ({
      ...s,
      tasks: [newTask, ...s.tasks],
    }));
  } catch (error) {
    console.error("Error adding task:", error);
  }
}, []);

const updateTaskStatus: Store["updateTaskStatus"] = useCallback(
  async (id, status) => {
    await fetch(`${API_URL}/tasks/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status }),
    });

    setState((s) => ({
      ...s,
      tasks: s.tasks.map((t) => (t.id === id ? { ...t, status } : t)),
    }));
  },
  [],
);

 const deleteTask: Store["deleteTask"] = useCallback(async (id) => {
  await fetch(`${API_URL}/tasks/${id}`, {
    method: "DELETE",
  });

  setState((s) => ({
    ...s,
    tasks: s.tasks.filter((t) => t.id !== id),
  }));
}, []);

const addEmployee: Store["addEmployee"] = useCallback(async (e) => {
  const response = await fetch(`${API_URL}/employees`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ...e,
      avatarSeed: Math.floor(Math.random() * 100),
    }),
  });

  const newEmployee = await response.json();

  setState((s) => ({
    ...s,
    employees: [...s.employees, newEmployee],
  }));
}, []);

const removeEmployee: Store["removeEmployee"] = useCallback(async (id) => {
  await fetch(`${API_URL}/employees/${id}`, {
    method: "DELETE",
  });

  setState((s) => ({
    ...s,
    employees: s.employees.filter((e) => e.id !== id),
  }));
}, []);

const addReport: Store["addReport"] = useCallback(async (r) => {
  try {
    const response = await fetch(`${API_URL}/reports`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...r,
        submittedAt: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to submit report");
    }

  const newReport = await response.json();
setState((s) => ({
  ...s,
  reports: [newReport, ...s.reports],
}));
    
    alert("تم إرسال التقرير بنجاح!"); // للتأكد من النجاح
  } catch (error) {
    console.error("Error adding report:", error);
    alert("فشل إرسال التقرير، راجعي الكونسول.");
  }
}, []);

const deleteReport: Store["deleteReport"] = useCallback(async (id) => {
  await fetch(`${API_URL}/reports/${id}`, {
    method: "DELETE",
  });

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
