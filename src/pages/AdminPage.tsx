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
import { useTheme } from "@/contexts/ThemeContext";
import { Download, Eye } from "lucide-react";

const STATUS_LABEL_KEYS: Record<ApplicationStatus, "status_submitted" | "status_received" | "status_processing" | "status_ready" | "status_completed"> = {
  submitted: "status_submitted",
  received: "status_received",
  processing: "status_processing",
  ready: "status_ready",
  completed: "status_completed",
};

const ADMIN_SECTIONS = [
  { id: "overview", label: "Dashboard Overview" },
  { id: "services", label: "Service Management" },
  { id: "users", label: "User Management" },
  { id: "documents", label: "Document Management" },
  { id: "applications", label: "Application Queue" },
  { id: "contacts", label: "Contact Requests" },
  { id: "settings", label: "Settings" },
] as const;

const AdminPage = () => {
  const { t } = useLang();
  const { status, isAdmin } = useAuth();
  const { applications, updateApplicationStatus } = useApplications();
  const { services, upsertService, removeService, createServiceDraft } = useServiceCatalog();
  const {
    themes,
    globalDefaultThemeId,
    setGlobalDefaultTheme,
    selectedThemeId,
    setSelectedThemeId,
  } = useTheme();

  const [selectedServiceId, setSelectedServiceId] = useState<string>("");
  const [editingService, setEditingService] = useState<ManagedService | null>(null);
  const [savingService, setSavingService] = useState(false);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [savingUserId, setSavingUserId] = useState<string>("");
  const [loadingDocumentKey, setLoadingDocumentKey] = useState<string>("");

  useEffect(() => {
    if (!selectedServiceId && services.length > 0) setSelectedServiceId(services[0].id);
  }, [selectedServiceId, services]);

  useEffect(() => {
    const selected = services.find((service) => service.id === selectedServiceId);
    if (selected) setEditingService({ ...selected, form_schema: [...selected.form_schema], required_documents: [...selected.required_documents] });
  }, [selectedServiceId, services]);

  useEffect(() => {
    const loadUsers = async () => {
      if (!isSupabaseConfigured || !supabase || status !== "authenticated" || !isAdmin) return;

      setLoadingUsers(true);
      const { data, error } = await supabase
        .from("user_profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Failed to load user profiles:", error);
      } else {
        setUsers((data ?? []).map(normalizeUserProfile));
      }
      setLoadingUsers(false);
    };

    void loadUsers();
  }, [status, isAdmin]);

  const serviceOptions = useMemo(
    () => services.map((service) => ({ id: service.id, label: `${service.title}${service.active ? "" : " (inactive)"}` })),
    [services],
  );
  const predefinedThemes = useMemo(() => themes.filter((theme) => theme.built_in).slice(0, 3), [themes]);
  const documentRows = useMemo(
    () => applications.flatMap((app) => (app.submitted_documents ?? []).map((doc, idx) => ({ app, doc, key: `${app.id}-${idx}` }))),
    [applications],
  );

  if (status === "unauthenticated") return <Navigate to="/login" replace state={{ from: "/admin" }} />;
  if (status === "loading") return null;
  if (!isAdmin) return <Navigate to="/dashboard" replace />;

  const saveService = async () => {
    if (!editingService) return;
    if (!editingService.title.trim() || !editingService.description.trim()) {
      toast.error("Service title and description are required.");
      return;
    }

    setSavingService(true);
    try {
      await upsertService({
        ...editingService,
        required_documents: editingService.required_documents.filter(Boolean),
      });
      toast.success("Service updated.");
    } catch {
      toast.error("Failed to update service.");
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

    const { data, error } = await supabase
      .from("user_profiles")
      .update(payload)
      .eq("id", profile.id)
      .select("*")
      .single();

    if (error || !data) {
      toast.error("Failed to update user.");
      setSavingUserId("");
      return;
    }

    setUsers((prev) => prev.map((item) => (item.id === profile.id ? normalizeUserProfile(data) : item)));
    toast.success("User updated.");
    setSavingUserId("");
  };

  const deleteService = async () => {
    if (!editingService) return;
    const confirmed = window.confirm(`Delete service "${editingService.title || editingService.id}"?`);
    if (!confirmed) return;

    try {
      await removeService(editingService.id);
      toast.success("Service deleted.");
      const remaining = services.filter((item) => item.id !== editingService.id);
      setSelectedServiceId(remaining[0]?.id ?? "");
      setEditingService(remaining[0] ?? null);
    } catch {
      toast.error("Failed to delete service.");
    }
  };

  const getDocumentUrl = async (documentItem: SubmittedDocument) => {
    if (documentItem.url) {
      return documentItem.url;
    }
    if (!documentItem.path || !supabase) return null;

    const { data, error } = await supabase.storage
      .from("application-documents")
      .createSignedUrl(documentItem.path, 300);

    if (error || !data?.signedUrl) {
      throw new Error("Unable to open document.");
    }

    return data.signedUrl;
  };

  const previewDocument = async (key: string, documentItem: SubmittedDocument) => {
    setLoadingDocumentKey(key);
    try {
      const url = await getDocumentUrl(documentItem);
      if (!url) {
        toast.error("Document link is not available.");
        return;
      }
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to open document.");
    } finally {
      setLoadingDocumentKey("");
    }
  };

  const downloadDocument = async (key: string, documentItem: SubmittedDocument) => {
    setLoadingDocumentKey(key);
    try {
      const url = await getDocumentUrl(documentItem);
      if (!url) {
        toast.error("Document link is not available.");
        return;
      }
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to download document.");
    } finally {
      setLoadingDocumentKey("");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        <section className="hero-bg border-b border-border">
          <div className="container-rural py-12 sm:py-16">
            <div className="heading-eyebrow mb-3">{t("nav_admin")}</div>
            <h1 className="text-3xl sm:text-4xl font-extrabold mb-2">{t("admin_title")}</h1>
            <p className="text-muted-foreground">{t("admin_sub")}</p>
          </div>
        </section>

        <section className="section-pad">
          <div className="container-rural grid xl:grid-cols-[250px_minmax(0,1fr)] gap-6">
            <aside className="card-soft p-4 h-fit xl:sticky xl:top-24">
              <nav className="space-y-1">
                {ADMIN_SECTIONS.map((section) => (
                  <a
                    key={section.id}
                    href={`#${section.id}`}
                    className="block rounded-lg px-3 py-2 text-sm font-medium text-foreground/85 hover:bg-muted"
                  >
                    {section.label}
                  </a>
                ))}
              </nav>
            </aside>

            <div className="space-y-6">
            <div id="overview" className="card-soft p-5">
              <h2 className="font-bold text-xl">Dashboard Overview</h2>
              <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-3 mt-4">
                <StatCard label="Total services" value={String(services.length)} />
                <StatCard label="Active services" value={String(services.filter((item) => item.active).length)} />
                <StatCard label="Total users" value={String(users.length)} />
                <StatCard label="Applications" value={String(applications.length)} />
              </div>
            </div>

            <div id="services" className="card-soft p-5 space-y-4">
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
                <select
                  id="service-select"
                  value={selectedServiceId}
                  onChange={(e) => setSelectedServiceId(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background h-10 px-3 text-sm mt-1.5"
                >
                  {serviceOptions.map((option) => (
                    <option key={option.id} value={option.id}>{option.label}</option>
                  ))}
                  {editingService && !serviceOptions.some((item) => item.id === editingService.id) && (
                    <option value={editingService.id}>{editingService.title || editingService.id}</option>
                  )}
                </select>
              </div>

              {editingService && (
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="service-id">Service ID (route key)</Label>
                    <Input
                      id="service-id"
                      value={editingService.id}
                      onChange={(e) => setEditingService((prev) => prev ? { ...prev, id: e.target.value } : prev)}
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label htmlFor="service-category">Category</Label>
                    <select
                      id="service-category"
                      value={editingService.category}
                      onChange={(e) => setEditingService((prev) => prev ? { ...prev, category: e.target.value as ServiceCategory } : prev)}
                      className="w-full rounded-xl border border-border bg-background h-10 px-3 text-sm mt-1.5"
                    >
                      <option value="gov">Government</option>
                      <option value="farm">Farming</option>
                      <option value="online">Online</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="service-title">Title</Label>
                    <Input
                      id="service-title"
                      value={editingService.title}
                      onChange={(e) => setEditingService((prev) => prev ? { ...prev, title: e.target.value } : prev)}
                      className="mt-1.5"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="service-description">Description</Label>
                    <Input
                      id="service-description"
                      value={editingService.description}
                      onChange={(e) => setEditingService((prev) => prev ? { ...prev, description: e.target.value } : prev)}
                      className="mt-1.5"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="service-image-url">Image URL</Label>
                    <Input
                      id="service-image-url"
                      value={editingService.image_url || ""}
                      onChange={(e) => setEditingService((prev) => prev ? { ...prev, image_url: e.target.value } : prev)}
                      className="mt-1.5"
                      placeholder="https://..."
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="service-details">Detailed content</Label>
                    <Textarea
                      id="service-details"
                      value={editingService.details || ""}
                      onChange={(e) => setEditingService((prev) => prev ? { ...prev, details: e.target.value } : prev)}
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label htmlFor="service-fee">Charge amount</Label>
                    <Input
                      id="service-fee"
                      type="number"
                      min={0}
                      step="0.01"
                      value={editingService.fee_amount}
                      onChange={(e) => setEditingService((prev) => prev ? { ...prev, fee_amount: Number(e.target.value || 0) } : prev)}
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label htmlFor="service-payment">Payment readiness</Label>
                    <select
                      id="service-payment"
                      value={editingService.payment_provider}
                      onChange={(e) => setEditingService((prev) => prev ? { ...prev, payment_provider: e.target.value as ManagedService["payment_provider"] } : prev)}
                      className="w-full rounded-xl border border-border bg-background h-10 px-3 text-sm mt-1.5"
                    >
                      <option value="none">No provider</option>
                      <option value="stripe">Stripe</option>
                      <option value="razorpay">Razorpay</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="service-fee-note">Fee note</Label>
                    <Input
                      id="service-fee-note"
                      value={editingService.fee_note || ""}
                      onChange={(e) => setEditingService((prev) => prev ? { ...prev, fee_note: e.target.value } : prev)}
                      className="mt-1.5"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="service-docs">Required documents (one per line)</Label>
                    <Textarea
                      id="service-docs"
                      value={editingService.required_documents.join("\n")}
                      onChange={(e) =>
                        setEditingService((prev) =>
                          prev ? { ...prev, required_documents: e.target.value.split("\n").map((item) => item.trim()).filter(Boolean) } : prev,
                        )
                      }
                      className="mt-1.5"
                    />
                  </div>

                  <div className="md:col-span-2 space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Application form fields</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setEditingService((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  form_schema: [
                                    ...prev.form_schema,
                                    {
                                      id: crypto.randomUUID(),
                                      key: `field_${prev.form_schema.length + 1}`,
                                      label: "New field",
                                      type: "text",
                                      required: false,
                                    },
                                  ],
                                }
                              : prev,
                          )
                        }
                      >
                        Add field
                      </Button>
                    </div>
                    {editingService.form_schema.length === 0 && (
                      <div className="text-sm text-muted-foreground">No extra fields configured for this service.</div>
                    )}
                    {editingService.form_schema.map((field, index) => (
                      <div key={field.id} className="border border-border rounded-xl p-3 grid sm:grid-cols-4 gap-2 items-end">
                        <div className="sm:col-span-2">
                          <Label>Label</Label>
                          <Input
                            value={field.label}
                            onChange={(e) =>
                              setEditingService((prev) =>
                                prev
                                  ? {
                                      ...prev,
                                      form_schema: prev.form_schema.map((item, i) => i === index ? { ...item, label: e.target.value } : item),
                                    }
                                  : prev,
                              )
                            }
                            className="mt-1.5"
                          />
                        </div>
                        <div>
                          <Label>Type</Label>
                          <select
                            value={field.type}
                            onChange={(e) =>
                              setEditingService((prev) =>
                                prev
                                  ? {
                                      ...prev,
                                      form_schema: prev.form_schema.map((item, i) => i === index ? { ...item, type: e.target.value as FormFieldType } : item),
                                    }
                                  : prev,
                              )
                            }
                            className="w-full rounded-xl border border-border bg-background h-10 px-3 text-sm mt-1.5"
                          >
                            <option value="text">Text</option>
                            <option value="number">Number</option>
                            <option value="date">Date</option>
                            <option value="textarea">Textarea</option>
                          </select>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <label className="text-sm inline-flex items-center gap-1">
                            <input
                              type="checkbox"
                              checked={field.required}
                              onChange={(e) =>
                                setEditingService((prev) =>
                                  prev
                                    ? {
                                        ...prev,
                                        form_schema: prev.form_schema.map((item, i) => i === index ? { ...item, required: e.target.checked } : item),
                                      }
                                    : prev,
                                )
                              }
                            />
                            Required
                          </label>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              setEditingService((prev) =>
                                prev
                                  ? { ...prev, form_schema: prev.form_schema.filter((item) => item.id !== field.id) }
                                  : prev,
                              )
                            }
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="md:col-span-2">
                    <label className="text-sm inline-flex items-center gap-2 mb-3">
                      <input
                        type="checkbox"
                        checked={editingService.active}
                        onChange={(e) => setEditingService((prev) => prev ? { ...prev, active: e.target.checked } : prev)}
                      />
                      Service is active (visible to citizens)
                    </label>
                    <div className="flex flex-wrap gap-2">
                      <Button onClick={saveService} disabled={savingService}>
                        {savingService ? "Saving..." : "Save service"}
                      </Button>
                      <Button type="button" variant="destructive" onClick={() => void deleteService()}>
                        Delete service
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div id="users" className="space-y-4">
              <h2 className="font-bold text-xl">User Management</h2>
              <div className="card-soft p-5 space-y-4">
                {!isSupabaseConfigured ? (
                  <div className="text-sm text-muted-foreground">
                    User management is available when Supabase is configured.
                  </div>
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
                          <Input
                            value={profile.full_name}
                            onChange={(e) =>
                              setUsers((prev) => prev.map((u) => (u.id === profile.id ? { ...u, full_name: e.target.value } : u)))
                            }
                          />
                          <Input
                            value={profile.email}
                            onChange={(e) =>
                              setUsers((prev) => prev.map((u) => (u.id === profile.id ? { ...u, email: e.target.value } : u)))
                            }
                          />
                        </div>
                        <div>
                          <Label>Phone</Label>
                          <Input
                            value={profile.phone ?? ""}
                            onChange={(e) =>
                              setUsers((prev) => prev.map((u) => (u.id === profile.id ? { ...u, phone: e.target.value } : u)))
                            }
                          />
                        </div>
                        <div>
                          <Label>Role</Label>
                          <select
                            className="w-full rounded-xl border border-border bg-background h-10 px-3 text-sm mt-1.5"
                            value={profile.role}
                            onChange={(e) =>
                              setUsers((prev) =>
                                prev.map((u) => (u.id === profile.id ? { ...u, role: e.target.value as UserProfile["role"] } : u)),
                              )
                            }
                          >
                            <option value="citizen">Citizen</option>
                            <option value="admin">Admin</option>
                          </select>
                        </div>
                        <div>
                          <Label>Status</Label>
                          <select
                            className="w-full rounded-xl border border-border bg-background h-10 px-3 text-sm mt-1.5"
                            value={profile.status}
                            onChange={(e) =>
                              setUsers((prev) =>
                                prev.map((u) => (u.id === profile.id ? { ...u, status: e.target.value as UserProfile["status"] } : u)),
                              )
                            }
                          >
                            <option value="active">Active</option>
                            <option value="suspended">Suspended</option>
                          </select>
                        </div>
                        <div className="lg:col-span-5">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => void saveUser(profile)}
                            disabled={savingUserId === profile.id}
                          >
                            {savingUserId === profile.id ? "Saving..." : "Save user"}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div id="settings" className="space-y-4">
              <h2 className="font-bold text-xl">Settings</h2>
              <div className="card-soft p-5 space-y-4">
                <div className="text-sm text-muted-foreground">
                  Theme options are limited to predefined themes only.
                </div>
                <div className="grid md:grid-cols-2 gap-3">
                  {predefinedThemes.map((theme) => (
                    <div key={theme.id} className="rounded-xl border border-border p-3 space-y-2">
                      <div className="font-semibold">{theme.name}</div>
                      {theme.description && <div className="text-xs text-muted-foreground">{theme.description}</div>}
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedThemeId(theme.id)}
                          disabled={selectedThemeId === theme.id}
                        >
                          {selectedThemeId === theme.id ? "Preview active" : "Preview"}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={async () => {
                            try {
                              await setGlobalDefaultTheme(theme.id);
                              toast.success("Global default theme updated.");
                            } catch {
                              toast.error("Failed to update global theme.");
                            }
                          }}
                          disabled={globalDefaultThemeId === theme.id}
                        >
                          {globalDefaultThemeId === theme.id ? "Global default" : "Set default"}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div id="documents" className="space-y-4">
              <h2 className="font-bold text-xl">Document Management</h2>
              <div className="card-soft p-5 space-y-3">
                {documentRows.length === 0 ? (
                  <div className="text-sm text-muted-foreground">No uploaded documents available yet.</div>
                ) : (
                  <div className="grid md:grid-cols-2 gap-3">
                    {documentRows.map(({ key, app, doc }) => (
                      <div key={key} className="rounded-xl border border-border p-4 space-y-2">
                        <div className="font-semibold text-sm">{doc.name}</div>
                        <div className="text-xs text-muted-foreground">
                          Application: {app.code} • {app.user_name} {app.user_email ? `• ${app.user_email}` : ""}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Service: {app.service_name} {doc.size ? `• ${(doc.size / 1024).toFixed(1)} KB` : ""}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => void previewDocument(key, doc)}
                            disabled={loadingDocumentKey === key}
                          >
                            <Eye className="h-4 w-4 mr-1" /> Preview
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => void downloadDocument(key, doc)}
                            disabled={loadingDocumentKey === key}
                          >
                            <Download className="h-4 w-4 mr-1" /> Download
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div id="applications" className="space-y-4">
              <h2 className="font-bold text-xl">Application Queue</h2>
              {applications.map((app) => (
                <div key={app.id} className="card-soft p-5">
                  <div className="grid lg:grid-cols-5 gap-3 items-end">
                    <div>
                      <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                        {t("track_label")}
                      </div>
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
                      <div className="text-xs text-muted-foreground mt-1">
                        Payment: {app.payment_status === "paid" ? "Paid" : "Pending"} {app.amount ? `• ₹${app.amount.toFixed(2)}` : ""}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">{t("admin_current_status")}</div>
                      <StatusBadge status={app.status} />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground block mb-1">{t("admin_update_status")}</label>
                      <select
                        value={app.status}
                        onChange={async (e) => {
                          try {
                            await updateApplicationStatus(app.id, e.target.value as (typeof STATUS_FLOW)[number]);
                            toast.success(t("admin_status_updated"));
                          } catch {
                            toast.error(t("admin_status_update_failed"));
                          }
                        }}
                        className="w-full rounded-xl border border-border bg-background h-10 px-3 text-sm"
                      >
                        {STATUS_FLOW.map((statusValue) => (
                          <option key={statusValue} value={statusValue}>
                            {t(STATUS_LABEL_KEYS[statusValue])}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  {app.submitted_payload && (
                    <div className="mt-3 border-t border-border pt-3 text-xs text-muted-foreground space-y-1">
                      {app.submitted_payload && Object.entries(app.submitted_payload).map(([key, value]) => (
                        <div key={key}>{key}: {value}</div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div id="contacts" className="space-y-4">
              <h2 className="font-bold text-xl">Contact Requests</h2>
              <div className="card-soft p-5 space-y-3">
                <p className="text-sm text-muted-foreground">
                  Contact submissions are sent to Formspree. Review requests in your Formspree dashboard and inbox.
                </p>
                <div className="rounded-xl border border-border p-3 text-xs text-muted-foreground">
                  Ensure <code>VITE_FORMSPREE_ENDPOINT</code> is configured in production.
                </div>
              </div>
            </div>
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
