var Sequelize = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  const commissionRulesModel = sequelize.define("commissionRules", {
    id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
    profileTypeId: { type: Sequelize.INTEGER },
    profileGradeId: { type: Sequelize.INTEGER },
    gatewayId: { type: Sequelize.STRING },
    includeAirlines: { type: Sequelize.ARRAY(Sequelize.STRING) },
    commission: { type: Sequelize.JSONB },
    counterCommission: { type: Sequelize.JSONB },
    ownerCommission: { type: Sequelize.JSONB },
    markup: { type: Sequelize.JSONB },
    isActive: { type: Sequelize.BOOLEAN },
    serviceTypeId: { type: Sequelize.INTEGER },
  });
  commissionRulesModel.associate = models => {
    // associations can be defined here
    commissionRulesModel.belongsTo(models.profileTypes, {
      foreignKey: "profileTypeId",
      as: "profileTypes"
    });
    commissionRulesModel.belongsTo(models.profileGrades, {
      foreignKey: "profileGradeId",
      as: "profileGrades"
    });
    commissionRulesModel.belongsTo(models.serviceTypes, {
      foreignKey: "serviceTypeId"
    });
  };
  return commissionRulesModel;
};
