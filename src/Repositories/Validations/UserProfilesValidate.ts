import { userProfileValidate } from "../../Common/Metadata/userProfileMetadata";

export const getByRoleListRules = [
    userProfileValidate.roleIds,
]

export const updateAsseignedRoleRules = [
    userProfileValidate.userId,
    userProfileValidate.profileId,
    userProfileValidate.roles,
]