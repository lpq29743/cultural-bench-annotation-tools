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

// Initialize Firebase Storage
const storage = firebase.storage();

// Collection names for different task modes and user management
const COLLECTIONS = {
    MODIFICATION: 'cultural_annotations_modified',
    CREATION: 'cultural_annotations_created',
    USERS: 'annotators',
    ASSIGNMENTS: 'task_assignments',
    SESSIONS: 'user_sessions',
    ALLOWED_USERS: 'allowed_users' // New collection for user permissions
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
    },

    // User Management Methods
    async createUser(userData) {
        try {
            const userDoc = {
                ...userData,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                lastActive: firebase.firestore.FieldValue.serverTimestamp(),
                isActive: true
            };
            
            const docRef = await db.collection(COLLECTIONS.USERS).add(userDoc);
            return { success: true, id: docRef.id, user: userDoc };
        } catch (error) {
            console.error('Error creating user:', error);
            return { success: false, error: error.message };
        }
    },

    async getUserByEmail(email) {
        try {
            const snapshot = await db.collection(COLLECTIONS.USERS)
                .where('email', '==', email)
                .limit(1)
                .get();
            
            if (snapshot.empty) {
                return { success: false, error: 'User not found' };
            }
            
            const doc = snapshot.docs[0];
            return { 
                success: true, 
                user: { id: doc.id, ...doc.data() }
            };
        } catch (error) {
            console.error('Error getting user:', error);
            return { success: false, error: error.message };
        }
    },

    async getUserByUserId(userId) {
        try {
            const snapshot = await db.collection(COLLECTIONS.USERS)
                .where('userId', '==', userId)
                .limit(1)
                .get();
            
            if (snapshot.empty) {
                return { success: false, error: 'User not found' };
            }
            
            const doc = snapshot.docs[0];
            return { 
                success: true, 
                user: { id: doc.id, ...doc.data() }
            };
        } catch (error) {
            console.error('Error getting user by userId:', error);
            return { success: false, error: error.message };
        }
    },

    async getUserById(id) {
        try {
            const doc = await db.collection(COLLECTIONS.USERS).doc(id).get();
            
            if (!doc.exists) {
                return { success: false, error: 'User not found' };
            }
            
            return { 
                success: true, 
                user: { id: doc.id, ...doc.data() }
            };
        } catch (error) {
            console.error('Error getting user by id:', error);
            return { success: false, error: error.message };
        }
    },

    // User validation using Firestore database instead of Storage
    async loadAllowedUsers() {
        try {
            const snapshot = await db.collection(COLLECTIONS.ALLOWED_USERS).get();
            
            const users = [];
            snapshot.forEach(doc => {
                const data = doc.data();
                users.push({
                    userId: data.userId,
                    role: data.role,
                    accessibleCsvs: data.accessibleCsvs || ['all']
                });
            });
            
            return { success: true, users };
        } catch (error) {
            console.error('Error loading allowed users from Firestore:', error);
            // If collection doesn't exist or error occurs, return empty array (allow all users)
            return { success: false, error: error.message, users: [] };
        }
    },

    // Add allowed user to Firestore
    async addAllowedUser(userId, role, accessibleCsvs = ['all']) {
        try {
            const userDoc = {
                userId: userId,
                role: role,
                accessibleCsvs: accessibleCsvs,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                isActive: true
            };
            
            const docRef = await db.collection(COLLECTIONS.ALLOWED_USERS).add(userDoc);
            return { success: true, id: docRef.id };
        } catch (error) {
            console.error('Error adding allowed user:', error);
            return { success: false, error: error.message };
        }
    },

    // Update user information
    async updateUser(id, userData) {
        try {
            await db.collection(COLLECTIONS.USERS).doc(id).update({
                ...userData,
                lastModified: firebase.firestore.FieldValue.serverTimestamp()
            });
            return { success: true };
        } catch (error) {
            console.error('Error updating user:', error);
            return { success: false, error: error.message };
        }
    },

    // Get all users
    async getAllUsers() {
        try {
            const snapshot = await db.collection(COLLECTIONS.USERS)
                .orderBy('createdAt', 'desc')
                .get();
            
            const users = [];
            snapshot.forEach(doc => {
                users.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            return { success: true, users };
        } catch (error) {
            console.error('Error getting all users:', error);
            return { success: false, error: error.message };
        }
    },

    // Task Assignment Methods
    async createAssignment(assignmentData) {
        try {
            const assignment = {
                ...assignmentData,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                status: 'active',
                progress: {
                    completed: 0,
                    total: assignmentData.itemCount || 0,
                    percentage: 0
                }
            };
            
            const docRef = await db.collection(COLLECTIONS.ASSIGNMENTS).add(assignment);
            return { success: true, id: docRef.id, assignment };
        } catch (error) {
            console.error('Error creating assignment:', error);
            return { success: false, error: error.message };
        }
    },

    async updateAssignment(id, assignmentData) {
        try {
            await db.collection(COLLECTIONS.ASSIGNMENTS).doc(id).update({
                ...assignmentData,
                lastModified: firebase.firestore.FieldValue.serverTimestamp()
            });
            return { success: true };
        } catch (error) {
            console.error('Error updating assignment:', error);
            return { success: false, error: error.message };
        }
    },

    async deleteAssignment(id) {
        try {
            await db.collection(COLLECTIONS.ASSIGNMENTS).doc(id).delete();
            return { success: true };
        } catch (error) {
            console.error('Error deleting assignment:', error);
            return { success: false, error: error.message };
        }
    },

    async getAllAssignments() {
        try {
            const snapshot = await db.collection(COLLECTIONS.ASSIGNMENTS)
                .orderBy('createdAt', 'desc')
                .get();
            
            const assignments = [];
            snapshot.forEach(doc => {
                assignments.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            return { success: true, assignments };
        } catch (error) {
            console.error('Error getting assignments:', error);
            return { success: false, error: error.message };
        }
    },

    async getAssignmentsByAnnotator(annotatorId) {
        try {
            const snapshot = await db.collection(COLLECTIONS.ASSIGNMENTS)
                .where('annotatorId', '==', annotatorId)
                .orderBy('createdAt', 'desc')
                .get();
            
            const assignments = [];
            snapshot.forEach(doc => {
                assignments.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            return { success: true, assignments };
        } catch (error) {
            console.error('Error getting assignments by annotator:', error);
            return { success: false, error: error.message };
        }
    },

    // Session Management
    async createSession(userId, sessionData) {
        try {
            const session = {
                userId: userId,
                ...sessionData,
                startTime: firebase.firestore.FieldValue.serverTimestamp(),
                isActive: true
            };
            
            const docRef = await db.collection(COLLECTIONS.SESSIONS).add(session);
            return { success: true, id: docRef.id, session };
        } catch (error) {
            console.error('Error creating session:', error);
            return { success: false, error: error.message };
        }
    },

    async endSession(sessionId) {
        try {
            await db.collection(COLLECTIONS.SESSIONS).doc(sessionId).update({
                endTime: firebase.firestore.FieldValue.serverTimestamp(),
                isActive: false
            });
            return { success: true };
        } catch (error) {
            console.error('Error ending session:', error);
            return { success: false, error: error.message };
        }
    },

    async getActiveSessions() {
        try {
            const snapshot = await db.collection(COLLECTIONS.SESSIONS)
                .where('isActive', '==', true)
                .orderBy('startTime', 'desc')
                .get();
            
            const sessions = [];
            snapshot.forEach(doc => {
                sessions.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            return { success: true, sessions };
        } catch (error) {
            console.error('Error getting active sessions:', error);
            return { success: false, error: error.message };
        }
    },

    // Statistics and Reporting
    async getAnnotationStats(collectionName, annotatorId = null) {
        try {
            let query = db.collection(collectionName);
            
            if (annotatorId) {
                query = query.where('annotatorId', '==', annotatorId);
            }
            
            const snapshot = await query.get();
            
            const stats = {
                total: 0,
                accepted: 0,
                revised: 0,
                rejected: 0,
                pending: 0
            };
            
            snapshot.forEach(doc => {
                const data = doc.data();
                stats.total++;
                
                if (data.annotationStatus) {
                    stats[data.annotationStatus]++;
                } else {
                    stats.pending++;
                }
            });
            
            return { success: true, stats };
        } catch (error) {
            console.error('Error getting annotation stats:', error);
            return { success: false, error: error.message };
        }
    },

    // Utility Methods
    async testConnection() {
        try {
            // Test basic Firestore connectivity
            await db.collection('connection_test').limit(1).get();
            return { success: true, message: 'Firebase connection successful' };
        } catch (error) {
            console.error('Firebase connection test failed:', error);
            return { success: false, error: error.message };
        }
    },

    // Get collection reference
    getCollection(collectionName) {
        return db.collection(collectionName);
    },

    // Get database reference
    getDatabase() {
        return db;
    }
};
