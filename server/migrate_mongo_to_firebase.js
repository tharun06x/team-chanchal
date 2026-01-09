const mongoose = require('mongoose');
const admin = require('firebase-admin');
require('dotenv').config();
const path = require('path');

// --- CONFIGURATION ---
// 1. Ensure you have your 'serviceAccountKey.json' in the same directory (server/)
// 2. Ensure your .env has MONGO_URI

const serviceAccountPath = path.join(__dirname, 'serviceAccountKey.json');

try {
    const serviceAccount = require(serviceAccountPath);
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
    console.log("✅ Firebase Admin Initialized");
} catch (e) {
    console.error("❌ Error initializing Firebase. Did you add 'serviceAccountKey.json'?");
    console.error(e.message);
    process.exit(1);
}

const db = admin.firestore();

// --- MONGO SCHEMAS (Must match index.js) ---
const ListingSchema = new mongoose.Schema({
    title: String, description: String, price: Number, category: String, condition: String,
    images: [String], sellerId: String, sellerName: String, sellerPhoto: String,
    collegeDomain: String, status: String, createdAt: Date
});
const Listing = mongoose.model('Listing', ListingSchema);

const ConversationSchema = new mongoose.Schema({
    participants: [{ uid: String, displayName: String, photoURL: String }],
    listingId: String, listingTitle: String, lastMessage: String,
    lastMessageTimestamp: Date, lastMessageBy: String
});
const Conversation = mongoose.model('Conversation', ConversationSchema);

const MessageSchema = new mongoose.Schema({
    conversationId: String, senderId: String, text: String, timestamp: Date
});
const Message = mongoose.model('Message', MessageSchema);

const UserSchema = new mongoose.Schema({
    uid: String, email: String, displayName: String, photoURL: String, collegeDomain: String, createdAt: Date
});
const User = mongoose.model('User', UserSchema);

// --- MIGRATION LOGIC ---
// Helper to remove undefined values (Firestore crashes on undefined)
const sanitize = (obj) => {
    const newObj = {};
    Object.keys(obj).forEach(key => {
        if (obj[key] === undefined) {
            newObj[key] = null;
        } else {
            newObj[key] = obj[key];
        }
    });
    return newObj;
};

// --- MIGRATION LOGIC ---
async function migrate() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ MongoDB Connected");

        // 1. Migrate Users
        console.log("--- Migrating Users ---");
        const users = await User.find({});
        for (const user of users) {
            try {
                await db.collection('users').doc(user.uid).set(sanitize({
                    uid: user.uid,
                    email: user.email,
                    displayName: user.displayName,
                    photoURL: user.photoURL || '',
                    collegeDomain: user.collegeDomain,
                    createdAt: user.createdAt || new Date()
                }));
                console.log(`Migrated User: ${user.email}`);
            } catch (err) {
                console.error(`Failed to migrate User ${user.uid}:`, err.message);
            }
        }

        // 2. Migrate Listings
        console.log("--- Migrating Listings ---");
        const listings = await Listing.find({});
        for (const item of listings) {
            try {
                await db.collection('listings').doc(item._id.toString()).set(sanitize({
                    title: item.title,
                    description: item.description,
                    price: item.price,
                    category: item.category,
                    condition: item.condition,
                    images: item.images || [],
                    sellerId: item.sellerId,
                    sellerName: item.sellerName,
                    sellerPhoto: item.sellerPhoto || '',
                    collegeDomain: item.collegeDomain || 'vjcet.org',
                    status: item.status || 'active',
                    createdAt: item.createdAt || new Date()
                }));
                console.log(`Migrated Listing: ${item.title}`);
            } catch (err) {
                console.error(`Failed to migrate Listing ${item._id}:`, err.message);
            }
        }

        // 3. Migrate Conversations
        console.log("--- Migrating Conversations ---");
        const conversations = await Conversation.find({});
        for (const conv of conversations) {
            try {
                // Check for valid participants
                if (!conv.participants || !Array.isArray(conv.participants)) {
                    console.warn(`Skipping chat ${conv._id}: No participants`);
                    continue;
                }

                await db.collection('conversations').doc(conv._id.toString()).set(sanitize({
                    participants: conv.participants.map(p => ({
                        uid: p.uid || '',
                        displayName: p.displayName || 'Unknown',
                        photoURL: p.photoURL || ''
                    })),
                    listingId: conv.listingId || '',
                    listingTitle: conv.listingTitle || '',
                    lastMessage: conv.lastMessage || '',
                    lastMessageTimestamp: conv.lastMessageTimestamp || new Date(),
                    lastMessageBy: conv.lastMessageBy || ''
                }));
                console.log(`Migrated Chat: ${conv._id}`);
            } catch (err) {
                console.error(`Failed to migrate Conversation ${conv._id}:`, err.message);
            }
        }

        // 4. Migrate Messages
        console.log("--- Migrating Messages ---");
        const messages = await Message.find({});
        for (const msg of messages) {
            try {
                await db.collection('messages').doc(msg._id.toString()).set(sanitize({
                    conversationId: msg.conversationId,
                    senderId: msg.senderId,
                    text: msg.text,
                    timestamp: msg.timestamp || new Date()
                }));
            } catch (err) {
                console.error(`Failed to migrate Message ${msg._id}:`, err.message);
            }
        }
        console.log(`Migrated ${messages.length} messages.`);

        console.log("🎉 MIGRATION COMPLETE!");
        process.exit(0);

    } catch (error) {
        console.error("Migration Fatal Error:", error);
        process.exit(1);
    }
}

migrate();
