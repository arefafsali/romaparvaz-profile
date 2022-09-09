var Sequelize = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  const serviceTypeModel = sequelize.define("serviceTypes", {
    id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: Sequelize.JSONB },
    code: { type: Sequelize.STRING },
    description: { type: Sequelize.STRING }
  });

  return serviceTypeModel;
};
