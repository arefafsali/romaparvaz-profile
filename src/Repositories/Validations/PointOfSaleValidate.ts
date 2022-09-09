import { pointOfSaleValidate } from "../../Common/Metadata/pointOfSaleMetaData";

export const getAllIncomeCotaRules = [
    pointOfSaleValidate.profileId,
    pointOfSaleValidate.startDate,
    pointOfSaleValidate.endDate
]

export const getByMeRules = [
    pointOfSaleValidate.isWithdraw,
    pointOfSaleValidate.startDate,
    pointOfSaleValidate.endDate
]
