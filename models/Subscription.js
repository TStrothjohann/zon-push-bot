module.exports = function(sequelize, DataTypes) {
  return sequelize.define("subscriptions", {
    name: DataTypes.STRING,
    active: DataTypes.BOOLEAN,
    interval: DataTypes.STRING
  })
}