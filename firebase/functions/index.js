const { onSchedule } = require("firebase-functions/v2/scheduler");
const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { logger } = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.firestore();

// 1. Auto-expire listings after 30 days
// Run every day at midnight
exports.checkListingExpiry = onSchedule("every day 00:00", async (event) => {
    const now = admin.firestore.Timestamp.now();
    const snapshot = await db.collection("listings")
        .where("status", "==", "active")
        .where("expiresAt", "<", now)
        .get();

    const batch = db.batch();
    snapshot.docs.forEach((doc) => {
        batch.update(doc.ref, { status: "expired" });
    });

    await batch.commit();
    logger.log(`Expired ${snapshot.size} listings.`);
});

// 2. Send Notification on New Message
exports.onMessageCreated = onDocumentCreated("conversations/{conversationId}/messages/{messageId}", async (event) => {
    const snapshot = event.data;
    if (!snapshot) {
        return;
    }

    const message = snapshot.data();
    const conversationId = event.params.conversationId;
    const conversationRef = db.doc(`conversations/${conversationId}`);
    const conversationDoc = await conversationRef.get();

    if (!conversationDoc.exists) {
        logger.error("Conversation not found");
        return;
    }

    const conversation = conversationDoc.data();
    const receiverId = conversation.participants.find(uid => uid !== message.senderId);

    // In a real app, you would fetch the receiver's FCM token from their profile
    // const userRef = db.doc(`users/${receiverId}`);
    // const userDoc = await userRef.get();
    // const token = userDoc.data()?.fcmToken;

    // For MVP, we will just update the conversation with last message
    // Notifications require FCM token management on client side

    await conversationRef.update({
        lastMessage: message.text,
        lastMessageTimestamp: message.timestamp,
        lastMessageBy: message.senderId
    });
});
