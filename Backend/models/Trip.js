import mongoose from 'mongoose';

const tripSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required']
    },
    origin: {
      name: {
        type: String,
        required: true
      },
      coordinates: {
        lng: {
          type: Number,
          required: true
        },
        lat: {
          type: Number,
          required: true
        }
      }
    },
    destination: {
      name: {
        type: String,
        required: true
      },
      coordinates: {
        lng: {
          type: Number,
          required: true
        },
        lat: {
          type: Number,
          required: true
        }
      }
    },
    selectedRoute: {
      id: String,
      distance: Number, // in meters
      duration: Number, // in seconds
      emission: Number, // in kg CO2
      ecoScore: Number,
      mode: String,
      profile: String,
      geometry: Object, // GeoJSON geometry
      instructions: Array
    },
    alternativeRoutes: [
      {
        id: String,
        distance: Number,
        duration: Number,
        emission: Number,
        ecoScore: Number,
        mode: String,
        profile: String
      }
    ],
    emissionSavings: {
      amount: Number, // kg CO2 saved
      percentage: Number // percentage saved
    },
    status: {
      type: String,
      enum: ['planned', 'in-progress', 'completed', 'cancelled'],
      default: 'planned'
    },
    completedAt: {
      type: Date,
      default: null
    },
    // Driver matching fields
    matchedDriverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    driverResponse: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending'
    },
    userResponse: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending'
    },
    matchedAt: {
      type: Date,
      default: null
    },
    // Driver pricing for matched ride
    driverPrice: {
      type: Number,
      min: 0,
      default: null
    },
    // User ride request fields
    isRideRequest: {
      type: Boolean,
      default: false // true when user is looking for a driver/ride
    },
    requestedAt: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
);

// Index for faster queries
tripSchema.index({ userId: 1, createdAt: -1 });

const Trip = mongoose.model('Trip', tripSchema);

export default Trip;
