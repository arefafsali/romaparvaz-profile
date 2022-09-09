var Sequelize = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  const profileDepartmentsModel = sequelize.define("profileDepartments", {
    id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: Sequelize.STRING },
    code: { type: Sequelize.STRING },
    profileId: { type: Sequelize.INTEGER }
  });
  profileDepartmentsModel.associate = models => {
    profileDepartmentsModel.belongsTo(models.profiles, {
      foreignKey: "profileId"
    });
  };
  return profileDepartmentsModel;
};
