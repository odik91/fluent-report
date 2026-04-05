import { useCallback, useEffect, useMemo, useState } from "react";
import type { CSSProperties, ReactNode } from "react";

import type {
  ColumnFormat,
  HAlign,
  ImageBand,
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

const accent = "#1d6b4a";

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
  /** Gabungkan dengan `fr-report-builder` di stylesheet app untuk responsif (lihat README). */
  className?: string;
  style?: CSSProperties;
}

const FORMATS: PageFormat[] = ["a4", "a3", "letter", "legal"];
const ALIGNS: HAlign[] = ["left", "center", "right"];
const COL_FORMATS: ColumnFormat[] = ["text", "integer", "number", "currency", "date", "datetime"];

/** Lebar kertas (mm) portrait — untuk garis margin di kanvas */
const PAGE_W_MM: Record<PageFormat, number> = {
  a4: 210,
  a3: 297,
  letter: 216,
  legal: 216,
};

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
    <div style={{ padding: "10px 0", borderBottom: "1px solid #eef0f4" }}>
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

function MetaPanel({
  meta,
  patchMeta,
}: {
  meta: ReportDefinition["meta"];
  patchMeta: (patch: Partial<ReportDefinition["meta"]>) => void;
}) {
  return (
    <section style={{ ...box, marginBottom: 12 }}>
      <h3 style={{ margin: "0 0 0.65rem", fontSize: 14 }}>Meta laporan</h3>
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
      <div style={{ ...row, marginTop: 10 }}>
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
          <NumInput value={meta.defaultFontSize} onChange={(n) => patchMeta({ defaultFontSize: n })} min={6} step={1} />
        </Field>
      </div>
      <div style={{ ...row, marginTop: 10 }}>
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
  );
}

function BandPropsForm({
  band,
  index,
  total,
  onChange,
  onMoveUp,
  onMoveDown,
  onRemove,
}: {
  band: ReportBand;
  index: number;
  total: number;
  onChange: (b: ReportBand) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
}) {
  const title =
    band.type === "text"
      ? "Teks"
      : band.type === "spacer"
        ? "Spasi"
        : band.type === "image"
          ? "Gambar / logo"
          : "Tabel";

  const setImageFromFile = useCallback(
    (file: File) => {
      if (band.type !== "image") return;
      const fr = new FileReader();
      fr.onload = () => {
        const dataUrl = String(fr.result || "");
        const im = new Image();
        im.onload = () => {
          const wMm = 40;
          const ar = im.naturalWidth > 0 ? im.naturalHeight / im.naturalWidth : 0.5;
          onChange({ ...band, src: dataUrl, widthMm: wMm, heightMm: Math.max(3, wMm * ar) });
        };
        im.onerror = () => onChange({ ...band, src: dataUrl });
        im.src = dataUrl;
      };
      fr.readAsDataURL(file);
    },
    [band, onChange],
  );

  return (
    <section style={box}>
      <h3 style={{ margin: "0 0 0.5rem", fontSize: 14 }}>
        {title} <span style={{ color: "#5c6370", fontWeight: 400 }}>#{index + 1}</span>
      </h3>

      {band.type === "text" ? (
        <>
          <p style={{ margin: "0 0 8px", fontSize: 12, color: "#5c6370" }}>Placeholder: {"{{path.ke.field}}"}</p>
          <Field title="Isi teks" style={{ flex: "1 1 100%", marginBottom: 8 }}>
            <textarea
              style={{ ...input, minHeight: 80, resize: "vertical", fontFamily: "ui-monospace, monospace" }}
              value={band.value}
              onChange={(e) => onChange({ ...band, value: e.target.value })}
            />
          </Field>
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
              <NumInput value={band.marginBottomMm} onChange={(n) => onChange({ ...band, marginBottomMm: n })} min={0} step={0.5} />
            </Field>
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, marginBottom: 2 }}>
              <input type="checkbox" checked={!!band.bold} onChange={(e) => onChange({ ...band, bold: e.target.checked })} />
              Tebal
            </label>
          </div>
        </>
      ) : null}

      {band.type === "spacer" ? (
        <Field title="Tinggi (mm)">
          <NumInput value={band.heightMm} onChange={(n) => onChange({ ...band, heightMm: n ?? 0 })} min={0} step={1} />
        </Field>
      ) : null}

      {band.type === "image" ? (
        <>
          <Field title="Logo / gambar">
            <input
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp"
              style={{ fontSize: 13 }}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) setImageFromFile(f);
                e.target.value = "";
              }}
            />
          </Field>
          {band.src ? (
            <div style={{ margin: "8px 0", textAlign: "center" as const }}>
              <img src={band.src} alt="" style={{ maxWidth: "100%", maxHeight: 120, objectFit: "contain" }} />
            </div>
          ) : (
            <p style={{ fontSize: 12, color: "#5c6370" }}>Pilih file PNG/JPEG/WebP — disimpan sebagai data URL di JSON.</p>
          )}
          <div style={{ ...row, marginTop: 8 }}>
            <Field title="Lebar (mm)">
              <NumInput value={band.widthMm} onChange={(n) => onChange({ ...band, widthMm: n ?? 1 })} min={1} step={1} />
            </Field>
            <Field title="Tinggi (mm)">
              <NumInput value={band.heightMm} onChange={(n) => onChange({ ...band, heightMm: n ?? 1 })} min={1} step={1} />
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
              <NumInput value={band.marginBottomMm} onChange={(n) => onChange({ ...band, marginBottomMm: n })} min={0} step={0.5} />
            </Field>
          </div>
        </>
      ) : null}

      {band.type === "table" ? (
        <>
          <div style={{ ...row, marginBottom: 10 }}>
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
          <span style={label}>Kolom</span>
          {band.columns.map((c, i) => (
            <ColumnRow
              key={c.id + i}
              col={c}
              onChange={(next) => {
                const cols = band.columns.slice();
                cols[i] = next;
                onChange({ ...band, columns: cols });
              }}
              onRemove={() => onChange({ ...band, columns: band.columns.filter((_, j) => j !== i) })}
            />
          ))}
          <button
            type="button"
            style={{ ...btnPrimary, marginTop: 8 }}
            onClick={() =>
              onChange({
                ...band,
                columns: [
                  ...band.columns,
                  { id: newColumnId(), header: `Kolom ${band.columns.length + 1}`, field: `field_${band.columns.length + 1}` },
                ],
              })
            }
          >
            + Kolom
          </button>
        </>
      ) : null}

      <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
        <button type="button" style={btn} disabled={index <= 0} onClick={onMoveUp}>
          ↑ Naik
        </button>
        <button type="button" style={btn} disabled={index >= total - 1} onClick={onMoveDown}>
          ↓ Turun
        </button>
        <button type="button" style={btnDanger} onClick={onRemove}>
          Hapus band
        </button>
      </div>
    </section>
  );
}

