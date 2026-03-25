const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Regex rules
const nameRegex = /^[A-Za-z\s]{2,50}$/;
const emailRegex = /^[a-zA-Z0-9._%+-]+@(gmail|yahoo)\.com$/;

const userSchema = new mongoose.Schema(
{
  name: {
    type: String,
    required: true,
    trim: true,
    validate: {
      validator: function (value) {
        return nameRegex.test(value);
      },
      message: "Name must contain only letters and spaces."
    }
  },

  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    validate: {
      validator: function (value) {
        return emailRegex.test(value);
      },
      message: "Only Gmail or Yahoo email addresses are allowed."
    }
  },

  password: {
    type: String,
    required: true,
    minlength: 6
  },

  role: {
    type: String,
    required: true,
    enum: ['student', 'team', 'admin']
  },

  // For Team & Admin
  phone: {
    type: String,
    validate: {
      validator: function (value) {
        if (this.role === 'team' || this.role === 'admin') {
          return /^[0-9]{10}$/.test(value);
        }
        return true;
      },
      message: "Phone number must be 10 digits."
    }
  },

  // Only for Team
  team: {
    type: String,
    required: function () {
      return this.role === 'team';
    }
  },

  teamRole: {
    type: String,
    required: function () {
      return this.role === 'team';
    }
  },

  // For Team, Faculty & Admin - Photo Upload
  photo: {
    type: String, // Base64 encoded photo or photo URL
    default: null,
  },

  photoMime: {
    type: String, // MIME type (image/png, image/jpeg, etc.)
    default: null,
  },

  // Social Media Links - For Team members
  linkedin: {
    type: String,
    trim: true,
    validate: {
      validator: function (value) {
        if (value) {
          return /^[a-zA-Z0-9\-._~:/?#\[\]@!$&'()*+,;=%]*linkedin/.test(value) || value.length <= 200;
        }
        return true;
      },
      message: "Invalid LinkedIn URL or ID."
    }
  },

  github: {
    type: String,
    trim: true,
    validate: {
      validator: function (value) {
        if (value) {
          return /^[a-zA-Z0-9\-._~:/?#\[\]@!$&'()*+,;=%]*github|^[a-zA-Z0-9\-_.]*$/.test(value) || value.length <= 200;
        }
        return true;
      },
      message: "Invalid GitHub URL or username."
    }
  },

},
{ timestamps: true }
);


// 🔐 Hash password before saving
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});



// 🔐 Method to compare password during login
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
