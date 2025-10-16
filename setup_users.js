// Setup script to add allowed users to Firebase
// This script demonstrates how to add users with data modification permissions

// Import Firebase configuration
// Make sure to run this in a browser environment or Node.js with Firebase SDK

const setupUsers = async () => {
    try {
        console.log('Setting up allowed users...');
        
        // Example users with different permissions
        const usersToAdd = [
            {
                userId: 'admin001',
                role: 'admin',
                language_code: ['all'],
                canModifyData: true
            },
            {
                userId: 'annotator001',
                role: 'annotator', 
                language_code: ['zh_cn', 'en_us'],
                canModifyData: true
            },
            {
                userId: 'annotator002',
                role: 'annotator',
                language_code: ['ja_jp', 'ko_kr'],
                canModifyData: false
            },
            {
                userId: 'reviewer001',
                role: 'reviewer',
                language_code: ['all'],
                canModifyData: true
            }
        ];
        
        // Add users to Firebase
        for (const userData of usersToAdd) {
            const result = await FirebaseService.addAllowedUser(
                userData.userId,
                userData.role,
                userData.language_code,
                userData.canModifyData
            );
            
            if (result.success) {
                console.log(`✓ Added user: ${userData.userId} (${userData.role})`);
            } else {
                console.error(`✗ Failed to add user ${userData.userId}:`, result.error);
            }
        }
        
        console.log('User setup completed!');
        
    } catch (error) {
        console.error('Error setting up users:', error);
    }
};

// Instructions for use:
console.log(`
To use this script:
1. Open your browser's developer console on the data modification page
2. Make sure Firebase is loaded
3. Copy and paste this entire script
4. Run: setupUsers()

This will create example users in your Firebase 'allowed_users' collection.
`);

// Export for Node.js if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { setupUsers };
}