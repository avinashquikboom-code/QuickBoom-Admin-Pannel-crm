"use client";
import * as React from "react";
import api from "../../../lib/api";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import { Label } from "@/components/common/Label";
import { DataTable } from "@/components/common/DataTable";
import { FormDrawer } from "@/components/common/drawers";
import { sessionCanAction, hrmError } from "@/modules/hrm/hrm-api";
import { toast } from "@/hooks/use-toast";
const unwrap = (value) => value?.data ?? value;
const blankSlab = () => ({
  name: "",
  minAmount: "",
  maxAmount: "",
  ratePercent: "",
  isActive: true,
});
const blank = () => ({
  name: "",
  description: "",
  roleId: "",
  status: "ACTIVE",
  calculationBasis: "FULL_PAYMENT_AMOUNT",
  startsAt: new Date().toISOString().slice(0, 10),
  endsAt: "",
  allowGaps: false,
  slabs: [blankSlab()],
});
function Field({ label, children }) {
  return (
    <Label className="grid min-w-0 gap-2 text-xs">
      {label}
      {children}
    </Label>
  );
}
const money = (n) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(
    Number(n),
  );
const dateOnly = (value) => (value ? String(value).slice(0, 10) : "");
function activePeriodConflicts(rows, form) {
  if (!form || form.status !== "ACTIVE" || !form.roleId || !form.startsAt) return [];
  const start = dateOnly(form.startsAt);
  const end = dateOnly(form.endsAt) || "9999-12-31";
  return rows.filter((row) => {
    if (
      row.status !== "ACTIVE" ||
      Number(row.roleId) !== Number(form.roleId) ||
      (form.id && Number(row.id) === Number(form.id))
    ) return false;
    const rowStart = dateOnly(row.startsAt) || "0000-01-01";
    const rowEnd = dateOnly(row.endsAt) || "9999-12-31";
    return rowStart <= end && rowEnd >= start;
  });
}
export function RoleCommissionSettings() {
  const [rows, setRows] = React.useState([]),
    [roles, setRoles] = React.useState([]),
    [error, setError] = React.useState(""),
    [loading, setLoading] = React.useState(true),
    [manage, setManage] = React.useState(false);
  const [form, setForm] = React.useState(null),
    [saving, setSaving] = React.useState(false),
    [history, setHistory] = React.useState(null),
    [preview, setPreview] = React.useState(null),
    [previewBusy, setPreviewBusy] = React.useState(false);
  const [query, setQuery] = React.useState({
    roleId: "",
    amount: "",
    date: new Date().toISOString().slice(0, 10),
  });
  const periodConflicts = activePeriodConflicts(rows, form);
  const load = React.useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [configs, roleRows] = await Promise.all([
        api.get("/commissions/configs/rules"),
        api.get("/commissions/configs/roles"),
      ]);
      setRows(unwrap(configs));
      setRoles(unwrap(roleRows));
    } catch (e) {
      setError(hrmError(e));
    } finally {
      setLoading(false);
    }
  }, []);
  React.useEffect(() => {
    setManage(sessionCanAction("COMMISSION", "MANAGE"));
    load();
  }, [load]);
  async function save() {
    if (periodConflicts.length) {
      toast.error("An active configuration already covers this role and effective period. Edit the existing rule or choose non-overlapping dates.");
      return;
    }
    setSaving(true);
    try {
      const body = {
        ...form,
        roleId: Number(form.roleId),
        endsAt: form.endsAt || null,
        slabs: form.slabs.map((s) => ({
          ...s,
          minAmount: Number(s.minAmount),
          maxAmount:
            s.maxAmount === "" || s.maxAmount == null
              ? null
              : Number(s.maxAmount),
          ratePercent: Number(s.ratePercent),
        })),
      };
      if (form.id)
        await api.patch(`/commissions/configs/rules/${form.id}`, body);
      else await api.post("/commissions/configs/rules", body);
      setForm(null);
      setPreview(null);
      toast.success("Commission configuration saved");
      await load();
    } catch (e) {
      toast.error(hrmError(e));
    } finally {
      setSaving(false);
    }
  }
  const set = (key, value) => setForm({ ...form, [key]: value });
  function edit(row) {
    setForm({
      ...row,
      startsAt: row.startsAt?.slice(0, 10) || "",
      endsAt: row.endsAt?.slice(0, 10) || "",
      allowGaps: false,
      slabs: row.slabs.map((s) => ({ ...s, maxAmount: s.maxAmount ?? "" })),
    });
  }
  return (
    <section className="space-y-4">
      <div className="flex flex-wrap justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">
            Role-based commission configurations
          </h2>
          <p className="text-sm text-slate-500">
            The selected percentage applies to the full confirmed payment. Saved
            commissions retain their original calculation.
          </p>
        </div>
        {manage && (
          <Button onClick={() => setForm(blank())}>Add configuration</Button>
        )}
      </div>
      {error && (
        <div
          role="alert"
          className="rounded-xl bg-rose-50 p-4 text-sm text-rose-700"
        >
          {error}
          <Button variant="outline" onClick={load}>
            Retry
          </Button>
        </div>
      )}
      <DataTable
        label="Commission configurations"
        isLoading={loading}
        data={rows}
        columns={[
          { header: "Name", accessorKey: "name" },
          { header: "Role", cell: (r) => r.role?.name },
          { header: "Status", accessorKey: "status" },
          {
            header: "Effective dates",
            cell: (r) =>
              `${r.startsAt?.slice(0, 10)} → ${r.endsAt?.slice(0, 10) || "No end date"}`,
          },
          {
            header: "Slabs",
            cell: (r) => r.slabs.filter((s) => s.isActive).length,
          },
          { header: "Created by", cell: (r) => r.createdById ?? "—" },
          {
            header: "Updated",
            cell: (r) => new Date(r.updatedAt).toLocaleString(),
          },
        ]}
        rowActions={[
          ...(manage
            ? [{ label: "Edit / activate / deactivate", onSelect: edit }]
            : []),
          { label: "Configuration history", onSelect: setHistory },
        ]}
      />
      <div className="rounded-xl border bg-white p-4">
        <h3 className="font-semibold">Preview commission</h3>
        <form
          className="mt-4 grid items-end gap-3 sm:grid-cols-2 lg:grid-cols-4"
          onSubmit={async (e) => {
            e.preventDefault();
            setPreview(null);
            setPreviewBusy(true);
            try {
              setPreview(
                unwrap(
                  await api.post("/commissions/configs/preview", {
                    ...query,
                    roleId: Number(query.roleId),
                    amount: Number(query.amount),
                  }),
                ),
              );
            } catch (err) {
              toast.error(hrmError(err));
            } finally {
              setPreviewBusy(false);
            }
          }}
        >
          <Field label="Employee role">
            <select
              required
              className="h-10 rounded-md border px-2"
              value={query.roleId}
              onChange={(e) => setQuery({ ...query, roleId: e.target.value })}
            >
              <option value="">Select role</option>
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Full sale amount">
            <Input
              type="number"
              min="0"
              step="0.01"
              required
              value={query.amount}
              onChange={(e) => setQuery({ ...query, amount: e.target.value })}
            />
          </Field>
          <Field label="Applicable date">
            <Input
              type="date"
              required
              value={query.date}
              onChange={(e) => setQuery({ ...query, date: e.target.value })}
            />
          </Field>
          <Button disabled={previewBusy}>
            {previewBusy ? "Calculating…" : "Preview"}
          </Button>
        </form>
        {preview && (
          <div className="mt-4 space-y-2 rounded-xl bg-brand-light p-4 text-sm">
            <p>
              {preview.configuration.name} · {preview.configuration.role?.name}{" "}
              · {preview.slab.name}
            </p>
            <p>
              Full sale {money(preview.saleAmount)} × {preview.slab.ratePercent}
              % = <strong>{money(preview.total)}</strong>
            </p>
            <p>
              Employee: {money(preview.employeeAmount)} · Team Leader:{" "}
              {money(preview.leaderAmount)}
            </p>
            <p className="text-xs">
              Existing single-recipient allocation. Preview does not credit
              wallets.
            </p>
          </div>
        )}
      </div>
      <FormDrawer
        open={!!form}
        onOpenChange={(v) => {
          if (!v && !saving) setForm(null);
        }}
        title={
          form?.id
            ? "Edit commission configuration"
            : "Add commission configuration"
        }
        size="xl"
        loading={saving}
        disabled={periodConflicts.length > 0}
        onSubmit={save}
        submitLabel="Save configuration"
      >
        {form && (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Configuration name">
                <Input
                  required
                  maxLength={120}
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                />
              </Field>
              <Field label="Eligible role">
                <select
                  required
                  className="h-10 rounded-md border px-2"
                  value={form.roleId}
                  onChange={(e) => set("roleId", e.target.value)}
                >
                  <option value="">Select role</option>
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Description">
                <Input
                  value={form.description || ""}
                  onChange={(e) => set("description", e.target.value)}
                />
              </Field>
              <Field label="Status">
                <select
                  className="h-10 rounded-md border px-2"
                  value={form.status}
                  onChange={(e) => set("status", e.target.value)}
                >
                  <option>ACTIVE</option>
                  <option>INACTIVE</option>
                </select>
              </Field>
              <Field label="Effective start">
                <Input
                  required
                  type="date"
                  value={form.startsAt}
                  onChange={(e) => set("startsAt", e.target.value)}
                />
              </Field>
              <Field label="Effective end (optional)">
                <Input
                  type="date"
                  min={form.startsAt}
                  value={form.endsAt}
                  onChange={(e) => set("endsAt", e.target.value)}
                />
              </Field>
            </div>
            {periodConflicts.length > 0 && (
              <div role="alert" className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
                <p className="font-semibold">An active rule already covers this role and date range.</p>
                <p className="mt-1">Add multiple slabs inside one role configuration. Open the active rule below and use “Add slab”; overlapping active configurations for the same role are not allowed.</p>
                <ul className="mt-2 space-y-2">
                  {periodConflicts.map((row) => (
                    <li key={row.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-amber-100/70 p-2">
                      <span>#{row.id} {row.name} · {dateOnly(row.startsAt)} to {dateOnly(row.endsAt) || "No end date"}</span>
                      <Button type="button" size="sm" variant="outline" onClick={() => edit(row)}>
                        Edit #{row.id} and add slabs
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <p>
              Basis: full confirmed payment amount × selected percentage. Ranges
              include both endpoints.
            </p>
            <Label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.allowGaps}
                onChange={(e) => set("allowGaps", e.target.checked)}
              />
              Allow intentional gaps between slabs
            </Label>
            {form.slabs.map((s, index) => (
              <fieldset
                key={s.id || `new-${index}`}
                className="space-y-3 rounded-xl border p-3"
              >
                <legend className="px-1 font-semibold">Slab {index + 1}</legend>
                <div className="grid gap-3 sm:grid-cols-2">
                  {[
                    ["name", "Slab name"],
                    ["minAmount", "Minimum sale"],
                    ["maxAmount", "Maximum sale (blank = unlimited)"],
                    ["ratePercent", "Commission %"],
                  ].map(([key, label]) => (
                    <Field key={key} label={label}>
                      <Input
                        required={key !== "maxAmount"}
                        type={key === "name" ? "text" : "number"}
                        min={key === "name" ? undefined : 0}
                        max={key === "ratePercent" ? 100 : undefined}
                        step="0.01"
                        value={s[key]}
                        onChange={(e) =>
                          set(
                            "slabs",
                            form.slabs.map((item, i) =>
                              i === index
                                ? { ...item, [key]: e.target.value }
                                : item,
                            ),
                          )
                        }
                      />
                    </Field>
                  ))}
                </div>
                <div className="flex flex-wrap gap-3">
                  <Label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={s.isActive}
                      onChange={(e) =>
                        set(
                          "slabs",
                          form.slabs.map((item, i) =>
                            i === index
                              ? { ...item, isActive: e.target.checked }
                              : item,
                          ),
                        )
                      }
                    />
                    Active
                  </Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={index === 0}
                    onClick={() => {
                      const items = [...form.slabs];
                      [items[index - 1], items[index]] = [
                        items[index],
                        items[index - 1],
                      ];
                      set("slabs", items);
                    }}
                  >
                    Move up
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={form.slabs.length === 1}
                    onClick={() =>
                      set(
                        "slabs",
                        form.slabs.filter((_, i) => i !== index),
                      )
                    }
                  >
                    Remove / deactivate
                  </Button>
                </div>
              </fieldset>
            ))}
            <Button
              type="button"
              variant="outline"
              onClick={() => set("slabs", [...form.slabs, blankSlab()])}
            >
              Add slab
            </Button>
            <p className="text-xs text-slate-500">
              For paise-accurate continuous ranges, start the next slab at the
              previous maximum + ₹0.01. Existing earnings are never
              recalculated.
            </p>
          </>
        )}
      </FormDrawer>
      <FormDrawer
        open={!!history}
        onOpenChange={(v) => {
          if (!v) setHistory(null);
        }}
        title="Configuration history"
        showFooter={false}
      >
        {history && (
          <div className="space-y-4">
            <p>
              Created: {new Date(history.createdAt).toLocaleString()} · User{" "}
              {history.createdById ?? "—"}
            </p>
            {!(history.history || []).length && <p>No prior versions.</p>}
            {(history.history || [])
              .slice()
              .reverse()
              .map((h, i) => (
                <div key={i} className="rounded-xl border p-3">
                  <p>
                    {h.name} · {h.status}
                  </p>
                  <p>
                    Changed {new Date(h.changedAt).toLocaleString()} by user{" "}
                    {h.changedById}
                  </p>
                  {h.slabs.map((s) => (
                    <p key={s.id}>
                      {s.name}: {money(s.minAmount)} –{" "}
                      {s.maxAmount == null ? "Unlimited" : money(s.maxAmount)} ·{" "}
                      {s.ratePercent}%
                    </p>
                  ))}
                </div>
              ))}
          </div>
        )}
      </FormDrawer>
    </section>
  );
}
