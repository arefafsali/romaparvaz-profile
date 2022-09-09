var Sequelize = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  const profileModel = sequelize.define("profiles", {
    id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
    firstName: { type: Sequelize.STRING },
    lastName: { type: Sequelize.STRING },
    displayName: { type: Sequelize.JSONB },
    basicInfo: { type: Sequelize.JSONB },
    isApproved: { type: Sequelize.BOOLEAN },
    isActive: { type: Sequelize.BOOLEAN },
    isLock: { type: Sequelize.BOOLEAN },
    creatorUserId: { type: Sequelize.INTEGER },
    operatorUserId: { type: Sequelize.INTEGER },
    guid: { type: Sequelize.UUID },
    businessTypeId: { type: Sequelize.INTEGER },
    profileTypeId: { type: Sequelize.INTEGER },
    email: { type: Sequelize.STRING },
    addresses: { type: Sequelize.ARRAY(Sequelize.JSONB) },
    profileGradeId: { type: Sequelize.INTEGER },
    invitedProfiles: { type: Sequelize.ARRAY(Sequelize.JSONB) },
    walletAmount: { type: Sequelize.JSONB },
    creditAmount: { type: Sequelize.JSONB },
  });
  profileModel.associate = models => {
    // associations can be defined here
    profileModel.hasMany(models.users, {
      foreignKey: "individualProfileId"
    });
    profileModel.hasMany(models.credits, {
      foreignKey: "profileId"
    });
    profileModel.hasMany(models.employeeAllocations, {
      foreignKey: "profileId"
    });
    profileModel.hasMany(models.employeeAllocations, {
      foreignKey: "ownerProfileId"
    });
    profileModel.hasMany(models.wallets, {
      foreignKey: "profileId"
    });
    profileModel.hasMany(models.userProfiles, {
      foreignKey: "profileId"
    });
    profileModel.belongsTo(models.users, {
      as: "operator",
      foreignKey: "operatorUserId"
    });
    profileModel.belongsTo(models.users, {
      as: "creator",
      foreignKey: "creatorUserId"
    });
    profileModel.belongsTo(models.profileTypes, {
      foreignKey: "profileTypeId"
    });
    profileModel.belongsTo(models.businessTypes, {
      foreignKey: "businessTypeId"
    });
    profileModel.hasMany(models.profileCommissions, {
      foreignKey: "profileId"
    });
    profileModel.belongsTo(models.profileGrades, {
      foreignKey: "profileGradeId"
    });
  };
  return profileModel;
};
