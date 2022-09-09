var Sequelize = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  const businessTypeModel = sequelize.define("businessTypes", {
    id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: Sequelize.JSONB },
    code: { type: Sequelize.STRING },
    description: { type: Sequelize.STRING },
    profileTypeId: { type: Sequelize.INTEGER }
  });
  businessTypeModel.associate = models => {
    // associations can be defined here
    businessTypeModel.hasMany(models.profiles, {
      foreignKey: "businessTypeId"
    });
    businessTypeModel.belongsTo(models.profileTypes, {
      as: "profileType",
      foreignKey: "profileTypeId"
    });
  };
  return businessTypeModel;
};
