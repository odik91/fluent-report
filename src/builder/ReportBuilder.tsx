import type { CSSProperties, ReactNode } from "react";

import type {
  ColumnFormat,
  HAlign,
  PageFormat,
  ReportBand,
  ReportDefinition,
  TableBand,
  TableColumn,
  TextBand,
} from "../types";
import { createDefaultReportDefinition } from "./defaults";
import { insertBand, moveBand, newColumnId, removeBandAt, updateBandAt, updateMeta } from "./utils";

const box: CSSProperties = {
  border: "1px solid #d8dce6",
  borderRadius: 10,
  background: "#fff",
  padding: "0.75rem 1rem",
};

const label: CSSProperties = {
  display: "block",
  fontSize: 11,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.04em",
  color: "#5c6370",
  marginBottom: 4,
};

const input: CSSProperties = {
  width: "100%",
  padding: "0.45rem 0.55rem",
  borderRadius: 8,
  border: "1px solid #d8dce6",
  fontSize: 14,
  fontFamily: "inherit",
  boxSizing: "border-box",
};

const row: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "0.5rem 0.75rem",
  alignItems: "flex-end",
};

const btn: CSSProperties = {
  padding: "0.35rem 0.65rem",
  borderRadius: 8,
  border: "1px solid #d8dce6",
  background: "#f8f9fb",
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
  fontFamily: "inherit",
};

const btnDanger: CSSProperties = {
  ...btn,
  borderColor: "#fecdca",
  background: "#fef2f2",
  color: "#b42318",
};

const btnPrimary: CSSProperties = {
  ...btn,
  borderColor: "#1d6b4a",
  background: "#1d6b4a",
  color: "#fff",
};

function Field({
  title,
  children,
  style,
}: {
  title: string;
  children: ReactNode;
  style?: CSSProperties;
}) {
  return (
    <div style={{ flex: "1 1 140px", minWidth: 0, ...style }}>
      <span style={label}>{title}</span>
      {children}
    </div>
  );
}

function NumInput({
  value,
  onChange,
  min,
  step,
}: {
  value: number | undefined;
  onChange: (n: number | undefined) => void;
  min?: number;
  step?: number;
}) {
  return (
    <input
      type="number"
      style={input}
      min={min}
      step={step}
      value={value ?? ""}
      onChange={(e) => {
        const v = e.target.value;
        if (v === "") onChange(undefined);
        else onChange(Number(v));
      }}
    />
  );
}

export interface ReportBuilderProps {
  value: ReportDefinition;
  onChange: (next: ReportDefinition) => void;
  className?: string;
  style?: CSSProperties;
}

const FORMATS: PageFormat[] = ["a4", "a3", "letter", "legal"];
const ALIGNS: HAlign[] = ["left", "center", "right"];
const COL_FORMATS: ColumnFormat[] = ["text", "integer", "number", "currency", "date", "datetime"];

function TextBandEditor({
  band,
  onChange,
  onMoveUp,
  onMoveDown,
  onRemove,
  index,
  total,
}: {
  band: TextBand;
  onChange: (b: TextBand) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
  index: number;
  total: number;
}) {
  return (
    <fieldset style={{ ...box, marginBottom: 12 }}>
      <legend style={{ fontWeight: 700, padding: "0 0.35rem" }}>
        Teks #{index + 1}
        <span style={{ marginLeft: 8, fontWeight: 400, fontSize: 12, color: "#5c6370" }}>
          Gunakan {"{{path.ke.field}}"} pada data root
        </span>
      </legend>
      <div style={{ ...row, marginBottom: 8 }}>
        <Field title="Isi teks" style={{ flex: "1 1 100%" }}>
          <textarea
            style={{ ...input, minHeight: 72, resize: "vertical", fontFamily: "ui-monospace, monospace" }}
            value={band.value}
            onChange={(e) => onChange({ ...band, value: e.target.value })}
          />
        </Field>
      </div>
      <div style={row}>
        <Field title="Ukuran font">
          <NumInput value={band.fontSize} onChange={(n) => onChange({ ...band, fontSize: n })} min={6} step={1} />
        </Field>
        <Field title="Rata">
          <select
            style={input}
            value={band.align ?? "left"}
            onChange={(e) => onChange({ ...band, align: e.target.value as HAlign })}
          >
            {ALIGNS.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </Field>
        <Field title="Jarak bawah (mm)">
          <NumInput
            value={band.marginBottomMm}
            onChange={(n) => onChange({ ...band, marginBottomMm: n })}
            min={0}
            step={0.5}
          />
        </Field>
        <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, marginBottom: 2 }}>
          <input
            type="checkbox"
            checked={!!band.bold}
            onChange={(e) => onChange({ ...band, bold: e.target.checked })}
          />
          Tebal
        </label>
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
        <button type="button" style={btn} disabled={index <= 0} onClick={onMoveUp}>
          ↑
        </button>
        <button type="button" style={btn} disabled={index >= total - 1} onClick={onMoveDown}>
          ↓
        </button>
        <button type="button" style={btnDanger} onClick={onRemove}>
          Hapus band
        </button>
      </div>
    </fieldset>
  );
}

