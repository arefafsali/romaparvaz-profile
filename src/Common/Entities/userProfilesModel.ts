var Sequelize = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  const userProfileModel = sequelize.define("userProfiles", {
    id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
    profileId: { type: Sequelize.INTEGER },
    userId: { type: Sequelize.INTEGER },
    departmentId: { type: Sequelize.INTEGER },
    roles: { type: Sequelize.ARRAY(Sequelize.INTEGER) },
    isActive: { type: Sequelize.BOOLEAN }
  });
  userProfileModel.associate = models => {
    // associations can be defined here
    userProfileModel.belongsTo(models.users, {
      foreignKey: "userId"
    });
    userProfileModel.belongsTo(models.profiles, {
      foreignKey: "profileId"
    });
    userProfileModel.belongsTo(models.profileDepartments, {
      foreignKey: "departmentId"
    });
  };
  return userProfileModel;
};
