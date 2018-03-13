const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const bcrypt = require('bcrypt');
// create a schema
var userSchema = new Schema({
  firstname: String,
  lastname: String,
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  status: String,
});


userSchema.pre('save', function (next) {
  var user = this;
  console.log("workkkkkk thissss")
  // only hash the password if it has been modified (or is new)
  if (!user.isModified('password')) return next();

  // generate a salt
  bcrypt.genSalt(10, function (err, salt) {
    if (err) return next(err);

    // hash the password using our new salt
    bcrypt.hash(user.password, salt, function (err, hash) {
      if (err) return next(err);

      // override the cleartext password with the hashed one
      user.password = hash;
      next();
    });
  });


});


userSchema.methods.comparePassword = function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.Password)
};


var User = mongoose.model('User', userSchema);

module.exports = User;