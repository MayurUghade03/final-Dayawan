import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useLang } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { STATUS_FLOW, useApplications } from "@/contexts/ApplicationContext";
import { Navigate } from "react-router-dom";
import { StatusBadge } from "@/components/StatusBadge";
import { toast } from "sonner";
import type { ApplicationStatus, Database, FormFieldType, ManagedService, ServiceCategory, UserProfile } from "@/types";
import { useEffect, useMemo, useState } from "react";
import { useServiceCatalog } from "@/contexts/ServiceCatalogContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

const STATUS_LABEL_KEYS: Record<ApplicationStatus, "status_submitted" | "status_received" | "status_processing" | "status_ready" | "status_completed"> = {
  submitted: "status_submitted",
  received: "status_received",
  processing: "status_processing",
  ready: "status_ready",
  completed: "status_completed",
};

const AdminPage = () => {
  const { t } = useLang();
  const { status, isAdmin } = useAuth();
  const { applications, updateApplicationStatus } = useApplications();
  const { services, upsertService, createServiceDraft } = useServiceCatalog();

  const [selectedServiceId, setSelectedServiceId] = useState<string>("");
  const [editingService, setEditingService] = useState<ManagedService | null>(null);
  const [savingService, setSavingService] = useState(false);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [savingUserId, setSavingUserId] = useState<string>("");

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

  const serviceOptions = useMemo(() => services.map((service) => ({ id: service.id, label: service.title })), [services]);

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
          <div className="container-rural space-y-6">
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
                    <Button onClick={saveService} disabled={savingService}>
                      {savingService ? "Saving..." : "Save service"}
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4">
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

            <div className="space-y-4">
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
                  {(app.submitted_documents?.length || app.submitted_payload) && (
                    <div className="mt-3 border-t border-border pt-3 text-xs text-muted-foreground space-y-1">
                      {app.submitted_documents && app.submitted_documents.length > 0 && (
                        <div className="space-y-1">
                          <div className="font-semibold text-foreground/80">Documents</div>
                          {app.submitted_documents.map((documentItem, index) => (
                            <div key={`${documentItem.name}-${index}`}>
                              {documentItem.url ? (
                                <a href={documentItem.url} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                                  {documentItem.name}
                                </a>
                              ) : (
                                <span>{documentItem.name}</span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                      {app.submitted_payload && Object.entries(app.submitted_payload).map(([key, value]) => (
                        <div key={key}>{key}: {value}</div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
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
