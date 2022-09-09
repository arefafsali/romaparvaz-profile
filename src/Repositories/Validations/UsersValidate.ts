import { userValidate } from "../../Common/Metadata/userMetadata";

export const loginRules = [
    userValidate.userName,
    userValidate.password,
]

export const addWithProfileRules = [
    userValidate.userName,
    userValidate.password,
    userValidate.firstName,
    userValidate.lastName,
    userValidate.email,
    userValidate.basicInfo
]

export const resetPasswordRules = [
    userValidate.guid,
    userValidate.hash,
    userValidate.password
]

export const loginAndSignWithGoogleRules = [
    userValidate.userName,
    userValidate.email,
    userValidate.firstName,
    userValidate.lastName,
    userValidate.basicInfoForGoogle
]

export const changePasswordRules = [
    userValidate.password,
    userValidate.oldPassword,
]
export const changeSecondPasswordRules = [
    userValidate.secondPassword,
]

export const searchByPhraseRules = [
    userValidate.phrase
]

export const getFilterRules = [
    userValidate.isInclude,
    userValidate.orderType,
    userValidate.column,
]

export const blockUserRules = [
    userValidate.id,
    userValidate.isActive,
]

export const addEmployeeRules = [
    userValidate.id,
    userValidate.profileId,
    userValidate.userName,
    userValidate.password,
    userValidate.firstName,
    userValidate.lastName,
    userValidate.email,
    userValidate.departmentId,
    userValidate.roles,
    userValidate.basicInfoForAddEmpolye,
]

export const deleteRules = [
    userValidate.idForUpdateAndDelete,
]