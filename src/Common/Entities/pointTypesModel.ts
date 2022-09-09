var Sequelize = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  const pointTypesModel = sequelize.define("pointTypes", {
    id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: Sequelize.JSONB },
    code: { type: Sequelize.STRING },
    description: { type: Sequelize.STRING }
  });
  pointTypesModel.associate = models => {
    // associations can be defined here
  };
  return pointTypesModel;
};
