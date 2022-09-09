
import { pointRulesValidate } from "../../Common/Metadata/pointRulesMetadata";

export const addRules = [
    pointRulesValidate.point,
    pointRulesValidate.pointTypeId,
    pointRulesValidate.isActive
]

export const updateRules = [
    pointRulesValidate.id,
    pointRulesValidate.point,
    pointRulesValidate.pointTypeId,
    pointRulesValidate.isActive
]

export const deleteRules = [
    pointRulesValidate.idforDelete
]