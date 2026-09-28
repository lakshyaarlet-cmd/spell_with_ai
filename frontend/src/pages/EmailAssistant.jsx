import { AlertCircle, Clipboard, Mail, Send, Sparkles } from "lucide-react";
import { useState } from "react";
import { api } from "../api";
import EmptyState from "../components/EmptyState";
import { copyText, unwrapAnalysis } from "../utils";

export default function EmailAssistant() {
  const [form, setForm] = useState({ purpose: "", recipient: "", tone: "Professional", points: "", context: "" });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
    setResult(null);
  }

  async function generate(event) {
    event.preventDefault();
    setError("");
    setNotice("");
    if (!form.purpose.trim()) {
      setError("Tell us what the email is about.");
      return;
    }
    const prompt = [
      `Draft a ${form.tone.toLowerCase()} email about: ${form.purpose.trim()}.`,
      form.recipient.trim() ? `Recipient: ${form.recipient.trim()}.` : "",
      form.points.trim() ? `Key points to include: ${form.points.trim()}` : "",
      form.context.trim() ? `Additional context: ${form.context.trim()}` : "",
      "Return an email with a subject line, greeting, body, and closing. Use only the details supplied and do not invent facts.",
    ].filter(Boolean).join("\n");
    setLoading(true);
    try {
      setResult(unwrapAnalysis(await api.analyze(prompt, "Email")));
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  async function copyEmail() {
    try {
      await copyText(result.corrected_text || "");
      setNotice("Email draft copied.");
    } catch (copyError) {
      setError(copyError.message);
    }
  }

  return (
    <div className="ww-page">
      <header className="ww-page-heading"><div><span className="ww-kicker">EMAIL DRAFTING</span><h2>Say it clearly, with the right tone.</h2><p>Build a draft from your notes, then review the wording in the local writing assistant.</p></div><span className="ww-heading-badge"><Mail size={15} /> Email studio</span></header>
      {error && <div className="ww-alert ww-alert-error" role="alert"><AlertCircle size={17} />{error}</div>}
      {notice && <div className="ww-alert ww-alert-success" role="status">{notice}</div>}
      <div className="ww-two-column">
        <form className="ww-panel ww-form ww-tool-form" onSubmit={generate}>
          <div><label htmlFor="email-purpose">Purpose</label><input id="email-purpose" maxLength={300} value={form.purpose} onChange={(event) => update("purpose", event.target.value)} placeholder="e.g. Ask about an internship opportunity" required /></div>
          <div><label htmlFor="email-recipient">Recipient <span>(optional)</span></label><input id="email-recipient" maxLength={180} value={form.recipient} onChange={(event) => update("recipient", event.target.value)} placeholder="e.g. Hiring manager" /></div>
          <div><label htmlFor="email-tone">Tone</label><select id="email-tone" value={form.tone} onChange={(event) => update("tone", event.target.value)}><option>Professional</option><option>Friendly</option><option>Formal</option><option>Concise</option></select></div>
          <div><label htmlFor="email-points">Key points <span>(optional)</span></label><textarea id="email-points" maxLength={1200} value={form.points} onChange={(event) => update("points", event.target.value)} placeholder="What should the email mention?" /></div>
          <div><label htmlFor="email-context">Additional context <span>(optional)</span></label><textarea id="email-context" maxLength={1200} value={form.context} onChange={(event) => update("context", event.target.value)} placeholder="Add background details, dates, or constraints." /></div>
          <button className="ww-button ww-button-primary" type="submit" disabled={loading || !form.purpose.trim()}><Send size={16} />{loading ? "Drafting…" : "Draft email"}</button>
          <small className="ww-form-footnote">Uses the existing /analyze route in Email mode; this backend does not expose a separate email endpoint.</small>
        </form>
        <section className="ww-panel ww-output-panel">
          <div className="ww-panel-header"><div><span className="ww-kicker">YOUR DRAFT</span><h3>Email preview</h3></div>{result?.corrected_text && <button className="ww-text-action" onClick={copyEmail}><Clipboard size={14} /> Copy</button>}</div>
          {loading ? <div className="ww-result-loading"><span className="ww-spinner" /><p>Creating a draft with your local writing assistant…</p></div> : result ? <><pre className="ww-email-output">{result.corrected_text || "The backend did not return an email draft."}</pre>{result.ai_available === false && <div className="ww-alert ww-alert-warning">Ollama is unavailable. The backend fallback can check wording but cannot generate an email draft.</div>}{!!result.suggestions?.length && <div className="ww-result-section"><h4><Sparkles size={15} /> Writing suggestions</h4>{result.suggestions.map((item, index) => <p className="ww-suggestion" key={index}>{typeof item === "string" ? item : item.suggestion || item.reason}</p>)}</div>}</> : <EmptyState icon={Mail} title="Your email draft will appear here">Add a purpose and any key points. Your request will be sent through FastAPI to local Ollama.</EmptyState>}
        </section>
      </div>
    </div>
  );
}
