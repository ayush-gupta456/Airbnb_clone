import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(cors());

mongoose.connect('mongodb://localhost:27017/airbnbdata', { serverSelectionTimeoutMS: 10000 })
.then(() => console.log('MongoDB Connected to airbnbdata'))
.catch(err => console.log('MongoDB Connection Error:', err));

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    match: [/.+\@.+\..+/, 'Please fill a valid email address']
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  isHost: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);

const dataSchema = new mongoose.Schema({
  title: String,
  description: String,
  type: String,
  location: String,
  price: Number,
  images: [String],
  bedrooms: Number,
  beds: Number,
  bathrooms: Number,
  maxGuests: Number,
  amenities: [String],
  rating: Number,
  host: {
    _id: String,
    name: String,
    email: String,
    avatar: String,
    isSuperhost: Boolean,
    responseRate: Number,
    responseTime: String,
    joinedDate: String
  },
  reviews: [{
    _id: String,
    user: {
      _id: String,
      name: String,
      avatar: String
    },
    rating: Number,
    text: String,
    date: String
  }],
  availableFrom: String,
  availableTo: String,
  isBooked: Boolean
});

const Data = mongoose.model('data', dataSchema);

import { protect } from './middleware/authMiddleware.js';

app.get('/', (req, res) => {
  res.send('Airbnb Clone API is running');
});

const generateToken = (user) => {
  return jwt.sign({ id: user._id, email: user.email, isHost: user.isHost }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
};

app.post('/api/users/register', async (req, res) => {
  const { name, email, password, isHost } = req.body;

  try {
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    user = new User({
      name,
      email,
      password,
      isHost: isHost || false
    });

    await user.save();

    const token = generateToken(user);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        isHost: user.isHost
      }
    });
  } catch (error) {
    console.error('Register Error:', error.message);
    res.status(500).json({ success: false, message: 'Server error during registration', error: error.message });
  }
});

app.post('/api/users/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = generateToken(user);

    res.status(200).json({
      success: true,
      message: 'User logged in successfully',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        isHost: user.isHost
      }
    });
  } catch (error) {
    console.error('Login Error:', error.message);
    res.status(500).json({ success: false, message: 'Server error during login', error: error.message });
  }
});

app.get('/api/properties', async (req, res) => {
  try {
    const properties = await Data.find();
    res.status(200).json(properties);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching properties', error: error.message });
  }
});

app.get('/api/properties/:id', async (req, res) => {
  try {
    const property = await Data.findById(req.params.id);
    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }
    res.status(200).json(property);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching property', error: error.message });
  }
});

app.post('/api/properties', protect, async (req, res) => {
  try {
    const newProperty = new Data(req.body);
    const savedProperty = await newProperty.save();
    res.status(201).json(savedProperty);
  } catch (error) {
    res.status(500).json({ message: 'Error creating property', error: error.message });
  }
});

app.put('/api/properties/:id', protect, async (req, res) => {
  try {
    const updatedProperty = await Data.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updatedProperty) {
      return res.status(404).json({ message: 'Property not found' });
    }
    res.status(200).json(updatedProperty);
  } catch (error) {
    res.status(500).json({ message: 'Error updating property', error: error.message });
  }
});

app.delete('/api/properties/:id', protect, async (req, res) => {
  try {
    const deletedProperty = await Data.findByIdAndDelete(req.params.id);
    if (!deletedProperty) {
      return res.status(404).json({ message: 'Property not found' });
    }
    res.status(200).json({ message: 'Property deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting property', error: error.message });
  }
});

app.post('/api/bookings', protect, (req, res) => {
  res.status(201).json({
    success: true,
    message: 'Booking created successfully',
    booking: {
      _id: 'booking123',
      property: req.body.propertyId,
      user: '123456',
      checkIn: req.body.checkIn,
      checkOut: req.body.checkOut,
      guests: req.body.guests,
      totalPrice: req.body.totalPrice,
      status: 'confirmed',
      createdAt: new Date()
    }
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});