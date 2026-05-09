import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import type { ApplicationStatus, ApplyFormData, ServiceApplication, SubmittedDocument } from "@/types";
import type { Database } from "@/types";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

type ApplicationCtx = {
  applications: ServiceApplication[];
  loadingApplications: boolean;
  submitApplication: (data: ApplyFormData) => Promise<ServiceApplication>;
  updateApplicationStatus: (id: string, status: ApplicationStatus, adminNotes?: string) => Promise<void>;
  findByCode: (code: string) => Promise<ServiceApplication | null>;
  myApplications: ServiceApplication[];
};

const STORAGE_KEY = "dayawan_applications";
const TRACK_CODE_BASELINE = 1200;
const SUPABASE_NO_ROWS_ERROR = "PGRST116";

const defaultDemoData: ServiceApplication[] = [
  {
    id: "demo-1",
    code: "DYW-1024",
    user_name: "Ramesh Patil",
    user_email: "ramesh@example.com",
    phone: "9876543210",
    service_id: "aadhaar",
    service_name: "Aadhaar Card Service",
    status: "processing",
    payment_status: "paid",
    payment_provider: "none",
    payment_reference: "DUMMY-1024",
    amount: 50,
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "demo-2",
    code: "DYW-1099",
    user_name: "Sunita Deshmukh",
    user_email: "sunita@example.com",
    phone: "9123456780",
    service_id: "pm-kisan",
    service_name: "PM Kisan",
    status: "ready",
    payment_status: "paid",
    payment_provider: "none",
    payment_reference: "DUMMY-1099",
    amount: 0,
    created_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "demo-3",
    code: "DYW-1001",
    user_name: "Anil Jadhav",
    user_email: "anil@example.com",
    phone: "9988776655",
    service_id: "pan",
    service_name: "PAN Card",
    status: "received",
    payment_status: "paid",
    payment_provider: "none",
    payment_reference: "DUMMY-1001",
    amount: 107,
    created_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
];

const ApplicationContext = createContext<ApplicationCtx | null>(null);

export function ApplicationProvider({ children }: { children: ReactNode }) {
  const { user, status, role, isSuspended } = useAuth();
  const [applications, setApplications] = useState<ServiceApplication[]>(() => loadApplications());
  const [loadingApplications, setLoadingApplications] = useState(false);
  const canUseSupabase = Boolean(isSupabaseConfigured && supabase);

  const refreshApplications = useCallback(async () => {
    if (!canUseSupabase || !supabase || status !== "authenticated") {
      setApplications(loadApplications());
      return;
    }

    setLoadingApplications(true);
    const { data, error } = await supabase
      .from("service_applications")
      .select("*")
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("Failed to fetch applications from Supabase:", error);
      setApplications(loadApplications());
      setLoadingApplications(false);
      return;
    }

    const normalized = (data ?? []).map(normalizeRemoteApplication);
    setApplications(normalized);
    setLoadingApplications(false);
  }, [canUseSupabase, status]);

  useEffect(() => {
    void refreshApplications();
  }, [refreshApplications]);

  const submitApplication = useCallback(async (data: ApplyFormData): Promise<ServiceApplication> => {
    if (role === "admin" || isSuspended) {
      throw new Error("APPLICATION_NOT_ALLOWED");
    }

    const now = new Date().toISOString();
    const fallbackDraft: ServiceApplication = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      code: getNextTrackingCode(applications),
      user_id: user?.id,
      user_email: user?.email,
      user_name: data.user_name,
      phone: data.phone,
      service_id: data.service_id,
      service_name: data.service_name,
      status: "submitted",
      submitted_payload: data.form_payload,
      submitted_documents: data.submitted_documents,
      payment_status: data.payment_status ?? "pending",
      payment_provider: data.payment_provider ?? "none",
      payment_reference: data.payment_reference,
      amount: data.amount ?? 0,
      created_at: now,
      updated_at: now,
    };

    if (canUseSupabase && supabase && status === "authenticated" && user) {
      const insertPayload: Database["public"]["Tables"]["service_applications"]["Insert"] = {
        user_id: user.id,
        user_email: user.email ?? null,
        user_name: data.user_name,
        phone: data.phone,
        service_id: data.service_id,
        service_name: data.service_name,
        status: "submitted",
        submitted_payload: data.form_payload ?? null,
        submitted_documents: data.submitted_documents ?? null,
        payment_status: data.payment_status ?? "pending",
        payment_provider: data.payment_provider ?? "none",
        payment_reference: data.payment_reference ?? null,
        amount: data.amount ?? 0,
      };

      const { data: inserted, error } = await supabase
        .from("service_applications")
        .insert(insertPayload)
        .select("*")
        .single();

      if (error || !inserted) {
        console.error("Failed to submit application:", error);
        throw new Error("APPLICATION_SUBMIT_FAILED");
      }

      const created = normalizeRemoteApplication(inserted);
      setApplications((prev) => [created, ...prev.filter((x) => x.id !== created.id)]);
      return created;
    }

    setApplications((prev) => {
      const next = [fallbackDraft, ...prev];
      saveApplications(next);
      return next;
    });
    return fallbackDraft;
  }, [applications, canUseSupabase, status, user, role, isSuspended]);

  const updateApplicationStatus = useCallback(async (id: string, status: ApplicationStatus, adminNotes?: string) => {
    if (canUseSupabase && supabase) {
      const payload: Database["public"]["Tables"]["service_applications"]["Update"] = {
        status,
      };
      if (typeof adminNotes === "string") payload.admin_notes = adminNotes.trim() || null;

      const { data: updated, error } = await supabase
        .from("service_applications")
        .update(payload)
        .eq("id", id)
        .select("*")
        .single();

      if (error || !updated) {
        console.error("Failed to update application status:", error);
        throw new Error("APPLICATION_STATUS_UPDATE_FAILED");
      }

      const normalized = normalizeRemoteApplication(updated);
      setApplications((prev) => prev.map((a) => (a.id === id ? normalized : a)));
      return;
    }

    setApplications((prev) => {
      const next = prev.map((a) =>
        a.id === id
          ? { ...a, status, admin_notes: adminNotes?.trim() || a.admin_notes, updated_at: new Date().toISOString() }
          : a,
      );
      saveApplications(next);
      return next;
    });
  }, [canUseSupabase]);

  const findByCode = useCallback(async (code: string) => {
    const normalized = code.trim().toUpperCase();
    if (!normalized) return null;

    if (canUseSupabase && supabase) {
      const { data, error } = await supabase
        .from("service_applications")
        .select("*")
        .eq("code", normalized)
        .maybeSingle();

      if (data) return normalizeRemoteApplication(data);
      if (error && error.code !== SUPABASE_NO_ROWS_ERROR) {
        console.error("Failed to track application by code:", error);
        return null;
      }
    }

    return applications.find((a) => a.code.toUpperCase() === normalized) ?? null;
  }, [applications, canUseSupabase]);

  const myApplications = useMemo(() => {
    if (!user) return [];
    return applications
      .filter((a) => isUserApplication(a, user.id, user.email))
      .sort((a, b) => Date.parse(b.updated_at) - Date.parse(a.updated_at));
  }, [applications, user]);

  return (
    <ApplicationContext.Provider
      value={{ applications, loadingApplications, submitApplication, updateApplicationStatus, findByCode, myApplications }}
    >
      {children}
    </ApplicationContext.Provider>
  );
}

