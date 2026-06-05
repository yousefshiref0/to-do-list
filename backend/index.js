import express from "express";
import cors from "cors";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL || "*", 
  methods: ["GET", "POST", "PATCH", "DELETE"],
  credentials: true
}));
app.use(express.json());

// === 🌟 التعديل الأول: مسار ترحيبي للدومين الرئيسي ===
app.get("/", (_, res) => {
  res.json({ message: "🚀 Backend server is running successfully on Vercel!" });
});

// --- TASKS ---
app.get("/tasks", async (_, res) => {
  try {
    const tasks = await prisma.task.findMany({
      orderBy: { createdAt: "desc" },
    });

    const modifiedTasks = tasks.map(task => {
      if (task.description && task.description.includes("[ALL_EMPLOYEES]")) {
        return {
          ...task,
          assigneeId: "all",
          description: task.description.replace("[ALL_EMPLOYEES]", "").trim() 
        };
      }
      return {
        ...task,
        assigneeId: task.assigneeId || "all" 
      };
    });

    res.json(modifiedTasks);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch tasks" });
  }
});

app.post("/tasks", async (req, res) => {
  try {
    const { assigneeId, dueDate, createdBy, ...restOfBody } = req.body;
    const isAssignAll = !assigneeId || assigneeId === "all" || assigneeId.trim() === "";

    let finalDescription = restOfBody.description || "";
    if (isAssignAll) {
      finalDescription = "[ALL_EMPLOYEES] " + finalDescription;
    }

    const prismaPayload = {
      data: {
        ...restOfBody,
        description: finalDescription,
        dueDate: dueDate ? new Date(dueDate) : null,
      }
    };

    if (!isAssignAll) {
      prismaPayload.data.assignee = { connect: { id: assigneeId } };
      prismaPayload.data.createdBy = { connect: { id: assigneeId } };
    } else {
      const firstEmployee = await prisma.employee.findFirst();
      if (firstEmployee) {
        prismaPayload.data.createdBy = { connect: { id: firstEmployee.id } };
      }
    }

    const task = await prisma.task.create(prismaPayload);
    
    if (isAssignAll) {
      task.assigneeId = "all";
      task.description = task.description.replace("[ALL_EMPLOYEES]", "").trim();
    } else {
      task.assigneeId = assigneeId;
    }

    res.json(task);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create task", details: error.message });
  }
});

app.patch("/tasks/:id", async (req, res) => {
  try {
    const { assigneeId, dueDate, createdBy, ...restOfBody } = req.body;
    const updateData = { ...restOfBody };
    
    if (dueDate) {
      updateData.dueDate = new Date(dueDate);
    }

    if (assigneeId) {
      const isAssignAll = assigneeId === "all" || assigneeId.trim() === "";
      
      if (!isAssignAll) {
        updateData.assignee = { connect: { id: assigneeId } };
        if (updateData.description && updateData.description.includes("[ALL_EMPLOYEES]")) {
          updateData.description = updateData.description.replace("[ALL_EMPLOYEES]", "").trim();
        }
      } else {
        updateData.assignee = { disconnect: true };
        if (updateData.description && !updateData.description.includes("[ALL_EMPLOYEES]")) {
          updateData.description = "[ALL_EMPLOYEES] " + updateData.description;
        }
      }
    }

    const updated = await prisma.task.update({
      where: { id: req.params.id },
      data: updateData,
    });

    if (updated.description && updated.description.includes("[ALL_EMPLOYEES]")) {
      updated.assigneeId = "all";
      updated.description = updated.description.replace("[ALL_EMPLOYEES]", "").trim();
    } else {
      updated.assigneeId = assigneeId;
    }

    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to update task" });
  }
});

app.delete("/tasks/:id", async (req, res) => {
  try {
    await prisma.task.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete task" });
  }
});

// --- EMPLOYEES ---
app.get("/employees", async (_, res) => {
  const employees = await prisma.employee.findMany();
  res.json(employees);
});

app.post("/employees", async (req, res) => {
  try {
    const employee = await prisma.employee.create({ data: req.body });
    res.json(employee);
  } catch (error) {
    res.status(500).json({ error: "Failed to create employee" });
  }
});

// --- REPORTS ---
app.get("/reports", async (_, res) => {
  try {
    const reports = await prisma.inspectionReport.findMany({
      orderBy: { submittedAt: "desc" },
    });
    res.json(reports);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch reports" });
  }
});

app.post("/reports", async (req, res) => {
  try {
    const {
      jobNumber,
      date,
      supervisor,
      arrivalTime,
      departureTime,
      stationName,
      stationManager,
      orderSummary,
      inspectorName,
      signature,
      submittedById,
      ...rest
    } = req.body;

    let finalSubmittedById = submittedById;
    if (!finalSubmittedById || finalSubmittedById.trim() === "") {
      let firstEmp = await prisma.employee.findFirst();
      if (!firstEmp) {
        firstEmp = await prisma.employee.create({
          data: { name: "Default Employee", role: "Worker", avatarSeed: 1 }
        });
      }
      finalSubmittedById = firstEmp.id;
    }

    const report = await prisma.inspectionReport.create({
      data: {
        jobNumber,
        date: new Date(date),
        supervisor,
        arrivalTime,
        departureTime,
        stationName,
        stationManager,
        orderSummary,
        inspectorName,
        signature,
        submittedById: finalSubmittedById,
        ...rest,
      },
    });

    res.json(report);
  } catch (error) {
    console.error("🔥 PRISMA ERROR:", error);
    res.status(500).json({ error: "Failed to create report", details: error.message });
  }
});

app.delete("/reports/:id", async (req, res) => {
  try {
    await prisma.inspectionReport.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete report" });
  }
});

app.delete("/employees/:id", async (req, res) => {
  try {
    await prisma.employee.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to delete employee" });
  }
});

// التشغيل المحلي التقليدي
const PORT = process.env.PORT || 5002;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

process.on("SIGINT", async () => {
  await prisma.$disconnect();
  process.exit(0);
});

// === 🌟 التعديل الثاني والأساسي لـ Vercel ===
export default app;