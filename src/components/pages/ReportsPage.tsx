import { useState } from "react";
import { ClipboardList, Printer, Trash2, X } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { useI18n } from "@/i18n/I18nProvider";
import { useStore, type InspectionReport } from "@/store/tasks";
import { useFormatters } from "@/lib/format";
import { useAuth } from "@/auth/AuthProvider";

export function ReportsPage() {
  const { t } = useI18n();
  const { reports, employees, deleteReport } = useStore();
  const { isLoading } = useAuth();
  const fmt = useFormatters();
  const [open, setOpen] = useState<InspectionReport | null>(null);

  if (isLoading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background">
        <div className="size-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  const nameFor = (id: string) => employees.find((e) => e.id === id)?.name ?? id;

  return (
    <AppShell>
      <div className="px-4 sm:px-6 lg:px-10 py-8 sm:py-10 max-w-6xl mx-auto">
        <div className="flex items-start gap-4 mb-8">
          <div className="size-12 rounded-2xl bg-foreground text-background flex items-center justify-center shrink-0">
            <ClipboardList className="size-6" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground font-semibold">
              {t.nav.reports}
            </p>
            <h1 className="font-display text-3xl sm:text-4xl font-bold text-foreground tracking-tight mt-1">
              {t.checklist.reportsTitle}
            </h1>
            <p className="text-muted-foreground mt-2 text-sm">{t.checklist.reportsSubtitle}</p>
          </div>
        </div>

        <div className="print:hidden">
          {reports.length === 0 ? (
            <div className="bg-surface border border-border rounded-3xl p-16 text-center shadow-soft">
              <p className="text-muted-foreground">{t.checklist.noReports}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reports.map((r) => (
                <article
                  key={r.id}
                  className="bg-surface border border-border rounded-3xl p-5 sm:p-6 shadow-soft flex flex-col"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-base uppercase tracking-widest text-muted-foreground font-bold">
                        {t.checklist.job_number} · {r.job_number || "—"}
                      </p>
                      <h3 className="font-display text-2xl font-bold text-foreground mt-1.5 truncate">
                        {r.station_name || r.inspector_name || "Inspection Report"}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1.5">
                        {t.checklist.submittedBy}{" "}
                        <span className="text-foreground font-semibold">
                          {nameFor(r.submitted_by_id)}
                        </span>{" "}
                        · {fmt.datetime(r.submitted_at)}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        if (confirm(t.common.delete + "?")) deleteReport(r.id);
                      }}
                      className="size-9 rounded-full text-muted-foreground hover:bg-urgent-soft hover:text-urgent flex items-center justify-center"
                      aria-label={t.common.delete}
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-4 text-center">
                    <Mini label={t.checklist.product_quality} value={r.product_quality} />
                    <Mini label={t.checklist.caliper} value={r.caliper} />
                    <Mini
                      label={t.checklist.temperature}
                      value={r.temperature_c ? `${r.temperature_c}°C` : "—"}
                    />
                  </div>
                  <button
                    onClick={() => setOpen(r)}
                    className="mt-4 w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-foreground text-background text-xs font-bold uppercase tracking-widest hover:opacity-90"
                  >
                    {t.checklist.open}
                  </button>
                </article>
              ))}
            </div>
          )}
        </div>

        {open && <ReportModal report={open} onClose={() => setOpen(null)} nameFor={nameFor} />}
      </div>
    </AppShell>
  );
}

function Mini({ label, value }: { label: string; value?: string }) {
  return (
    <div className="bg-surface-muted rounded-xl p-2">
      <div className="text-[9px] uppercase tracking-widest text-muted-foreground truncate">
        {label}
      </div>
      <div className="text-xs font-bold text-foreground capitalize mt-0.5 truncate">
        {value ?? "—"}
      </div>
    </div>
  );
}

