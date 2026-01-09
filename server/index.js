require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
// const path = require('path'); // Not needed for path.join if we don't use local fs
// const fs = require('fs');

// ... (keep earlier code)

// Cloudinary Config
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure Multer Storage for Cloudinary
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'campus-marketplace',
        allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
    },
});

const upload = multer({ storage: storage });

// API Routes

// 1. Create Listing with Images
app.post('/api/listings', upload.array('images', 5), async (req, res) => {
    try {
        const { title, description, price, category, condition, sellerId, sellerName, sellerPhoto } = req.body;

        // With Cloudinary, file.path contains the remote URL
        const imageUrls = req.files.map(file => file.path);

        const newListing = new Listing({
            title,
            description,
            price,
            category,
            condition,
            sellerId,
            sellerName,
            sellerPhoto,
            images: imageUrls
        });

        await newListing.save();
        res.status(201).json(newListing);
    } catch (error) {
        console.error('Error creating listing:', error);
        res.status(500).json({ message: error.message });
    }
});

// 2. Get All Listings
app.get('/api/listings', async (req, res) => {
    try {
        const { category, sort } = req.query;
        let query = { status: 'active' };

        if (category) {
            query.category = category;
        }

        let listingsQuery = Listing.find(query);

        if (sort === 'newest') {
            listingsQuery = listingsQuery.sort({ createdAt: -1 });
        } else if (sort === 'price_low') {
            listingsQuery = listingsQuery.sort({ price: 1 });
        } else if (sort === 'price_high') {
            listingsQuery = listingsQuery.sort({ price: -1 });
        } else {
            listingsQuery = listingsQuery.sort({ createdAt: -1 });
        }

        const listings = await listingsQuery.exec();
        res.json(listings);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// 3. Get Single Listing
app.get('/api/listings/:id', async (req, res) => {
    try {
        const listing = await Listing.findById(req.params.id);
        if (!listing) return res.status(404).json({ message: 'Listing not found' });
        res.json(listing);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// 4. Delete Listing
// 4. Delete Listing
app.delete('/api/listings/:id', async (req, res) => {
    try {
        // In a real app, verify sellerId matches requestor
        await Listing.findByIdAndDelete(req.params.id);
        res.json({ message: 'Deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// --- CHAT SYSTEM ---

// Schemas
const ConversationSchema = new mongoose.Schema({
    participants: [String], // Array of UIDs
    listingId: String,
    listingTitle: String,
    lastMessage: String,
    lastMessageTimestamp: { type: Date, default: Date.now },
    lastMessageBy: String
});

const MessageSchema = new mongoose.Schema({
    conversationId: String,
    senderId: String,
    text: String,
    timestamp: { type: Date, default: Date.now }
});

const Conversation = mongoose.model('Conversation', ConversationSchema);
const Message = mongoose.model('Message', MessageSchema);

// 5. Start/Get Conversation
app.post('/api/conversations', async (req, res) => {
    try {
        const { senderId, receiverId, listingId, listingTitle } = req.body;

        // Check if conversation already exists
        const existingOps = await Conversation.findOne({
            participants: { $all: [senderId, receiverId] },
            listingId: listingId
        });

        if (existingOps) {
            return res.json(existingOps);
        }

        const newConv = new Conversation({
            participants: [senderId, receiverId],
            listingId,
            listingTitle,
            lastMessage: '',
            lastMessageTimestamp: new Date(),
            lastMessageBy: ''
        });

        await newConv.save();
        res.status(201).json(newConv);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// 6. Get User Conversations
app.get('/api/conversations/:userId', async (req, res) => {
    try {
        const convs = await Conversation.find({
            participants: { $in: [req.params.userId] }
        }).sort({ lastMessageTimestamp: -1 });
        res.json(convs);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// 7. Send Message
app.post('/api/messages', async (req, res) => {
    try {
        const { conversationId, senderId, text } = req.body;

        const newMessage = new Message({
            conversationId,
            senderId,
            text
        });

        await newMessage.save();

        // Update conversation last message
        await Conversation.findByIdAndUpdate(conversationId, {
            lastMessage: text,
            lastMessageTimestamp: new Date(),
            lastMessageBy: senderId
        });

        res.status(201).json(newMessage);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// 8. Get Messages for a Conversation
// 8. Get Messages for a Conversation
app.get('/api/messages/:conversationId', async (req, res) => {
    try {
        const messages = await Message.find({
            conversationId: req.params.conversationId
        }).sort({ timestamp: 1 });
        res.json(messages);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// --- USER SYSTEM ---

const UserSchema = new mongoose.Schema({
    uid: { type: String, required: true, unique: true },
    email: String,
    displayName: String,
    photoURL: String,
    collegeDomain: String,
    createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', UserSchema);

// 9. Sync User to MongoDB
app.post('/api/users', async (req, res) => {
    try {
        const { uid, email, displayName, photoURL, collegeDomain } = req.body;
        
        // Upsert: Update if exists, Insert if not
        const user = await User.findOneAndUpdate(
            { uid },
            { 
                uid, 
                email, 
                displayName, 
                photoURL, 
                collegeDomain,
                // Only set createdAt on insert (if not exists)
                $setOnInsert: { createdAt: new Date() }
            },
            { new: true, upsert: true }
        );
        
        res.json(user);
    } catch (error) {
        console.error("Error syncing user:", error);
        res.status(500).json({ message: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
