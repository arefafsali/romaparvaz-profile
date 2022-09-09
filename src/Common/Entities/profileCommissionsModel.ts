var Sequelize = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  const profileCommissionModel = sequelize.define("profileCommissions", {
    id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
    gatewayId: { type: Sequelize.STRING },
    profileTypeId: { type: Sequelize.INTEGER },
    profileGradeId: { type: Sequelize.INTEGER },
    profileId: { type: Sequelize.INTEGER },
    buyerProfileId: { type: Sequelize.INTEGER },
    commission: { type: Sequelize.JSONB },
    counterCommission: { type: Sequelize.JSONB },
    markup: { type: Sequelize.JSONB },
    isSeller: { type: Sequelize.BOOLEAN },
    includeAirlines: { type: Sequelize.ARRAY(Sequelize.STRING) },
    serviceTypeId: { type: Sequelize.INTEGER },
    isActive: { type: Sequelize.BOOLEAN },
    fromCountryCode: { type: Sequelize.ARRAY(Sequelize.STRING) },
    toCountryCode: { type: Sequelize.ARRAY(Sequelize.STRING) },
    fromCityCode: { type: Sequelize.ARRAY(Sequelize.STRING) },
    toCityCode: { type: Sequelize.ARRAY(Sequelize.STRING) },
    startDate: { type: Sequelize.DATE },
    endDate: { type: Sequelize.DATE },
    ownerCommission: { type: Sequelize.JSONB }
  });
  profileCommissionModel.associate = models => {
    // associations can be defined here
    profileCommissionModel.belongsTo(models.profiles, {
      foreignKey: "profileId"
    });
    profileCommissionModel.belongsTo(models.profiles, {
      foreignKey: "buyerProfileId"
    });
    profileCommissionModel.belongsTo(models.profileTypes, {
      foreignKey: "profileTypeId"
    });
    profileCommissionModel.belongsTo(models.profileGrades, {
      foreignKey: "profileGradeId"
    });
    profileCommissionModel.belongsTo(models.serviceTypes, {
      foreignKey: "serviceTypeId"
    });
  };
  return profileCommissionModel;
};
