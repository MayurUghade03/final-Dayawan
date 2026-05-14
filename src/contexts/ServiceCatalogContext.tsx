import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { SERVICES } from "@/i18n/translations";
import type { Database, ManagedService, ServiceCategory, ServiceFormField } from "@/types";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

type ServiceCatalogCtx = {
  services: ManagedService[];
  loadingServices: boolean;
  getServiceById: (id: string) => ManagedService | undefined;
  upsertService: (service: ManagedService) => Promise<void>;
  deleteService: (serviceId: string) => Promise<void>;
  setServiceActive: (serviceId: string, active: boolean) => Promise<void>;
  createServiceDraft: () => ManagedService;
};

const STORAGE_KEY = "dayawan_services_catalog";
const ServiceCatalogContext = createContext<ServiceCatalogCtx | null>(null);

const defaultServices: ManagedService[] = SERVICES.map((service) => ({
  id: service.id,
  category: service.category,
  title: service.title.en,
  description: service.desc.en,
  details: service.long?.en ?? service.desc.en,
  image_url: undefined,
  required_documents: service.docs.map((doc) => doc.en),
  fee_amount: parseFeeAmount(service.fee?.en),
  fee_note: service.fee?.en,
  payment_provider: "none",
  form_schema: [],
  active: true,
}));

export function ServiceCatalogProvider({ children }: { children: ReactNode }) {
  const { isAdmin } = useAuth();
  const [services, setServices] = useState<ManagedService[]>(() => loadServices());
  const [loadingServices, setLoadingServices] = useState(false);
  const canUseSupabase = Boolean(isSupabaseConfigured && supabase);

  const refreshServices = useCallback(async () => {
    if (!canUseSupabase || !supabase) {
      setServices(loadServices());
      return;
    }

    setLoadingServices(true);
    let query = supabase
      .from("services")
      .select("*")
      .order("id", { ascending: true });

    if (!isAdmin) {
      query = query.eq("active", true);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Failed to fetch services from Supabase:", error);
      setServices(loadServices());
      setLoadingServices(false);
      return;
    }

    const normalized = (data ?? []).map(normalizeRemoteService);
    setServices(normalized);
    saveServices(normalized);
    setLoadingServices(false);
  }, [canUseSupabase, isAdmin]);

  useEffect(() => {
    void refreshServices();
  }, [refreshServices]);

  const upsertService = useCallback(async (service: ManagedService) => {
    const normalized = normalizeManagedService(service);

    if (canUseSupabase && supabase) {
      const payload: Database["public"]["Tables"]["services"]["Insert"] = {
        id: normalized.id,
        category: normalized.category,
        title: normalized.title,
        description: normalized.description,
        details: normalized.details ?? null,
        image_url: normalized.image_url ?? null,
        required_documents: normalized.required_documents,
        fee_amount: normalized.fee_amount,
        fee_note: normalized.fee_note ?? null,
        payment_provider: normalized.payment_provider,
        form_schema: normalized.form_schema,
        active: normalized.active,
      };

      const { error } = await supabase.from("services").upsert(payload, { onConflict: "id" });
      if (error) {
        if (isMissingImageUrlColumnError(error)) {
          const legacyPayload = { ...payload };
          delete legacyPayload.image_url;
          const { error: legacyError } = await supabase.from("services").upsert(legacyPayload, { onConflict: "id" });
          if (legacyError) {
            console.error("Failed to upsert service:", legacyError);
            throw new Error("SERVICE_SAVE_FAILED");
          }
        } else {
          console.error("Failed to upsert service:", error);
          throw new Error("SERVICE_SAVE_FAILED");
        }
      }
    }

    setServices((prev) => {
      const next = upsertById(prev, normalized);
      saveServices(next);
      return next;
    });
  }, [canUseSupabase]);

  const deleteService = useCallback(async (serviceId: string) => {
    const normalizedId = sanitizeServiceId(serviceId);
    if (canUseSupabase && supabase) {
      const { error } = await supabase.from("services").delete().eq("id", normalizedId);
      if (error) {
        console.error("Failed to delete service:", error);
        throw new Error("SERVICE_DELETE_FAILED");
      }
    }

    setServices((prev) => {
      const next = prev.filter((service) => service.id !== normalizedId);
      saveServices(next);
      return next;
    });
  }, [canUseSupabase]);

  const setServiceActive = useCallback(async (serviceId: string, active: boolean) => {
    const normalizedId = sanitizeServiceId(serviceId);
    if (canUseSupabase && supabase) {
      const { error } = await supabase
        .from("services")
        .update({ active })
        .eq("id", normalizedId);
      if (error) {
        console.error("Failed to update service active status:", error);
        throw new Error("SERVICE_ACTIVE_UPDATE_FAILED");
      }
    }

    setServices((prev) => {
      const next = prev.map((service) => (service.id === normalizedId ? { ...service, active } : service));
      saveServices(next);
      return next;
    });
  }, [canUseSupabase]);

  const getServiceById = useCallback((id: string) => services.find((service) => service.id === id), [services]);

  const createServiceDraft = useCallback((): ManagedService => ({
    id: `service-${crypto.randomUUID()}`,
    category: "gov",
    title: "",
    description: "",
    details: "",
    image_url: "",
    required_documents: [],
    fee_amount: 0,
    fee_note: "",
    payment_provider: "none",
    form_schema: [],
    active: true,
  }), []);

  const value = useMemo<ServiceCatalogCtx>(
    () => ({
      services,
      loadingServices,
      getServiceById,
      upsertService,
      deleteService,
      setServiceActive,
      createServiceDraft,
    }),
    [services, loadingServices, getServiceById, upsertService, deleteService, setServiceActive, createServiceDraft],
  );

  return <ServiceCatalogContext.Provider value={value}>{children}</ServiceCatalogContext.Provider>;
}

