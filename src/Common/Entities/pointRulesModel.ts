var Sequelize = require("sequelize");
module.exports = (sequelize, DataTypes) => {
    const pointRulesModel = sequelize.define("pointRules", {
        id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
        pointTypeId: { type: Sequelize.INTEGER },
        point: { type: Sequelize.FLOAT },
        startRange: { type: Sequelize.FLOAT },
        endRange: { type: Sequelize.FLOAT },
        isActive: { type: Sequelize.BOOLEAN },
        isPercent: { type: Sequelize.BOOLEAN }
    });
    pointRulesModel.associate = models => {
        pointRulesModel.belongsTo(models.pointTypes, {
            foreignKey: "pointTypeId"
        });
    };
    return pointRulesModel;
};
