import { creditValidate } from "../../Common/Metadata/creditMetadata";

export const creditAddRule = [
  creditValidate.profileId.exists({ checkNull: true }),
  creditValidate.amount.exists({ checkNull: true }),
  creditValidate.currencyId.exists({ checkNull: true }),
  creditValidate.period.custom(value => value != undefined && value != null)
]

export const creditUpdateRule = [
  creditValidate.id,
  creditValidate.amount.optional(),
  // creditValidate.currencyId,
  creditValidate.creditStatusId.optional(),
  creditValidate.expireDate.optional(),
  creditValidate.period.optional()
]

export const creditUpdateStatusRule = [
  creditValidate.id,
  creditValidate.creditStatusId
]

export const creditDeleteRule = [
  creditValidate.id
]

export const creditGetRule = [
  creditValidate.phrase,
  creditValidate.creditStatusCode
]

export const creditClearRule = [
  creditValidate.id,
  creditValidate.addCredit
]

export const creditGetByProfileRule = [
  creditValidate.createdStartDate,
  creditValidate.createdEndDate,
  creditValidate.expieryStartDate,
  creditValidate.expieryEndDate,
  creditValidate.creditStatusId,
];