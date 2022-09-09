var Sequelize = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  const incomeModel = sequelize.define("incomes", {
    id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
    amount: { type: Sequelize.DOUBLE },
    bookingFlightId: { type: Sequelize.STRING },
    serviceTypeCode: { type: Sequelize.INTEGER },
    walletId: { type: Sequelize.INTEGER },
    creditExpenseId: { type: Sequelize.INTEGER },
    profilePointId: { type: Sequelize.INTEGER }
  });
  incomeModel.associate = models => {
    incomeModel.belongsTo(models.creditExpenses, {
      as: "creditExpense",
      foreignKey: "creditExpenseId"
    });
    incomeModel.belongsTo(models.wallets, {
      as: "wallet",
      foreignKey: "walletId"
    });
    incomeModel.hasMany(models.pointOfSales,{
      foreignKey:"incomeId"
    })
   };
  return incomeModel;
};
