import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useLang } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { STATUS_FLOW, useApplications } from "@/contexts/ApplicationContext";
import { Navigate } from "react-router-dom";
import { StatusBadge } from "@/components/StatusBadge";
import { toast } from "sonner";
import type { ApplicationStatus, Database, FormFieldType, ManagedService, ServiceCategory, SubmittedDocument, UserProfile } from "@/types";
import { useEffect, useMemo, useState } from "react";
import { useServiceCatalog } from "@/contexts/ServiceCatalogContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { Download, Eye, FileText, FolderOpen, Phone, Search, Trash2, Users } from "lucide-react";

type AdminSection = "overview" | "services" | "users" | "documents" | "queue" | "contacts";
type ContactRequestStatus = "new" | "read" | "replied" | "in_progress" | "resolved";
type ContactRequest = Database["public"]["Tables"]["contact_requests"]["Row"];

const STATUS_LABEL_KEYS: Record<ApplicationStatus, "status_submitted" | "status_received" | "status_processing" | "status_ready" | "status_completed"> = {
  submitted: "status_submitted",
  received: "status_received",
  processing: "status_processing",
  ready: "status_ready",
  completed: "status_completed",
};

const SECTIONS: Array<{ id: AdminSection; label: string; icon: typeof FileText }> = [
  { id: "overview", label: "Dashboard Overview", icon: FileText },
  { id: "services", label: "Service Management", icon: FolderOpen },
  { id: "users", label: "User Management", icon: Users },
  { id: "documents", label: "Document Management", icon: FileText },
  { id: "queue", label: "Application Queue", icon: FileText },
  { id: "contacts", label: "Contact Requests", icon: Phone },
];

