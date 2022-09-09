var Sequelize = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  const permissionModel = sequelize.define("permissions", {
    id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: Sequelize.JSONB },
    code: { type: Sequelize.STRING },
    description: { type: Sequelize.STRING }
  });
  return permissionModel;
};