export function useServiceCatalog() {
  const ctx = useContext(ServiceCatalogContext);
  if (!ctx) throw new Error("useServiceCatalog must be used within ServiceCatalogProvider");
  return ctx;
}

function loadServices(): ManagedService[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    saveServices(defaultServices);
    return defaultServices;
  }

  try {
    const parsed = JSON.parse(raw) as ManagedService[];
    if (!Array.isArray(parsed) || parsed.length === 0) return defaultServices;
    return parsed.map(normalizeManagedService);
  } catch {
    return defaultServices;
  }
}

function saveServices(data: ManagedService[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data.map(normalizeManagedService)));
}

function parseFeeAmount(value?: string): number {
  if (!value) return 0;
  const digits = value.replace(/[^\d.]/g, "");
  const parsed = Number(digits);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeManagedService(service: ManagedService): ManagedService {
  return {
    id: sanitizeServiceId(service.id),
    category: normalizeCategory(service.category),
    title: service.title.trim() || "Untitled Service",
    description: service.description.trim() || "Service details will be updated soon.",
    details: service.details?.trim() || service.description.trim() || "Service details will be updated soon.",
    image_url: service.image_url?.trim() || "",
    required_documents: service.required_documents.map((item) => item.trim()).filter(Boolean),
    fee_amount: Number.isFinite(service.fee_amount) ? Math.max(0, service.fee_amount) : 0,
    fee_note: service.fee_note?.trim() || "",
    payment_provider: service.payment_provider,
    form_schema: service.form_schema.map(normalizeFormField),
    active: service.active !== false,
  };
}

function normalizeFormField(field: ServiceFormField): ServiceFormField {
  return {
    id: field.id || crypto.randomUUID(),
    key: field.key.trim() || field.id || `field_${crypto.randomUUID().replace(/-/g, "")}`,
    label: field.label.trim() || "Additional detail",
    type: field.type,
    required: Boolean(field.required),
  };
}

function sanitizeServiceId(id: string): string {
  const normalized = id.trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
  return normalized || `service-${crypto.randomUUID()}`;
}

function normalizeCategory(category: ServiceCategory): ServiceCategory {
  if (category === "farm" || category === "online") return category;
  return "gov";
}

function upsertById(list: ManagedService[], next: ManagedService): ManagedService[] {
  const existingIndex = list.findIndex((item) => item.id === next.id);
  if (existingIndex === -1) return [next, ...list];
  return list.map((item, index) => (index === existingIndex ? next : item));
}

function normalizeRemoteService(row: Database["public"]["Tables"]["services"]["Row"]): ManagedService {
  const safeFormSchema = Array.isArray(row.form_schema) ? row.form_schema : [];
  const safeDocuments = Array.isArray(row.required_documents) ? row.required_documents : [];
  return normalizeManagedService({
    id: row.id,
    category: row.category,
    title: row.title,
    description: row.description,
    details: row.details ?? undefined,
    image_url: row.image_url ?? undefined,
    required_documents: safeDocuments,
    fee_amount: Number(row.fee_amount ?? 0),
    fee_note: row.fee_note ?? undefined,
    payment_provider: row.payment_provider,
    form_schema: safeFormSchema
      .filter((field): field is ServiceFormField => Boolean(field && typeof field === "object"))
      .map((field) => normalizeFormField(field)),
    active: row.active,
  });
}

function isMissingImageUrlColumnError(error: { code?: string | null; message?: string | null }): boolean {
  return error.code === "PGRST204" && (error.message?.toLowerCase().includes("image_url") ?? false);
}
