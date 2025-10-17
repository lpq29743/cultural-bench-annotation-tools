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

// Initialize Firebase Storage (commented out - not used in this project)
// const storage = firebase.storage();

// Collection names for different task modes and user management
const COLLECTIONS = {
    USERS: 'users',
    ANNOTATED_DATA: 'annotated_data',
    CREATED_DATA: 'created_data',
    MODIFIED_DATA: 'modified_data',
    CULTURAL_TOPICS: 'cultural_topics',
    // Legacy collections for backward compatibility
    MODIFICATION: 'modified_data',
    CREATION: 'created_data',
    ASSIGNMENTS: 'task_assignments',
    SESSIONS: 'user_sessions',
    USERS: 'users' // Use users collection for permissions
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

    // Get all created data (annotated data)
    async getAllCreatedData() {
        try {
            return await this.loadFromCollection(COLLECTIONS.CREATED_DATA);
        } catch (error) {
            console.error('Error getting all created data:', error);
            return { success: false, error: error.message };
        }
    },

    // Get all annotated data (alias for getAllCreatedData for backward compatibility)
    async getAllAnnotatedData() {
        try {
            return await this.loadFromCollection(COLLECTIONS.ANNOTATED_DATA);
        } catch (error) {
            console.error('Error getting all annotated data:', error);
            return { success: false, error: error.message };
        }
    },

    // Get all modified data
    async getAllModifiedData() {
        try {
            return await this.loadFromCollection(COLLECTIONS.MODIFIED_DATA);
        } catch (error) {
            console.error('Error getting all modified data:', error);
            return { success: false, error: error.message };
        }
    },

    // User validation using Firestore database instead of Storage
    async loadAllowedUsers() {
        try {
            const snapshot = await db.collection(COLLECTIONS.USERS).get();
            
            const users = [];
            snapshot.forEach(doc => {
                const data = doc.data();
                users.push({
                    userId: data.userId,
                    role: data.role,
                    language_region: data.language_region || ['all'],
                    canModifyData: data.canModifyData || false // Include data modification permission
                });
            });
            
            return { success: true, users };
        } catch (error) {
            console.error('Error loading allowed users from Firestore:', error);
            // If collection doesn't exist or error occurs, return empty array (allow all users)
            return { success: false, error: error.message, users: [] };
        }
    },

    async validateUserWithPermissions(userId) {
        try {
            const result = await this.loadAllowedUsers();
            
            // If no validation file exists, create a basic user
            if (!result.success || result.users.length === 0) {
                return { 
                    success: true, 
                    allowed: true,
                    user: {
                        userId,
                        role: 'annotator',
                        language_region: ['all'],
                        canModifyData: false
                    },
                    userInfo: {
                        userId,
                        role: 'annotator',
                        language_region: ['all'],
                        canModifyData: false
                    }
                };
            }
            
            // Find user in the allowed list
            const userInfo = result.users.find(user => user.userId === userId);
            
            if (!userInfo) {
                return { 
                    success: false, 
                    allowed: false,
                    error: 'User ID not found in allowed list',
                    message: 'Access denied: User ID not authorized for this system'
                };
            }
            
            return { 
                success: true, 
                allowed: true,
                user: userInfo,
                userInfo: userInfo // For backward compatibility
            };
        } catch (error) {
            console.error('Error validating user:', error);
            return { success: false, allowed: false, error: error.message };
        }
    },

    // Add allowed user to Firestore
    async addAllowedUser(userId, role, language_region = ['all'], canModifyData = false) {
        try {
            const userDoc = {
                userId: userId,
                role: role,
                language_region: language_region,
                canModifyData: canModifyData, // New field to control data modification permissions
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                isActive: true
            };
            
            const docRef = await db.collection(COLLECTIONS.USERS).add(userDoc);
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
                total: snapshot.size,
                byAnnotator: {},
                byDate: {},
                byLanguage: {}
            };
            
            snapshot.forEach(doc => {
                const data = doc.data();
                
                // Count by annotator
                if (data.annotatorId) {
                    stats.byAnnotator[data.annotatorId] = (stats.byAnnotator[data.annotatorId] || 0) + 1;
                }
                
                // Count by date
                if (data.timestamp) {
                    const date = data.timestamp.toDate().toDateString();
                    stats.byDate[date] = (stats.byDate[date] || 0) + 1;
                }
                
                // Count by language
                if (data.language) {
                    stats.byLanguage[data.language] = (stats.byLanguage[data.language] || 0) + 1;
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
    },

    // Batch add multiple allowed users
    async batchAddAllowedUsers(usersData) {
        try {
            const batch = db.batch();
            
            usersData.forEach(userData => {
                const docRef = db.collection(COLLECTIONS.USERS).doc();
                batch.set(docRef, {
                    userId: userData.userId.trim(),
                    role: userData.role.trim(),
                    language_region: userData.language_region || ['all'],
                    canModifyData: userData.canModifyData || false, // Include data modification permission
                    createdAt: new Date(),
                    isActive: true
                });
            });
            
            await batch.commit();
            return { success: true };
        } catch (error) {
            console.error('Error batch adding allowed users:', error);
            return { success: false, error: error.message };
        }
    },

    // Enhanced validateUserWithPermissions method that returns user object
    async validateUserWithPermissions(userId) {
        try {
            const result = await this.loadAllowedUsers();
            
            // If no validation file exists, create a basic user
            if (!result.success || result.users.length === 0) {
                return { 
                    success: true, 
                    allowed: true,
                    user: {
                        userId,
                        role: 'annotator',
                        language_region: ['all'],
                        canModifyData: false
                    },
                    userInfo: {
                        userId,
                        role: 'annotator',
                        language_region: ['all'],
                        canModifyData: false
                    }
                };
            }
            
            // Find user in the allowed list
            const userInfo = result.users.find(user => user.userId === userId);
            
            if (!userInfo) {
                return { 
                    success: false, 
                    allowed: false,
                    error: 'User ID not found in allowed list',
                    message: 'Access denied: User ID not authorized for this system'
                };
            }
            
            return { 
                success: true, 
                allowed: true,
                user: userInfo,
                userInfo: userInfo // For backward compatibility
            };
        } catch (error) {
            console.error('Error validating user:', error);
            return { success: false, allowed: false, error: error.message };
        }
    },

    // Get user by userId with validation
    async getUserByUserIdWithValidation(userId, requestedRole = null) {
        try {
            // First validate the user with permissions
            const validation = await this.validateUserWithPermissions(userId, requestedRole);
            
            if (!validation.success) {
                return { success: false, error: validation.error };
            }
            
            if (!validation.allowed) {
                return { success: false, error: validation.message };
            }
            
            return { 
                success: true, 
                user: validation.userInfo
            };
        } catch (error) {
            console.error('Error getting user by userId with validation:', error);
            return { success: false, error: error.message };
        }
    },

    // Data Modification Methods - Load user's annotation data based on accessible CSVs
    async loadUserAnnotationData(userId, language_region = ['all']) {
        try {
            let query = db.collection(COLLECTIONS.MODIFICATION);
            
            // If user has specific CSV access restrictions, filter by those
            if (language_region && !language_region.includes('all')) {
                query = query.where('language_region', 'in', language_region);
            }
            
            // Also filter by assigned user if needed
            // query = query.where('assignedTo', '==', userId);
            
            const snapshot = await query.orderBy('timestamp', 'desc').get();
            
            const annotations = [];
            snapshot.forEach(doc => {
                annotations.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            return { success: true, data: annotations };
        } catch (error) {
            console.error('Error loading user annotation data:', error);
            return { success: false, error: error.message };
        }
    },

    // Save user's modified annotation data
    async saveUserAnnotationData(userId, annotationData, mode = 'modification') {
        try {
            const collectionName = mode === 'modification' ? COLLECTIONS.MODIFICATION : COLLECTIONS.CREATION;
            const batch = db.batch();
            
            annotationData.forEach(item => {
                if (item.id && item.id.startsWith('firebase_')) {
                    // Update existing document
                    const docRef = db.collection(collectionName).doc(item.id.replace('firebase_', ''));
                    batch.update(docRef, {
                        ...item,
                        modifiedBy: userId,
                        lastModified: firebase.firestore.FieldValue.serverTimestamp()
                    });
                } else {
                    // Create new document
                    const docRef = db.collection(collectionName).doc();
                    batch.set(docRef, {
                        ...item,
                        createdBy: userId,
                        modifiedBy: userId,
                        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                        lastModified: firebase.firestore.FieldValue.serverTimestamp()
                    });
                }
            });
            
            await batch.commit();
            return { success: true };
        } catch (error) {
            console.error('Error saving user annotation data:', error);
            return { success: false, error: error.message };
        }
    },

    // Data Creation Methods - Load user's created data
    async loadUserCreatedData(userId) {
        try {
            const snapshot = await db.collection(COLLECTIONS.CREATION)
                .where('createdBy', '==', userId)
                .orderBy('createdAt', 'desc')
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
            console.error('Error loading user created data:', error);
            return { success: false, error: error.message };
        }
    },

    // Save user's created data
    async saveUserCreatedData(userId, annotationData) {
        try {
            const batch = db.batch();
            
            annotationData.forEach(item => {
                if (item.firebaseId) {
                    // Update existing document
                    const docRef = db.collection(COLLECTIONS.CREATION).doc(item.firebaseId);
                    batch.update(docRef, {
                        ...item,
                        lastModified: firebase.firestore.FieldValue.serverTimestamp()
                    });
                } else {
                    // Create new document
                    const docRef = db.collection(COLLECTIONS.CREATION).doc();
                    batch.set(docRef, {
                        ...item,
                        createdBy: userId,
                        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                        lastModified: firebase.firestore.FieldValue.serverTimestamp()
                    });
                }
            });
            
            await batch.commit();
            return { success: true };
        } catch (error) {
            console.error('Error saving user created data:', error);
            return { success: false, error: error.message };
        }
    },

    // Search user data by userId (for admin purposes)
    async searchUserData(searchUserId, requestingUserId) {
        try {
            // First validate the requesting user has admin permissions
            const validation = await this.validateUserWithPermissions(requestingUserId);
            
            if (!validation.success || validation.user.role !== 'admin') {
                return { success: false, error: 'Insufficient permissions to search user data' };
            }
            
            // Search in both modification and creation collections
            const [modificationResult, creationResult] = await Promise.all([
                this.loadUserAnnotationData(searchUserId, ['all']),
                this.loadUserCreatedData(searchUserId)
            ]);
            
            return {
                success: true,
                data: {
                    modification: modificationResult.success ? modificationResult.data : [],
                    creation: creationResult.success ? creationResult.data : []
                }
            };
        } catch (error) {
            console.error('Error searching user data:', error);
            return { success: false, error: error.message };
        }
    },

    // Get user statistics
    async getUserStats(userId) {
        try {
            const [modificationData, creationData] = await Promise.all([
                this.loadUserAnnotationData(userId, ['all']),
                this.loadUserCreatedData(userId)
            ]);
            
            const modificationStats = {
                total: 0,
                accepted: 0,
                revised: 0,
                rejected: 0,
                pending: 0
            };
            
            if (modificationData.success) {
                modificationData.data.forEach(item => {
                    modificationStats.total++;
                    const status = item.annotation_status || 'pending';
                    modificationStats[status] = (modificationStats[status] || 0) + 1;
                });
            }
            
            const creationStats = {
                total: creationData.success ? creationData.data.length : 0,
                completed: 0
            };
            
            if (creationData.success) {
                creationStats.completed = creationData.data.filter(item => 
                    item.topic && item.scenario && item.question && item.answer && item.explanation
                ).length;
            }
            
            return {
                success: true,
                stats: {
                    modification: modificationStats,
                    creation: creationStats
                }
            };
        } catch (error) {
            console.error('Error getting user stats:', error);
            return { success: false, error: error.message };
        }
    },

    // Cultural Topics Management Methods
    async saveCulturalTopic(topicData) {
        try {
            const docRef = await db.collection(COLLECTIONS.CULTURAL_TOPICS).add({
                ...topicData,
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                lastModified: firebase.firestore.FieldValue.serverTimestamp()
            });
            return { success: true, id: docRef.id };
        } catch (error) {
            console.error('Error saving cultural topic:', error);
            return { success: false, error: error.message };
        }
    },

    async loadCulturalTopics() {
        try {
            const snapshot = await db.collection(COLLECTIONS.CULTURAL_TOPICS)
                .orderBy('timestamp', 'desc')
                .get();
            
            const topics = [];
            snapshot.forEach(doc => {
                topics.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            return { success: true, data: topics };
        } catch (error) {
            console.error('Error loading cultural topics:', error);
            return { success: false, error: error.message };
        }
    },

    async saveAllCulturalTopics(topics) {
        try {
            const batch = db.batch();
            
            topics.forEach(topic => {
                const docRef = db.collection(COLLECTIONS.CULTURAL_TOPICS).doc();
                batch.set(docRef, {
                    ...topic,
                    timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                    lastModified: firebase.firestore.FieldValue.serverTimestamp()
                });
            });
            
            await batch.commit();
            return { success: true };
        } catch (error) {
            console.error('Error saving all cultural topics:', error);
            return { success: false, error: error.message };
        }
    },

    async clearCulturalTopics() {
        return this.clearCollection(COLLECTIONS.CULTURAL_TOPICS);
    },

    // Annotated Data Management Methods
    async saveAnnotatedData(annotationData) {
        try {
            const docRef = await db.collection(COLLECTIONS.ANNOTATED_DATA).add({
                ...annotationData,
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                lastModified: firebase.firestore.FieldValue.serverTimestamp()
            });
            return { success: true, id: docRef.id };
        } catch (error) {
            console.error('Error saving annotated data:', error);
            return { success: false, error: error.message };
        }
    },

    async loadAnnotatedData() {
        try {
            const snapshot = await db.collection(COLLECTIONS.ANNOTATED_DATA)
                .orderBy('timestamp', 'desc')
                .get();
            
            const data = [];
            snapshot.forEach(doc => {
                data.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            return { success: true, data: data };
        } catch (error) {
            console.error('Error loading annotated data:', error);
            return { success: false, error: error.message };
        }
    },

    async saveAllAnnotatedData(annotatedData) {
        try {
            const batch = db.batch();
            
            annotatedData.forEach(item => {
                const docRef = db.collection(COLLECTIONS.ANNOTATED_DATA).doc();
                batch.set(docRef, {
                    ...item,
                    timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                    lastModified: firebase.firestore.FieldValue.serverTimestamp()
                });
            });
            
            await batch.commit();
            return { success: true };
        } catch (error) {
            console.error('Error saving all annotated data:', error);
            return { success: false, error: error.message };
        }
    },

    async clearAnnotatedData() {
        return this.clearCollection(COLLECTIONS.ANNOTATED_DATA);
    }
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { FirebaseService, COLLECTIONS };
}