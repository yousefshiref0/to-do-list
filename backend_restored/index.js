import express from "express";
import cors from "cors";
import "dotenv/config";
import { PrismaClient } from "@prisma/client";

if (!process.env.DATABASE_URL) {
  console.error("❌ DATABASE_URL is missing in environment variables");
  if (process.env.NODE_ENV === "production") {
    throw new Error("DATABASE_URL is required in production");
  }
}

const prisma = new PrismaClient();
const app = express();

const allowedOrigins = (process.env.FRONTEND_URL || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const rateLimitStore = new Map();
const isProduction = process.env.NODE_ENV === "production";

function sanitizeError(error) {
  if (error instanceof Error) {
    console.error(`[Error]: ${error.message}`, error.stack);
    if (!isProduction) {
      return { message: error.message, stack: error.stack };
    }
  } else {
    console.error(`[Non-Error thrown]:`, error);
  }
  return isProduction ? "Internal Server Error" : error;
}

function badRequest(res, message) {
  return res.status(400).json({ error: message });
}

function requireString(body, key) {
  return typeof body[key] === "string" && body[key].trim().length > 0;
}

function validateEnum(value, allowed) {
  return typeof value === "string" && allowed.includes(value);
}

function rateLimit(req, res, next) {
  const windowMs = 60_000;
  const maxRequests = isProduction ? 120 : 1000; // Higher limit for dev
  const now = Date.now();
  const ip =
    req.headers["x-forwarded-for"]?.split(",")[0] || req.ip || "unknown";
  const current = rateLimitStore.get(ip) || {
    count: 0,
    resetAt: now + windowMs,
  };

  if (current.resetAt <= now) {
    current.count = 0;
    current.resetAt = now + windowMs;
  }

  current.count += 1;
  rateLimitStore.set(ip, current);

  if (current.count > maxRequests) {
    return res.status(429).json({ error: "Too many requests" });
  }

  return next();
}

function securityHeaders(_, res, next) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()"
  );
  next();
}

app.set("trust proxy", 1);
app.use(securityHeaders);
app.use(rateLimit);
app.use(
  cors({
    origin(origin, callback) {
      // Allow requests with no origin (like mobile apps or curl) or if origin is in allowedOrigins
      if (
        !origin ||
        allowedOrigins.length === 0 ||
        allowedOrigins.includes(origin)
      ) {
        callback(null, true);
      } else {
        console.warn(`[CORS Blocked]: ${origin}`);
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    credentials: true,
  })
);
app.use(express.json({ limit: "1mb" }));

app.get("/", (_, res) => {
  res.json({ message: "Backend server is running" });
});

// --- TASKS ---
app.get("/tasks", async (_, res) => {
  try {
    const tasks = await prisma.task.findMany({
      orderBy: { createdAt: "desc" },
    });

    const modifiedTasks = tasks.map((task) => {
      if (task.description && task.description.includes("[ALL_EMPLOYEES]")) {
        return {
          ...task,
          assigneeId: "all",
          description: task.description.replace("[ALL_EMPLOYEES]", "").trim(),
        };
      }
      return {
        ...task,
        assigneeId: task.assigneeId || "all",
      };
    });

    res.json(modifiedTasks);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: "Failed to fetch tasks", details: sanitizeError(error) });
  }
});

