import { TransactionType } from '../enums/transaction-type.enum';

export type Transaction = {
  id: string;
  userId: string;
  appointmentId?: string;
  amount: number;
  type: TransactionType;
};
