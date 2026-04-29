import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8081/api"
});

export async function login(payload) {
  const response = await api.post("/auth/login", payload);
  return response.data;
}

export async function fetchConversations() {
  const response = await api.get("/conversations");
  return response.data;
}

export async function fetchConversationsWithFilters(params) {
  const response = await api.get("/conversations", { params });
  return response.data;
}

export async function ingestConversation(payload) {
  const response = await api.post("/conversations", payload);
  return response.data;
}

export async function analyzeConversation(conversationId) {
  const response = await api.post(`/evaluation/conversation/${conversationId}`);
  return response.data;
}

export async function fetchDashboardReport() {
  const response = await api.get("/evaluation/report");
  return response.data;
}

export async function fetchDashboardReportWithFilters(params) {
  const response = await api.get("/evaluation/report", { params });
  return response.data;
}

export async function analyzeBatch(limit = 20) {
  const response = await api.post("/evaluation/analyze-batch", { limit });
  return response.data;
}

export async function predictEmployee(employeeId, period = "weekly") {
  const response = await api.post(`/evaluation/employee/${employeeId}/predict`, { period });
  return response.data;
}

export async function fetchEmployeeHistory(employeeId) {
  const response = await api.get(`/evaluation/employee/${employeeId}/history`);
  return response.data;
}

export async function runEmployeePrediction(employeeId, period = "weekly") {
  const response = await api.post(`/evaluation/employee/${employeeId}/predict`, { period });
  return response.data;
}

export async function runForecastScenario(employeeId, payload) {
  const response = await api.post(`/evaluation/employee/${employeeId}/forecast-scenario`, payload);
  return response.data;
}

export async function fetchTeam() {
  const response = await api.get("/team");
  return response.data;
}

export async function createTeamMember(payload) {
  const response = await api.post("/team", payload);
  return response.data;
}

export async function updateTeamMember(id, payload) {
  const response = await api.put(`/team/${id}`, payload);
  return response.data;
}

export async function deleteTeamMember(id) {
  const response = await api.delete(`/team/${id}`);
  return response.data;
}

// ========= Chat API =========

export async function startChat(payload) {
  const response = await api.post("/chat/start", payload);
  return response.data;
}

export async function fetchGames(params = {}) {
  const response = await api.get("/games", { params });
  return response.data;
}

export async function createGame(payload) {
  const response = await api.post("/games", payload);
  return response.data;
}

export async function updateGame(id, payload) {
  const response = await api.put(`/games/${id}`, payload);
  return response.data;
}

export async function archiveGame(id) {
  const response = await api.delete(`/games/${id}`);
  return response.data;
}

export async function sendChatMessage(payload) {
  const response = await api.post("/chat/message", payload);
  return response.data;
}

export async function getChatConversation(id, params = {}) {
  const response = await api.get(`/chat/conversation/${id}`, { params });
  return response.data;
}

export async function listActiveChats(params = {}) {
  const response = await api.get("/chat/active", { params });
  return response.data;
}

export async function assignAgentToChat(conversationId, employeeId) {
  const response = await api.put(`/chat/conversation/${conversationId}/assign`, { employeeId });
  return response.data;
}

export async function closeChat(conversationId) {
  const response = await api.put(`/chat/conversation/${conversationId}/close`);
  return response.data;
}

export async function recordCallEvent(conversationId, payload) {
  const response = await api.post(`/chat/conversation/${conversationId}/call-event`, payload);
  return response.data;
}

// ========= Settings API =========

export async function fetchSettings(category) {
  const params = category ? { category } : {};
  const response = await api.get("/settings", { params });
  return response.data;
}

export async function saveSettings(settings) {
  const response = await api.put("/settings", settings);
  return response.data;
}

export async function resetAllSettings() {
  const response = await api.delete("/settings");
  return response.data;
}
