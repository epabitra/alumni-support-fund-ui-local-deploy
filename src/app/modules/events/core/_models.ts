import type { PublicPaymentHistoryDTO } from '../../payment/core/_models';
import type { ScholarshipReceiptDTO } from '../../scholarship/core/_models';

export type FundEventStatus = 'DRAFT' | 'OPEN' | 'CLOSED' | 'CANCELLED';

/** Money moved between funds: MANUAL by an admin, COVER_SHORTFALL for a payment, LEFTOVER at closing, CANCELLATION */
export type FundTransferKind = 'MANUAL' | 'COVER_SHORTFALL' | 'LEFTOVER' | 'CANCELLATION';

export interface FundEventExpenseDTO {
  id: number;
  eventId: number;
  eventTitle: string;
  amount: number;
  /** yyyy-MM-dd */
  paidOn: string;
  recordedAt?: string;
  purpose: string;
  /** Plan line it was for, and how many at what price (all optional) */
  itemId?: number | null;
  itemName?: string | null;
  unit?: string | null;
  quantity?: number | null;
  unitPrice?: number | null;
  /** Part the General Fund added because the event did not have enough */
  coveredFromGeneral: number;
  /** Admins only */
  paidBy?: string;
  receipts: ScholarshipReceiptDTO[];
}

/** A plan line with what actually happened */
export interface FundEventItemDTO {
  id: number;
  name: string;
  /** pcs, box, kg ... */
  unit?: string | null;
  plannedQuantity?: number | null;
  plannedUnitPrice?: number | null;
  plannedTotal?: number | null;
  /** Sum of quantities of linked spending; null when none gave a quantity */
  boughtQuantity?: number | null;
  spentAmount: number;
  paymentCount: number;
  /** From the report */
  givenQuantity?: number | null;
}

export interface PlanItemInput {
  /** Missing = new line */
  id?: number;
  name: string;
  unit?: string;
  plannedQuantity?: number | null;
  plannedUnitPrice?: number | null;
}

export interface FundTransferDTO {
  id: number;
  /** Empty = General Fund */
  fromEventId?: number | null;
  fromTitle: string;
  toEventId?: number | null;
  toTitle: string;
  amount: number;
  kind: FundTransferKind;
  reason?: string;
  createdAt: string;
  /** Admins only */
  createdBy?: string;
}

export interface FundEventChangeDTO {
  field: 'END_DATE' | 'START_DATE' | 'BUDGET';
  oldValue?: string;
  newValue?: string;
  reason?: string;
  changedAt: string;
  /** Admins only */
  changedBy?: string;
}

export interface FundEventDTO {
  id: number;
  title: string;
  description?: string;
  budget: number;
  /** yyyy-MM-dd */
  startDate: string;
  endDate: string;
  status: FundEventStatus;
  /** Open, but the end date has passed: no more online donations */
  collectionEnded: boolean;
  /** Days left including today; only for open events */
  daysLeft?: number | null;
  collected: number;
  refunded: number;
  netCollected: number;
  spent: number;
  transferredIn: number;
  transferredOut: number;
  /** Money of this event still in hand */
  balance: number;
  /** Donations kept plus money set aside for it; not General Fund cover for payments */
  raised: number;
  /** Moved in from the General Fund to pay for spending the event could not afford */
  coveredFromGeneral: number;
  donationCount: number;
  publishedAt?: string;
  closedAt?: string;
  closingNote?: string;
  /** Written after the event */
  reportSummary?: string | null;
  reportUpdatedAt?: string | null;
  hasReport: boolean;
  /** Banner / poster images, cover first */
  images: ScholarshipReceiptDTO[];
  /** Photos from the event (detail only) */
  photos: ScholarshipReceiptDTO[];
  /** Budget plan with actuals (detail only) */
  items: FundEventItemDTO[];
  /** Filled for the single-event view only */
  donations: PublicPaymentHistoryDTO[];
  expenses: FundEventExpenseDTO[];
  transfers: FundTransferDTO[];
  changes: FundEventChangeDTO[];
}

export interface FundEventSaveRequest {
  title: string;
  description?: string;
  budget: number;
  startDate: string;
  endDate: string;
  /** Create only: open straight away instead of saving a draft */
  publish?: boolean;
  notifyMembers?: boolean;
  /** Editing an open event: why the dates or budget changed (shown to members) */
  changeReason?: string;
  /** Budget plan; omit to leave it unchanged */
  items?: PlanItemInput[];
}

export interface FundMove {
  /** null = General Fund */
  toEventId: number | null;
  amount: number;
}

export interface ContributionRefundDTO {
  id: number;
  orderId: string;
  amount: number;
  refundedOn: string;
  reference?: string;
  reason: string;
  coveredFromGeneral: number;
  totalRefunded: number;
  donationAmount: number;
}
