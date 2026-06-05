import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { CheckCircle2, ClipboardList, Send, Thermometer } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { useI18n } from "@/i18n/I18nProvider";
import { useAuth } from "@/auth/AuthProvider";
import {
  useStore,
  type Caliper,
  type FittingT,
  type InspectionReport,
  type PalletNew,
  type PalletStrength,
  type Rating3,
  type StampedT,
  type YesNo,
} from "@/store/tasks";
import { cn } from "@/lib/utils";

type FormState = Omit<InspectionReport, "id" | "submitted_at">;

const empty: FormState = {
  job_number: "",
  date: new Date().toISOString().slice(0, 10),
  supervisor: "",
  arrival_time: "",
  departure_time: "",
  station_name: "",
  station_manager: "",
  order_summary: "",
  product_quality_notes: "",
  caliper_notes: "",
  washing_notes: "",
  packing_material_notes: "",
  temperature_c: "",
  temperature_notes: "",
  packing_weight_size_notes: "",
  pallets_check_notes: "",
  pallets_condition_notes: "",
  pallets_prepared_weight: "",
  pallets_prepared_notes: "",
  fitting_notes: "",
  storage_condition: "",
  loading_start: "",
  loading_end: "",
  container_washed_notes: "",
  testing_temp_condition: "",
  final_loading_details: "",
  inspector_name: "",
  signature: "",
  submitted_by_id: "",
};

