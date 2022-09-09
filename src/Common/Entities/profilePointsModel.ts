var Sequelize = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  const profilePointModel = sequelize.define("profilePoints", {
    id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
    pointRuleId: { type: Sequelize.INTEGER },
    pointTypeId: { type: Sequelize.INTEGER },
    bookingId: { type: Sequelize.STRING },
    point: { type: Sequelize.INTEGER },
    profileId: { type: Sequelize.INTEGER }
  });
  profilePointModel.associate = models => {
    // associations can be defined here
    profilePointModel.belongsTo(models.profiles, {
      foreignKey: "profileId"
    });
    profilePointModel.belongsTo(models.pointTypes, {
      foreignKey: "pointTypeId"
    });
    profilePointModel.belongsTo(models.pointRules, {
      foreignKey: "pointRuleId"
    });
  };
  return profilePointModel;
};
