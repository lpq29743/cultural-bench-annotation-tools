// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCNZVb7brU6PTPk_Y-RgIuOmXoxYNKWchY",
    authDomain: "culturalbench.firebaseapp.com",
    projectId: "culturalbench",
    storageBucket: "culturalbench.firebasestorage.app",
    messagingSenderId: "84353630871",
    appId: "1:84353630871:web:d92c7c6a25d239f548dfd2"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Firestore
const db = firebase.firestore();

// Collection names for different task modes
const COLLECTIONS = {
    MODIFICATION: 'cultural_annotations_modified',
    CREATION: 'cultural_annotations_created'
};

// Firebase service functions
const FirebaseService = {
    // Save annotation data to Firestore
    async saveAnnotation(data, collectionName = COLLECTIONS.CREATION) {
        try {
            const docRef = await db.collection(collectionName).add({
                ...data,
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                lastModified: firebase.firestore.FieldValue.serverTimestamp()
            });
            return { success: true, id: docRef.id };
        } catch (error) {
            console.error('Error saving annotation:', error);
            return { success: false, error: error.message };
        }
    },

    // Update existing annotation
    async updateAnnotation(id, data, collectionName = COLLECTIONS.CREATION) {
        try {
            await db.collection(collectionName).doc(id).update({
                ...data,
                lastModified: firebase.firestore.FieldValue.serverTimestamp()
            });
            return { success: true };
        } catch (error) {
            console.error('Error updating annotation:', error);
            return { success: false, error: error.message };
        }
    },

    // Delete annotation
    async deleteAnnotation(id, collectionName = COLLECTIONS.CREATION) {
        try {
            await db.collection(collectionName).doc(id).delete();
            return { success: true };
        } catch (error) {
            console.error('Error deleting annotation:', error);
            return { success: false, error: error.message };
        }
    },

    // Load all annotations from a specific collection
    async loadFromCollection(collectionName) {
        try {
            const snapshot = await db.collection(collectionName)
                .orderBy('timestamp', 'desc')
                .get();
            
            const annotations = [];
            snapshot.forEach(doc => {
                annotations.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            return { success: true, data: annotations };
        } catch (error) {
            console.error('Error loading annotations:', error);
            return { success: false, error: error.message };
        }
    },

    // Save all annotations to a specific collection (batch operation)
    async saveAllToCollection(collectionName, annotations) {
        try {
            const batch = db.batch();
            
            annotations.forEach(annotation => {
                const docRef = db.collection(collectionName).doc();
                batch.set(docRef, {
                    ...annotation,
                    timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                    lastModified: firebase.firestore.FieldValue.serverTimestamp()
                });
            });
            
            await batch.commit();
            return { success: true };
        } catch (error) {
            console.error('Error saving all annotations:', error);
            return { success: false, error: error.message };
        }
    },

    // Clear all annotations from a specific collection
    async clearCollection(collectionName) {
        try {
            const snapshot = await db.collection(collectionName).get();
            const batch = db.batch();
            
            snapshot.docs.forEach(doc => {
                batch.delete(doc.ref);
            });
            
            await batch.commit();
            return { success: true };
        } catch (error) {
            console.error('Error clearing collection:', error);
            return { success: false, error: error.message };
        }
    },

    // Legacy methods for backward compatibility
    async loadAnnotations() {
        return this.loadFromCollection(COLLECTIONS.CREATION);
    },

    async saveAllAnnotations(annotations) {
        return this.saveAllToCollection(COLLECTIONS.CREATION, annotations);
    },

    async clearAllAnnotations() {
        return this.clearCollection(COLLECTIONS.CREATION);
    }
};