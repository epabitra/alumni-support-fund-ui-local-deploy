/**
 * Payment module – types aligned with backend DTOs
 */

export type PaymentOrderStatus =
  | 'PENDING'
  | 'CREATED'
  | 'PAID'
  | 'FAILED'
  | 'CANCELLED'
  | 'EXPIRED';

export type TransactionStatus = 'SUCCESS' | 'FAILED' | 'PENDING' | 'CANCELLED';

export type PaymentMethod = 'UPI' | 'CARD' | 'NETBANKING' | 'WALLET' | 'EMI' | 'ADMIN';

export interface CheckoutConfigDTO {
  /** False until online payments are switched on */
  paymentsEnabled: boolean;
  razorpayKeyId: string;
}

export interface CreatePaymentOrderDTO {
  amount: number;
  /** The event chosen on the Contribute page; empty = General Fund */
  fundEventId?: number;
  currency?: string;
  description?: string;
  receipt?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
}

export interface PaymentOrderDTO {
  id: number;
  uuid?: string;
  orderId: string;
  amount: number;
  currency: string;
  status: PaymentOrderStatus;
  description?: string;
  receipt?: string;
  paymentMethod?: PaymentMethod;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  expiresAt?: string;
  completedAt?: string;
  failureReason?: string;
  createdDate?: string;
  providerOrderId: string;
  providerPaymentId?: string;
  providerDetails?: Record<string, unknown>;
}

export interface UserContributionSummaryDTO {
  userId: number;
  totalContributed: number;
  transactionCount: number;
  firstContributionDate?: string;
  lastContributionDate?: string;
}

export interface PaymentTransactionDTO {
  id: number;
  uuid?: string;
  transactionId: string;
  orderId?: string;
  transactionType?: string;
  amount: number;
  currency: string;
  status: TransactionStatus;
  paymentMethod?: PaymentMethod;
  paymentGateway?: string;
  paymentDate?: string;
  referenceId?: string;
  failureCode?: string;
  failureReason?: string;
  bankTransactionId?: string;
  upiTransactionId?: string;
  cardLast4?: string;
  cardNetwork?: string;
  createdDate?: string;
  /** Event title, or "General Fund" */
  purpose?: string;
  fundEventId?: number | null;
  /** Given back so far for this donation */
  refundedAmount?: number;
}

export interface PublicPaymentHistoryDTO {
  /** When contributor chose to reveal details */
  fullName?: string;
  fullEmail?: string;
  /** Only present when the contributor shows their details and has a photo */
  profileImageUrl?: string;
  /** When contributor chose to keep details private */
  maskedName?: string;
  maskedEmail?: string;
  maskedPhone?: string;
  amount: number;
  /** Given back to the donor; 0 if none */
  refundedAmount?: number;
  paymentDate: string;
  paymentMethod?: string;
  /** Event title, or "General Fund" */
  purpose?: string;
  /** Empty for the General Fund */
  fundEventId?: number | null;
  /** Admins only (needed to record a refund) */
  orderId?: string;
}

export interface FundBalanceDTO {
  totalBalance: number;
  totalContributions: number;
  totalDisbursements: number;
  lastUpdated?: string;
  /** Number of selected students currently supported (scholarship recipients) */
  selectedStudentsCount?: number;
  /** Money spent for events */
  totalEventExpenses?: number;
  totalRefunds?: number;
  /** Part of the balance that belongs to events */
  heldByEvents?: number;
  /** Part of the balance free for scholarships */
  generalFundBalance?: number;
  /** Events holding money; DRAFT = set aside for an event that has not opened yet */
  events?: { eventId: number; title: string; status: string; balance: number }[];
}

/** Receipt data for donation/contribution (screen and print). */
export interface ReceiptDTO {
  organizationName: string;
  receiptTitle: string;
  orderId: string;
  transactionId: string;
  paymentDate: string; // ISO
  amount: number;
  amountInWords?: string;
  currency: string;
  donorName: string;
  donorEmail: string;
  paymentMethodDisplay: string;
  status: string;
  /** Event title, or "General Fund" */
  purpose?: string;
  refundedAmount?: number;
  generatedAt: string; // ISO
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}
