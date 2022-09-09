import { walletValidate } from "../../Common/Metadata/walletMetadata";

export const walletAddRule = [
  walletValidate.profileId.exists({ checkNull: true }),
  walletValidate.amount.exists({ checkNull: true }),
  walletValidate.currencyId.exists({ checkNull: true })
]

export const walletUpdateRule = [
  walletValidate.id,
  walletValidate.walletStatusId.optional(),
  walletValidate.description
]

export const walletUpdateStatusRule = [
  walletValidate.id,
  walletValidate.walletStatusId
]

export const walletDeleteRule = [
  walletValidate.id
]

export const walletChargeRule = [
  walletValidate.amount,
  walletValidate.currencyId,
  walletValidate.description
]

export const walletHistoryFilterRule = [
  walletValidate.startDate,
  walletValidate.endDate,
  walletValidate.walletStatusId
]