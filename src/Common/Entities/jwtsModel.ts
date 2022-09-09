var Sequelize = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  const jwtModel = sequelize.define("jwts", {
    id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
    guid: { type: Sequelize.UUID },
    expireDate: { type: Sequelize.DATE },
    userId: { type: Sequelize.INTEGER }
  });

  return jwtModel;
};
