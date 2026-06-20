export interface TicketCustomFieldValue {
  fieldId: number;
  fieldName: string;
  fieldType: string;
  value: string;
}

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
  commentCount?: number;
  customFields?: TicketCustomFieldValue[];
}

export interface TicketCreateRequest {
  title: string;
  description: string;
  priority: string;
  category?: string;
  customFields?: { fieldId: number; value: string }[];
  reporterName?: string;
  reporterEmail?: string;
}

export interface CustomFieldConfig {
  id: number;
  category: string;
  fieldName: string;
  fieldType: string;
  options: string;
  isRequired: boolean;
}