export function useApplications() {
  const ctx = useContext(ApplicationContext);
  if (!ctx) throw new Error("useApplications must be used within ApplicationProvider");
  return ctx;
}

function loadApplications(): ServiceApplication[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    saveApplications(defaultDemoData);
    return defaultDemoData;
  }
  try {
    const parsed = JSON.parse(raw) as ServiceApplication[];
    if (!Array.isArray(parsed)) return defaultDemoData;
    return parsed.map(normalizeLocalApplication);
  } catch {
    return defaultDemoData;
  }
}

function saveApplications(data: ServiceApplication[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function getNextTrackingCode(applications: ServiceApplication[]): string {
  const allCodes = applications.map((a) => parseTrackingCodeNumber(a.code));
  const baseline = Math.max(TRACK_CODE_BASELINE, ...allCodes);
  const existing = new Set(applications.map((a) => a.code.toUpperCase()));
  let next = baseline + 1;
  while (existing.has(`DYW-${next}`)) next += 1;
  return `DYW-${next}`;
}

function parseTrackingCodeNumber(code: string): number {
  const parts = code.split("-");
  if (parts.length < 2) return 1000;
  const parsed = Number(parts[parts.length - 1]);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1000;
}

function isUserApplication(app: ServiceApplication, userId: string, userEmail?: string): boolean {
  if (app.user_id) return !!app.user_id && app.user_id === userId;
  if (!userEmail) return false;
  return app.user_email === userEmail;
}

function normalizeRemoteApplication(row: Database["public"]["Tables"]["service_applications"]["Row"]): ServiceApplication {
    return {
    id: row.id,
    code: row.code,
    user_id: row.user_id ?? undefined,
    user_email: row.user_email ?? undefined,
    user_name: row.user_name,
    phone: row.phone,
    service_id: row.service_id,
    service_name: row.service_name,
    status: row.status,
      admin_notes: row.admin_notes ?? undefined,
      submitted_payload: row.submitted_payload ?? undefined,
      submitted_documents: normalizeSubmittedDocuments(row.submitted_documents),
      payment_status: row.payment_status,
      payment_provider: row.payment_provider ?? "none",
      payment_reference: row.payment_reference ?? undefined,
      amount: row.amount ?? 0,
      created_at: row.created_at,
      updated_at: row.updated_at,
  };
}

function normalizeLocalApplication(app: ServiceApplication): ServiceApplication {
  return {
    ...app,
    submitted_payload:
      app.submitted_payload && typeof app.submitted_payload === "object" && !Array.isArray(app.submitted_payload)
        ? app.submitted_payload
        : undefined,
    submitted_documents: normalizeSubmittedDocuments(app.submitted_documents),
    payment_status: app.payment_status ?? "pending",
    payment_provider: app.payment_provider ?? "none",
    payment_reference: app.payment_reference || undefined,
    amount: Number.isFinite(app.amount) ? app.amount : 0,
  };
}

function normalizeSubmittedDocuments(value: unknown): SubmittedDocument[] | undefined {
  if (!Array.isArray(value)) return undefined;

  const normalized = value
    .map((item) => {
      if (!item) return null;
      if (typeof item === "string") return { name: item } as SubmittedDocument;
      if (typeof item !== "object") return null;
      const record = item as Record<string, unknown>;
      const name = typeof record.name === "string" ? record.name : "";
      if (!name.trim()) return null;
      return {
        name,
        path: typeof record.path === "string" ? record.path : undefined,
        url: typeof record.url === "string" ? record.url : undefined,
        size: typeof record.size === "number" ? record.size : undefined,
        uploaded_at: typeof record.uploaded_at === "string" ? record.uploaded_at : undefined,
      } satisfies SubmittedDocument;
    })
    .filter((item): item is SubmittedDocument => Boolean(item));

  return normalized.length > 0 ? normalized : undefined;
}

export const STATUS_FLOW: ApplicationStatus[] = ["submitted", "received", "processing", "ready", "completed"];
