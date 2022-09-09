var Sequelize = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  const creditModel = sequelize.define("credits", {
    id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
    profileId: { type: Sequelize.INTEGER },
    amount: { type: Sequelize.DOUBLE },
    currencyId: { type: Sequelize.STRING },
    creditStatusId: { type: Sequelize.INTEGER },
    expireDate: { type: Sequelize.DATE },
    period: { type: Sequelize.INTEGER },
    operatorId: { type: Sequelize.INTEGER },
  });
  creditModel.associate = models => {
    // associations can be defined here
    creditModel.belongsTo(models.profiles, {
      as: "profile",
      foreignKey: "profileId"
    });
    creditModel.belongsTo(models.users, {
      as: "operator",
      foreignKey: "operatorId"
    });
    creditModel.belongsTo(models.creditStatuses, {
      as: "creditStatus",
      foreignKey: "creditStatusId"
    });
    creditModel.hasMany(models.creditExpenses,{
      foreignKey: "creditId"
    });
  };
  return creditModel;
}