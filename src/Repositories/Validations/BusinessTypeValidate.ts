import { businessTypeValidate } from "../../Common/Metadata/businessTypeMetadata";

export const addRules = [
    businessTypeValidate.description,
    businessTypeValidate.code,
    businessTypeValidate.profileTypeId,
    businessTypeValidate.businessTypeName,
]
export const updateRules = [
    businessTypeValidate.id,
    businessTypeValidate.description,
    businessTypeValidate.code,
    businessTypeValidate.profileTypeId,
    businessTypeValidate.businessTypeName,
]
export const deleteRules = [
    businessTypeValidate.idForDelete
]