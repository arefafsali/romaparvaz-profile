import { creditExpenseValidate } from "../../Common/Metadata/creditExpenseMetadata";

export const addRule = [
  creditExpenseValidate.creditId,
  creditExpenseValidate.amount,
  creditExpenseValidate.currencyId,
  creditExpenseValidate.bookingId,
  creditExpenseValidate.userId
]

export const updateStatusRule = [
  creditExpenseValidate.id,
  creditExpenseValidate.creditStatusId
]

export const deleteRule = [
  creditExpenseValidate.id
]