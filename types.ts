
export enum WorkflowStep {
  INITIAL = 0,
  STEP_1 = 1,
  STEP_2 = 2,
  STEP_3 = 3,
  STEP_4 = 4,
  COMPLETED = 5,
  KITTING_PAYMENT = 6
}

export interface User {
  id: string;
  name: string;
  permissions: {
    dashboard: boolean;
    step1: boolean;
    step2: boolean;
    step3: boolean;
    step4: boolean;
    kitting: boolean;
    table: boolean;
  };
}

export interface FmsData {
  rowId: number;
  timestamp: string;
  returnNo: string;
  doNumber: string;
  partyNames: string;
  productName: string;
  qty: string;
  transportPayment: string;
  reasonOfMaterialReturn: string;
  debitNote: string;
  planned1: string;
  actual1: string;
  delay1: string;
  transporterName: string;
  biltyNo: string;
  typeOfRate: string;
  perMatricTonRate: string;
  fixedAmount: string;
  vehicleNo: string;
  receivedDate: string;
  planned2: string;
  actual2: string;
  delay2: string;
  qtyOfReturnMaterial: string;
  rateOfMaterial: string;
  conditionOfMaterial: string;
  photoOfReturnMaterial: string;
  partyDebitNoteNo: string;
  materialReturnNo: string;
  originalBillImage: string;
  planned3: string;
  actual3: string;
  delay3: string;
  billNo: string;
  amount: string;
  creditNoteCopy: string;
  creditNoteNo: string;
  planned4: string;
  actual4: string;
  delay4: string;
  sendToMail: string;
}

export interface FullKittingData {
  rowId: number;
  timestamp: string;
  paymentNumber: string;
  uniqueNumber: string;
  status: string;
  transporterName: string;
  vehicleNumber: string;
  fromLocation: string;
  toLocation: string;
  materialLoadDetails: string;
  biltyNumber: string;
  rateType: string;
  amount: string;
  biltyImage: string;
  planned: string;
  actual: string;
  delay: string;
  paymentForm: string;
}

export interface OrderData {
  doNumber: string;
  partyNames: string;
  productName: string;
}

export interface OrderResponse {
  orders: OrderData[];
  transporters: string[];
}

export type View = 'dashboard' | 'step1' | 'step2' | 'step3' | 'step4' | 'table' | 'kitting';

export interface DashboardStats {
  total: number;
  pending: number;
  completed: number;
  delayed: number;
}
