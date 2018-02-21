const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const bcrypt = require('bcrypt');
// create a schema
var userSchema = new Schema({
  firstName: String,
  lastName: String,
  Username: { type: String, required: true, unique: true },
  Password: { type: String, required: true },
  reportAccession: Boolean,
  memberAccession: Boolean,
});


userSchema.pre('save', function (next) {
  var user = this;

  // only hash the password if it has been modified (or is new)
  if (!user.isModified('Password')) return next();

  // generate a salt
  bcrypt.genSalt(10, function (err, salt) {
    if (err) return next(err);

    // hash the password using our new salt
    bcrypt.hash(user.Password, salt, function (err, hash) {
      if (err) return next(err);

      // override the cleartext password with the hashed one
      user.Password = hash;
      next();
    });
  });


});


userSchema.methods.comparePassword = function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.Password)
};


var User = mongoose.model('User', userSchema);

module.exports = User;