app.post("/tasks", async (req, res) => {
  try {
    const { assigneeId, dueDate, createdBy, ...restOfBody } = req.body;

    if (
      !requireString(req.body, "title") ||
      !requireString(req.body, "description") ||
      !requireString(req.body, "ref") ||
      !validateEnum(req.body.priority, ["urgent", "medium", "low"]) ||
      !validateEnum(req.body.status, ["pending", "acknowledged", "completed"])
    ) {
      return badRequest(res, "Invalid task payload");
    }

    const isAssignAll =
      !assigneeId || assigneeId === "all" || assigneeId.trim() === "";

    let finalDescription = restOfBody.description || "";
    if (isAssignAll) {
      finalDescription = "[ALL_EMPLOYEES] " + finalDescription;
    }

    const prismaPayload = {
      data: {
        ...restOfBody,
        description: finalDescription,
        dueDate: dueDate ? new Date(dueDate) : null,
      },
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
    res
      .status(500)
      .json({ error: "Failed to create task", details: sanitizeError(error) });
  }
});

app.patch("/tasks/:id", async (req, res) => {
  try {
    const { assigneeId, dueDate, createdBy, ...restOfBody } = req.body;
    const updateData = { ...restOfBody };

    if (
      updateData.priority &&
      !validateEnum(updateData.priority, ["urgent", "medium", "low"])
    ) {
      return badRequest(res, "Invalid task priority");
    }

    if (
      updateData.status &&
      !validateEnum(updateData.status, ["pending", "acknowledged", "completed"])
    ) {
      return badRequest(res, "Invalid task status");
    }

    if (dueDate) {
      updateData.dueDate = new Date(dueDate);
    }

    if (assigneeId) {
      const isAssignAll = assigneeId === "all" || assigneeId.trim() === "";

      if (!isAssignAll) {
        updateData.assignee = { connect: { id: assigneeId } };
        if (
          updateData.description &&
          updateData.description.includes("[ALL_EMPLOYEES]")
        ) {
          updateData.description = updateData.description
            .replace("[ALL_EMPLOYEES]", "")
            .trim();
        }
      } else {
        updateData.assignee = { disconnect: true };
        if (
          updateData.description &&
          !updateData.description.includes("[ALL_EMPLOYEES]")
        ) {
          updateData.description = "[ALL_EMPLOYEES] " + updateData.description;
        }
      }
    }

    const updated = await prisma.task.update({
      where: { id: req.params.id },
      data: updateData,
    });

    if (
      updated.description &&
      updated.description.includes("[ALL_EMPLOYEES]")
    ) {
      updated.assigneeId = "all";
      updated.description = updated.description
        .replace("[ALL_EMPLOYEES]", "")
        .trim();
    } else {
      updated.assigneeId = assigneeId;
    }

    res.json(updated);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: "Failed to update task", details: sanitizeError(error) });
  }
});

app.delete("/tasks/:id", async (req, res) => {
  try {
    await prisma.task.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: "Failed to delete task", details: sanitizeError(error) });
  }
});

// --- EMPLOYEES ---
app.get("/employees", async (_, res) => {
  try {
    const employees = await prisma.employee.findMany();
    res.json(employees);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({
        error: "Failed to fetch employees",
        details: sanitizeError(error),
      });
  }
});

app.post("/employees", async (req, res) => {
  try {
    if (!requireString(req.body, "name") || !requireString(req.body, "role")) {
      return badRequest(res, "Invalid employee payload");
    }

    const employee = await prisma.employee.create({ data: req.body });
    res.json(employee);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({
        error: "Failed to create employee",
        details: sanitizeError(error),
      });
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
    console.error(error);
    res
      .status(500)
      .json({
        error: "Failed to fetch reports",
        details: sanitizeError(error),
      });
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

    if (
      !jobNumber ||
      !date ||
      !supervisor ||
      !arrivalTime ||
      !departureTime ||
      !stationName ||
      !stationManager ||
      !orderSummary ||
      !inspectorName ||
      !signature
    ) {
      return badRequest(res, "Invalid report payload");
    }

    let finalSubmittedById = submittedById;
    if (!finalSubmittedById || finalSubmittedById.trim() === "") {
      let firstEmp = await prisma.employee.findFirst();
      if (!firstEmp) {
        firstEmp = await prisma.employee.create({
          data: { name: "Default Employee", role: "Worker", avatarSeed: 1 },
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
    console.error("PRISMA ERROR:", error);
    res
      .status(500)
      .json({
        error: "Failed to create report",
        details: sanitizeError(error),
      });
  }
});

app.delete("/reports/:id", async (req, res) => {
  try {
    await prisma.inspectionReport.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({
        error: "Failed to delete report",
        details: sanitizeError(error),
      });
  }
});

app.delete("/employees/:id", async (req, res) => {
  try {
    await prisma.employee.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({
        error: "Failed to delete employee",
        details: sanitizeError(error),
      });
  }
});

if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 5002;
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
}

process.on("SIGINT", async () => {
  await prisma.$disconnect();
  process.exit(0);
});

export default app;
