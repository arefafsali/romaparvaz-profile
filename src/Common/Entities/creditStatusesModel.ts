var Sequelize = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  const creditStatusModel = sequelize.define("creditStatuses", {
    id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: Sequelize.JSONB },
    code: { type: Sequelize.STRING },
    description: { type: Sequelize.STRING },
    isForExpense: { type: Sequelize.BOOLEAN }
  });
  creditStatusModel.associate = models => {
    // associations can be defined here
    creditStatusModel.hasMany(models.credits, {
      foreignKey: "creditStatusId"
    });
    creditStatusModel.hasMany(models.creditExpenses, {
      foreignKey: "creditStatusId"
    });
  };

  return creditStatusModel;
}