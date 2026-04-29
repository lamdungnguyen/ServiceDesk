import { useState } from "react";

const initialState = {
  employeeName: "",
  team: "Care Team A",
  customerName: "",
  language: "mix",
  status: "resolved",
  messagesText: "customer: Hello, my order is delayed\nemployee: I apologize, let me check it right away\ncustomer: Thanks, please update soon\nemployee: Updated, the order will be delivered before 6 PM today"
};

function parseMessages(raw) {
  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [senderToken, ...textTokens] = line.split(":");
      const normalizedSender = senderToken?.toLowerCase().includes("employee") ? "employee" : "customer";

      return {
        senderType: normalizedSender,
        text: textTokens.join(":").trim()
      };
    })
    .filter((item) => item.text.length > 0);
}

export default function ConversationForm({ onSubmit, isLoading }) {
  const [form, setForm] = useState(initialState);

  async function handleSubmit(event) {
    event.preventDefault();

    const payload = {
      employeeName: form.employeeName,
      team: form.team,
      customerName: form.customerName,
      language: form.language,
      status: form.status,
      messages: parseMessages(form.messagesText)
    };

    await onSubmit(payload);
    setForm((previous) => ({
      ...previous,
      employeeName: "",
      customerName: ""
    }));
  }

  return (
    <form className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm min-w-0" onSubmit={handleSubmit}>
      <h3 className="text-lg font-bold text-slate-900 tracking-tight mb-5">Collect Conversation Data</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <label className="form-label">
          Employee Name
          <input
            className="form-input"
            required
            value={form.employeeName}
            onChange={(event) => setForm({ ...form, employeeName: event.target.value })}
            placeholder="e.g. John Doe"
          />
        </label>
        <label className="form-label">
          Customer Name
          <input
            className="form-input"
            required
            value={form.customerName}
            onChange={(event) => setForm({ ...form, customerName: event.target.value })}
            placeholder="e.g. Jane Smith"
          />
        </label>
        <label className="form-label">
          Language Dialect
          <select 
             className="form-input bg-white text-gray-800"
             value={form.language} 
             onChange={(event) => setForm({ ...form, language: event.target.value })}>
            <option value="vi">Vietnamese</option>
            <option value="en">English</option>
            <option value="mix">Multilingual (Mix)</option>
          </select>
        </label>
      </div>
      <label className="form-label mb-5 mt-2">
        Transcription Content <span className="text-xs text-slate-400 font-normal">Format: `customer: text...` or `employee: text...` on new lines</span>
        <textarea
          className="form-input font-mono text-sm leading-relaxed mt-1"
          rows={6}
          value={form.messagesText}
          onChange={(event) => setForm({ ...form, messagesText: event.target.value })}
        />
      </label>
      <button 
        type="submit" 
        className={`w-full ${isLoading ? 'bg-pink-400' : 'btn-primary'} py-3 text-sm font-bold uppercase tracking-wide`}
        disabled={isLoading}
      >
        {isLoading ? (
            <span className="flex items-center gap-2">
               <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
               Processing NLP...
            </span>
         ) : "Save & Queue Conversation"}
      </button>
    </form>
  );
}
