import axios from 'axios';
import { API_URL } from '../../../Constants';
import { setupAxios } from '../../auth/core/setupAxios';
import type { PageResponse } from '../../payment/core/_models';
import type { ScholarshipReceiptDTO } from '../../scholarship/core/_models';
import type {
  ContributionRefundDTO,
  FundEventDTO,
  FundEventExpenseDTO,
  FundEventSaveRequest,
  FundMove,
  FundTransferDTO
} from './_models';

const eventsAxios = axios.create();
setupAxios(eventsAxios);

const EVENTS = `${API_URL}/events`;
const ADMIN_EVENTS = `${API_URL}/admin/events`;

/** Open events first, then finished ones (members never get drafts) */
export function getEvents() {
  return eventsAxios.get<FundEventDTO[]>(EVENTS).then((r) => r.data);
}

/** All events including drafts (admin) */
export function getAdminEvents() {
  return eventsAxios.get<FundEventDTO[]>(ADMIN_EVENTS).then((r) => r.data);
}

export type EventImageKind = 'BANNER' | 'PHOTO';

/** BANNER = poster (cards, shares); PHOTO = photos from the event (report). Returns all images of that kind, cover first */
export function addEventImages(eventId: number, images: File[], kind: EventImageKind = 'BANNER') {
  const form = new FormData();
  images.forEach((f) => form.append('images', f));
  return eventsAxios
    .post<ScholarshipReceiptDTO[]>(`${ADMIN_EVENTS}/${eventId}/images`, form, { params: { kind } })
    .then((r) => r.data);
}

export interface EventReportInput {
  summary: string;
  items: { itemId: number; givenQuantity: number | null }[];
}

export function saveEventReport(eventId: number, input: EventReportInput) {
  return eventsAxios.put<FundEventDTO>(`${ADMIN_EVENTS}/${eventId}/report`, input).then((r) => r.data);
}

export interface ExpenseDetailsInput {
  itemId: number | null;
  quantity: number | null;
  unitPrice: number | null;
  purpose: string;
  paidOn: string;
  /** New total; null keeps it. Only for an open event. */
  amount?: number | null;
  coverFromGeneral?: boolean;
}

/** Fix a recorded payment; a new total moves the difference back to or out of the event */
export function updateEventExpenseDetails(eventId: number, expenseId: number, input: ExpenseDetailsInput) {
  return eventsAxios.patch<FundEventExpenseDTO>(`${ADMIN_EVENTS}/${eventId}/expenses/${expenseId}`, input).then((r) => r.data);
}

export function removeEventImage(eventId: number, imageId: number) {
  return eventsAxios.delete<ScholarshipReceiptDTO[]>(`${ADMIN_EVENTS}/${eventId}/images/${imageId}`).then((r) => r.data);
}

export function makeEventCover(eventId: number, imageId: number) {
  return eventsAxios.post<ScholarshipReceiptDTO[]>(`${ADMIN_EVENTS}/${eventId}/images/${imageId}/cover`).then((r) => r.data);
}

/** Downloads an event image as a File (for sharing); contentUrl is /api/events/images/{id}/content */
export async function fetchEventImageFile(contentUrl: string, fileName: string): Promise<File> {
  const base = (API_URL || '').replace(/\/api\/?$/, '');
  const res = await eventsAxios.get<Blob>(base + contentUrl, { responseType: 'blob' });
  const type = res.data.type || 'image/jpeg';
  return new File([res.data], fileName, { type });
}

export function getEvent(id: number | string) {
  return eventsAxios.get<FundEventDTO>(`${EVENTS}/${id}`).then((r) => r.data);
}

export interface EventExpenseFilters {
  search?: string;
  from?: string;
  to?: string;
  sortBy?: 'date' | 'amount';
  sortDir?: 'asc' | 'desc';
}

