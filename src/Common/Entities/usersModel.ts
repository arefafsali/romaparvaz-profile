var Sequelize = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  const userModel = sequelize.define("users", {
    id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
    userName: { type: Sequelize.STRING },
    password: { type: Sequelize.STRING },
    secondPassword: { type: Sequelize.STRING },
    guid: { type: Sequelize.UUID },
    isActive: { type: Sequelize.BOOLEAN },
    individualProfileId: { type: Sequelize.INTEGER }
  });
  userModel.associate = models => {
    // associations can be defined here
    userModel.belongsTo(models.profiles, {
      as: "individualProfile",
      foreignKey: "individualProfileId"
    });
    userModel.hasMany(models.userProfiles, {
      foreignKey: "userId"
    });
    userModel.hasMany(models.profiles, {
      foreignKey: "operatorUserId"
    });
    userModel.hasMany(models.profiles, {
      foreignKey: "creatorUserId"
    });
    userModel.hasMany(models.creditExpenses, {
      foreignKey: "userId"
    });
    userModel.hasMany(models.credits, {
      foreignKey: "operatorId"
    });
    userModel.hasMany(models.employeeAllocations, {
      foreignKey: "userId"
    });
    userModel.hasMany(models.wallets, {
      foreignKey: "userId"
    });
  };

  return userModel;
};
