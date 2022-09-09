var Sequelize = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  const creditExpenseModel = sequelize.define("creditExpenses", {
    id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
    creditId: { type: Sequelize.INTEGER },
    amount: { type: Sequelize.DOUBLE },
    currencyId: { type: Sequelize.STRING },
    creditStatusId: { type: Sequelize.INTEGER },
    bookingId: { type: Sequelize.STRING },
    userId: { type: Sequelize.INTEGER },
  });
  creditExpenseModel.associate = models => {
    // associations can be defined here
    creditExpenseModel.belongsTo(models.credits, {
      as: "credit",
      foreignKey: "creditId"
    });
    creditExpenseModel.belongsTo(models.users, {
      as: "user",
      foreignKey: "userId"
    });
    creditExpenseModel.belongsTo(models.creditStatuses, {
      as: "creditStatus",
      foreignKey: "creditStatusId"
    });
    creditExpenseModel.hasMany(models.incomes,{
      foreignKey: "creditExpenseId"
    });
};
  return creditExpenseModel;
}