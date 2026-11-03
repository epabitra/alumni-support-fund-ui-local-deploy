import axios from 'axios';
import { API_URL } from '../../../Constants';
import { setupAxios } from '../../auth/core/setupAxios';
import type {
  CheckoutConfigDTO,
  CreatePaymentOrderDTO,
  PaymentOrderDTO,
  UserContributionSummaryDTO,
  PaymentTransactionDTO,
  PublicPaymentHistoryDTO,
  FundBalanceDTO,
  PageResponse,
  ReceiptDTO,
} from './_models';

const paymentAxios = axios.create();
setupAxios(paymentAxios);

const PAYMENTS_BASE = `${API_URL}/payments`;

/** Get client-side checkout config (e.g. Razorpay Key ID). Requires ROLE_USER. */
export function getCheckoutConfig() {
  return paymentAxios.get<CheckoutConfigDTO>(`${PAYMENTS_BASE}/checkout-config`).then((r) => r.data);
}

/** Create a payment order. Requires ROLE_USER. */
export function createPaymentOrder(body: CreatePaymentOrderDTO) {
  return paymentAxios.post<PaymentOrderDTO>(PAYMENTS_BASE, body).then((r) => r.data);
}

/** Get payment order by order ID. Owner only. */
export function getPaymentOrder(orderId: string) {
  return paymentAxios.get<PaymentOrderDTO>(`${PAYMENTS_BASE}/${orderId}`).then((r) => r.data);
}

/** Get current user's contribution summary. Requires ROLE_USER. */
export function getMyContributions() {
  return paymentAxios.get<UserContributionSummaryDTO>(`${PAYMENTS_BASE}/my-contributions`).then((r) => r.data);
}

/** Get current user's payment history (paginated). Requires ROLE_USER. */
export function getMyHistory(page: number = 0, size: number = 10): Promise<PageResponse<PaymentTransactionDTO>> {
  return paymentAxios
    .get<PageResponse<PaymentTransactionDTO>>(`${PAYMENTS_BASE}/my-history`, { params: { page, size } })
    .then((response) => response.data);
}

/** Get public payment history with masked user info (paginated). Authenticated. */
/** Filters for the public contributions table; dates are yyyy-MM-dd (inclusive) */
export interface PublicHistoryFilters {
  search?: string;
  from?: string;
  to?: string;
  /** UPI, CARD, NETBANKING, WALLET, EMI or ADMIN */
  method?: string;
  sortBy?: 'date' | 'amount';
  sortDir?: 'asc' | 'desc';
}

export function getPublicHistory(
  page: number = 0,
  size: number = 10,
  filters: PublicHistoryFilters = {}
): Promise<PageResponse<PublicPaymentHistoryDTO>> {
  const params: Record<string, string | number> = { page, size };
  Object.entries(filters).forEach(([k, v]) => {
    if (v != null && String(v).trim() !== '') params[k] = String(v).trim();
  });
  return paymentAxios
    .get<PageResponse<PublicPaymentHistoryDTO>>(`${PAYMENTS_BASE}/public-history`, { params })
    .then((response) => response.data);
}

/** Get current organization fund balance. Authenticated. */
export function getFundBalance() {
  return paymentAxios.get<FundBalanceDTO>(`${PAYMENTS_BASE}/fund-balance`).then((r) => r.data);
}

/** Get receipt for a paid order. Allowed for order owner or admin. */
export function getReceipt(orderId: string) {
  return paymentAxios.get<ReceiptDTO>(`${PAYMENTS_BASE}/receipt/${encodeURIComponent(orderId)}`).then((r) => r.data);
}