const AdminPage = () => {
  const { t } = useLang();
  const { status, isAdmin } = useAuth();
  const {
    applications,
    updateApplicationStatus,
    updateApplicationPaymentStatus,
    deleteApplication,
    deleteApplicationDocument,
  } = useApplications();
  const { services, upsertService, deleteService, setServiceActive, createServiceDraft } = useServiceCatalog();

  const [activeSection, setActiveSection] = useState<AdminSection>("overview");
  const [selectedServiceId, setSelectedServiceId] = useState<string>("");
  const [editingService, setEditingService] = useState<ManagedService | null>(null);
  const [savingService, setSavingService] = useState(false);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [savingUserId, setSavingUserId] = useState<string>("");
  const [contactRequests, setContactRequests] = useState<ContactRequest[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [updatingContactId, setUpdatingContactId] = useState<string>("");
  const [documentSearch, setDocumentSearch] = useState("");
  const [queueSearch, setQueueSearch] = useState("");
  const [queuePaymentFilter, setQueuePaymentFilter] = useState<"all" | "pending" | "verified" | "rejected">("all");
  const [contactSearch, setContactSearch] = useState("");

  useEffect(() => {
    if (!selectedServiceId && services.length > 0) setSelectedServiceId(services[0].id);
  }, [selectedServiceId, services]);

  useEffect(() => {
    const selected = services.find((service) => service.id === selectedServiceId);
    if (selected) {
      setEditingService({
        ...selected,
        image_url: selected.image_url || "",
        form_schema: [...selected.form_schema],
        required_documents: [...selected.required_documents],
      });
    }
  }, [selectedServiceId, services]);

  useEffect(() => {
    const loadUsers = async () => {
      if (!isSupabaseConfigured || !supabase || status !== "authenticated" || !isAdmin) return;
      setLoadingUsers(true);
      const { data, error } = await supabase.from("user_profiles").select("*").order("created_at", { ascending: false });
      if (error) console.error("Failed to load user profiles:", error);
      else setUsers((data ?? []).map(normalizeUserProfile));
      setLoadingUsers(false);
    };

    const loadContactRequests = async () => {
      if (!isSupabaseConfigured || !supabase || status !== "authenticated" || !isAdmin) return;
      setLoadingContacts(true);
      const { data, error } = await supabase.from("contact_requests").select("*").order("created_at", { ascending: false }).limit(100);
      if (error) console.error("Failed to load contact requests:", error);
      else setContactRequests(data ?? []);
      setLoadingContacts(false);
    };

    void Promise.all([loadUsers(), loadContactRequests()]);
  }, [status, isAdmin]);

  const serviceOptions = useMemo(
    () => services.map((service) => ({ id: service.id, label: `${service.title}${service.active ? "" : " (Inactive)"}` })),
    [services],
  );
  const documentEntries = useMemo(() => (
    applications.flatMap((app) =>
      (app.submitted_documents ?? []).map((documentItem, index) => ({
        id: `${app.id}-${documentItem.path || documentItem.url || documentItem.name}-${index}`,
        app,
        index,
        documentItem,
      })),
    )
  ), [applications]);

  const filteredDocumentEntries = useMemo(() => {
    const key = documentSearch.trim().toLowerCase();
    if (!key) return documentEntries;
    return documentEntries.filter(({ app, documentItem }) =>
      `${app.user_name} ${app.user_email ?? ""} ${app.code} ${documentItem.name}`.toLowerCase().includes(key),
    );
  }, [documentEntries, documentSearch]);

  const documentsByUser = useMemo(() => {
    const grouped = new Map<string, typeof filteredDocumentEntries>();
    filteredDocumentEntries.forEach((entry) => {
      const groupKey = entry.app.user_id || entry.app.user_email || entry.app.user_name;
      const list = grouped.get(groupKey) ?? [];
      list.push(entry);
      grouped.set(groupKey, list);
    });
    return Array.from(grouped.entries()).map(([key, items]) => ({ key, items }));
  }, [filteredDocumentEntries]);

  const filteredQueue = useMemo(() => {
    const key = queueSearch.trim().toLowerCase();
    return applications.filter((app) => {
      const matchesSearch = !key || `${app.code} ${app.user_name} ${app.user_email ?? ""} ${app.service_name}`.toLowerCase().includes(key);
      const matchesPayment = queuePaymentFilter === "all" || normalizePaymentStatus(app.payment_status) === queuePaymentFilter;
      return matchesSearch && matchesPayment;
    });
  }, [applications, queuePaymentFilter, queueSearch]);

  const filteredContactRequests = useMemo(() => {
    const key = contactSearch.trim().toLowerCase();
    if (!key) return contactRequests;
    return contactRequests.filter((request) =>
      `${request.name} ${request.email ?? ""} ${request.phone} ${request.message}`.toLowerCase().includes(key),
    );
  }, [contactRequests, contactSearch]);

  if (status === "unauthenticated") return <Navigate to="/login" replace state={{ from: "/admin" }} />;
  if (status === "loading") return null;
  if (!isAdmin) return <Navigate to="/dashboard" replace />;

  const saveService = async () => {
    if (!editingService) return;
    if (!editingService.title.trim() || !editingService.description.trim()) {
      toast.error("Service title and description are required.");
      return;
    }
    if (!Number.isInteger(editingService.fee_amount) || editingService.fee_amount < 0) {
      toast.error("Charge amount must be a whole number (e.g. 100, 250).");
      return;
    }
    setSavingService(true);
    try {
      await upsertService({
        ...editingService,
        required_documents: editingService.required_documents.filter(Boolean),
      });
      toast.success("Service updated.");
      setSelectedServiceId(editingService.id);
    } catch (error) {
      if (error instanceof Error && error.message === "SERVICE_FEE_INVALID") {
        toast.error("Charge amount must be a whole number (e.g. 100, 250).");
      } else {
        toast.error("Failed to update service.");
      }
    } finally {
      setSavingService(false);
    }
  };

  const saveUser = async (profile: UserProfile) => {
    if (!isSupabaseConfigured || !supabase) return;
    setSavingUserId(profile.id);
    const payload: Database["public"]["Tables"]["user_profiles"]["Update"] = {
      email: profile.email.trim().toLowerCase(),
      full_name: profile.full_name.trim() || profile.email,
      phone: profile.phone?.trim() || null,
      role: profile.role,
      status: profile.status,
      suspended_at: profile.status === "suspended" ? (profile.suspended_at ?? new Date().toISOString()) : null,
    };
    const { data, error } = await supabase.from("user_profiles").update(payload).eq("id", profile.id).select("*").single();
    if (error || !data) {
      toast.error("Failed to update user.");
      setSavingUserId("");
      return;
    }
    setUsers((prev) => prev.map((item) => (item.id === profile.id ? normalizeUserProfile(data) : item)));
    toast.success("User updated.");
    setSavingUserId("");
  };

  const getDocumentUrl = async (documentItem: SubmittedDocument): Promise<string | null> => {
    if (documentItem.url) return documentItem.url;
    if (!documentItem.path) {
      toast.error("Document path is missing.");
      return null;
    }
    if (!supabase) {
      toast.error("Storage is not configured.");
      return null;
    }
    const { data, error } = await supabase.storage.from("application-documents").createSignedUrl(documentItem.path, 300);
    if (error || !data?.signedUrl) {
      toast.error("Unable to access document.");
      return null;
    }
    return data.signedUrl;
  };

  const openDocument = async (documentItem: SubmittedDocument, mode: "preview" | "download") => {
    const url = await getDocumentUrl(documentItem);
    if (!url) return;
    if (mode === "download") {
      const link = document.createElement("a");
      link.href = url;
      link.download = documentItem.name;
      link.rel = "noopener noreferrer";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const updateContactStatus = async (request: ContactRequest, nextStatus: ContactRequestStatus) => {
    if (!supabase) return;
    setUpdatingContactId(request.id);
    const { data, error } = await supabase
      .from("contact_requests")
      .update({ status: nextStatus })
      .eq("id", request.id)
      .select("*")
      .single();

    if (error || !data) {
      toast.error("Failed to update contact request.");
      setUpdatingContactId("");
      return;
    }

    setContactRequests((prev) => prev.map((item) => (item.id === data.id ? data : item)));
    toast.success("Contact request updated.");
    setUpdatingContactId("");
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        <section className="hero-bg border-b border-border">
          <div className="container-rural py-10 sm:py-14">
            <div className="heading-eyebrow mb-3">{t("nav_admin")}</div>
            <h1 className="text-3xl sm:text-4xl font-extrabold mb-2">{t("admin_title")}</h1>
            <p className="text-muted-foreground">{t("admin_sub")}</p>
          </div>
        </section>

        <section className="section-pad">
          <div className="container-rural grid lg:grid-cols-[260px,1fr] gap-5">
            <aside className="card-soft p-3 h-fit lg:sticky lg:top-24">
              <nav className="space-y-1">
                {SECTIONS.map((section) => {
                  const Icon = section.icon;
                  return (
                    <button
                      type="button"
                      key={section.id}
                      onClick={() => setActiveSection(section.id)}
                      className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium inline-flex items-center gap-2 transition-colors ${activeSection === section.id ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-muted"}`}
                    >
                      <Icon className="h-4 w-4" />
                      {section.label}
                    </button>
                  );
                })}
              </nav>
            </aside>

            <div className="space-y-5 min-w-0">
              {activeSection === "overview" && (
                <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
                  <StatCard label="Total services" value={String(services.length)} sub={`${services.filter((item) => item.active).length} active`} />
                  <StatCard label="Applications" value={String(applications.length)} sub={`${documentEntries.length} documents`} />
                  <StatCard label="Users" value={String(users.length)} sub={loadingUsers ? "Loading..." : "Managed users"} />
                  <StatCard label="Contact requests" value={String(contactRequests.length)} sub={`${contactRequests.filter((item) => item.status !== "replied" && item.status !== "resolved").length} open`} />
                </div>
              )}

              {activeSection === "services" && (
                <div className="card-soft p-5 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <h2 className="font-bold text-xl">Service Management</h2>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        const draft = createServiceDraft();
                        setSelectedServiceId(draft.id);
                        setEditingService(draft);
                      }}
                    >
                      Add service
                    </Button>
                  </div>

                  <div>
                    <Label htmlFor="service-select">Select service</Label>
                    <select id="service-select" value={selectedServiceId} onChange={(e) => setSelectedServiceId(e.target.value)} className="w-full rounded-xl border border-border bg-background h-10 px-3 text-sm mt-1.5">
                      {serviceOptions.map((option) => (
                        <option key={option.id} value={option.id}>{option.label}</option>
                      ))}
                    </select>
                  </div>

                  {editingService && (
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="service-id">Service ID (route key)</Label>
                        <Input id="service-id" value={editingService.id} onChange={(e) => setEditingService((prev) => prev ? { ...prev, id: e.target.value } : prev)} className="mt-1.5" />
                      </div>
                      <div>
                        <Label htmlFor="service-category">Category</Label>
                        <select id="service-category" value={editingService.category} onChange={(e) => setEditingService((prev) => prev ? { ...prev, category: e.target.value as ServiceCategory } : prev)} className="w-full rounded-xl border border-border bg-background h-10 px-3 text-sm mt-1.5">
                          <option value="gov">Government</option>
                          <option value="farm">Farming</option>
                          <option value="online">Online</option>
                        </select>
                      </div>
                      <div className="md:col-span-2">
                        <Label htmlFor="service-title">Title</Label>
                        <Input id="service-title" value={editingService.title} onChange={(e) => setEditingService((prev) => prev ? { ...prev, title: e.target.value } : prev)} className="mt-1.5" />
                      </div>
                      <div className="md:col-span-2">
                        <Label htmlFor="service-description">Description</Label>
                        <Input id="service-description" value={editingService.description} onChange={(e) => setEditingService((prev) => prev ? { ...prev, description: e.target.value } : prev)} className="mt-1.5" />
                      </div>
                      <div className="md:col-span-2">
                        <Label htmlFor="service-details">Detailed content</Label>
                        <Textarea id="service-details" value={editingService.details || ""} onChange={(e) => setEditingService((prev) => prev ? { ...prev, details: e.target.value } : prev)} className="mt-1.5" />
                      </div>
                      <div>
                        <Label htmlFor="service-fee">Charge amount</Label>
                        <Input
                          id="service-fee"
                          type="number"
                          min={0}
                          step={1}
                          value={editingService.fee_amount}
                          onChange={(e) => {
                            const rawValue = e.target.value;
                            if (rawValue.includes(".")) return;
                            const nextValue = Number(rawValue || 0);
                            if (!Number.isFinite(nextValue)) return;
                            setEditingService((prev) => prev ? { ...prev, fee_amount: Math.max(0, nextValue) } : prev);
                          }}
                          className="mt-1.5"
                        />
                      </div>
                      <div>
                        <Label htmlFor="service-payment">Payment readiness</Label>
                        <select id="service-payment" value={editingService.payment_provider} onChange={(e) => setEditingService((prev) => prev ? { ...prev, payment_provider: e.target.value as ManagedService["payment_provider"] } : prev)} className="w-full rounded-xl border border-border bg-background h-10 px-3 text-sm mt-1.5">
                          <option value="none">No payment required</option>
                          <option value="manual_qr">Manual QR payment</option>
                          <option value="stripe">Stripe (legacy)</option>
                          <option value="razorpay">Razorpay (legacy)</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="service-qr-upload">Payment QR image</Label>
                        <Input
                          id="service-qr-upload"
                          type="file"
                          accept="image/*"
                          onChange={async (e) => {
                            const input = e.currentTarget;
                            const file = input.files?.[0];
                            if (!file) return;
                            if (!file.type.startsWith("image/")) {
                              toast.error("Please upload an image file for payment QR.");
                              input.value = "";
                              return;
                            }
                            try {
                              const dataUrl = await fileToDataUrl(file);
                              setEditingService((prev) => prev ? { ...prev, payment_qr_image_url: dataUrl } : prev);
                            } catch {
                              toast.error("Failed to read selected QR image.");
                            } finally {
                              input.value = "";
                            }
                          }}
                          className="mt-1.5"
                        />
                        {editingService.payment_qr_image_url && (
                          <div className="space-y-2">
                            <div className="rounded-lg overflow-hidden border border-border bg-background max-w-xs">
                              <img
                                src={editingService.payment_qr_image_url}
                                alt={`${editingService.title || "Service"} payment QR preview`}
                                className="w-full h-auto object-contain"
                                loading="lazy"
                              />
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setEditingService((prev) => prev ? { ...prev, payment_qr_image_url: "" } : prev)}
                            >
                              Remove QR image
                            </Button>
                          </div>
                        )}
                      </div>
                      <div className="md:col-span-2">
                        <Label htmlFor="service-fee-note">Fee note</Label>
                        <Input id="service-fee-note" value={editingService.fee_note || ""} onChange={(e) => setEditingService((prev) => prev ? { ...prev, fee_note: e.target.value } : prev)} className="mt-1.5" />
                      </div>
                      <div className="md:col-span-2">
                        <Label htmlFor="service-docs">Required documents (one per line)</Label>
                        <Textarea
                          id="service-docs"
                          className="mt-1.5 min-h-28"
                          value={editingService.required_documents.join("\n")}
                          onChange={(e) =>
                            setEditingService((prev) =>
                              prev
                                ? {
                                  ...prev,
                                  required_documents: e.target.value.split(/\r?\n/),
                                }
                                : prev,
                            )
                          }
                          placeholder={"Aadhaar Card\nPAN Card\nBirth Certificate"}
                        />
                      </div>
                      <div className="md:col-span-2 space-y-3">
                        <div className="flex items-center justify-between">
                          <Label>Application form fields</Label>
                          <Button type="button" variant="outline" size="sm" onClick={() => setEditingService((prev) => prev ? { ...prev, form_schema: [...prev.form_schema, { id: crypto.randomUUID(), key: `field_${prev.form_schema.length + 1}`, label: "New field", type: "text", required: false }] } : prev)}>
                            Add field
                          </Button>
                        </div>
                        {editingService.form_schema.map((field, index) => (
                          <div key={field.id} className="border border-border rounded-xl p-3 grid sm:grid-cols-4 gap-2 items-end">
                            <div className="sm:col-span-2">
                              <Label>Label</Label>
                              <Input value={field.label} onChange={(e) => setEditingService((prev) => prev ? { ...prev, form_schema: prev.form_schema.map((item, i) => i === index ? { ...item, label: e.target.value } : item) } : prev)} className="mt-1.5" />
                            </div>
                            <div>
                              <Label>Type</Label>
                              <select value={field.type} onChange={(e) => setEditingService((prev) => prev ? { ...prev, form_schema: prev.form_schema.map((item, i) => i === index ? { ...item, type: e.target.value as FormFieldType } : item) } : prev)} className="w-full rounded-xl border border-border bg-background h-10 px-3 text-sm mt-1.5">
                                <option value="text">Text</option>
                                <option value="number">Number</option>
                                <option value="date">Date</option>
                                <option value="textarea">Textarea</option>
                                <option value="select">Select</option>
                                <option value="file">File Upload</option>
                                <option value="checkbox">Checkbox</option>
                                <option value="radio">Radio</option>
                              </select>
                            </div>
                            {(field.type === "select" || field.type === "radio") && (
                              <div className="sm:col-span-2">
                                <Label>Options (one per line)</Label>
                                <Textarea
                                  value={(field.options ?? []).join("\n")}
                                  onChange={(e) =>
                                    setEditingService((prev) =>
                                      prev
                                        ? {
                                          ...prev,
                                          form_schema: prev.form_schema.map((item, i) =>
                                            i === index
                                              ? { ...item, options: e.target.value.split("\n").map((option) => option.trim()).filter(Boolean) }
                                              : item,
                                          ),
                                        }
                                        : prev,
                                    )
                                  }
                                  className="mt-1.5"
                                />
                              </div>
                            )}
                            <div className="flex items-center justify-between gap-2">
                              <label className="text-sm inline-flex items-center gap-1">
                                <input type="checkbox" checked={field.required} onChange={(e) => setEditingService((prev) => prev ? { ...prev, form_schema: prev.form_schema.map((item, i) => i === index ? { ...item, required: e.target.checked } : item) } : prev)} />
                                Required
                              </label>
                              <Button type="button" variant="ghost" size="sm" onClick={() => setEditingService((prev) => prev ? { ...prev, form_schema: prev.form_schema.filter((item) => item.id !== field.id) } : prev)}>Remove</Button>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="md:col-span-2 flex flex-wrap gap-2">
                        <Button onClick={saveService} disabled={savingService}>{savingService ? "Saving..." : "Save service"}</Button>
                        <Button type="button" variant="outline" onClick={async () => { try { await setServiceActive(editingService.id, !editingService.active); toast.success(editingService.active ? "Service deactivated." : "Service activated."); } catch { toast.error("Failed to update service status."); } }}>
                          {editingService.active ? "Deactivate" : "Activate"}
                        </Button>
                        <Button type="button" variant="destructive" onClick={async () => {
                          if (!window.confirm(`Delete service "${editingService.title}"?`)) return;
                          try {
                            await deleteService(editingService.id);
                            toast.success("Service deleted.");
                            const next = services.find((item) => item.id !== editingService.id);
                            setSelectedServiceId(next?.id ?? "");
                            setEditingService(next ?? null);
                          } catch {
                            toast.error("Failed to delete service.");
                          }
                        }}>
                          Delete service
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeSection === "users" && (
                <div className="card-soft p-5 space-y-4">
                  <h2 className="font-bold text-xl">User Management</h2>
                  {!isSupabaseConfigured ? (
                    <div className="text-sm text-muted-foreground">User management is available when Supabase is configured.</div>
                  ) : loadingUsers ? (
                    <div className="text-sm text-muted-foreground">Loading users...</div>
                  ) : users.length === 0 ? (
                    <div className="text-sm text-muted-foreground">No users found.</div>
                  ) : (
                    <div className="space-y-3">
                      {users.map((profile) => (
                        <div key={profile.id} className="rounded-xl border border-border p-4 grid lg:grid-cols-5 gap-3">
                          <div className="lg:col-span-2 space-y-1">
                            <Label>Name</Label>
                            <Input value={profile.full_name} onChange={(e) => setUsers((prev) => prev.map((u) => (u.id === profile.id ? { ...u, full_name: e.target.value } : u)))} />
                            <Input value={profile.email} onChange={(e) => setUsers((prev) => prev.map((u) => (u.id === profile.id ? { ...u, email: e.target.value } : u)))} />
                          </div>
                          <div>
                            <Label>Phone</Label>
                            <Input value={profile.phone ?? ""} onChange={(e) => setUsers((prev) => prev.map((u) => (u.id === profile.id ? { ...u, phone: e.target.value } : u)))} />
                          </div>
                          <div>
                            <Label>Role</Label>
                            <select className="w-full rounded-xl border border-border bg-background h-10 px-3 text-sm mt-1.5" value={profile.role} onChange={(e) => setUsers((prev) => prev.map((u) => (u.id === profile.id ? { ...u, role: e.target.value as UserProfile["role"] } : u)))}>
                              <option value="citizen">Citizen</option>
                              <option value="admin">Admin</option>
                            </select>
                          </div>
                          <div>
                            <Label>Status</Label>
                            <select className="w-full rounded-xl border border-border bg-background h-10 px-3 text-sm mt-1.5" value={profile.status} onChange={(e) => setUsers((prev) => prev.map((u) => (u.id === profile.id ? { ...u, status: e.target.value as UserProfile["status"] } : u)))}>
                              <option value="active">Active</option>
                              <option value="suspended">Suspended</option>
                            </select>
                          </div>
                          <div className="lg:col-span-5">
                            <Button type="button" variant="outline" onClick={() => void saveUser(profile)} disabled={savingUserId === profile.id}>{savingUserId === profile.id ? "Saving..." : "Save user"}</Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeSection === "documents" && (
                <div className="card-soft p-5 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <h2 className="font-bold text-xl">Document Management</h2>
                    <div className="relative w-full sm:w-72">
                      <Search className="h-4 w-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                      <Input
                        value={documentSearch}
                        onChange={(e) => setDocumentSearch(e.target.value)}
                        placeholder="Search user, code, or document"
                        className="pl-9"
                      />
                    </div>
                  </div>
                  {filteredDocumentEntries.length === 0 ? (
                    <div className="text-sm text-muted-foreground">No uploaded documents found.</div>
                  ) : (
                    <div className="space-y-3">
                      {documentsByUser.map(({ key, items }) => (
                        <div key={key} className="rounded-xl border border-border p-4 space-y-3">
                          <div className="font-semibold text-sm">
                            {items[0]?.app.user_name}
                            <span className="text-xs text-muted-foreground ml-2">{items[0]?.app.user_email || "No email"}</span>
                          </div>
                          {items.map(({ id, app, documentItem, index }) => (
                            <div key={id} className="rounded-lg border border-border p-3 space-y-2">
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <div>
                                  <div className="font-semibold">{documentItem.name}</div>
                                  <div className="text-xs text-muted-foreground">{detectDocumentType(documentItem.name)} • {formatDocumentSize(documentItem.size)}</div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Button size="sm" variant="outline" onClick={() => void openDocument(documentItem, "preview")}><Eye className="h-4 w-4 mr-1" />Preview</Button>
                                  <Button size="sm" variant="outline" onClick={() => void openDocument(documentItem, "download")}><Download className="h-4 w-4 mr-1" />Download</Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={async () => {
                                      if (!window.confirm(`Delete document "${documentItem.name}"?`)) return;
                                      try {
                                        await deleteApplicationDocument(app.id, index);
                                        toast.success("Document deleted.");
                                      } catch {
                                        toast.error("Failed to delete document.");
                                      }
                                    }}
                                  >
                                    <Trash2 className="h-4 w-4 mr-1" />Delete
                                  </Button>
                                </div>
                              </div>
                              <div className="text-xs text-muted-foreground">Application: <span className="font-medium text-foreground">{app.code}</span> • Service: <span className="font-medium text-foreground">{app.service_name}</span></div>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeSection === "queue" && (
                <div className="space-y-4">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                    <h2 className="font-bold text-xl">Application Queue</h2>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <div className="relative">
                        <Search className="h-4 w-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                        <Input value={queueSearch} onChange={(e) => setQueueSearch(e.target.value)} placeholder="Search applications" className="pl-9 sm:w-64" />
                      </div>
                      <select
                        value={queuePaymentFilter}
                        onChange={(e) => setQueuePaymentFilter(e.target.value as typeof queuePaymentFilter)}
                        className="rounded-xl border border-border bg-background h-10 px-3 text-sm"
                      >
                        <option value="all">All payments</option>
                        <option value="pending">Pending</option>
                        <option value="verified">Verified</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    </div>
                  </div>
                  {filteredQueue.length === 0 ? (
                    <div className="card-soft p-5 text-sm text-muted-foreground">No applications match current filters.</div>
                  ) : filteredQueue.map((app) => (
                    <div key={app.id} className="card-soft p-5">
                      <div className="grid lg:grid-cols-6 gap-3 items-end">
                        <div>
                          <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">{t("track_label")}</div>
                          <div className="font-bold">{app.code}</div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground">{t("admin_user")}</div>
                          <div className="font-semibold">{app.user_name}</div>
                          {app.user_email && <div className="text-xs text-muted-foreground">{app.user_email}</div>}
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground">{t("dashboard_service")}</div>
                          <div className="font-semibold">{app.service_name}</div>
                          <div className="text-xs text-muted-foreground mt-1">Payment: {formatPaymentStatus(app.payment_status)} {app.amount ? `• ₹${app.amount.toFixed(2)}` : ""} {app.transaction_id ? `• ${app.transaction_id}` : ""}</div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">{t("admin_current_status")}</div>
                          <StatusBadge status={app.status} />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground block mb-1">{t("admin_update_status")}</label>
                          <select value={app.status} onChange={async (e) => { try { await updateApplicationStatus(app.id, e.target.value as (typeof STATUS_FLOW)[number]); toast.success(t("admin_status_updated")); } catch { toast.error(t("admin_status_update_failed")); } }} className="w-full rounded-xl border border-border bg-background h-10 px-3 text-sm">
                            {STATUS_FLOW.map((statusValue) => (
                              <option key={statusValue} value={statusValue}>{t(STATUS_LABEL_KEYS[statusValue])}</option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs text-muted-foreground block">Payment status</label>
                          <select
                            value={normalizePaymentStatus(app.payment_status)}
                            onChange={async (e) => {
                              try {
                                await updateApplicationPaymentStatus(app.id, e.target.value as "pending" | "verified" | "rejected", app.payment_reference, app.transaction_id);
                                toast.success("Payment status updated.");
                              } catch {
                                toast.error("Failed to update payment status.");
                              }
                            }}
                            className="w-full rounded-xl border border-border bg-background h-10 px-3 text-sm"
                          >
                            <option value="pending">Pending</option>
                            <option value="verified">Verified</option>
                            <option value="rejected">Rejected</option>
                          </select>
                          <Button
                            size="sm"
                            variant="destructive"
                            className="w-full"
                            onClick={async () => {
                              if (!window.confirm(`Delete application ${app.code}?`)) return;
                              try {
                                await deleteApplication(app.id);
                                toast.success("Application deleted.");
                              } catch {
                                toast.error("Failed to delete application.");
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeSection === "contacts" && (
                <div className="card-soft p-5 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <h2 className="font-bold text-xl">Contact Requests</h2>
                    <div className="relative w-full sm:w-72">
                      <Search className="h-4 w-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                      <Input value={contactSearch} onChange={(e) => setContactSearch(e.target.value)} placeholder="Search contact requests" className="pl-9" />
                    </div>
                  </div>
                  {!isSupabaseConfigured ? (
                    <div className="text-sm text-muted-foreground">Supabase is required to view contact requests.</div>
                  ) : loadingContacts ? (
                    <div className="text-sm text-muted-foreground">Loading contact requests...</div>
                  ) : filteredContactRequests.length === 0 ? (
                    <div className="text-sm text-muted-foreground">No contact requests received yet.</div>
                  ) : (
                    <div className="space-y-3">
                      {filteredContactRequests.map((request) => (
                        <div key={request.id} className="rounded-xl border border-border p-4 space-y-2">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div>
                              <div className="font-semibold">{request.name}</div>
                              <div className="text-xs text-muted-foreground">{request.email} • {request.phone}</div>
                            </div>
                            <select className="rounded-lg border border-border bg-background h-9 px-2 text-sm" value={request.status} disabled={updatingContactId === request.id} onChange={(e) => void updateContactStatus(request, e.target.value as ContactRequestStatus)}>
                              <option value="new">New</option>
                              <option value="read">Read</option>
                              <option value="replied">Replied</option>
                              <option value="in_progress">In Progress (legacy)</option>
                              <option value="resolved">Resolved (legacy)</option>
                            </select>
                          </div>
                          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{request.message}</p>
                          <div className="text-xs text-muted-foreground">Received: {new Date(request.created_at).toLocaleString()}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default AdminPage;

function normalizeUserProfile(row: Database["public"]["Tables"]["user_profiles"]["Row"]): UserProfile {
  return {
    id: row.id,
    email: row.email,
    full_name: row.full_name,
    phone: row.phone ?? undefined,
    role: row.role,
    status: row.status,
    suspended_at: row.suspended_at ?? undefined,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function detectDocumentType(name: string): string {
  const ext = name.split(".").pop()?.toLowerCase();
  if (!ext) return "Unknown";
  if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext)) return "Image";
  if (ext === "pdf") return "PDF";
  if (["doc", "docx", "rtf"].includes(ext)) return "Document";
  return ext.toUpperCase();
}

function formatDocumentSize(size?: number): string {
  if (!Number.isFinite(size) || !size || size <= 0) return "Unknown size";
  return `${(size / 1024).toFixed(1)} KB`;
}

function normalizePaymentStatus(status: string): "pending" | "verified" | "rejected" {
  if (status === "verified" || status === "rejected" || status === "pending") return status;
  if (status === "paid") return "verified";
  return "pending";
}

function formatPaymentStatus(status: string): string {
  const normalized = normalizePaymentStatus(status);
  if (normalized === "verified") return "Verified";
  if (normalized === "rejected") return "Rejected";
  return "Pending";
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }
      reject(new Error("INVALID_FILE_DATA"));
    };
    reader.onerror = () => reject(new Error("FILE_READ_FAILED"));
    reader.readAsDataURL(file);
  });
}

function StatCard({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="card-soft p-5">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="text-2xl font-extrabold mt-1">{value}</div>
      <div className="text-xs text-muted-foreground mt-1">{sub}</div>
    </div>
  );
}