function bandSummary(band: ReportBand): string {
  if (band.type === "text") return band.value.slice(0, 80) + (band.value.length > 80 ? "…" : "");
  if (band.type === "spacer") return `Jarak vertikal ${band.heightMm} mm`;
  if (band.type === "image") return band.src ? "Logo / gambar" : "Gambar (kosong)";
  return `Tabel · ${band.columns.length} kolom · ${band.dataPath || "(path)"}`;
}

function BandCanvasCard({
  band,
  index,
  selected,
  onSelect,
}: {
  band: ReportBand;
  index: number;
  selected: boolean;
  onSelect: () => void;
}) {
  const typeLabel =
    band.type === "text" ? "Teks" : band.type === "spacer" ? "Spasi" : band.type === "image" ? "Gambar" : "Tabel";

  return (
    <button
      type="button"
      onClick={onSelect}
      style={{
        display: "block",
        width: "100%",
        textAlign: "left",
        cursor: "pointer",
        borderRadius: 8,
        border: selected ? `2px solid ${accent}` : "1px solid #e2e5eb",
        background: selected ? "#f0faf5" : "#fff",
        padding: "10px 12px",
        marginBottom: 8,
        fontFamily: "inherit",
        boxSizing: "border-box",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: "#5c6370", textTransform: "uppercase" }}>
          {typeLabel} · #{index + 1}
        </span>
      </div>
      {band.type === "image" && band.src ? (
        <img src={band.src} alt="" style={{ maxHeight: 44, maxWidth: "100%", objectFit: "contain", display: "block" }} />
      ) : (
        <div style={{ fontSize: 13, color: "#1a1d26", lineHeight: 1.4, whiteSpace: "pre-wrap" as const }}>
          {bandSummary(band)}
        </div>
      )}
    </button>
  );
}

/**
 * Desainer visual: kanvas band + panel properti (mirip alur *Gui Based*).
 * Logo: band Gambar dengan data URL di `src` → ikut terserialisasi ke JSON untuk ERP.
 */
