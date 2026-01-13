import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a name'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters']
    },
    email: {
      type: String,
      required: [true, 'Please provide an email'],
      unique: true,
      lowercase: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email'
      ],
      index: true
    },
    passwordHash: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: 6,
      select: false // Don't return password in queries by default
    },
    userType: {
      type: String,
      enum: ['user', 'driver'],
      default: 'user'
    },
    vehicleType: {
      type: String,
      enum: ['bike', 'scooter', 'auto', 'car', 'cycle', 'van'],
      default: 'bike'
    },
    // Detailed vehicle information for drivers
    vehicleDetails: {
      registrationNumber: {
        type: String,
        default: null,
        uppercase: true
      },
      make: {
        type: String,
        default: null
      },
      model: {
        type: String,
        default: null
      },
      year: {
        type: Number,
        default: null
      },
      color: {
        type: String,
        default: null
      },
      fuelType: {
        type: String,
        enum: ['petrol', 'diesel', 'electric', 'hybrid', 'cng', 'lpg', null],
        default: null
      },
      seatingCapacity: {
        type: Number,
        default: null,
        min: 1,
        max: 8
      },
      licensePlateImage: {
        type: String,
        default: null
      },
      rcNumber: {
        type: String,
        default: null
      },
      insuranceExpiry: {
        type: Date,
        default: null
      },
      pollutionCertificateExpiry: {
        type: Date,
        default: null
      },
      verificationStatus: {
        type: String,
        enum: ['pending', 'verified', 'rejected'],
        default: 'pending'
      },
      verificationDate: {
        type: Date,
        default: null
      }
    },
    profileImage: {
      type: String,
      default: null
    },
    phoneNumber: {
      type: String,
      default: null
    },
    // Driver-specific fields
    isOnline: {
      type: Boolean,
      default: false
    },
    currentLocation: {
      coordinates: {
        lat: Number,
        lng: Number
      },
      address: String,
      updatedAt: Date
    },
    activeRoute: {
      origin: {
        name: String,
        coordinates: {
          lat: Number,
          lng: Number
        }
      },
      destination: {
        name: String,
        coordinates: {
          lat: Number,
          lng: Number
        }
      },
      price: {
        type: Number,
        min: 0,
        default: 0
      },
      waypoints: [{
        lat: Number,
        lng: Number
      }],
      updatedAt: Date
    },
    driverStats: {
      totalTrips: {
        type: Number,
        default: 0
      },
      totalEarnings: {
        type: Number,
        default: 0
      },
      totalDistance: {
        type: Number,
        default: 0 // in km
      },
      averageRating: {
        type: Number,
        default: 5
      },
      carbonSaved: {
        type: Number,
        default: 0 // in kg CO2
      }
    },
    notifications: [{
      type: {
        type: String,
        enum: ['trip_cancelled', 'trip_matched', 'payment_received', 'system_alert'],
        required: true
      },
      tripId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Trip'
      },
      message: {
        type: String,
        required: true
      },
      reason: {
        type: String,
        default: null
      },
      read: {
        type: Boolean,
        default: false
      },
      createdAt: {
        type: Date,
        default: Date.now
      }
    }],
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  // Only hash if password is modified
  if (!this.isModified('passwordHash')) {
    return next();
  }

  try {
    const saltRounds = 10;
    this.passwordHash = await bcrypt.hash(this.passwordHash, saltRounds);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.passwordHash);
  } catch (error) {
    throw new Error('Password comparison failed');
  }
};

// Remove password from response
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.passwordHash;
  // Ensure _id is included as a string
  if (obj._id) {
    obj._id = obj._id.toString();
  }
  return obj;
};

const User = mongoose.model('User', userSchema);

export default User;
