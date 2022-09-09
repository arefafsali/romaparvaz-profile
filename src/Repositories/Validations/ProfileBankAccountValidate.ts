import { profileBankAccountValidate } from "../../Common/Metadata/profileBankAccountMetadata";

export const createMeRules = [
    profileBankAccountValidate.id,
    profileBankAccountValidate.bankName,
    profileBankAccountValidate.accountNo,
    profileBankAccountValidate.branchName,
    profileBankAccountValidate.cardNo,
    profileBankAccountValidate.isDefault,
    profileBankAccountValidate.shebaNo
]
