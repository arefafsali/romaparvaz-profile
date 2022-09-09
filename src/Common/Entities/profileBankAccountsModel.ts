var Sequelize = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  const profileBankAccountModel = sequelize.define("profileBankAccounts", {
    id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
    bankName: { type: Sequelize.STRING },
    branchName: { type: Sequelize.STRING },
    accountNo: { type: Sequelize.STRING },
    cardNo: { type: Sequelize.STRING },
    shebaNo: { type: Sequelize.STRING },
    isDefault: { type: Sequelize.BOOLEAN },
    profileId: { type: Sequelize.INTEGER },
    bankAccountTypeId: { type: Sequelize.STRING },
    countryId: { type: Sequelize.STRING },
  });
  profileBankAccountModel.associate = models => {
    // associations can be defined here
    profileBankAccountModel.belongsTo(models.profiles, {
      foreignKey: "profileId"
    });
  };

  return profileBankAccountModel;
};
