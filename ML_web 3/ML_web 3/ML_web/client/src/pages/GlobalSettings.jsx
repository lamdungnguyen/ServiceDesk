import React, { useState, useEffect, useCallback } from 'react';
import {
  Wrench, Key, Bell, Globe, Database, Save, CheckCircle,
  Shield, Eye, EyeOff, AlertTriangle, Clock, ToggleLeft,
  ToggleRight, MessageSquare, Zap, Server, RefreshCw,
  Lock, Users, FileText, Cpu, BarChart2, Volume2,
  Mail, Link2, Building2, Hash, Loader2, Lightbulb,
  Wifi, WifiOff, Gamepad2, Plus, Pencil, Archive
} from 'lucide-react';
import { fetchSettings, saveSettings, resetAllSettings, fetchGames, createGame, updateGame, archiveGame } from '../services/api';

/* ──────── Toggle Switch ──────── */
function Toggle({ checked, onChange, label, description }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div className="flex-1 min-w-0">
        <span className="font-semibold text-slate-700 text-sm">{label}</span>
        {description && <p className="text-xs text-slate-500 mt-0.5">{description}</p>}
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0 ${checked ? 'bg-pink-600' : 'bg-slate-200'}`}
      >
        <span className={`inline-block h-5 w-5 transform rounded-full bg-white border border-gray-200 shadow-sm transition-transform ${checked ? 'translate-x-5.5' : 'translate-x-0.5'}`} />
      </button>
    </div>
  );
}

/* ──────── Section Header ──────── */
function SectionHeader({ icon: Icon, title, subtitle }) {
  return (
    <div className="mb-6 border-b border-slate-100 pb-4">
      <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
        {Icon && <Icon className="w-5 h-5 text-pink-600" />} {title}
      </h2>
      {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
    </div>
  );
}

/* ────────────────────────────────────────────
   TAB 1 – AI & NLP Models
   ──────────────────────────────────────────── */
function AIModelsTab({ settings, onChange }) {
  const [showToken, setShowToken] = useState(false);

  return (
    <div className="animate-fade-in space-y-8">
      <SectionHeader icon={Cpu} title="AI & Inference Settings" subtitle="Configure the ML models used for sentiment analysis, summarization, and predictive performance." />

      <div className="space-y-5 max-w-2xl">
        {/* Sentiment Model */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
          <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm">
            <BarChart2 className="w-4 h-4 text-indigo-500" /> Sentiment Analysis Model
          </h3>
          <div>
            <label className="form-label block mb-1">Model Endpoint (HuggingFace API)</label>
            <input
              type="url"
              className="form-input w-full bg-white"
              value={settings.sentimentEndpoint}
              onChange={e => onChange({ sentimentEndpoint: e.target.value })}
            />
            <p className="text-xs text-slate-500 mt-1">URL of the transformer model used for customer sentiment scoring.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="form-label block mb-1">Confidence Threshold</label>
              <input
                type="number"
                min="0" max="1" step="0.05"
                className="form-input w-full bg-white"
                value={settings.sentimentThreshold}
                onChange={e => onChange({ sentimentThreshold: parseFloat(e.target.value) })}
              />
              <p className="text-xs text-slate-500 mt-1">Minimum confidence score to accept a prediction (0-1).</p>
            </div>
            <div>
              <label className="form-label block mb-1">Batch Size</label>
              <input
                type="number"
                min="1" max="100"
                className="form-input w-full bg-white"
                value={settings.sentimentBatchSize}
                onChange={e => onChange({ sentimentBatchSize: parseInt(e.target.value) })}
              />
              <p className="text-xs text-slate-500 mt-1">Number of texts processed per batch call.</p>
            </div>
          </div>
        </div>

        {/* Summarization Model */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
          <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm">
            <FileText className="w-4 h-4 text-teal-500" /> Summarization Model
          </h3>
          <div>
            <label className="form-label block mb-1">Model Endpoint (BART / T5)</label>
            <input
              type="url"
              className="form-input w-full bg-white"
              value={settings.summaryEndpoint}
              onChange={e => onChange({ summaryEndpoint: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="form-label block mb-1">Max Summary Length (tokens)</label>
              <input
                type="number"
                min="50" max="1024"
                className="form-input w-full bg-white"
                value={settings.summaryMaxLength}
                onChange={e => onChange({ summaryMaxLength: parseInt(e.target.value) })}
              />
            </div>
            <div>
              <label className="form-label block mb-1">Default Language</label>
              <select
                className="form-input w-full bg-white"
                value={settings.summaryLanguage}
                onChange={e => onChange({ summaryLanguage: e.target.value })}
              >
                <option value="en">English</option>
                <option value="vi">Vietnamese</option>
                <option value="auto">Auto-detect</option>
              </select>
            </div>
          </div>
        </div>

        {/* API Token */}
        <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-5 space-y-4">
          <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm">
            <Key className="w-4 h-4 text-amber-500" /> API Access Token
          </h3>
          <div className="relative">
            <input
              type={showToken ? 'text' : 'password'}
              className="form-input w-full bg-white pr-12"
              value={settings.apiToken}
              onChange={e => onChange({ apiToken: e.target.value })}
              placeholder="hf_xxxxxxxxxxxxxxxx"
            />
            <button
              type="button"
              onClick={() => setShowToken(!showToken)}
              className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 transition-colors"
            >
              {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-xs text-amber-700">This token is used to authenticate with HuggingFace Inference API. Keep it secret.</p>
        </div>

        {/* ML Service Connection */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
          <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm">
            <Server className="w-4 h-4 text-pink-500" /> ML Service Connection
          </h3>
          <div>
            <label className="form-label block mb-1">ML Service URL</label>
            <input
              type="url"
              className="form-input w-full bg-white"
              value={settings.mlServiceUrl}
              onChange={e => onChange({ mlServiceUrl: e.target.value })}
            />
            <p className="text-xs text-slate-500 mt-1">Internal URL of the FastAPI ML microservice (e.g. http://ml-service:8000 in Docker).</p>
          </div>
        </div>

        {/* Auto Batch Processing */}
        <div className="border border-slate-200 rounded-xl p-5 space-y-1">
          <Toggle
            checked={settings.autoBatch}
            onChange={v => onChange({ autoBatch: v })}
            label="Auto-Batch Processing"
            description="Automatically analyze new conversations in background batches."
          />
          {settings.autoBatch && (
            <div className="pt-3 pl-1">
              <label className="form-label block mb-1">Batch Interval (minutes)</label>
              <input
                type="number"
                min="1" max="1440"
                className="form-input w-48 bg-white"
                value={settings.batchInterval}
                onChange={e => onChange({ batchInterval: parseInt(e.target.value) })}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────
   TAB 2 – Integrations
   ──────────────────────────────────────────── */
function IntegrationsTab({ settings, onChange }) {
  const integrations = [
    {
      id: 'slack',
      name: 'Slack',
      description: 'Send alerts and daily reports to Slack channels.',
      icon: MessageSquare,
      iconColor: 'text-purple-500',
      bgColor: 'bg-purple-50',
      fields: [
        { key: 'slackWebhookUrl', label: 'Webhook URL', type: 'url', placeholder: 'https://hooks.slack.com/services/...' },
        { key: 'slackChannel', label: 'Default Channel', type: 'text', placeholder: '#customer-support' },
      ],
    },
    {
      id: 'email',
      name: 'Email (SMTP)',
      description: 'Configure SMTP server for sending email notifications and reports.',
      icon: Mail,
      iconColor: 'text-pink-500',
      bgColor: 'bg-pink-50',
      fields: [
        { key: 'smtpHost', label: 'SMTP Host', type: 'text', placeholder: 'smtp.gmail.com' },
        { key: 'smtpPort', label: 'SMTP Port', type: 'number', placeholder: '587' },
        { key: 'smtpUser', label: 'Username', type: 'email', placeholder: 'noreply@falcongames.com' },
        { key: 'smtpPassword', label: 'Password', type: 'password', placeholder: '••••••••' },
      ],
    },
    {
      id: 'webhooks',
      name: 'Custom Webhooks',
      description: 'Push events (new conversation, low CSAT, etc.) to external endpoints.',
      icon: Link2,
      iconColor: 'text-emerald-500',
      bgColor: 'bg-emerald-50',
      fields: [
        { key: 'webhookUrl', label: 'Endpoint URL', type: 'url', placeholder: 'https://api.yourapp.com/webhook' },
        { key: 'webhookSecret', label: 'Signing Secret', type: 'password', placeholder: 'whsec_xxxxxxxx' },
      ],
    },
    {
      id: 'crm',
      name: 'CRM Integration',
      description: 'Sync customer data and conversation history with your CRM system.',
      icon: Building2,
      iconColor: 'text-orange-500',
      bgColor: 'bg-orange-50',
      fields: [
        { key: 'crmApiUrl', label: 'API Base URL', type: 'url', placeholder: 'https://api.salesforce.com/v54.0' },
        { key: 'crmApiKey', label: 'API Key', type: 'password', placeholder: 'sk_xxxxxxxx' },
      ],
    },
  ];

  return (
    <div className="animate-fade-in space-y-6">
      <SectionHeader icon={Globe} title="Integrations" subtitle="Connect external services to enhance automation and reporting." />

      <div className="space-y-5 max-w-2xl">
        {integrations.map(integration => {
          const enabledKey = `${integration.id}Enabled`;
          const isEnabled = settings[enabledKey] ?? false;
          const IconComp = integration.icon;

          return (
            <div key={integration.id} className={`border rounded-xl p-5 transition-colors ${isEnabled ? 'border-pink-200 bg-pink-50/30' : 'border-slate-200 bg-slate-50'}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${integration.bgColor}`}>
                    <IconComp className={`w-5 h-5 ${integration.iconColor}`} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm">{integration.name}</h3>
                    <p className="text-xs text-slate-500">{integration.description}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onChange({ [enabledKey]: !isEnabled })}
                  className={`shrink-0 ${isEnabled ? 'text-pink-600' : 'text-slate-400'}`}
                >
                  {isEnabled ? <ToggleRight className="w-8 h-8" /> : <ToggleLeft className="w-8 h-8" />}
                </button>
              </div>

              {isEnabled && (
                <div className="mt-4 pt-4 border-t border-slate-200/70 space-y-3">
                  {integration.fields.map(field => (
                    <div key={field.key}>
                      <label className="form-label block mb-1">{field.label}</label>
                      <input
                        type={field.type}
                        placeholder={field.placeholder}
                        className="form-input w-full bg-white"
                        value={settings[field.key] || ''}
                        onChange={e => onChange({ [field.key]: e.target.value })}
                      />
                    </div>
                  ))}
                  <button type="button" className="text-xs text-pink-600 hover:text-pink-700 font-semibold flex items-center gap-1 mt-2">
                    <Wifi className="w-3 h-3" /> Test Connection
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────
   TAB 3 – Alerts & Notifications
   ──────────────────────────────────────────── */
function NotificationsTab({ settings, onChange }) {
  return (
    <div className="animate-fade-in space-y-8">
      <SectionHeader icon={Bell} title="Alerts & Notifications" subtitle="Set up automated alerts for performance issues, escalations, and system events." />

      <div className="space-y-5 max-w-2xl">
        {/* Performance Alerts */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-3">
          <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm">
            <AlertTriangle className="w-4 h-4 text-amber-500" /> Performance Thresholds
          </h3>
          <p className="text-xs text-slate-500">Trigger alerts when an agent's metrics fall below these values.</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="form-label block mb-1">Min. CSAT Score (%)</label>
              <input
                type="number"
                min="0" max="100"
                className="form-input w-full bg-white"
                value={settings.minCsatAlert}
                onChange={e => onChange({ minCsatAlert: parseInt(e.target.value) })}
              />
            </div>
            <div>
              <label className="form-label block mb-1">Min. Sentiment Score</label>
              <input
                type="number"
                min="-1" max="1" step="0.1"
                className="form-input w-full bg-white"
                value={settings.minSentimentAlert}
                onChange={e => onChange({ minSentimentAlert: parseFloat(e.target.value) })}
              />
            </div>
            <div>
              <label className="form-label block mb-1">Max Avg. Response Time (min)</label>
              <input
                type="number"
                min="1" max="60"
                className="form-input w-full bg-white"
                value={settings.maxResponseTimeAlert}
                onChange={e => onChange({ maxResponseTimeAlert: parseInt(e.target.value) })}
              />
            </div>
            <div>
              <label className="form-label block mb-1">Max Queue Length</label>
              <input
                type="number"
                min="1" max="200"
                className="form-input w-full bg-white"
                value={settings.maxQueueAlert}
                onChange={e => onChange({ maxQueueAlert: parseInt(e.target.value) })}
              />
            </div>
          </div>
        </div>

        {/* Notification Channels */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-1">
          <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm mb-3">
            <Volume2 className="w-4 h-4 text-pink-500" /> Notification Channels
          </h3>
          <Toggle
            checked={settings.notifyEmail}
            onChange={v => onChange({ notifyEmail: v })}
            label="Email Notifications"
            description="Send alert emails to admin and team leads."
          />
          <Toggle
            checked={settings.notifySlack}
            onChange={v => onChange({ notifySlack: v })}
            label="Slack Notifications"
            description="Post alerts to the configured Slack channel."
          />
          <Toggle
            checked={settings.notifyInApp}
            onChange={v => onChange({ notifyInApp: v })}
            label="In-App Notifications"
            description="Show real-time toast notifications in the dashboard."
          />
          <Toggle
            checked={settings.notifySound}
            onChange={v => onChange({ notifySound: v })}
            label="Sound Alerts"
            description="Play a notification sound for critical alerts."
          />
        </div>

        {/* Notification Events */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-1">
          <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm mb-3">
            <Zap className="w-4 h-4 text-yellow-500" /> Events to Monitor
          </h3>
          <Toggle
            checked={settings.eventLowCsat}
            onChange={v => onChange({ eventLowCsat: v })}
            label="Low CSAT Detected"
            description="Alert when agent CSAT drops below the threshold."
          />
          <Toggle
            checked={settings.eventNegativeSentiment}
            onChange={v => onChange({ eventNegativeSentiment: v })}
            label="Negative Sentiment Spike"
            description="Alert when multiple conversations show negative sentiment."
          />
          <Toggle
            checked={settings.eventLongWait}
            onChange={v => onChange({ eventLongWait: v })}
            label="Long Customer Wait Time"
            description="Alert when a customer has been waiting beyond the max response time."
          />
          <Toggle
            checked={settings.eventNewConversation}
            onChange={v => onChange({ eventNewConversation: v })}
            label="New Unassigned Conversation"
            description="Alert when a customer starts a chat and no agent is assigned."
          />
          <Toggle
            checked={settings.eventSystemDown}
            onChange={v => onChange({ eventSystemDown: v })}
            label="ML Service Health Check Failed"
            description="Alert when the ML prediction service is unreachable."
          />
        </div>

        {/* Digest Schedule */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
          <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm">
            <Clock className="w-4 h-4 text-slate-500" /> Daily Digest Report
          </h3>
          <Toggle
            checked={settings.dailyDigest}
            onChange={v => onChange({ dailyDigest: v })}
            label="Enable Daily Digest"
            description="Send a summary of all alerts and key metrics at the end of each day."
          />
          {settings.dailyDigest && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="form-label block mb-1">Send Time</label>
                <input
                  type="time"
                  className="form-input w-full bg-white"
                  value={settings.digestTime}
                  onChange={e => onChange({ digestTime: e.target.value })}
                />
              </div>
              <div>
                <label className="form-label block mb-1">Recipients</label>
                <input
                  type="text"
                  className="form-input w-full bg-white"
                  placeholder="admin@falcongames.com, lead@falcongames.com"
                  value={settings.digestRecipients}
                  onChange={e => onChange({ digestRecipients: e.target.value })}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────
   TAB 4 – Security & Auth
   ──────────────────────────────────────────── */
function SecurityTab({ settings, onChange }) {
  const [showJwt, setShowJwt] = useState(false);

  return (
    <div className="animate-fade-in space-y-8">
      <SectionHeader icon={Shield} title="Security & Authentication" subtitle="Configure authentication rules, session management, and access control." />

      <div className="space-y-5 max-w-2xl">
        {/* JWT Settings */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
          <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm">
            <Key className="w-4 h-4 text-amber-500" /> JWT Configuration
          </h3>
          <div>
            <label className="form-label block mb-1">JWT Secret Key</label>
            <div className="relative">
              <input
                type={showJwt ? 'text' : 'password'}
                className="form-input w-full bg-white pr-12"
                value={settings.jwtSecret}
                onChange={e => onChange({ jwtSecret: e.target.value })}
              />
              <button
                type="button"
                onClick={() => setShowJwt(!showJwt)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showJwt ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> Changing this will invalidate all existing sessions.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="form-label block mb-1">Token Expiry (hours)</label>
              <input
                type="number"
                min="1" max="720"
                className="form-input w-full bg-white"
                value={settings.tokenExpiry}
                onChange={e => onChange({ tokenExpiry: parseInt(e.target.value) })}
              />
            </div>
            <div>
              <label className="form-label block mb-1">Refresh Token Expiry (days)</label>
              <input
                type="number"
                min="1" max="90"
                className="form-input w-full bg-white"
                value={settings.refreshTokenExpiry}
                onChange={e => onChange({ refreshTokenExpiry: parseInt(e.target.value) })}
              />
            </div>
          </div>
        </div>

        {/* Password Policy */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-3">
          <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm">
            <Lock className="w-4 h-4 text-rose-500" /> Password Policy
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="form-label block mb-1">Minimum Length</label>
              <input
                type="number"
                min="4" max="32"
                className="form-input w-full bg-white"
                value={settings.passwordMinLength}
                onChange={e => onChange({ passwordMinLength: parseInt(e.target.value) })}
              />
            </div>
            <div>
              <label className="form-label block mb-1">Max Failed Attempts</label>
              <input
                type="number"
                min="1" max="20"
                className="form-input w-full bg-white"
                value={settings.maxFailedAttempts}
                onChange={e => onChange({ maxFailedAttempts: parseInt(e.target.value) })}
              />
              <p className="text-xs text-slate-500 mt-1">Lock account after N failed login attempts.</p>
            </div>
          </div>
          <div className="space-y-1 pt-2">
            <Toggle
              checked={settings.requireUppercase}
              onChange={v => onChange({ requireUppercase: v })}
              label="Require Uppercase Letter"
            />
            <Toggle
              checked={settings.requireNumber}
              onChange={v => onChange({ requireNumber: v })}
              label="Require Number"
            />
            <Toggle
              checked={settings.requireSpecialChar}
              onChange={v => onChange({ requireSpecialChar: v })}
              label="Require Special Character (!@#$...)"
            />
          </div>
        </div>

        {/* Session Management */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-1">
          <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm mb-3">
            <Clock className="w-4 h-4 text-pink-500" /> Session Management
          </h3>
          <Toggle
            checked={settings.singleSession}
            onChange={v => onChange({ singleSession: v })}
            label="Single Active Session"
            description="Only allow one active login session per user. New login will logout old sessions."
          />
          <Toggle
            checked={settings.autoLogout}
            onChange={v => onChange({ autoLogout: v })}
            label="Auto-Logout on Inactivity"
            description="Automatically sign out users after a period of inactivity."
          />
          {settings.autoLogout && (
            <div className="pt-3 pl-1">
              <label className="form-label block mb-1">Inactivity Timeout (minutes)</label>
              <input
                type="number"
                min="5" max="480"
                className="form-input w-48 bg-white"
                value={settings.inactivityTimeout}
                onChange={e => onChange({ inactivityTimeout: parseInt(e.target.value) })}
              />
            </div>
          )}
        </div>

        {/* Access Control */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-1">
          <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm mb-3">
            <Users className="w-4 h-4 text-indigo-500" /> Access Control
          </h3>
          <Toggle
            checked={settings.agentCanViewAllChats}
            onChange={v => onChange({ agentCanViewAllChats: v })}
            label="Agents Can View All Chats"
            description="Allow agents to see conversations from other agents (read-only)."
          />
          <Toggle
            checked={settings.agentCanExportData}
            onChange={v => onChange({ agentCanExportData: v })}
            label="Agents Can Export Data"
            description="Allow agents to download conversation/report data as CSV."
          />
          <Toggle
            checked={settings.agentCanViewAnalytics}
            onChange={v => onChange({ agentCanViewAnalytics: v })}
            label="Agents Can View Analytics"
            description="Show the analytics dashboard to agent-role users."
          />
        </div>

        {/* Rate Limiting */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
          <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm">
            <Shield className="w-4 h-4 text-green-600" /> API Rate Limiting
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="form-label block mb-1">Max Requests (per window)</label>
              <input
                type="number"
                min="10" max="10000"
                className="form-input w-full bg-white"
                value={settings.rateLimitMax}
                onChange={e => onChange({ rateLimitMax: parseInt(e.target.value) })}
              />
            </div>
            <div>
              <label className="form-label block mb-1">Window Duration (minutes)</label>
              <input
                type="number"
                min="1" max="60"
                className="form-input w-full bg-white"
                value={settings.rateLimitWindow}
                onChange={e => onChange({ rateLimitWindow: parseInt(e.target.value) })}
              />
            </div>
          </div>
          <Toggle
            checked={settings.corsRestrict}
            onChange={v => onChange({ corsRestrict: v })}
            label="Restrict CORS Origins"
            description="Only allow requests from specific domains (recommended for production)."
          />
          {settings.corsRestrict && (
            <div>
              <label className="form-label block mb-1">Allowed Origins (comma-separated)</label>
              <input
                type="text"
                className="form-input w-full bg-white"
                placeholder="https://yourdomain.com, https://admin.yourdomain.com"
                value={settings.corsOrigins}
                onChange={e => onChange({ corsOrigins: e.target.value })}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function GameCatalogTab({ games, loadingGames, gameMessage, onCreateGame, onUpdateGame, onArchiveGame }) {
  const [newGameName, setNewGameName] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');

  const beginEdit = (game) => {
    setEditingId(game.id);
    setEditingName(game.name);
  };

  const submitEdit = async (game) => {
    if (!editingName.trim()) return;
    await onUpdateGame(game.id, { name: editingName.trim(), status: game.status });
    setEditingId(null);
    setEditingName('');
  };

  return (
    <div className="animate-fade-in space-y-8">
      <SectionHeader icon={Gamepad2} title="Game Catalog" subtitle="Manage supported game titles for customer support routing." />

      <div className="max-w-3xl space-y-5">
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
          <label className="form-label block mb-2">Add New Game</label>
          <div className="flex gap-2">
            <input
              type="text"
              className="form-input flex-1 bg-white"
              placeholder="e.g. Dragon Arena Online"
              value={newGameName}
              onChange={(e) => setNewGameName(e.target.value)}
            />
            <button
              type="button"
              onClick={async () => {
                if (!newGameName.trim()) return;
                await onCreateGame(newGameName.trim());
                setNewGameName('');
              }}
              className="btn-primary"
            >
              <Plus className="w-4 h-4" /> Add
            </button>
          </div>
        </div>

        {gameMessage && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl text-sm font-medium">
            {gameMessage}
          </div>
        )}

        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3 font-bold border-b border-slate-200">Game</th>
                <th className="px-4 py-3 font-bold border-b border-slate-200">Slug</th>
                <th className="px-4 py-3 font-bold border-b border-slate-200">Status</th>
                <th className="px-4 py-3 font-bold border-b border-slate-200 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loadingGames ? (
                <tr>
                  <td colSpan="4" className="px-4 py-8 text-center text-slate-500">Loading games...</td>
                </tr>
              ) : games.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-4 py-8 text-center text-slate-500">No games in catalog.</td>
                </tr>
              ) : games.map((game) => (
                <tr key={game.id}>
                  <td className="px-4 py-3">
                    {editingId === game.id ? (
                      <input
                        className="form-input w-full bg-white"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                      />
                    ) : (
                      <span className="font-semibold text-slate-800">{game.name}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500 font-mono">{game.slug}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-bold px-2 py-1 rounded ${game.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>
                      {game.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex items-center gap-2">
                      {editingId === game.id ? (
                        <>
                          <button
                            type="button"
                            className="text-xs px-2 py-1 rounded bg-pink-600 text-white"
                            onClick={() => submitEdit(game)}
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            className="text-xs px-2 py-1 rounded bg-slate-100 text-slate-600"
                            onClick={() => {
                              setEditingId(null);
                              setEditingName('');
                            }}
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            className="p-2 text-slate-500 hover:text-pink-600 hover:bg-pink-50 rounded"
                            onClick={() => beginEdit(game)}
                            title="Edit game"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            className="p-2 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded"
                            onClick={() => onUpdateGame(game.id, { status: game.status === 'active' ? 'inactive' : 'active' })}
                            title={game.status === 'active' ? 'Deactivate game' : 'Activate game'}
                          >
                            <ToggleRight className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded"
                            onClick={() => onArchiveGame(game.id)}
                            title="Archive game"
                          >
                            <Archive className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────
   MAIN COMPONENT
   ────────────────────────────────────────────── */
const TABS = [
  { id: 'llm', label: 'AI & NLP Models', icon: Database },
  { id: 'games', label: 'Game Catalog', icon: Gamepad2 },
  { id: 'integrations', label: 'Integrations', icon: Globe },
  { id: 'notifications', label: 'Alerts & Notifications', icon: Bell },
  { id: 'security', label: 'Security & Auth', icon: Key },
];

export default function GlobalSettings() {
  const [activeTab, setActiveTab] = useState('llm');
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [games, setGames] = useState([]);
  const [loadingGames, setLoadingGames] = useState(true);
  const [gameMessage, setGameMessage] = useState('');

  // Load settings from API on mount
  const loadSettings = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const data = await fetchSettings();
      setSettings(data);
    } catch (err) {
      console.error('Failed to load settings:', err);
      setError('Failed to load settings from server. Showing defaults.');
      // Fallback defaults so the UI still renders
      setSettings({
        sentimentEndpoint: 'https://api-inference.huggingface.co/models/distilbert-base-uncased-finetuned-sst-2-english',
        sentimentThreshold: 0.7, sentimentBatchSize: 20,
        summaryEndpoint: 'https://api-inference.huggingface.co/models/facebook/bart-large-cnn',
        summaryMaxLength: 256, summaryLanguage: 'en',
        apiToken: '', mlServiceUrl: 'http://ml-service:8000',
        autoBatch: true, batchInterval: 30,
        slackEnabled: false, slackWebhookUrl: '', slackChannel: '#customer-support',
        emailEnabled: false, smtpHost: '', smtpPort: 587, smtpUser: '', smtpPassword: '',
        webhooksEnabled: false, webhookUrl: '', webhookSecret: '',
        crmEnabled: false, crmApiUrl: '', crmApiKey: '',
        minCsatAlert: 70, minSentimentAlert: 0.3, maxResponseTimeAlert: 10, maxQueueAlert: 20,
        notifyEmail: true, notifySlack: false, notifyInApp: true, notifySound: false,
        eventLowCsat: true, eventNegativeSentiment: true, eventLongWait: true,
        eventNewConversation: false, eventSystemDown: true,
        dailyDigest: true, digestTime: '18:00', digestRecipients: '',
        jwtSecret: 'change_this_secret', tokenExpiry: 24, refreshTokenExpiry: 7,
        passwordMinLength: 6, maxFailedAttempts: 5,
        requireUppercase: false, requireNumber: false, requireSpecialChar: false,
        singleSession: false, autoLogout: true, inactivityTimeout: 30,
        agentCanViewAllChats: false, agentCanExportData: false, agentCanViewAnalytics: false,
        rateLimitMax: 500, rateLimitWindow: 15, corsRestrict: false, corsOrigins: '',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadSettings(); }, [loadSettings]);

  const loadGames = useCallback(async () => {
    try {
      setLoadingGames(true);
      const data = await fetchGames({ includeInactive: true });
      setGames(data || []);
    } catch (err) {
      console.error('Failed to load games:', err);
      setGameMessage('Failed to load game catalog.');
    } finally {
      setLoadingGames(false);
    }
  }, []);

  useEffect(() => {
    loadGames();
  }, [loadGames]);

  const handleCreateGame = async (name) => {
    await createGame({ name });
    setGameMessage('Game added successfully.');
    setTimeout(() => setGameMessage(''), 2000);
    await loadGames();
  };

  const handleUpdateGame = async (id, payload) => {
    await updateGame(id, payload);
    setGameMessage('Game updated successfully.');
    setTimeout(() => setGameMessage(''), 2000);
    await loadGames();
  };

  const handleArchiveGame = async (id) => {
    await archiveGame(id);
    setGameMessage('Game archived successfully.');
    setTimeout(() => setGameMessage(''), 2000);
    await loadGames();
  };

  const updateSettings = (partial) => {
    setSettings(prev => ({ ...prev, ...partial }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await saveSettings(settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error('Failed to save settings:', err);
      setError('Failed to save settings. Please check your server connection.');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!window.confirm('Reset all settings to default values? This cannot be undone.')) return;
    setSaving(true);
    setError('');
    try {
      const data = await resetAllSettings();
      setSettings(data.settings || {});
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error('Failed to reset settings:', err);
      setError('Failed to reset settings. Please check your server connection.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full flex items-center justify-center py-32">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin" />
          <p className="font-medium">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col gap-6 animate-fade-in pb-10 min-w-0">
      {/* Header */}
      <header className="bg-white border border-slate-200 rounded-3xl p-6 lg:p-8 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 shadow-sm">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            <div className="p-2.5 bg-slate-100 rounded-xl text-slate-600">
              <Wrench className="w-7 h-7" />
            </div>
            Global Settings
          </h1>
          <p className="text-slate-500 mt-2">Manage AI models, integrations, alerts, and security preferences.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleReset}
            disabled={saving}
            className="btn-secondary text-slate-600 hover:text-rose-600"
          >
            <RefreshCw className={`w-4 h-4 ${saving ? 'animate-spin' : ''}`} /> Reset
          </button>
          <button className="btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : saved ? <CheckCircle className="w-5 h-5" /> : <Save className="w-5 h-5" />}
            {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Changes'}
          </button>
        </div>
      </header>

      {/* Error / Success banners */}
      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl flex items-center gap-3 font-medium shadow-sm animate-fade-in">
          <WifiOff className="w-5 h-5 shrink-0" /> {error}
        </div>
      )}
      {saved && !error && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl flex items-center gap-3 font-medium shadow-sm animate-fade-in">
          <CheckCircle className="w-5 h-5 shrink-0" />
          All settings have been saved successfully to the server.
        </div>
      )}

      {/* Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1 flex flex-col gap-2">
          {TABS.map(tab => (
            <button
              key={tab.id}
              className={`text-left px-4 py-3 rounded-xl font-semibold flex items-center gap-3 transition-colors ${
                activeTab === tab.id
                  ? 'bg-pink-50 text-pink-700 border border-pink-100 shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
              onClick={() => setActiveTab(tab.id)}
            >
              <tab.icon className="w-5 h-5" /> {tab.label}
            </button>
          ))}

          {/* Tips */}
          <div className="mt-4 bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-500 space-y-2">
            <p className="font-semibold text-slate-700 text-sm flex items-center gap-1.5">
              <Lightbulb className="w-4 h-4 text-amber-400" /> Tips
            </p>
            <p>Settings are stored in the database. Click <strong>Save Changes</strong> to persist.</p>
            <p>Use <strong>Reset</strong> to restore all factory defaults.</p>
          </div>
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 lg:p-8 min-h-[500px]">
            {activeTab === 'llm' && <AIModelsTab settings={settings} onChange={updateSettings} />}
            {activeTab === 'games' && (
              <GameCatalogTab
                games={games}
                loadingGames={loadingGames}
                gameMessage={gameMessage}
                onCreateGame={handleCreateGame}
                onUpdateGame={handleUpdateGame}
                onArchiveGame={handleArchiveGame}
              />
            )}
            {activeTab === 'integrations' && <IntegrationsTab settings={settings} onChange={updateSettings} />}
            {activeTab === 'notifications' && <NotificationsTab settings={settings} onChange={updateSettings} />}
            {activeTab === 'security' && <SecurityTab settings={settings} onChange={updateSettings} />}
          </div>
        </div>
      </div>
    </div>
  );
}
