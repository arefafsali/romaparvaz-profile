var Sequelize = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  const walletsModel = sequelize.define("wallets", {
    id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
    guid: { type: Sequelize.UUID },
    profileId: { type: Sequelize.INTEGER },
    amount: { type: Sequelize.DOUBLE },
    walletStatusId: { type: Sequelize.INTEGER },
    description: { type: Sequelize.STRING },
    bookingId: { type: Sequelize.STRING },
    paymentData: { type: Sequelize.JSONB },
    userId: { type: Sequelize.INTEGER },
    currencyId: { type: Sequelize.STRING },
  });
  walletsModel.associate = models => {
    // associations can be defined here
    walletsModel.belongsTo(models.profiles, {
      as: "profile",
      foreignKey: "profileId"
    });
    walletsModel.belongsTo(models.users, {
      as: "user",
      foreignKey: "userId"
    });
    walletsModel.belongsTo(models.walletStatuses, {
      as: "walletStatus",
      foreignKey: "walletStatusId"
    });
    walletsModel.hasMany(models.incomes, {
      foreignKey: "walletId"
    });
  };
  return walletsModel;
}