function SpacerBandEditor({
  band,
  onChange,
  onMoveUp,
  onMoveDown,
  onRemove,
  index,
  total,
}: {
  band: { type: "spacer"; heightMm: number };
  onChange: (b: { type: "spacer"; heightMm: number }) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
  index: number;
  total: number;
}) {
  return (
    <fieldset style={{ ...box, marginBottom: 12 }}>
      <legend style={{ fontWeight: 700, padding: "0 0.35rem" }}>Spasi #{index + 1}</legend>
      <div style={row}>
        <Field title="Tinggi (mm)">
          <NumInput value={band.heightMm} onChange={(n) => onChange({ ...band, heightMm: n ?? 0 })} min={0} step={1} />
        </Field>
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <button type="button" style={btn} disabled={index <= 0} onClick={onMoveUp}>
          ↑
        </button>
        <button type="button" style={btn} disabled={index >= total - 1} onClick={onMoveDown}>
          ↓
        </button>
        <button type="button" style={btnDanger} onClick={onRemove}>
          Hapus band
        </button>
      </div>
    </fieldset>
  );
}

function ColumnRow({
  col,
  onChange,
  onRemove,
}: {
  col: TableColumn;
  onChange: (c: TableColumn) => void;
  onRemove: () => void;
}) {
  const showLocale = col.format === "currency" || col.format === "number" || col.format === "integer";
  return (
    <div
      style={{
        padding: "10px 0",
        borderBottom: "1px solid #eef0f4",
      }}
    >
      <div style={row}>
        <Field title="ID" style={{ flex: "1 1 120px" }}>
          <input style={input} value={col.id} onChange={(e) => onChange({ ...col, id: e.target.value })} />
        </Field>
        <Field title="Header" style={{ flex: "1 1 140px" }}>
          <input style={input} value={col.header} onChange={(e) => onChange({ ...col, header: e.target.value })} />
        </Field>
        <Field title="Field (path)" style={{ flex: "1 1 160px" }}>
          <input
            style={{ ...input, fontFamily: "ui-monospace, monospace" }}
            value={col.field}
            onChange={(e) => onChange({ ...col, field: e.target.value })}
          />
        </Field>
        <Field title="Format" style={{ flex: "0 0 130px" }}>
          <select
            style={input}
            value={col.format ?? "text"}
            onChange={(e) => onChange({ ...col, format: e.target.value as ColumnFormat })}
          >
            {COL_FORMATS.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </Field>
        <Field title="Rata" style={{ flex: "0 0 110px" }}>
          <select
            style={input}
            value={col.align ?? "left"}
            onChange={(e) => onChange({ ...col, align: e.target.value as HAlign })}
          >
            {ALIGNS.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </Field>
        <Field title="Lebar" style={{ flex: "0 0 90px" }}>
          <NumInput value={col.width} onChange={(n) => onChange({ ...col, width: n })} min={0.1} step={0.1} />
        </Field>
        <div style={{ flex: "0 0 auto", alignSelf: "flex-end" }}>
          <span style={label}> </span>
          <button type="button" style={btnDanger} onClick={onRemove}>
            Hapus
          </button>
        </div>
      </div>
      {showLocale || col.format === "currency" ? (
        <div style={{ ...row, marginTop: 8 }}>
          {showLocale ? (
            <Field title="Locale" style={{ flex: "0 0 140px" }}>
              <input
                style={input}
                value={col.locale ?? ""}
                placeholder="id-ID"
                onChange={(e) => onChange({ ...col, locale: e.target.value || undefined })}
              />
            </Field>
          ) : null}
          {col.format === "currency" ? (
            <Field title="Mata uang" style={{ flex: "0 0 120px" }}>
              <input
                style={input}
                value={col.currency ?? ""}
                placeholder="IDR"
                onChange={(e) => onChange({ ...col, currency: e.target.value || undefined })}
              />
            </Field>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function TableBandEditor({
  band,
  onChange,
  onMoveUp,
  onMoveDown,
  onRemove,
  index,
  total,
}: {
  band: TableBand;
  onChange: (b: TableBand) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
  index: number;
  total: number;
}) {
  const cols = band.columns;
  const setCols = (next: TableColumn[]) => onChange({ ...band, columns: next });

  return (
    <fieldset style={{ ...box, marginBottom: 12 }}>
      <legend style={{ fontWeight: 700, padding: "0 0.35rem" }}>Tabel #{index + 1}</legend>
      <div style={{ ...row, marginBottom: 12 }}>
        <Field title="Path data (array)">
          <input
            style={{ ...input, fontFamily: "ui-monospace, monospace" }}
            value={band.dataPath}
            placeholder="lines"
            onChange={(e) => onChange({ ...band, dataPath: e.target.value })}
          />
        </Field>
        <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, marginBottom: 2 }}>
          <input
            type="checkbox"
            checked={band.showHeader !== false}
            onChange={(e) => onChange({ ...band, showHeader: e.target.checked })}
          />
          Header kolom
        </label>
      </div>
      <div style={{ marginBottom: 8 }}>
        <span style={label}>Kolom</span>
        <div style={{ overflowX: "auto" }}>
          {cols.map((c, i) => (
            <ColumnRow
              key={c.id + i}
              col={c}
              onChange={(next) => {
                const nextCols = cols.slice();
                nextCols[i] = next;
                setCols(nextCols);
              }}
              onRemove={() => setCols(cols.filter((_, j) => j !== i))}
            />
          ))}
        </div>
        <button
          type="button"
          style={{ ...btnPrimary, marginTop: 8 }}
          onClick={() =>
            setCols([
              ...cols,
              { id: newColumnId(), header: `Kolom ${cols.length + 1}`, field: `field_${cols.length + 1}` },
            ])
          }
        >
          + Kolom
        </button>
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button type="button" style={btn} disabled={index <= 0} onClick={onMoveUp}>
          ↑
        </button>
        <button type="button" style={btn} disabled={index >= total - 1} onClick={onMoveDown}>
          ↓
        </button>
        <button type="button" style={btnDanger} onClick={onRemove}>
          Hapus band
        </button>
      </div>
    </fieldset>
  );
}

/**
 * Visual report designer: mutates a `ReportDefinition` and calls `onChange` with a new object.
 * Serialize with `serializeReportDefinition` from the main entry for API/DB storage.
 */
export function ReportBuilder({ value, onChange, className, style }: ReportBuilderProps) {
  const { meta, bands } = value;

  const patchMeta = (patch: Partial<ReportDefinition["meta"]>) => {
    onChange(updateMeta(value, { ...meta, ...patch }));
  };

  const addText = () => {
    const band: TextBand = {
      type: "text",
      value: "{{label}}",
      fontSize: meta.defaultFontSize ?? 10,
      align: "left",
    };
    onChange(insertBand(value, bands.length, band));
  };

  const addSpacer = () => {
    onChange(insertBand(value, bands.length, { type: "spacer", heightMm: 4 }));
  };

  const addTable = () => {
    const band: TableBand = {
      type: "table",
      dataPath: "rows",
      showHeader: true,
      columns: [
        { id: newColumnId(), header: "Kolom A", field: "a" },
        { id: newColumnId(), header: "Kolom B", field: "b" },
      ],
    };
    onChange(insertBand(value, bands.length, band));
  };

  return (
    <div className={className} style={{ fontFamily: "system-ui, Segoe UI, sans-serif", color: "#1a1d26", ...style }}>
      <section style={{ ...box, marginBottom: 16 }}>
        <h2 style={{ margin: "0 0 0.75rem", fontSize: 16 }}>Meta laporan</h2>
        <div style={row}>
          <Field title="Judul PDF">
            <input style={input} value={meta.title ?? ""} onChange={(e) => patchMeta({ title: e.target.value || undefined })} />
          </Field>
          <Field title="Subjek">
            <input style={input} value={meta.subject ?? ""} onChange={(e) => patchMeta({ subject: e.target.value || undefined })} />
          </Field>
          <Field title="Penulis">
            <input style={input} value={meta.author ?? ""} onChange={(e) => patchMeta({ author: e.target.value || undefined })} />
          </Field>
        </div>
        <div style={{ ...row, marginTop: 12 }}>
          <Field title="Ukuran halaman">
            <select
              style={input}
              value={meta.format ?? "a4"}
              onChange={(e) => patchMeta({ format: e.target.value as PageFormat })}
            >
              {FORMATS.map((f) => (
                <option key={f} value={f}>
                  {f.toUpperCase()}
                </option>
              ))}
            </select>
          </Field>
          <Field title="Orientasi">
            <select
              style={input}
              value={meta.orientation ?? "portrait"}
              onChange={(e) => patchMeta({ orientation: e.target.value as "portrait" | "landscape" })}
            >
              <option value="portrait">Portrait</option>
              <option value="landscape">Landscape</option>
            </select>
          </Field>
          <Field title="Font default">
            <NumInput
              value={meta.defaultFontSize}
              onChange={(n) => patchMeta({ defaultFontSize: n })}
              min={6}
              step={1}
            />
          </Field>
        </div>
        <div style={{ ...row, marginTop: 12 }}>
          <Field title="Margin atas (mm)">
            <NumInput value={meta.marginMm?.top} onChange={(n) => patchMeta({ marginMm: { ...meta.marginMm, top: n } })} min={0} />
          </Field>
          <Field title="Kanan">
            <NumInput value={meta.marginMm?.right} onChange={(n) => patchMeta({ marginMm: { ...meta.marginMm, right: n } })} min={0} />
          </Field>
          <Field title="Bawah">
            <NumInput value={meta.marginMm?.bottom} onChange={(n) => patchMeta({ marginMm: { ...meta.marginMm, bottom: n } })} min={0} />
          </Field>
          <Field title="Kiri">
            <NumInput value={meta.marginMm?.left} onChange={(n) => patchMeta({ marginMm: { ...meta.marginMm, left: n } })} min={0} />
          </Field>
        </div>
      </section>

      <section>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12, marginBottom: 12 }}>
          <h2 style={{ margin: 0, fontSize: 16 }}>Band (urutan atas → bawah)</h2>
          <button type="button" style={btnPrimary} onClick={addText}>
            + Teks
          </button>
          <button type="button" style={btnPrimary} onClick={addSpacer}>
            + Spasi
          </button>
          <button type="button" style={btnPrimary} onClick={addTable}>
            + Tabel
          </button>
          <button
            type="button"
            style={btn}
            onClick={() => onChange(createDefaultReportDefinition())}
            title="Reset ke template awal"
          >
            Reset template
          </button>
        </div>

        {bands.length === 0 ? (
          <p style={{ color: "#5c6370" }}>Belum ada band. Tambahkan teks, spasi, atau tabel.</p>
        ) : null}

        {bands.map((band, i) => {
          const key = `${band.type}-${i}`;
          if (band.type === "text") {
            return (
              <TextBandEditor
                key={key}
                band={band}
                index={i}
                total={bands.length}
                onChange={(b) => onChange(updateBandAt(value, i, b))}
                onMoveUp={() => onChange(moveBand(value, i, i - 1))}
                onMoveDown={() => onChange(moveBand(value, i, i + 1))}
                onRemove={() => onChange(removeBandAt(value, i))}
              />
            );
          }
          if (band.type === "spacer") {
            return (
              <SpacerBandEditor
                key={key}
                band={band}
                index={i}
                total={bands.length}
                onChange={(b) => onChange(updateBandAt(value, i, b))}
                onMoveUp={() => onChange(moveBand(value, i, i - 1))}
                onMoveDown={() => onChange(moveBand(value, i, i + 1))}
                onRemove={() => onChange(removeBandAt(value, i))}
              />
            );
          }
          return (
            <TableBandEditor
              key={key}
              band={band}
              index={i}
              total={bands.length}
              onChange={(b) => onChange(updateBandAt(value, i, b))}
              onMoveUp={() => onChange(moveBand(value, i, i - 1))}
              onMoveDown={() => onChange(moveBand(value, i, i + 1))}
              onRemove={() => onChange(removeBandAt(value, i))}
            />
          );
        })}
      </section>
    </div>
  );
}
