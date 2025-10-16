// Firebase configuration
const firebaseConfig = {
    // 请替换为您的实际Firebase项目配置
    // 从Firebase Console -> Project Settings -> General -> Your apps -> Web app config获取
    apiKey: "your-actual-api-key-here",
    authDomain: "your-project-id.firebaseapp.com", 
    projectId: "your-actual-project-id",
    storageBucket: "your-project-id.appspot.com",
    messagingSenderId: "your-actual-sender-id",
    appId: "your-actual-app-id"
    
    // 示例配置（请勿直接使用）：
    // apiKey: "AIzaSyC...",
    // authDomain: "cultural-annotation-tool.firebaseapp.com",
    // projectId: "cultural-annotation-tool", 
    // storageBucket: "cultural-annotation-tool.appspot.com",
    // messagingSenderId: "123456789",
    // appId: "1:123456789:web:abcdef123456"
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