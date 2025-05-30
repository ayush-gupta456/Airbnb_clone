import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(cors());

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/airbnbdata', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB Connected to airbnbdata'))
.catch(err => console.log('MongoDB Connection Error:', err));

// Define Schema
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

// Create Model
const Data = mongoose.model('data', dataSchema);

// Routes
app.get('/', (req, res) => {
  res.send('Airbnb Clone API is running');
});

// User Routes
app.post('/api/users/register', (req, res) => {
  // Implementation for user registration
  // For the demo, we'll just send a successful response
  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    token: 'demo-jwt-token',
    user: {
      _id: '123456',
      name: req.body.name,
      email: req.body.email,
      isHost: false
    }
  });
});

app.post('/api/users/login', (req, res) => {
  // Implementation for user login
  // For the demo, we'll just send a successful response
  res.status(200).json({
    success: true,
    message: 'User logged in successfully',
    token: 'demo-jwt-token',
    user: {
      _id: '123456',
      name: 'Demo User',
      email: req.body.email,
      isHost: false
    }
  });
});

// Property Routes
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

// Add new property
app.post('/api/properties', async (req, res) => {
  try {
    const newProperty = new Data(req.body);
    const savedProperty = await newProperty.save();
    res.status(201).json(savedProperty);
  } catch (error) {
    res.status(500).json({ message: 'Error creating property', error: error.message });
  }
});

// Update property
app.put('/api/properties/:id', async (req, res) => {
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

// Delete property
app.delete('/api/properties/:id', async (req, res) => {
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

// Booking Routes
app.post('/api/bookings', (req, res) => {
  // Implementation for creating a booking
  // For the demo, we'll just send a successful response
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

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});