require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const admin = require('firebase-admin');
const path = require('path');

// --- FIREBASE ADMIN SETUP ---
const serviceAccountPath = path.join(__dirname, 'serviceAccountKey.json');
let db;

try {
    const serviceAccount = require(serviceAccountPath);
    // prevent multiple initializations
    if (!admin.apps.length) {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
    }
    db = admin.firestore();
    console.log("✅ Connected to Firebase Firestore (Backend)");
} catch (e) {
    console.error("❌ Error initializing Firebase Admin:", e.message);
    process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// --- CLOUDINARY CONFIG ---
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'campus-marketplace',
        allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
    },
});

const upload = multer({ storage: storage });

// --- HELPER: Map Firestore Doc to Object with _id ---
// Frontend expects '_id', Firestore gives 'id'. We map it here.
const mapDoc = (doc) => {
    const data = doc.data();
    // Convert Firestore Timestamp to Date object if needed, or keeping as is (JSON stringifies OK)
    // But for created dates, we might want to ensure they are compatible
    if (data.createdAt && data.createdAt.toDate) data.createdAt = data.createdAt.toDate();
    if (data.lastMessageTimestamp && data.lastMessageTimestamp.toDate) data.lastMessageTimestamp = data.lastMessageTimestamp.toDate();

    return {
        _id: doc.id,
        ...data
    };
};

// --- API ROUTES ---

// 1. Create Listing
app.post('/api/listings', upload.array('images', 5), async (req, res) => {
    try {
        const { title, description, price, category, condition, sellerId, sellerName, sellerPhoto } = req.body;
        const imageUrls = req.files.map(file => file.path);

        const newListing = {
            title,
            description,
            price: Number(price),
            category,
            condition,
            sellerId,
            sellerName,
            sellerPhoto,
            images: imageUrls,
            collegeDomain: 'vjcet.org',
            status: 'active',
            createdAt: new Date() // Firestore Timestamp
        };

        const docRef = await db.collection('listings').add(newListing);
        const savedListing = await docRef.get(); // Get the saved doc to return full object

        res.status(201).json(mapDoc(savedListing));
    } catch (error) {
        console.error('Error creating listing:', error);
        res.status(500).json({ message: error.message });
    }
});

// 2. Get All Listings
app.get('/api/listings', async (req, res) => {
    try {
        const { category, sort } = req.query;
        let query = db.collection('listings').where('status', '==', 'active');

        if (category) {
            query = query.where('category', '==', category);
        }

        // Firestore requires indexes for compound queries (Category + Sort).
        // Since we don't know if User created indexes, we will fetch and SORT IN MEMORY (Node.js)
        // This is safer for small datasets than risking "Index Required" errors.

        const snapshot = await query.get();
        let listings = snapshot.docs.map(mapDoc);

        // Sort in Memory
        if (sort === 'price_low') {
            listings.sort((a, b) => a.price - b.price);
        } else if (sort === 'price_high') {
            listings.sort((a, b) => b.price - a.price);
        } else {
            // Newest ('createdAt' desc)
            listings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        }

        res.json(listings);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// 3. Get Single Listing
app.get('/api/listings/:id', async (req, res) => {
    try {
        const doc = await db.collection('listings').doc(req.params.id).get();
        if (!doc.exists) return res.status(404).json({ message: 'Listing not found' });
        res.json(mapDoc(doc));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// 4. Delete Listing
app.delete('/api/listings/:id', async (req, res) => {
    try {
        await db.collection('listings').doc(req.params.id).delete();
        res.json({ message: 'Deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// --- CHAT SYSTEM (Firestore) ---

// 5. Start/Get Conversation
app.post('/api/conversations', async (req, res) => {
    try {
        const { senderId, senderName, senderPhoto, receiverId, receiverName, receiverPhoto, listingId, listingTitle } = req.body;

        // Challenge: Querying array of objects in Firestore is hard.
        // We will fetch ALL conversations that involve these users and filter manually.
        // Why? Becase 'participants' is [{uid:..}, {uid:..}]. array-contains requires primitive or exact object match.

        // Optimization: Filter by ONE user using a workaround or just Client-Side filter logic here.
        // We'll fetch all docs. For scale < 1000 chats it's fine.

        const snapshot = await db.collection('conversations').get();
        const allConvs = snapshot.docs.map(mapDoc);

        // Find existing conversation between these two
        const existing = allConvs.find(c => {
            const p = c.participants;
            // Check if both UIDs exist in participants array
            return p.some(x => x.uid === senderId) && p.some(x => x.uid === receiverId);
        });

        if (existing) {
            // Update Context if changed
            if (existing.listingId !== listingId) {
                await db.collection('conversations').doc(existing._id).update({
                    listingId,
                    listingTitle
                });
                existing.listingId = listingId;
                existing.listingTitle = listingTitle;
            }
            return res.json(existing);
        }

        // Create New
        const newConv = {
            participants: [
                { uid: senderId, displayName: senderName, photoURL: senderPhoto },
                { uid: receiverId, displayName: receiverName, photoURL: receiverPhoto }
            ],
            listingId,
            listingTitle,
            lastMessage: '',
            lastMessageTimestamp: new Date(),
            lastMessageBy: ''
        };

        const docRef = await db.collection('conversations').add(newConv);
        const saved = await docRef.get();
        res.status(201).json(mapDoc(saved));

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// 6. Get User Conversations
app.get('/api/conversations/:userId', async (req, res) => {
    try {
        // Again, filter in memory due to complex object array structure
        const snapshot = await db.collection('conversations').get();
        let convs = snapshot.docs.map(mapDoc);

        // Filter: where userId is in ANY participant
        convs = convs.filter(c => c.participants.some(p => p.uid === req.params.userId));

        // Sort by Time Desc
        convs.sort((a, b) => new Date(b.lastMessageTimestamp) - new Date(a.lastMessageTimestamp));

        res.json(convs);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// 7. Send Message
app.post('/api/messages', async (req, res) => {
    try {
        const { conversationId, senderId, text } = req.body;

        const newMessage = {
            conversationId,
            senderId,
            text,
            timestamp: new Date()
        };

        const msgRef = await db.collection('messages').add(newMessage);
        const savedMsg = await msgRef.get();

        // Update Conversation Header
        await db.collection('conversations').doc(conversationId).update({
            lastMessage: text,
            lastMessageTimestamp: new Date(),
            lastMessageBy: senderId
        });

        res.status(201).json(mapDoc(savedMsg));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// 8. Get Messages for a Conversation
app.get('/api/messages/:conversationId', async (req, res) => {
    try {
        const snapshot = await db.collection('messages')
            .where('conversationId', '==', req.params.conversationId)
            .get(); // We sort in JS to avoid index issues

        let messages = snapshot.docs.map(mapDoc);
        // Sort Ascending (Oldest first)
        messages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

        res.json(messages);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// 9. Sync User
app.post('/api/users', async (req, res) => {
    try {
        const { uid, email, displayName, photoURL, collegeDomain } = req.body;

        const userRef = db.collection('users').doc(uid);
        const doc = await userRef.get();

        if (doc.exists) {
            // Update existing
            await userRef.update({ email, displayName, photoURL, collegeDomain });
        } else {
            // Create new
            await userRef.set({
                uid, email, displayName, photoURL, collegeDomain,
                createdAt: new Date()
            });
        }

        const updated = await userRef.get();
        res.json(mapDoc(updated));
    } catch (error) {
        console.error("Error syncing user:", error);
        res.status(500).json({ message: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