/** Every event expense, for the Paid out tab */
export function getEventExpenses(page = 0, size = 10, filters: EventExpenseFilters = {}) {
  const params: Record<string, string | number> = { page, size };
  Object.entries(filters).forEach(([k, v]) => {
    if (v != null && String(v).trim() !== '') params[k] = String(v).trim();
  });
  return eventsAxios.get<PageResponse<FundEventExpenseDTO>>(`${EVENTS}/expenses`, { params }).then((r) => r.data);
}

export function createEvent(body: FundEventSaveRequest) {
  return eventsAxios.post<FundEventDTO>(ADMIN_EVENTS, body).then((r) => r.data);
}

export function updateEvent(id: number, body: FundEventSaveRequest) {
  return eventsAxios.put<FundEventDTO>(`${ADMIN_EVENTS}/${id}`, body).then((r) => r.data);
}

export function publishEvent(id: number, notifyMembers: boolean) {
  return eventsAxios.post<FundEventDTO>(`${ADMIN_EVENTS}/${id}/publish`, { notifyMembers }).then((r) => r.data);
}

export function deleteDraftEvent(id: number) {
  return eventsAxios.delete(`${ADMIN_EVENTS}/${id}`);
}

export interface EventExpenseInput {
  amount: number;
  paidOn: string;
  purpose: string;
  coverFromGeneral: boolean;
  itemId?: number | null;
  quantity?: number | null;
  unitPrice?: number | null;
  receipts: File[];
}

export function addEventExpense(eventId: number, input: EventExpenseInput) {
  const form = new FormData();
  const { receipts, ...data } = input;
  form.append('data', new Blob([JSON.stringify(data)], { type: 'application/json' }));
  receipts.forEach((f) => form.append('receipts', f));
  return eventsAxios.post<FundEventExpenseDTO>(`${ADMIN_EVENTS}/${eventId}/expenses`, form).then((r) => r.data);
}

export function addEventExpenseReceipts(eventId: number, expenseId: number, receipts: File[]) {
  const form = new FormData();
  receipts.forEach((f) => form.append('receipts', f));
  return eventsAxios.post<FundEventExpenseDTO>(`${ADMIN_EVENTS}/${eventId}/expenses/${expenseId}/receipts`, form).then((r) => r.data);
}

export function removeEventExpenseReceipt(eventId: number, expenseId: number, receiptId: number) {
  return eventsAxios.delete<FundEventExpenseDTO>(`${ADMIN_EVENTS}/${eventId}/expenses/${expenseId}/receipts/${receiptId}`).then((r) => r.data);
}

/** null on either side = General Fund */
export function transferMoney(fromEventId: number | null, toEventId: number | null, amount: number, reason: string) {
  return eventsAxios.post<FundTransferDTO>(`${ADMIN_EVENTS}/transfers`, { fromEventId, toEventId, amount, reason }).then((r) => r.data);
}

export function closeEvent(id: number, moves: FundMove[], note: string) {
  return eventsAxios.post<FundEventDTO>(`${ADMIN_EVENTS}/${id}/close`, { moves, note }).then((r) => r.data);
}

/** Open a closed or cancelled event again; bringBack moves the closing leftover back in */
export function reopenEvent(id: number, reason: string, bringBack: boolean) {
  return eventsAxios.post<FundEventDTO>(`${ADMIN_EVENTS}/${id}/reopen`, { reason, bringBack }).then((r) => r.data);
}

export function cancelEvent(id: number, note: string) {
  return eventsAxios.post<FundEventDTO>(`${ADMIN_EVENTS}/${id}/cancel`, { note }).then((r) => r.data);
}

export interface RefundInput {
  amount: number;
  refundedOn: string;
  reference: string;
  reason: string;
  coverFromGeneral: boolean;
}

export function recordRefund(orderId: string, input: RefundInput) {
  return eventsAxios
    .post<ContributionRefundDTO>(`${API_URL}/admin/payments/${encodeURIComponent(orderId)}/refunds`, input)
    .then((r) => r.data);
}
