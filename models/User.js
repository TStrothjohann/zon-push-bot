module.exports = function(sequelize, DataTypes) {
  return sequelize.define("users", {
    pcuid: { type: DataTypes.STRING,  unique: 'compositeIndex'},
    intent: DataTypes.STRING
  })
}