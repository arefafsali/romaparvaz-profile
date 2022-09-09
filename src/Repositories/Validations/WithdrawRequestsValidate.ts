import { withdrawRequestValidate } from "../../Common/Metadata/withdrawRequestMetadata";

export const createMeRules = [
    withdrawRequestValidate.id,
    withdrawRequestValidate.requestAmount,
    withdrawRequestValidate.profileBankAccountId,
    withdrawRequestValidate.description,
]

export const updateApprovedStatusRules = [
    withdrawRequestValidate.id,
    withdrawRequestValidate.description,
    withdrawRequestValidate.isApproved
]

export const deleteRules = [
    withdrawRequestValidate.idForUpdateAndDelete
]