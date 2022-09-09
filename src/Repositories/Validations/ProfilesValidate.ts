import { profileValidate } from "../../Common/Metadata/profileMetadata";
import { creditValidate } from "../../Common/Metadata/creditMetadata";

export const getByPagingRules = [
    profileValidate.phrase,
]

export const getApprovedProfileHasCreditRules = [
    profileValidate.phrase,
    creditValidate.createdStartDate,
    creditValidate.createdEndDate,
    creditValidate.expieryStartDate,
    creditValidate.expieryEndDate,
    creditValidate.creditStatusId
]

export const getByUserAndPagingRules = [
    profileValidate.phrase,
]

export const getNewEvaluationRules = [
    profileValidate.phrase,
]

export const searchByPhraseRules = [
    profileValidate.phrase,
]

export const getAssignToMeRules = [
    profileValidate.phrase,
]

export const getInProgressAssignToMeRules = [
    profileValidate.phrase,
]

export const getApprovedAssignToMeRules = [
    profileValidate.phrase,
]

export const assignToProfileRules = [
    profileValidate.profileIds,
    profileValidate.operatorId,
]

export const updateEvaluationResultRules = [
    profileValidate.id,
    profileValidate.subject,
    profileValidate.message,
    profileValidate.status,
]

export const updateGradeRules = [
    profileValidate.profileId,
    profileValidate.gradeId,
]

export const updateMeRules = [
    // profileValidate.id,
    profileValidate.firstName,
    profileValidate.lastName,
    profileValidate.email,
    profileValidate.basicInfoForupdateMe,
    // profileValidate.displayName,
    // profileValidate.businessTypeId,
    // profileValidate.role,
    // profileValidate.addresses
]

export const addBusinessProfileRules = [
    profileValidate.businessTypeId,
    profileValidate.displayName,
    profileValidate.role,
    profileValidate.addresses,
    profileValidate.basicInfoForAddBusiness
]

export const changeAvatarRules = [
    profileValidate.avatar,
]
export const updateLogoRules = [
    profileValidate.basicInfoForUpdateLogo,
    profileValidate.id
]

export const updateAcceptInvitationRules = [
    profileValidate.profileId,
    profileValidate.departmentId,
    profileValidate.roleId,
    profileValidate.isAccept
]
export const deleteRules = [
    profileValidate.idForDelete
]
