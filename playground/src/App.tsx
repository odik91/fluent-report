import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  createDefaultReportDefinition,
  parseReportDefinition,
  ReportBuilder,
  serializeReportDefinition,
} from "@alishoddiqien/fluent-report/builder";
import { generateReportPdfBlob, type ReportData, type ReportDefinition } from "@alishoddiqien/fluent-report";
import { SAMPLE_DATA_JSON, SAMPLE_DEFINITION_JSON } from "./samples";

type MainTab = "gui" | "code" | "preview";

function formatJsonString(raw: string): { ok: true; text: string } | { ok: false; error: string } {
  try {
    const v = JSON.parse(raw) as unknown;
    return { ok: true, text: JSON.stringify(v, null, 2) };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg };
  }
}

function initialDefinition(): ReportDefinition {
  try {
    return parseReportDefinition(SAMPLE_DEFINITION_JSON);
  } catch {
    return createDefaultReportDefinition();
  }
}

export function App() {
  const [mainTab, setMainTab] = useState<MainTab>("gui");
  const [definition, setDefinition] = useState<ReportDefinition>(initialDefinition);
  const [definitionText, setDefinitionText] = useState(() => serializeReportDefinition(initialDefinition()));
  const [dataText, setDataText] = useState(SAMPLE_DATA_JSON);
  const [parseError, setParseError] = useState<string | null>(null);
  const [genError, setGenError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const prevTab = useRef<MainTab>(mainTab);

  useEffect(() => {
    if (mainTab === "code" && prevTab.current !== "code") {
      setDefinitionText(serializeReportDefinition(definition));
    }
    prevTab.current = mainTab;
  }, [mainTab, definition]);

  const revokePreview = useCallback(() => {
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
  }, []);

  useEffect(() => () => revokePreview(), [revokePreview]);

  const tryCompile = useMemo(() => {
    return (): { definition: ReportDefinition; data: ReportData } | null => {
      setParseError(null);
      let dataParsed: unknown;
      try {
        dataParsed = JSON.parse(dataText) as unknown;
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        setParseError(`Data JSON: ${msg}`);
        return null;
      }
      if (dataParsed == null || typeof dataParsed !== "object" || Array.isArray(dataParsed)) {
        setParseError("Data harus berupa objek JSON (bukan array atau null).");
        return null;
      }
      try {
        const def = parseReportDefinition(definitionText);
        return { definition: def, data: dataParsed as ReportData };
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        setParseError(`Definisi: ${msg}`);
        return null;
      }
    };
  }, [dataText, definitionText]);

  const tryCompileFromState = useMemo(() => {
    return (): { definition: ReportDefinition; data: ReportData } | null => {
      setParseError(null);
      let dataParsed: unknown;
      try {
        dataParsed = JSON.parse(dataText) as unknown;
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        setParseError(`Data JSON: ${msg}`);
        return null;
      }
      if (dataParsed == null || typeof dataParsed !== "object" || Array.isArray(dataParsed)) {
        setParseError("Data harus berupa objek JSON (bukan array atau null).");
        return null;
      }
      return { definition, data: dataParsed as ReportData };
    };
  }, [dataText, definition]);

  const handleFormatDefinitionJson = () => {
    setParseError(null);
    const d = formatJsonString(definitionText);
    if (!d.ok) {
      setParseError(`Definisi: ${d.error}`);
      return;
    }
    setDefinitionText(d.text);
  };

  const handleFormatDataJson = () => {
    setParseError(null);
    const j = formatJsonString(dataText);
    if (!j.ok) {
      setParseError(`Data: ${j.error}`);
      return;
    }
    setDataText(j.text);
  };

  const handleApplyDefinitionJson = () => {
    setParseError(null);
    try {
      const next = parseReportDefinition(definitionText);
      setDefinition(next);
      setParseError(null);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setParseError(`Definisi: ${msg}`);
    }
  };

  const handleResetSample = () => {
    revokePreview();
    setGenError(null);
    setParseError(null);
    const def = initialDefinition();
    setDefinition(def);
    setDefinitionText(serializeReportDefinition(def));
    setDataText(SAMPLE_DATA_JSON);
    setMainTab("gui");
  };

  const handleGenerate = () => {
    setGenError(null);
    const compiled = mainTab === "code" ? tryCompile() : tryCompileFromState();
    if (!compiled) return;
    setBusy(true);
    try {
      revokePreview();
      const blob = generateReportPdfBlob(compiled.definition, compiled.data);
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
      setMainTab("preview");
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setGenError(msg);
    } finally {
      setBusy(false);
    }
  };

  const handleDownload = () => {
    const compiled = mainTab === "code" ? tryCompile() : tryCompileFromState();
    if (!compiled) return;
    try {
      const blob = generateReportPdfBlob(compiled.definition, compiled.data);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${compiled.definition.meta.title?.replace(/\s+/g, "-") || "laporan"}.pdf`;
      a.rel = "noopener";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setGenError(msg);
    }
  };

  const handleCopyDefinitionJson = async () => {
    const text =
      mainTab === "code" ? definitionText : serializeReportDefinition(definition);
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <div>
          <h1>Fluent Report Playground</h1>
          <p>
            Mode <strong>GUI</strong> dan <strong>JSON</strong> seperti{" "}
            <a href="https://fluentreports.com/demo.html" target="_blank" rel="noreferrer">
              fluentReports Live Demo
            </a>
            : desain laporan → JSON terserialisasi untuk disimpan di ERP, lalu pratinjau PDF.
          </p>
        </div>
        <nav className="header-links" aria-label="Tautan">
          <a href="https://github.com/odik91/fluent-report" target="_blank" rel="noreferrer">
            GitHub
          </a>
          <a href="https://fluentreports.com/docs.html" target="_blank" rel="noreferrer">
            fluentReports docs
          </a>
        </nav>
      </header>

      <div className="demo-tabs" role="tablist" aria-label="Mode demo">
        <button
          type="button"
          role="tab"
          aria-selected={mainTab === "gui"}
          className={mainTab === "gui" ? "active" : ""}
          onClick={() => setMainTab("gui")}
        >
          Berbasis GUI
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mainTab === "code"}
          className={mainTab === "code" ? "active" : ""}
          onClick={() => setMainTab("code")}
        >
          Berbasis JSON
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mainTab === "preview"}
          className={mainTab === "preview" ? "active" : ""}
          onClick={() => setMainTab("preview")}
        >
          Pratinjau PDF
        </button>
      </div>

      {mainTab === "gui" ? (
        <>
          <div className="toolbar">
            <button type="button" onClick={handleResetSample}>
              Muat contoh
            </button>
            <button type="button" className="primary" disabled={busy} onClick={handleGenerate}>
              {busy ? "Memproses…" : "Generate & pratinjau"}
            </button>
            <button type="button" onClick={handleCopyDefinitionJson}>
              Salin JSON definisi
            </button>
            <span className="hint">Perubahan langsung memperbarui objek definisi; gunakan Salin / tab JSON untuk persistensi.</span>
          </div>
          {(parseError || genError) && (
            <div className="alert error" role="alert">
              {parseError || genError}
            </div>
          )}
          <div className="gui-layout">
            <section className="panel gui-builder" aria-label="Designer GUI">
              <div className="panel-header">Designer</div>
              <div className="gui-builder-body">
                <ReportBuilder value={definition} onChange={setDefinition} />
              </div>
            </section>
            <section className="panel" aria-label="Data runtime">
              <div className="panel-header">Data (JSON)</div>
              <textarea
                spellCheck={false}
                className="gui-data-textarea"
                value={dataText}
                onChange={(e) => setDataText(e.target.value)}
                aria-label="JSON data"
              />
            </section>
          </div>
        </>
      ) : null}

      {mainTab === "code" ? (
        <>
          <div className="toolbar">
            <button type="button" onClick={handleFormatDefinitionJson}>
              Format definisi
            </button>
            <button type="button" onClick={handleFormatDataJson}>
              Format data
            </button>
            <button type="button" onClick={handleApplyDefinitionJson}>
              Terapkan definisi → GUI
            </button>
            <button type="button" onClick={handleResetSample}>
              Muat contoh
            </button>
            <button type="button" className="primary" disabled={busy} onClick={handleGenerate}>
              {busy ? "Memproses…" : "Generate & pratinjau"}
            </button>
          </div>
          {(parseError || genError) && (
            <div className="alert error" role="alert">
              {parseError || genError}
            </div>
          )}
          <div className="editor-grid">
            <section className="panel" aria-label="Definisi laporan">
              <div className="panel-header">Definisi (versi 1)</div>
              <textarea
                spellCheck={false}
                value={definitionText}
                onChange={(e) => setDefinitionText(e.target.value)}
                aria-label="JSON definisi laporan"
              />
            </section>
            <section className="panel" aria-label="Data runtime">
              <div className="panel-header">Data</div>
              <textarea
                spellCheck={false}
                value={dataText}
                onChange={(e) => setDataText(e.target.value)}
                aria-label="JSON data"
              />
            </section>
          </div>
        </>
      ) : null}

      {mainTab === "preview" ? (
        <>
          <div className="toolbar">
            <button type="button" onClick={() => setMainTab("gui")}>
              ← Kembali ke GUI
            </button>
            <button type="button" onClick={() => setMainTab("code")}>
              JSON
            </button>
            <button type="button" className="primary" onClick={handleDownload}>
              Unduh PDF
            </button>
            <button type="button" onClick={handleGenerate} disabled={busy}>
              Generate ulang
            </button>
          </div>
          {genError && (
            <div className="alert error" role="alert">
              {genError}
            </div>
          )}
          <div className="preview-wrap">
            <div className="preview-toolbar">
              <span style={{ fontSize: "0.85rem", color: "var(--muted)" }}>
                PDF dari <code>@odik91/fluent-report</code> — definisi saat ini dari tab GUI atau JSON (setelah
                Terapkan).
              </span>
            </div>
            {previewUrl ? (
              <iframe className="preview-frame" title="Pratinjau PDF" src={previewUrl} />
            ) : (
              <div className="preview-empty">
                Belum ada pratinjau. Buka tab <strong>Berbasis GUI</strong> atau <strong>JSON</strong> lalu klik{" "}
                <strong>Generate & pratinjau</strong>.
              </div>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}
