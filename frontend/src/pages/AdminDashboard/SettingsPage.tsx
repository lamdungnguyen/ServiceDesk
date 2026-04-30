import { useEffect, useState, useCallback } from 'react';
import {
  Bell, Shield, Clock, Bot, Save, CheckCircle2, AlertCircle,
  Loader2, ToggleLeft, ToggleRight, Mail, MonitorSmartphone,
  Ticket, CheckCheck, Siren, Lock, Eye, Download, Link,
} from 'lucide-react';
import { getSettings, updateSettings, type SystemSettings } from '../../api/apiClient';

type Tab = 'notifications' | 'sla' | 'security' | 'ai';

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'notifications', label: 'Notifications', icon: <Bell size={16} /> },
  { id: 'sla', label: 'SLA & Alerts', icon: <Clock size={16} /> },
  { id: 'security', label: 'Security', icon: <Shield size={16} /> },
  { id: 'ai', label: 'AI Service', icon: <Bot size={16} /> },
];

interface ToggleProps {
  value: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}
const Toggle = ({ value, onChange, disabled }: ToggleProps) => (
  <button
    type="button"
    disabled={disabled}
    onClick={() => onChange(!value)}
    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${
      value ? 'bg-purple-600' : 'bg-slate-300 dark:bg-slate-600'
    } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
  >
    <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${value ? 'translate-x-6' : 'translate-x-1'}`} />
  </button>
);

interface NumberInputProps {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  unit?: string;
}
const NumberInput = ({ value, onChange, min = 1, max = 9999, unit }: NumberInputProps) => (
  <div className="flex items-center gap-2">
    <input
      type="number"
      value={value}
      min={min}
      max={max}
      onChange={e => onChange(Math.max(min, Math.min(max, Number(e.target.value))))}
      className="w-24 px-3 py-1.5 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-400"
    />
    {unit && <span className="text-xs text-slate-500">{unit}</span>}
  </div>
);

interface RowProps {
  icon: React.ReactNode;
  label: string;
  description?: string;
  children: React.ReactNode;
}
const SettingRow = ({ icon, label, description, children }: RowProps) => (
  <div className="flex items-center justify-between py-4 border-b border-slate-100 dark:border-slate-800 last:border-0">
    <div className="flex items-start gap-3">
      <div className="mt-0.5 text-slate-400">{icon}</div>
      <div>
        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{label}</p>
        {description && <p className="text-xs text-slate-500 mt-0.5">{description}</p>}
      </div>
    </div>
    <div className="ml-6 shrink-0">{children}</div>
  </div>
);

interface SectionProps {
  title: string;
  children: React.ReactNode;
}
const Section = ({ title, children }: SectionProps) => (
  <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden mb-6">
    <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-900/40">
      <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">{title}</h3>
    </div>
    <div className="px-6">{children}</div>
  </div>
);

const DEFAULT_SETTINGS: SystemSettings = {
  notificationsEnabled: true,
  notifyInApp: true,
  notifyEmail: false,
  notifyTicketAssigned: true,
  notifyTicketResolved: true,
  notifySlaWarning: true,
  notifyEscalation: true,
  maxResponseTimeMinutes: 60,
  escalationThresholdMinutes: 240,
  slaWarningThresholdMinutes: 60,
  sessionTimeoutMinutes: 30,
  agentCanViewAllTickets: false,
  agentCanExportData: false,
  aiServiceUrl: 'http://localhost:8000',
};

const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState<Tab>('notifications');
  const [form, setForm] = useState<SystemSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [dirty, setDirty] = useState(false);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getSettings();
      setForm(data);
    } catch {
      setForm(DEFAULT_SETTINGS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void fetchSettings(); }, [fetchSettings]);

  const set = <K extends keyof SystemSettings>(key: K, value: SystemSettings[K]) => {
    setForm(prev => ({ ...prev, [key]: value }));
    setDirty(true);
    setStatus('idle');
  };

  const handleSave = async () => {
    setSaving(true);
    setStatus('idle');
    try {
      const updated = await updateSettings(form);
      setForm(updated);
      setDirty(false);
      setStatus('success');
      setTimeout(() => setStatus('idle'), 3000);
    } catch {
      setStatus('error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={28} className="animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">System Settings</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Configure SmartDesk AI system behaviour</p>
        </div>

        <div className="flex items-center gap-3">
          {status === 'success' && (
            <span className="flex items-center gap-1.5 text-emerald-600 text-sm font-medium animate-in fade-in">
              <CheckCircle2 size={16} /> Saved
            </span>
          )}
          {status === 'error' && (
            <span className="flex items-center gap-1.5 text-red-500 text-sm font-medium animate-in fade-in">
              <AlertCircle size={16} /> Save failed
            </span>
          )}
          <button
            onClick={() => void handleSave()}
            disabled={saving || !dirty}
            className="flex items-center gap-2 px-5 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-xl text-sm font-semibold transition-colors shadow-sm"
          >
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
            Save changes
          </button>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl w-fit">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === tab.id
                ? 'bg-white dark:bg-slate-700 text-purple-700 dark:text-purple-300 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Notifications Tab ── */}
      {activeTab === 'notifications' && (
        <>
          <Section title="General">
            <SettingRow
              icon={form.notificationsEnabled ? <ToggleRight size={18} className="text-purple-500" /> : <ToggleLeft size={18} />}
              label="Enable Notifications"
              description="Master switch — disabling this turns off all notifications system-wide"
            >
              <Toggle value={form.notificationsEnabled} onChange={v => set('notificationsEnabled', v)} />
            </SettingRow>
          </Section>

          <Section title="Channels">
            <SettingRow
              icon={<MonitorSmartphone size={18} />}
              label="In-app Notifications"
              description="Show notifications inside the dashboard"
            >
              <Toggle value={form.notifyInApp} onChange={v => set('notifyInApp', v)} disabled={!form.notificationsEnabled} />
            </SettingRow>
            <SettingRow
              icon={<Mail size={18} />}
              label="Email Notifications"
              description="Send notification emails to users"
            >
              <Toggle value={form.notifyEmail} onChange={v => set('notifyEmail', v)} disabled={!form.notificationsEnabled} />
            </SettingRow>
          </Section>

          <Section title="Events">
            <SettingRow
              icon={<Ticket size={18} />}
              label="Ticket Assigned"
              description="Notify agent when a ticket is assigned to them"
            >
              <Toggle value={form.notifyTicketAssigned} onChange={v => set('notifyTicketAssigned', v)} disabled={!form.notificationsEnabled} />
            </SettingRow>
            <SettingRow
              icon={<CheckCheck size={18} />}
              label="Ticket Resolved"
              description="Notify reporter when their ticket is resolved"
            >
              <Toggle value={form.notifyTicketResolved} onChange={v => set('notifyTicketResolved', v)} disabled={!form.notificationsEnabled} />
            </SettingRow>
            <SettingRow
              icon={<Clock size={18} />}
              label="SLA Warning"
              description="Alert assigned agent when a ticket nears its SLA deadline"
            >
              <Toggle value={form.notifySlaWarning} onChange={v => set('notifySlaWarning', v)} disabled={!form.notificationsEnabled} />
            </SettingRow>
            <SettingRow
              icon={<Siren size={18} />}
              label="Escalation"
              description="Alert admins when a ticket is automatically escalated"
            >
              <Toggle value={form.notifyEscalation} onChange={v => set('notifyEscalation', v)} disabled={!form.notificationsEnabled} />
            </SettingRow>
          </Section>
        </>
      )}

      {/* ── SLA & Alerts Tab ── */}
      {activeTab === 'sla' && (
        <Section title="SLA Thresholds">
          <SettingRow
            icon={<Clock size={18} />}
            label="Max Response Time"
            description="Maximum time before a ticket must receive a first response"
          >
            <NumberInput value={form.maxResponseTimeMinutes} onChange={v => set('maxResponseTimeMinutes', v)} unit="minutes" />
          </SettingRow>
          <SettingRow
            icon={<AlertCircle size={18} />}
            label="SLA Warning Threshold"
            description="Minutes before the due date to trigger an SLA warning notification"
          >
            <NumberInput value={form.slaWarningThresholdMinutes} onChange={v => set('slaWarningThresholdMinutes', v)} unit="minutes" />
          </SettingRow>
          <SettingRow
            icon={<Siren size={18} />}
            label="Escalation Threshold"
            description="Minutes past the due date before a ticket is automatically escalated"
          >
            <NumberInput value={form.escalationThresholdMinutes} onChange={v => set('escalationThresholdMinutes', v)} unit="minutes" />
          </SettingRow>
        </Section>
      )}

      {/* ── Security Tab ── */}
      {activeTab === 'security' && (
        <>
          <Section title="Session">
            <SettingRow
              icon={<Lock size={18} />}
              label="Session Timeout"
              description="Automatically log out inactive users after this many minutes"
            >
              <NumberInput value={form.sessionTimeoutMinutes} onChange={v => set('sessionTimeoutMinutes', v)} unit="minutes" min={5} />
            </SettingRow>
          </Section>

          <Section title="Agent Permissions">
            <SettingRow
              icon={<Eye size={18} />}
              label="Can View All Tickets"
              description="Allow agents to view tickets assigned to other agents"
            >
              <Toggle value={form.agentCanViewAllTickets} onChange={v => set('agentCanViewAllTickets', v)} />
            </SettingRow>
            <SettingRow
              icon={<Download size={18} />}
              label="Can Export Data"
              description="Allow agents to export ticket data as CSV"
            >
              <Toggle value={form.agentCanExportData} onChange={v => set('agentCanExportData', v)} />
            </SettingRow>
          </Section>
        </>
      )}

      {/* ── AI Tab ── */}
      {activeTab === 'ai' && (
        <Section title="AI Service Configuration">
          <SettingRow
            icon={<Link size={18} />}
            label="AI Service URL"
            description="Base URL of the AI microservice used for ticket classification and priority suggestions"
          >
            <input
              type="url"
              value={form.aiServiceUrl}
              onChange={e => set('aiServiceUrl', e.target.value)}
              placeholder="http://localhost:8000"
              className="w-64 px-3 py-1.5 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-400 font-mono"
            />
          </SettingRow>
          <div className="py-4">
            <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800/40 rounded-xl">
              <Bot size={16} className="text-blue-500 mt-0.5 shrink-0" />
              <div className="text-xs text-blue-700 dark:text-blue-400">
                <p className="font-semibold mb-0.5">AI features currently active:</p>
                <ul className="space-y-0.5 list-disc list-inside">
                  <li>Automatic ticket category detection</li>
                  <li>Priority suggestion based on description</li>
                  <li>Duplicate ticket detection</li>
                </ul>
              </div>
            </div>
          </div>
        </Section>
      )}

      {/* Sticky Save Footer (mobile) */}
      {dirty && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl px-6 py-3 flex items-center gap-4 animate-in slide-in-from-bottom-4">
          <p className="text-sm text-slate-600 dark:text-slate-300 font-medium">You have unsaved changes</p>
          <button
            onClick={() => void handleSave()}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-semibold"
          >
            {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
            Save
          </button>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;
