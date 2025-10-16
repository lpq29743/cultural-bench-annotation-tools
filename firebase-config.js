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
    SESSIONS: 'user_sessions'
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

    // User validation using Firebase Storage file with enhanced format
    async loadAllowedUsers() {
        try {
            const storageRef = storage.ref('config/allowed_users.txt');
            const downloadURL = await storageRef.getDownloadURL();
            
            const response = await fetch(downloadURL);
            const text = await response.text();
            
            const users = [];
            const lines = text.split('\n').filter(line => line.trim().length > 0);
            
            for (const line of lines) {
                const parts = line.trim().split(',');
                
                if (parts.length === 3) {
                    // New format: userId,role,csvAccess
                    const [userId, role, csvAccess] = parts;
                    const accessibleCsvs = csvAccess === 'all' ? ['all'] : csvAccess.split(';');
                    
                    users.push({
                        userId: userId.trim(),
                        role: role.trim(),
                        accessibleCsvs: accessibleCsvs.map(csv => csv.trim())
                    });
                } else if (parts.length === 1) {
                    // Legacy format: just userId (backward compatibility)
                    users.push({
                        userId: parts[0].trim(),
                        role: 'annotator', // default role
                        accessibleCsvs: ['all'] // default access
                    });
                }
            }
            
            return { success: true, users };
        } catch (error) {
            console.error('Error loading allowed users:', error);
            // If file doesn't exist or error occurs, return empty array (allow all users)
            return { success: false, error: error.message, users: [] };
        }
    },

    async validateUserWithPermissions(userId, requestedRole = null) {
        try {
            const result = await this.loadAllowedUsers();
            
            // If no validation file exists, allow all users
            if (!result.success || result.users.length === 0) {
                return { 
                    success: true, 
                    allowed: true, 
                    userInfo: {
                        userId,
                        role: requestedRole || 'annotator',
                        accessibleCsvs: ['all']
                    },
                    message: 'No validation file found, allowing all users' 
                };
            }
            
            // Find user in the allowed list
            const userInfo = result.users.find(user => user.userId === userId);
            
            if (!userInfo) {
                return { 
                    success: true, 
                    allowed: false, 
                    message: 'User ID not found in allowed list'
                };
            }
            
            // Check role compatibility if requested
            if (requestedRole && userInfo.role !== requestedRole) {
                return {
                    success: true,
                    allowed: false,
                    message: `User role mismatch. Expected: ${userInfo.role}, Requested: ${requestedRole}`
                };
            }
            
            return { 
                success: true, 
                allowed: true, 
                userInfo,
                message: 'User validated successfully'
            };
        } catch (error) {
            console.error('Error validating user:', error);
            return { success: false, allowed: false, error: error.message };
        }
    },

    async getUserAccessibleCsvs(userId) {
        try {
            const validation = await this.validateUserWithPermissions(userId);
            
            if (!validation.success || !validation.allowed) {
                return { success: false, error: 'User not authorized' };
            }
            
            return { 
                success: true, 
                csvs: validation.userInfo.accessibleCsvs,
                hasFullAccess: validation.userInfo.accessibleCsvs.includes('all')
            };
        } catch (error) {
            console.error('Error getting user CSV access:', error);
            return { success: false, error: error.message };
        }
    },

    async getUserByUserIdWithValidation(userId, requestedRole = null) {
        try {
            // First validate the user with permissions
            const validation = await this.validateUserWithPermissions(userId, requestedRole);
            
            if (!validation.success) {
                return { success: false, error: validation.error };
            }
            
            if (!validation.allowed) {
                return { success: false, error: validation.message || 'User ID not authorized. Please contact administrator.' };
            }
            
            // Try to get existing user from database
            const existingUser = await this.getUserByUserId(userId);
            
            if (existingUser.success) {
                // Update user with validated permissions
                const updatedUser = {
                    ...existingUser.user,
                    role: validation.userInfo.role,
                    accessibleCsvs: validation.userInfo.accessibleCsvs
                };
                return { success: true, user: updatedUser };
            } else {
                // User doesn't exist in database, return validation info for creation
                return { 
                    success: false, 
                    error: 'User not found in database',
                    validationInfo: validation.userInfo
                };
            }
        } catch (error) {
            console.error('Error getting user with validation:', error);
            return { success: false, error: error.message };
        }
    },

    async updateUserActivity(userId) {
        try {
            await db.collection(COLLECTIONS.USERS).doc(userId).update({
                lastActive: firebase.firestore.FieldValue.serverTimestamp()
            });
            return { success: true };
        } catch (error) {
            console.error('Error updating user activity:', error);
            return { success: false, error: error.message };
        }
    },

    async getAllUsers() {
        try {
            const snapshot = await db.collection(COLLECTIONS.USERS)
                .orderBy('createdAt', 'desc')
                .get();
            
            const users = [];
            snapshot.forEach(doc => {
                users.push({ id: doc.id, ...doc.data() });
            });
            
            return { success: true, users };
        } catch (error) {
            console.error('Error getting all users:', error);
            return { success: false, error: error.message };
        }
    },

    async updateUser(userId, userData) {
        try {
            await db.collection(COLLECTIONS.USERS).doc(userId).update({
                ...userData,
                lastModified: firebase.firestore.FieldValue.serverTimestamp()
            });
            return { success: true };
        } catch (error) {
            console.error('Error updating user:', error);
            return { success: false, error: error.message };
        }
    },

    async deleteUser(userId) {
        try {
            await db.collection(COLLECTIONS.USERS).doc(userId).delete();
            return { success: true };
        } catch (error) {
            console.error('Error deleting user:', error);
            return { success: false, error: error.message };
        }
    },

    // Session Management
    async createSession(userId, sessionData) {
        try {
            const session = {
                userId,
                ...sessionData,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                isActive: true
            };
            
            const docRef = await db.collection(COLLECTIONS.SESSIONS).add(session);
            return { success: true, sessionId: docRef.id };
        } catch (error) {
            console.error('Error creating session:', error);
            return { success: false, error: error.message };
        }
    },

    async endSession(sessionId) {
        try {
            await db.collection(COLLECTIONS.SESSIONS).doc(sessionId).update({
                isActive: false,
                endedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            return { success: true };
        } catch (error) {
            console.error('Error ending session:', error);
            return { success: false, error: error.message };
        }
    },

    // Assignment Management
    async createAssignment(assignmentData) {
        try {
            const assignment = {
                ...assignmentData,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                status: 'active',
                progress: 0,
                completedItems: 0
            };
            
            const docRef = await db.collection(COLLECTIONS.ASSIGNMENTS).add(assignment);
            return { success: true, id: docRef.id, assignment };
        } catch (error) {
            console.error('Error creating assignment:', error);
            return { success: false, error: error.message };
        }
    },

    async getAssignmentsByUser(userId) {
        try {
            const snapshot = await db.collection(COLLECTIONS.ASSIGNMENTS)
                .where('annotatorId', '==', userId)
                .orderBy('createdAt', 'desc')
                .get();
            
            const assignments = [];
            snapshot.forEach(doc => {
                assignments.push({ id: doc.id, ...doc.data() });
            });
            
            return { success: true, assignments };
        } catch (error) {
            console.error('Error getting user assignments:', error);
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
                assignments.push({ id: doc.id, ...doc.data() });
            });
            
            return { success: true, assignments };
        } catch (error) {
            console.error('Error getting all assignments:', error);
            return { success: false, error: error.message };
        }
    },

    async updateAssignment(assignmentId, updateData) {
        try {
            await db.collection(COLLECTIONS.ASSIGNMENTS).doc(assignmentId).update({
                ...updateData,
                lastModified: firebase.firestore.FieldValue.serverTimestamp()
            });
            return { success: true };
        } catch (error) {
            console.error('Error updating assignment:', error);
            return { success: false, error: error.message };
        }
    },

    async updateAssignmentProgress(assignmentId, completedItems, totalItems) {
        try {
            const progress = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
            const status = progress === 100 ? 'completed' : 'active';
            
            await db.collection(COLLECTIONS.ASSIGNMENTS).doc(assignmentId).update({
                completedItems,
                progress,
                status,
                lastModified: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            return { success: true };
        } catch (error) {
            console.error('Error updating assignment progress:', error);
            return { success: false, error: error.message };
        }
    },

    async deleteAssignment(assignmentId) {
        try {
            await db.collection(COLLECTIONS.ASSIGNMENTS).doc(assignmentId).delete();
            return { success: true };
        } catch (error) {
            console.error('Error deleting assignment:', error);
            return { success: false, error: error.message };
        }
    },

    // Enhanced annotation methods with user tracking
    async saveAnnotationWithUser(data, userId, collectionName = COLLECTIONS.CREATION) {
        try {
            const docRef = await db.collection(collectionName).add({
                ...data,
                annotatorId: userId,
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                lastModified: firebase.firestore.FieldValue.serverTimestamp()
            });
            return { success: true, id: docRef.id };
        } catch (error) {
            console.error('Error saving annotation with user:', error);
            return { success: false, error: error.message };
        }
    },

    async getAnnotationsByUser(userId, collectionName = COLLECTIONS.CREATION) {
        try {
            const snapshot = await db.collection(collectionName)
                .where('annotatorId', '==', userId)
                .orderBy('timestamp', 'desc')
                .get();
            
            const annotations = [];
            snapshot.forEach(doc => {
                annotations.push({ id: doc.id, ...doc.data() });
            });
            
            return { success: true, data: annotations };
        } catch (error) {
            console.error('Error getting annotations by user:', error);
            return { success: false, error: error.message };
        }
    },

    // Statistics and reporting
    async getUserStatistics(userId) {
        try {
            const [annotationsResult, assignmentsResult] = await Promise.all([
                this.getAnnotationsByUser(userId, COLLECTIONS.CREATION),
                this.getAssignmentsByUser(userId)
            ]);

            if (!annotationsResult.success || !assignmentsResult.success) {
                throw new Error('Failed to fetch user data');
            }

            const annotations = annotationsResult.data || [];
            const assignments = assignmentsResult.assignments || [];

            const stats = {
                totalAnnotations: annotations.length,
                completedAnnotations: annotations.filter(a => a.completed).length,
                totalAssignments: assignments.length,
                completedAssignments: assignments.filter(a => a.status === 'completed').length,
                averageProgress: assignments.length > 0 
                    ? Math.round(assignments.reduce((sum, a) => sum + (a.progress || 0), 0) / assignments.length)
                    : 0
            };

            return { success: true, stats };
        } catch (error) {
            console.error('Error getting user statistics:', error);
            return { success: false, error: error.message };
        }
    },

    async getOverallStatistics() {
        try {
            const [usersResult, assignmentsResult, annotationsResult] = await Promise.all([
                this.getAllUsers(),
                this.getAllAssignments(),
                this.loadFromCollection(COLLECTIONS.CREATION)
            ]);

            if (!usersResult.success || !assignmentsResult.success || !annotationsResult.success) {
                throw new Error('Failed to fetch statistics data');
            }

            const users = usersResult.users || [];
            const assignments = assignmentsResult.assignments || [];
            const annotations = annotationsResult.data || [];

            const stats = {
                totalUsers: users.length,
                activeUsers: users.filter(u => u.isActive).length,
                totalAssignments: assignments.length,
                completedAssignments: assignments.filter(a => a.status === 'completed').length,
                totalAnnotations: annotations.length,
                completedAnnotations: annotations.filter(a => a.completed).length,
                overallProgress: assignments.length > 0 
                    ? Math.round(assignments.reduce((sum, a) => sum + (a.progress || 0), 0) / assignments.length)
                    : 0
            };

            return { success: true, stats };
        } catch (error) {
            console.error('Error getting overall statistics:', error);
            return { success: false, error: error.message };
        }
    }
};