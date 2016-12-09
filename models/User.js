module.exports = function(sequelize, DataTypes) {
  return sequelize.define("users", {
    pcuid: { type: DataTypes.STRING,  unique: true},
    intent: DataTypes.STRING
  })
}