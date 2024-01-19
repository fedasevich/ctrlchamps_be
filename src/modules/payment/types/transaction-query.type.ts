import { Transaction } from './transaction-history.type';

export type TransactionQuery = {
  limit?: number;
  offset?: number;
};

export type TransactionsListResponse = {
  data: Transaction[];
  count: number;
};
