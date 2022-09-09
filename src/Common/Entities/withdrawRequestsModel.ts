var Sequelize = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  const withdrawRequestModel = sequelize.define("withdrawRequests", {
    id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
    requestDate: { type: Sequelize.DATE },
    profileId: { type: Sequelize.INTEGER },
    isApproved: { type: Sequelize.BOOLEAN },
    requestAmount: { type: Sequelize.DOUBLE },
    profileBankAccountId: { type: Sequelize.INTEGER },
    withdrawTypeId: { type: Sequelize.INTEGER },
    description: { type: Sequelize.STRING },
    isPay: { type: Sequelize.BOOLEAN },
  });
  withdrawRequestModel.associate = models => {
    // associations can be defined here
    withdrawRequestModel.belongsTo(models.profiles, {
      foreignKey: "profileId"
    });
    withdrawRequestModel.belongsTo(models.profileBankAccounts, {
      foreignKey: "profileBankAccountId"
    });
  };
  return withdrawRequestModel;
};
