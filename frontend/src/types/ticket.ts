export interface Ticket {
  id: number;
  title: string;
  description: string;
  status: string;
  priority: string;
  category: string;
  createdAt: string;
  updatedAt: string;
  dueDate: string | null;
  reporterId: number | null;
  reporterName: string | null;
  reporterEmail: string | null;
  assigneeId: number | null;
  escalated: boolean;
  resolvedAt: string | null;
}

export interface TicketCreateRequest {
  title: string;
  description: string;
  priority: string;
  reporterName?: string;
  reporterEmail?: string;
}
