var Sequelize = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  const profileGradesModel = sequelize.define("profileGrades", {
    id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: Sequelize.JSONB },
    code: { type: Sequelize.STRING },
    description: { type: Sequelize.STRING }
  });
  profileGradesModel.associate = models => {
    // associations can be defined here
    // profileGradesModel.hasMany(models.commissionRules, {
    //   foreignKey: "profileGradeId"
    // });
  };
  return profileGradesModel;
};