export function ChecklistPage() {
  const { t } = useI18n();
  const { addReport, currentEmployeeId, employees } = useStore();
  const { isAdmin, isLoading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState<FormState>({ ...empty, submitted_by_id: currentEmployeeId });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (currentEmployeeId) {
      setForm((s) => ({ ...s, submitted_by_id: currentEmployeeId }));
    }
  }, [currentEmployeeId]);

  useEffect(() => {
    if (!isLoading && isAdmin) {
      navigate({ to: "/reports" });
    }
  }, [isAdmin, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background">
        <div className="size-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((s) => ({ ...s, [k]: v }));

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!form.job_number.trim() || !form.inspector_name.trim()) {
      setError(t.checklist.validation);
      return;
    }

    // تنظيف البيانات باستخدام undefined بدلاً من null لتتوافق مع TypeScript
    const cleanedForm: FormState = {
      ...form,
      product_quality: form.product_quality || undefined,
      caliper: form.caliper || undefined,
      washing: form.washing || undefined,
      packing_material: form.packing_material || undefined,
      temperature_treatment: form.temperature_treatment || undefined,
      packing_weight_size: form.packing_weight_size || undefined,
      pallets_check: form.pallets_check || undefined,
      pallets_condition_type: form.pallets_condition_type || undefined,
      pallets_condition_strength: form.pallets_condition_strength || undefined,
      pallets_prepared_wrapping: form.pallets_prepared_wrapping || undefined,
      fitting: form.fitting || undefined,
      container_washed: form.container_washed || undefined,
      submitted_by_id: currentEmployeeId,
    };

    addReport(cleanedForm);
    setSuccess(true);

    setTimeout(() => {
      navigate({ to: "/reports" });
    }, 1200);
  };

  const me = employees.find((e) => e.id === currentEmployeeId);

  return (
    <AppShell>
      <div className="px-4 sm:px-6 lg:px-10 py-8 sm:py-10 max-w-4xl mx-auto">
        <div className="flex items-start gap-4 mb-8">
          <div className="size-12 rounded-2xl bg-foreground text-background flex items-center justify-center shrink-0">
            <ClipboardList className="size-6" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground font-semibold">
              {t.nav.checklist}
            </p>
            <h1 className="font-display text-3xl sm:text-4xl font-bold text-foreground tracking-tight mt-1">
              {t.checklist.title}
            </h1>
            <p className="text-muted-foreground mt-2 text-sm">
              {t.checklist.subtitle}
              {me ? ` · ${me.name}` : ""}
            </p>
          </div>
        </div>

        <form onSubmit={submit} className="space-y-6">
          {/* Job Information */}
          <Section title={t.checklist.jobInfo}>
            <Grid>
              <Text
                label={t.checklist.job_number}
                value={form.job_number}
                onChange={(v) => set("job_number", v)}
                required
              />
              <DateInput
                label={t.checklist.date}
                value={form.date}
                onChange={(v) => set("date", v)}
              />
              <Text
                label={t.checklist.supervisor}
                value={form.supervisor}
                onChange={(v) => set("supervisor", v)}
              />
              <TimeInput
                label={t.checklist.arrival_time}
                value={form.arrival_time}
                onChange={(v) => set("arrival_time", v)}
              />
              <TimeInput
                label={t.checklist.departure_time}
                value={form.departure_time}
                onChange={(v) => set("departure_time", v)}
              />
            </Grid>
          </Section>

          {/* Station Details */}
          <Section title={t.checklist.stationDetails}>
            <Grid>
              <Text
                label={t.checklist.station_name}
                value={form.station_name}
                onChange={(v) => set("station_name", v)}
              />
              <Text
                label={t.checklist.station_manager}
                value={form.station_manager}
                onChange={(v) => set("station_manager", v)}
              />
            </Grid>
            <Field label={t.checklist.order_summary}>
              <textarea
                rows={3}
                value={form.order_summary}
                onChange={(e) => set("order_summary", e.target.value)}
                className="textarea"
              />
            </Field>
          </Section>

          {/* Product Inspection */}
          <Section title={t.checklist.productInspection}>
            <Rating
              label={t.checklist.product_quality}
              options={[
                ["fair", t.checklist.fair],
                ["good", t.checklist.good],
                ["excellent", t.checklist.excellent],
              ]}
              value={form.product_quality}
              onChange={(v) => set("product_quality", v as Rating3)}
              notes={form.product_quality_notes}
              onNotes={(v) => set("product_quality_notes", v)}
              notesLabel={t.checklist.notes}
            />
            <Rating
              label={t.checklist.caliper}
              options={[
                ["fair", t.checklist.fair],
                ["fit", t.checklist.fit],
                ["perfect", t.checklist.perfect],
              ]}
              value={form.caliper}
              onChange={(v) => set("caliper", v as Caliper)}
              notes={form.caliper_notes}
              onNotes={(v) => set("caliper_notes", v)}
              notesLabel={t.checklist.notes}
            />
            <Rating
              label={t.checklist.washing}
              options={[
                ["fair", t.checklist.fair],
                ["good", t.checklist.good],
                ["excellent", t.checklist.excellent],
              ]}
              value={form.washing}
              onChange={(v) => set("washing", v as Rating3)}
              notes={form.washing_notes}
              onNotes={(v) => set("washing_notes", v)}
              notesLabel={t.checklist.notes}
            />
            <Rating
              label={t.checklist.packing_material}
              options={[
                ["fair", t.checklist.fair],
                ["good", t.checklist.good],
                ["excellent", t.checklist.excellent],
              ]}
              value={form.packing_material}
              onChange={(v) => set("packing_material", v as Rating3)}
              notes={form.packing_material_notes}
              onNotes={(v) => set("packing_material_notes", v)}
              notesLabel={t.checklist.notes}
            />
            <Rating
              label={
                <span className="inline-flex items-center gap-2">
                  <Thermometer className="size-4 text-urgent" /> {t.checklist.temperature_treatment}
                </span>
              }
              options={[
                ["fair", t.checklist.fair],
                ["good", t.checklist.good],
                ["excellent", t.checklist.excellent],
              ]}
              value={form.temperature_treatment}
              onChange={(v) => set("temperature_treatment", v as Rating3)}
              notes={form.temperature_notes}
              onNotes={(v) => set("temperature_notes", v)}
              notesLabel={t.checklist.notes}
              extra={
                <div className="flex items-center gap-2 mt-2">
                  <input
                    type="number"
                    step="0.1"
                    placeholder={t.checklist.temperature}
                    value={form.temperature_c}
                    onChange={(e) => set("temperature_c", e.target.value)}
                    className="w-40 input"
                  />
                  <span className="text-xs text-muted-foreground font-bold">°C</span>
                </div>
              }
            />
            <Rating
              label={t.checklist.packing_weight_size}
              options={[
                ["fair", t.checklist.fair],
                ["good", t.checklist.good],
                ["excellent", t.checklist.excellent],
              ]}
              value={form.packing_weight_size}
              onChange={(v) => set("packing_weight_size", v as Rating3)}
              notes={form.packing_weight_size_notes}
              onNotes={(v) => set("packing_weight_size_notes", v)}
              notesLabel={t.checklist.notes}
            />
          </Section>

          {/* Pallets */}
          <Section title={t.checklist.palletsInspection}>
            <Rating
              label={t.checklist.pallets_check}
              options={[
                ["stamped", t.checklist.stamped],
                ["not_stamped", t.checklist.notStamped],
              ]}
              value={form.pallets_check}
              onChange={(v) => set("pallets_check", v as StampedT)}
              notes={form.pallets_check_notes}
              onNotes={(v) => set("pallets_check_notes", v)}
              notesLabel={t.checklist.notes}
            />

            <div className="space-y-3">
              <Rating
                label={t.checklist.pallets_condition}
                options={[
                  ["new", t.checklist.new],
                  ["used", t.checklist.used],
                ]}
                value={form.pallets_condition_type}
                onChange={(v) => set("pallets_condition_type", v as PalletNew)}
                notesLabel={t.checklist.notes}
              />
              <Rating
                label={`${t.checklist.pallets_condition} — ${t.checklist.fair}/${t.checklist.strong}/${t.checklist.excellent}`}
                options={[
                  ["fair", t.checklist.fair],
                  ["strong", t.checklist.strong],
                  ["excellent", t.checklist.excellent],
                ]}
                value={form.pallets_condition_strength}
                onChange={(v) => set("pallets_condition_strength", v as PalletStrength)}
                notes={form.pallets_condition_notes}
                onNotes={(v) => set("pallets_condition_notes", v)}
                notesLabel={t.checklist.notes}
              />
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-foreground mb-3">
                {t.checklist.pallets_prepared}
              </p>
              <Grid>
                <Text
                  label={t.checklist.weight}
                  type="number"
                  value={form.pallets_prepared_weight}
                  onChange={(v) => set("pallets_prepared_weight", v)}
                />
                <Field label={t.checklist.wrapping}>
                  <Choice
                    value={form.pallets_prepared_wrapping}
                    onChange={(v) => set("pallets_prepared_wrapping", v as YesNo)}
                    options={[
                      ["yes", t.checklist.yes],
                      ["no", t.checklist.no],
                    ]}
                  />
                </Field>
              </Grid>
              <Field label={t.checklist.notes}>
                <textarea
                  rows={2}
                  value={form.pallets_prepared_notes}
                  onChange={(e) => set("pallets_prepared_notes", e.target.value)}
                  className="textarea"
                />
              </Field>
            </div>

            <Rating
              label={t.checklist.fitting}
              options={[
                ["strong", t.checklist.strong],
                ["not_strong", t.checklist.notStrong],
              ]}
              value={form.fitting}
              onChange={(v) => set("fitting", v as FittingT)}
              notes={form.fitting_notes}
              onNotes={(v) => set("fitting_notes", v)}
              notesLabel={t.checklist.notes}
            />
          </Section>

          {/* Storage & Loading */}
          <Section title={t.checklist.storageLoading}>
            <Field label={t.checklist.storage_condition}>
              <textarea
                rows={2}
                value={form.storage_condition}
                onChange={(e) => set("storage_condition", e.target.value)}
                className="textarea"
              />
            </Field>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-foreground mb-3">
                {t.checklist.loading_time}
              </p>
              <Grid>
                <TimeInput
                  label={t.checklist.start_at}
                  value={form.loading_start}
                  onChange={(v) => set("loading_start", v)}
                />
                <TimeInput
                  label={t.checklist.end_at}
                  value={form.loading_end}
                  onChange={(v) => set("loading_end", v)}
                />
              </Grid>
            </div>
            <Rating
              label={t.checklist.container_washed}
              options={[
                ["yes", t.checklist.yes],
                ["no", t.checklist.no],
              ]}
              value={form.container_washed}
              onChange={(v) => set("container_washed", v as YesNo)}
              notes={form.container_washed_notes}
              onNotes={(v) => set("container_washed_notes", v)}
              notesLabel={t.checklist.notes}
            />
            <Field label={t.checklist.testing_temp_condition}>
              <textarea
                rows={2}
                value={form.testing_temp_condition}
                onChange={(e) => set("testing_temp_condition", e.target.value)}
                className="textarea"
              />
            </Field>
            <Field label={t.checklist.final_loading_details}>
              <textarea
                rows={3}
                value={form.final_loading_details}
                onChange={(e) => set("final_loading_details", e.target.value)}
                className="textarea"
              />
            </Field>
          </Section>

          {/* Signature */}
          <Section title={t.checklist.signature}>
            <Grid>
              <Text
                label={t.checklist.inspector_name}
                value={form.inspector_name}
                onChange={(v) => set("inspector_name", v)}
                required
              />
              <Text
                label={t.checklist.signature_field}
                value={form.signature}
                onChange={(v) => set("signature", v)}
              />
            </Grid>
          </Section>

          {error && (
            <div className="text-sm text-urgent bg-urgent-soft border border-urgent/30 rounded-xl px-4 py-3">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={success}
            className="w-full inline-flex items-center justify-center gap-2 bg-foreground text-background py-4 rounded-2xl text-sm font-bold uppercase tracking-[0.15em] hover:opacity-90 transition shadow-elevated disabled:opacity-60"
          >
            {success ? (
              <>
                <CheckCircle2 className="size-4" /> {t.checklist.submitted}
              </>
            ) : (
              <>
                <Send className="size-4" /> {t.checklist.submit}
              </>
            )}
          </button>
        </form>

        <style>{`
          .input { width: 100%; background: var(--color-background); border: 1px solid var(--color-border); border-radius: 0.75rem; padding: 0.75rem 1rem; font-size: 0.875rem; color: var(--color-foreground); outline: none; }
          .input:focus { box-shadow: 0 0 0 2px color-mix(in oklab, var(--color-primary) 25%, transparent); border-color: var(--color-primary); }
          .textarea { width: 100%; background: var(--color-background); border: 1px solid var(--color-border); border-radius: 0.75rem; padding: 0.75rem 1rem; font-size: 0.875rem; color: var(--color-foreground); outline: none; resize: vertical; }
          .textarea:focus { box-shadow: 0 0 0 2px color-mix(in oklab, var(--color-primary) 25%, transparent); border-color: var(--color-primary); }
          input[type=number]::-webkit-inner-spin-button, input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
          input[type=number] { -moz-appearance: textfield; }
        `}</style>
      </div>
    </AppShell>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="bg-surface border border-border rounded-3xl p-5 sm:p-7 shadow-soft space-y-5">
      <h2 className="font-display text-lg font-bold text-foreground border-b border-border pb-3">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Grid({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{children}</div>;
}

function Field({ label, children }: { label: ReactNode; children: ReactNode }) {
  return (
    <label className="block">
      <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-bold mb-2 block">
        {label}
      </span>
      {children}
    </label>
  );
}

function Text({
  label,
  value,
  onChange,
  type = "text",
  required,
}: {
  label: ReactNode;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <Field label={label}>
      <input
        type={type}
        value={value}
        required={required}
        onChange={(e) => onChange(e.target.value)}
        className="input"
      />
    </Field>
  );
}

function DateInput({
  label,
  value,
  onChange,
}: {
  label: ReactNode;
  value: string;
  onChange: (v: string) => void;
}) {
  const displayValue = value
    ? value.split("-").length === 3
      ? `${value.split("-")[2]}/${value.split("-")[1]}/${value.split("-")[0]}`
      : value
    : "";

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const parts = val.split("/");
    if (parts.length === 3 && parts[2].length === 4) {
      onChange(`${parts[2]}-${parts[1]}-${parts[0]}`);
    } else {
      onChange(val);
    }
  };

  return (
    <Field label={label}>
      <input
        type="text"
        placeholder="dd/mm/yyyy"
        value={displayValue}
        onChange={handleChange}
        className="input"
      />
    </Field>
  );
}

function TimeInput({
  label,
  value,
  onChange,
}: {
  label: ReactNode;
  value: string;
  onChange: (v: string) => void;
}) {
  const timePart = value.replace(/\s*(AM|PM)$/i, "").trim();
  const periodMatch = value.match(/\s*(AM|PM)$/i);
  const period = periodMatch ? periodMatch[1].toUpperCase() : "AM";

  return (
    <Field label={label}>
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="00:00"
          value={timePart}
          onChange={(e) => onChange(e.target.value ? `${e.target.value} ${period}` : "")}
          className="input flex-1"
        />
        <div className="flex border border-border rounded-[0.75rem] p-1 gap-1 shrink-0 bg-background">
          <button
            type="button"
            onClick={() => onChange(timePart ? `${timePart} AM` : "")}
            className={cn(
              "px-3 py-1 rounded-lg text-xs font-bold transition-colors",
              period === "AM"
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
            )}
          >
            AM
          </button>
          <button
            type="button"
            onClick={() => onChange(timePart ? `${timePart} PM` : "12:00 PM")}
            className={cn(
              "px-3 py-1 rounded-lg text-xs font-bold transition-colors",
              period === "PM"
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
            )}
          >
            PM
          </button>
        </div>
      </div>
    </Field>
  );
}

function Choice<T extends string>({
  value,
  onChange,
  options,
}: {
  value?: T;
  onChange: (v: T) => void;
  options: ReadonlyArray<readonly [T, string]>;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(([k, label]) => {
        const active = value === k;
        return (
          <button
            type="button"
            key={k}
            onClick={() => onChange(k)}
            className={cn(
              "min-h-11 px-4 rounded-xl text-xs font-bold uppercase tracking-widest border transition flex items-center gap-2",
              active
                ? "bg-foreground text-background border-foreground"
                : "bg-background border-border text-muted-foreground hover:text-foreground hover:border-foreground/40",
            )}
          >
            <span
              className={cn(
                "size-3.5 rounded border-2 flex items-center justify-center",
                active ? "bg-background border-background" : "border-muted-foreground/40",
              )}
            >
              {active && <span className="size-1.5 rounded-sm bg-foreground" />}
            </span>
            {label}
          </button>
        );
      })}
    </div>
  );
}

function Rating<T extends string>({
  label,
  options,
  value,
  onChange,
  notes,
  onNotes,
  notesLabel,
  extra,
}: {
  label: ReactNode;
  options: ReadonlyArray<readonly [T, string]>;
  value?: T;
  onChange: (v: T) => void;
  notes?: string;
  onNotes?: (v: string) => void;
  notesLabel: string;
  extra?: ReactNode;
}) {
  return (
    <div className="space-y-2 border-t border-border/60 pt-4 first:border-t-0 first:pt-0">
      <p className="text-xs font-bold uppercase tracking-widest text-foreground">{label}</p>
      <Choice value={value} onChange={onChange} options={options} />
      {extra}
      {onNotes && (
        <div>
          <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-bold mb-1.5 block mt-2">
            📝 {notesLabel}
          </span>
          <textarea
            rows={2}
            value={notes ?? ""}
            onChange={(e) => onNotes(e.target.value)}
            className="textarea"
          />
        </div>
      )}
    </div>
  );
}
