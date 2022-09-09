var Sequelize = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  const profileRelationModel = sequelize.define("profileRelations", {
    id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
    profileId: { type: Sequelize.INTEGER },
    relationTypeId: { type: Sequelize.INTEGER }
  });
  return profileRelationModel;
};
