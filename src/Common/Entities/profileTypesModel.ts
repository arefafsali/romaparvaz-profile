var Sequelize = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  const profileTypeModel = sequelize.define("profileTypes", {
    id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: Sequelize.JSONB },
    code: { type: Sequelize.STRING },
    description: { type: Sequelize.STRING },
    isShow: { type: Sequelize.BOOLEAN }
  });
  profileTypeModel.associate = models => {
    // associations can be defined here
    profileTypeModel.hasMany(models.profiles, {
      foreignKey: "profileTypeId"
    });
    profileTypeModel.hasMany(models.businessTypes, {
      foreignKey: "profileTypeId"
    });
  };
  return profileTypeModel;
};
