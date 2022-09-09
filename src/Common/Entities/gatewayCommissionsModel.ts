var Sequelize = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  const gatewayCommissionsModel = sequelize.define("gatewayCommissions", {
    id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
    gatewayId: { type: Sequelize.STRING },
    includeAirlines: { type: Sequelize.ARRAY(Sequelize.STRING) },
    commission: { type: Sequelize.JSONB },
    domesticCommission: { type: Sequelize.JSONB },
    internationalCommission: { type: Sequelize.JSONB },
    serviceTypeId: { type: Sequelize.INTEGER },
    isActive: { type: Sequelize.BOOLEAN },
    flightCountries: { type: Sequelize.JSONB }
  });
  gatewayCommissionsModel.associate = models => {
    // associations can be defined here
    gatewayCommissionsModel.belongsTo(models.serviceTypes, {
      foreignKey: "serviceTypeId"
    });
  };
  return gatewayCommissionsModel;
};
