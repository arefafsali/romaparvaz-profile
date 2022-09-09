var Sequelize = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  const walletStatusModel = sequelize.define("walletStatuses", {
    id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: Sequelize.JSONB },
    code: { type: Sequelize.STRING },
    description: { type: Sequelize.STRING },
  });
  walletStatusModel.associate = models => {
    // associations can be defined here
    walletStatusModel.hasMany(models.wallets, {
      foreignKey: "walletStatusId"
    });
  };

  return walletStatusModel;
}