export function ReportBuilder({ value, onChange, className, style }: ReportBuilderProps) {
  const { meta, bands } = value;
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  useEffect(() => {
    if (selectedIndex == null) return;
    if (selectedIndex >= bands.length) {
      setSelectedIndex(bands.length > 0 ? bands.length - 1 : null);
    }
  }, [bands.length, selectedIndex]);

  const patchMeta = useCallback(
    (patch: Partial<ReportDefinition["meta"]>) => {
      onChange(updateMeta(value, { ...meta, ...patch }));
    },
    [meta, onChange, value],
  );

  const pageWmm = PAGE_W_MM[meta.format ?? "a4"];
  const ml = meta.marginMm?.left ?? 14;
  const mr = meta.marginMm?.right ?? 14;
  const canvasInnerPx = 260;
  const guideLeftPx = (ml / pageWmm) * canvasInnerPx;
  const guideRightPx = (mr / pageWmm) * canvasInnerPx;

  const addText = () => {
    const band: TextBand = {
      type: "text",
      value: "{{label}}",
      fontSize: meta.defaultFontSize ?? 10,
      align: "left",
    };
    onChange(insertBand(value, bands.length, band));
    setSelectedIndex(bands.length);
  };

  const addImage = () => {
    const band: ImageBand = {
      type: "image",
      src: "",
      widthMm: 40,
      heightMm: 20,
      align: "center",
      marginBottomMm: 4,
    };
    onChange(insertBand(value, bands.length, band));
    setSelectedIndex(bands.length);
  };

  const addSpacer = () => {
    onChange(insertBand(value, bands.length, { type: "spacer", heightMm: 4 }));
    setSelectedIndex(bands.length);
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
    setSelectedIndex(bands.length);
  };

  const selectedBand = useMemo(() => {
    if (selectedIndex == null || selectedIndex < 0 || selectedIndex >= bands.length) return null;
    return { band: bands[selectedIndex]!, index: selectedIndex };
  }, [bands, selectedIndex]);

  return (
    <div
      className={["fr-report-builder", className].filter(Boolean).join(" ")}
      style={{
        fontFamily: "system-ui, Segoe UI, sans-serif",
        color: "#1a1d26",
        display: "grid",
        gridTemplateColumns: "minmax(280px, 340px) minmax(0, 1fr)",
        gap: 16,
        alignItems: "start",
        ...style,
      }}
    >
      <aside style={{ position: "sticky" as const, top: 8, maxHeight: "calc(100vh - 24px)", overflowY: "auto" }}>
        <MetaPanel meta={meta} patchMeta={patchMeta} />
        {selectedBand ? (
          <BandPropsForm
            band={selectedBand.band}
            index={selectedBand.index}
            total={bands.length}
            onChange={(b) => onChange(updateBandAt(value, selectedBand.index, b))}
            onMoveUp={() => {
              onChange(moveBand(value, selectedBand.index, selectedBand.index - 1));
              setSelectedIndex(selectedBand.index - 1);
            }}
            onMoveDown={() => {
              onChange(moveBand(value, selectedBand.index, selectedBand.index + 1));
              setSelectedIndex(selectedBand.index + 1);
            }}
            onRemove={() => {
              onChange(removeBandAt(value, selectedBand.index));
              setSelectedIndex(null);
            }}
          />
        ) : (
          <div style={{ ...box, fontSize: 13, color: "#5c6370" }}>
            Klik sebuah band di kanvas untuk mengedit properti di sini (seperti panel kiri pada desainer GUI).
          </div>
        )}
      </aside>

      <div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12, alignItems: "center" }}>
          <span style={{ fontWeight: 700, fontSize: 14, marginRight: 8 }}>Kanvas</span>
          <button type="button" style={btnPrimary} onClick={addText}>
            + Teks
          </button>
          <button type="button" style={btnPrimary} onClick={addImage}>
            + Gambar
          </button>
          <button type="button" style={btnPrimary} onClick={addSpacer}>
            + Spasi
          </button>
          <button type="button" style={btnPrimary} onClick={addTable}>
            + Tabel
          </button>
          <button type="button" style={btn} onClick={() => onChange(createDefaultReportDefinition())}>
            Reset template
          </button>
        </div>

        <div
          style={{
            background: "#525659",
            borderRadius: 10,
            padding: 16,
            minHeight: 320,
          }}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: 4,
              boxShadow: "0 2px 12px rgba(0,0,0,0.2)",
              maxWidth: canvasInnerPx + 32,
              margin: "0 auto",
              padding: "12px 16px 20px",
            }}
          >
            <div style={{ fontSize: 10, color: "#888", marginBottom: 8, textAlign: "center" as const }}>
              Pratinjau urutan band · garis putus = margin kiri/kanan (~{meta.format ?? "a4"} portrait {pageWmm} mm)
            </div>
            <div style={{ position: "relative" as const, width: canvasInnerPx, margin: "0 auto" }}>
              <div
                aria-hidden
                style={{
                  position: "absolute",
                  left: guideLeftPx,
                  top: 0,
                  bottom: 0,
                  width: 0,
                  borderLeft: "1px dashed #e53935",
                  pointerEvents: "none",
                }}
              />
              <div
                aria-hidden
                style={{
                  position: "absolute",
                  right: guideRightPx,
                  top: 0,
                  bottom: 0,
                  width: 0,
                  borderRight: "1px dashed #e53935",
                  pointerEvents: "none",
                }}
              />
              <div style={{ paddingLeft: guideLeftPx, paddingRight: guideRightPx, minHeight: 120 }}>
                {bands.length === 0 ? (
                  <p style={{ margin: 0, fontSize: 13, color: "#5c6370" }}>Tambah band dari toolbar di atas.</p>
                ) : (
                  bands.map((band, i) => (
                    <BandCanvasCard
                      key={`${band.type}-${i}`}
                      band={band}
                      index={i}
                      selected={selectedIndex === i}
                      onSelect={() => setSelectedIndex(i)}
                    />
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
