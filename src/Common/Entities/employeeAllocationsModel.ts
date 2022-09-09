var Sequelize = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  const employeeAllocationModel = sequelize.define("employeeAllocations", {
    id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
    ownerProfileId: { type: Sequelize.INTEGER },
    profileId: { type: Sequelize.INTEGER },
    amount: { type: Sequelize.DOUBLE },
    currencyId: { type: Sequelize.STRING },
    employeeAllocationStatusId: { type: Sequelize.INTEGER },
    expireDate: { type: Sequelize.DATE },
    period: { type: Sequelize.INTEGER },
    userId: { type: Sequelize.INTEGER },
  });
  employeeAllocationModel.associate = models => {
    // associations can be defined here
    employeeAllocationModel.belongsTo(models.profiles, {
      as: "ownerProfile",
      foreignKey: "ownerProfileId"
    });
    employeeAllocationModel.belongsTo(models.profiles, {
      as: "profile",
      foreignKey: "profileId"
    });
    employeeAllocationModel.belongsTo(models.users, {
      as: "user",
      foreignKey: "userId"
    });
    employeeAllocationModel.belongsTo(models.employeeAllocationStatuses, {
      as: "employeeAllocationStatus",
      foreignKey: "employeeAllocationStatusId"
    });
  };
  return employeeAllocationModel;
}