function ReportModal({
  report,
  onClose,
  nameFor,
}: {
  report: InspectionReport;
  onClose: () => void;
  nameFor: (id: string) => string;
}) {
  const { t } = useI18n();
  const fmt = useFormatters();
  const r = report;

  const Row = ({ label, value }: { label: string; value?: string }) => (
    <div className="flex justify-between gap-3 py-1.5 border-b border-border/50 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground capitalize text-end">{value || "—"}</span>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 bg-foreground/60 backdrop-blur-sm flex items-stretch sm:items-center justify-center p-0 sm:p-4 print:absolute print:inset-0 print:bg-white print:block print:p-0">
      <div className="bg-surface w-full max-w-3xl sm:rounded-3xl border border-border shadow-elevated overflow-hidden flex flex-col max-h-dvh print:max-h-none print:shadow-none print:border-0 print:block print:overflow-visible">
        <div className="flex items-center justify-between px-5 sm:px-7 py-4 border-b border-border print:hidden">
          <h2 className="font-display text-lg font-bold text-foreground">
            {t.checklist.reportsTitle}
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-full border border-border text-xs font-bold hover:bg-accent"
            >
              <Printer className="size-3.5" /> {t.checklist.print}
            </button>
            <button
              onClick={onClose}
              className="size-9 rounded-full hover:bg-accent flex items-center justify-center"
              aria-label={t.checklist.close}
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto p-5 sm:p-7 space-y-6 text-sm print:overflow-visible print:h-auto print:p-0 print:block">
          <header className="flex flex-col items-start gap-4">
            <img
              src="https://i.postimg.cc/N0VY5rgN/logo-for-blal.jpg"
              alt="Company Logo"
              className="h-16 object-contain"
            />
            <div>
              <h1 className="font-display text-2xl font-bold text-foreground">
                MODERN ENTERPRISE — Loading & Quality Check List
              </h1>
              <p className="text-xs text-muted-foreground mt-1">
                {t.checklist.submittedBy}: <strong>{nameFor(r.submitted_by_id)}</strong> ·{" "}
                {fmt.datetime(r.submitted_at)}
              </p>
            </div>
          </header>

          <Section title={t.checklist.jobInfo}>
            <Row label={t.checklist.job_number} value={r.job_number} />
            <Row label={t.checklist.date} value={fmt.date(r.date) || r.date} />
            <Row label={t.checklist.supervisor} value={r.supervisor} />
            <Row label={t.checklist.arrival_time} value={r.arrival_time} />
            <Row label={t.checklist.departure_time} value={r.departure_time} />
          </Section>

          <Section title={t.checklist.stationDetails}>
            <Row label={t.checklist.station_name} value={r.station_name} />
            <Row label={t.checklist.station_manager} value={r.station_manager} />
            <Row label={t.checklist.order_summary} value={r.order_summary} />
          </Section>

          <Section title={t.checklist.productInspection}>
            <Row label={t.checklist.product_quality} value={r.product_quality} />
            <Row
              label={`${t.checklist.product_quality} ${t.checklist.notes}`}
              value={r.product_quality_notes}
            />
            <Row label={t.checklist.caliper} value={r.caliper} />
            <Row label={`${t.checklist.caliper} ${t.checklist.notes}`} value={r.caliper_notes} />
            <Row label={t.checklist.washing} value={r.washing} />
            <Row label={`${t.checklist.washing} ${t.checklist.notes}`} value={r.washing_notes} />
            <Row label={t.checklist.packing_material} value={r.packing_material} />
            <Row
              label={`${t.checklist.packing_material} ${t.checklist.notes}`}
              value={r.packing_material_notes}
            />
            <Row label={t.checklist.temperature_treatment} value={r.temperature_treatment} />
            <Row
              label={t.checklist.temperature}
              value={r.temperature_c ? `${r.temperature_c}°C` : "—"}
            />
            <Row
              label={`${t.checklist.temperature_treatment} ${t.checklist.notes}`}
              value={r.temperature_notes}
            />
            <Row label={t.checklist.packing_weight_size} value={r.packing_weight_size} />
            <Row
              label={`${t.checklist.packing_weight_size} ${t.checklist.notes}`}
              value={r.packing_weight_size_notes}
            />
          </Section>

          <Section title={t.checklist.palletsInspection}>
            <Row label={t.checklist.pallets_check} value={r.pallets_check?.replace("_", " ")} />
            <Row
              label={`${t.checklist.pallets_check} ${t.checklist.notes}`}
              value={r.pallets_check_notes}
            />
            <Row label={t.checklist.pallets_condition} value={r.pallets_condition_type} />
            <Row
              label={`${t.checklist.pallets_condition} (${t.checklist.strong})`}
              value={r.pallets_condition_strength}
            />
            <Row
              label={`${t.checklist.pallets_condition} ${t.checklist.notes}`}
              value={r.pallets_condition_notes}
            />
            <Row
              label={`${t.checklist.pallets_prepared} — ${t.checklist.weight}`}
              value={r.pallets_prepared_weight ? `${r.pallets_prepared_weight} kg` : "—"}
            />
            <Row label={t.checklist.wrapping} value={r.pallets_prepared_wrapping} />
            <Row
              label={`${t.checklist.pallets_prepared} ${t.checklist.notes}`}
              value={r.pallets_prepared_notes}
            />
            <Row label={t.checklist.fitting} value={r.fitting?.replace("_", " ")} />
            <Row label={`${t.checklist.fitting} ${t.checklist.notes}`} value={r.fitting_notes} />
          </Section>

          <Section title={t.checklist.storageLoading}>
            <Row label={t.checklist.storage_condition} value={r.storage_condition} />
            <Row label={t.checklist.start_at} value={r.loading_start} />
            <Row label={t.checklist.end_at} value={r.loading_end} />
            <Row label={t.checklist.container_washed} value={r.container_washed} />
            <Row
              label={`${t.checklist.container_washed} ${t.checklist.notes}`}
              value={r.container_washed_notes}
            />
            <Row label={t.checklist.testing_temp_condition} value={r.testing_temp_condition} />
            <Row label={t.checklist.final_loading_details} value={r.final_loading_details} />
          </Section>

          <Section title={t.checklist.signature}>
            <Row label={t.checklist.inspector_name} value={r.inspector_name} />
            <Row label={t.checklist.signature_field} value={r.signature} />
          </Section>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="font-display text-sm font-bold uppercase tracking-widest text-foreground border-b-2 border-foreground/80 pb-1 mb-2">
        {title}
      </h3>
      <div>{children}</div>
    </section>
  );
}
