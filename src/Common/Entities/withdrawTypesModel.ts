var Sequelize = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  const withdrawTypeModel = sequelize.define("withdrawTypes", {
    id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: Sequelize.JSONB },
    code: { type: Sequelize.STRING },
    description: { type: Sequelize.STRING }
  });
  withdrawTypeModel.associate = models => {
    // associations can be defined here
    withdrawTypeModel.hasMany(models.pointOfSales, {
      foreignKey: "withdrawTypeId"
    });
  };
  return withdrawTypeModel;
};
