var Sequelize = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  const roleModel = sequelize.define("roles", {
    id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: Sequelize.JSONB },
    code: { type: Sequelize.STRING },
    description: { type: Sequelize.STRING },
    permissions: { type: Sequelize.ARRAY(Sequelize.INTEGER) }
  });

  return roleModel;
};
