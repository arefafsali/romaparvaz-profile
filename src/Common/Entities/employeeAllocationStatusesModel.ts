var Sequelize = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  const employeeAllocationStatusModel = sequelize.define("employeeAllocationStatuses", {
    id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: Sequelize.JSONB },
    code: { type: Sequelize.STRING },
    description: { type: Sequelize.STRING }
  });
  employeeAllocationStatusModel.associate = models => {
    // associations can be defined here
    employeeAllocationStatusModel.hasMany(models.employeeAllocations, {
      foreignKey: "employeeAllocationStatusId"
    });
  };

  return employeeAllocationStatusModel;
}