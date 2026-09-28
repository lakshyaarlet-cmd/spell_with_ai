import { AlertCircle, Clipboard, FileText, Sparkles, Target } from "lucide-react";
import { useState } from "react";
import { api } from "../api";
import EmptyState from "../components/EmptyState";
import { copyText, unwrapAnalysis } from "../utils";

export default function ResumeAssistant() {
  const [form, setForm] = useState({ text: "", role: "", description: "" });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
    setResult(null);
  }

  async function improve(event) {
    event.preventDefault();
    setError("");
    setNotice("");
    if (!form.text.trim()) {
      setError("Paste the resume text you want to improve.");
      return;
    }
    const prompt = [
      `Improve the grammar, clarity, concision, and professional wording of the resume content below.`,
      form.role.trim() ? `Target role: ${form.role.trim()}.` : "",
      form.description.trim() ? `Job description for context: ${form.description.trim()}` : "",
      "Preserve the candidate's actual experience and do not invent achievements, skills, metrics, or qualifications. Return the improved resume wording.",
      `Resume content:\n${form.text.trim()}`,
    ].filter(Boolean).join("\n\n");
    setLoading(true);
    try {
      setResult(unwrapAnalysis(await api.analyze(prompt, "Resume")));
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  async function copyImproved() {
    try {
      await copyText(result.corrected_text || "");
      setNotice("Improved resume content copied.");
    } catch (copyError) {
      setError(copyError.message);
    }
  }

  return (
    <div className="ww-page">
      <header className="ww-page-heading"><div><span className="ww-kicker">RESUME ASSISTANT</span><h2>Make your experience easier to understand.</h2><p>Improve clarity and professional wording while preserving the facts you provide.</p></div><span className="ww-heading-badge"><Target size={15} /> Resume studio</span></header>
      {error && <div className="ww-alert ww-alert-error" role="alert"><AlertCircle size={17} />{error}</div>}
      {notice && <div className="ww-alert ww-alert-success" role="status">{notice}</div>}
      <div className="ww-two-column">
        <form className="ww-panel ww-form ww-tool-form" onSubmit={improve}>
          <div><label htmlFor="resume-text">Resume content</label><textarea id="resume-text" className="ww-resume-input" maxLength={2700} value={form.text} onChange={(event) => update("text", event.target.value)} placeholder="Paste a resume bullet or section…" required /></div>
          <div><label htmlFor="resume-role">Target role <span>(optional)</span></label><input id="resume-role" maxLength={150} value={form.role} onChange={(event) => update("role", event.target.value)} placeholder="e.g. Junior data analyst" /></div>
          <div><label htmlFor="resume-description">Job description <span>(optional)</span></label><textarea id="resume-description" maxLength={1300} value={form.description} onChange={(event) => update("description", event.target.value)} placeholder="Paste relevant job requirements for context." /></div>
          <button className="ww-button ww-button-primary" type="submit" disabled={loading || !form.text.trim()}><Sparkles size={16} />{loading ? "Improving…" : "Improve resume wording"}</button>
          <small className="ww-form-footnote">ATS scoring is not available in the current backend. No separate resume endpoint is exposed.</small>
        </form>
        <section className="ww-panel ww-output-panel">
          <div className="ww-panel-header"><div><span className="ww-kicker">REFINED CONTENT</span><h3>Improved version</h3></div>{result?.corrected_text && <button className="ww-text-action" onClick={copyImproved}><Clipboard size={14} /> Copy</button>}</div>
          {loading ? <div className="ww-result-loading"><span className="ww-spinner" /><p>Reviewing your resume content…</p></div> : result ? <><pre className="ww-email-output">{result.corrected_text || "No improved version was returned."}</pre>{result.ai_available === false && <div className="ww-alert ww-alert-warning">Ollama is unavailable. The backend returned basic writing checks rather than AI resume improvements.</div>}{!!result.mistakes?.length && <div className="ww-result-section"><h4>Edits to review</h4>{result.mistakes.map((item, index) => <p className="ww-suggestion" key={index}><b>{item.original}</b> → <b>{item.correction}</b><br />{item.explanation}</p>)}</div>}{!!result.suggestions?.length && <div className="ww-result-section"><h4><Sparkles size={15} /> Suggestions</h4>{result.suggestions.map((item, index) => <p className="ww-suggestion" key={index}>{typeof item === "string" ? item : item.suggestion || item.reason}</p>)}</div>}</> : <EmptyState icon={FileText} title="Your improved content will appear here">Add a resume section to receive grammar and clarity feedback from your local writing analysis endpoint.</EmptyState>}
        </section>
      </div>
    </div>
  );
}
