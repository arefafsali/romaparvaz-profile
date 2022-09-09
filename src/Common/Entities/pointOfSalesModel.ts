var Sequelize = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  const pointOfSaleModel = sequelize.define("pointOfSales", {
    id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
    incomeId: { type: Sequelize.INTEGER },
    parentId: { type: Sequelize.INTEGER },
    profileId: { type: Sequelize.INTEGER },
    isWithdraw: { type: Sequelize.BOOLEAN },
    amount: { type: Sequelize.DOUBLE },
    withdrawDate: { type: Sequelize.DATE },
    withdrawTypeId: { type: Sequelize.INTEGER },
    gatewayId: { type: Sequelize.STRING }
  });
  pointOfSaleModel.associate = models => {
    // associations can be defined here
    pointOfSaleModel.belongsTo(models.incomes, {
      foreignKey: "incomeId"
    });
    pointOfSaleModel.belongsTo(models.pointOfSales, {
      foreignKey: "parentId"
    });
    pointOfSaleModel.belongsTo(models.profiles, {
      foreignKey: "profileId"
    });
    pointOfSaleModel.belongsTo(models.withdrawTypes, {
      foreignKey: "withdrawTypeId"
    });
  };
  return pointOfSaleModel;
};
