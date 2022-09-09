import { employeeAllocationValidate } from "../../Common/Metadata/employeeAllocationMetadata";

export const employeeAllocationAddRule = [
  employeeAllocationValidate.profileId.exists({ checkNull: true }),
  employeeAllocationValidate.amount.exists({ checkNull: true }),
  employeeAllocationValidate.currencyId.exists({ checkNull: true }),
  employeeAllocationValidate.period.custom(value => value != undefined && value != null)
]

export const employeeAllocationUpdateRule = [
  employeeAllocationValidate.id,
  employeeAllocationValidate.amount.optional(),
  // employeeAllocationValidate.currencyId,
  employeeAllocationValidate.employeeAllocationStatusId.optional(),
  employeeAllocationValidate.expireDate.optional(),
  employeeAllocationValidate.period.optional()
]

export const employeeAllocationUpdateStatusRule = [
  employeeAllocationValidate.id,
  employeeAllocationValidate.employeeAllocationStatusId
]

export const employeeAllocationDeleteRule = [
  employeeAllocationValidate.id
]

export const employeeAllocationGetRule = [
  employeeAllocationValidate.phrase,
  employeeAllocationValidate.employeeAllocationStatusCode
]

export const employeeAllocationClearRule = [
  employeeAllocationValidate.id,
  employeeAllocationValidate.addEmployeeAllocation
]