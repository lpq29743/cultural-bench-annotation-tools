// Data Modification JavaScript
// Implements the workflow described in data_modification.tex

// Application state
let currentUser = null;
let annotationData = [];
let currentIndex = 0;
let isLoggedIn = false;

// DOM elements
const elements = {
    // Sections
    loginSection: document.getElementById('loginSection'),
    userInfoSection: document.getElementById('userInfoSection'),
    annotationSection: document.getElementById('annotationSection'),
    emptyState: document.getElementById('emptyState'),
    loadingOverlay: document.getElementById('loadingOverlay'),
    
    // Login form
    loginForm: document.getElementById('loginForm'),
    userIdInput: document.getElementById('userId'),
    
    // User info display
    userDisplayName: document.getElementById('userDisplayName'),
    userIdDisplay: document.getElementById('userIdDisplay'),
    userLanguageCode: document.getElementById('userLanguageCode'),
    userPermission: document.getElementById('userPermission'),
    progressNumber: document.getElementById('progressNumber'),
    logoutBtn: document.getElementById('logoutBtn'),
    
    // Annotation fields
    sourceExcerpt: document.getElementById('sourceExcerpt'),
    topic: document.getElementById('topic'),
    scenario: document.getElementById('scenario'),
    question: document.getElementById('question'),
    answer: document.getElementById('answer'),
    explanation: document.getElementById('explanation'),
    
    // Decision buttons
    acceptBtn: document.getElementById('acceptBtn'),
    reviseBtn: document.getElementById('reviseBtn'),
    rejectBtn: document.getElementById('rejectBtn'),
    
    // Rejection reason
    rejectionReason: document.getElementById('rejectionReason'),
    rejectionSelect: document.getElementById('rejectionSelect'),
    
    // Navigation
    prevBtn: document.getElementById('prevBtn'),
    nextBtn: document.getElementById('nextBtn'),
    currentItemIndex: document.getElementById('currentItemIndex'),
    totalItems: document.getElementById('totalItems'),
    
    // New elements for the updated layout
    currentItemIndexTop: document.getElementById('currentItemIndexTop'),
    totalItemsTop: document.getElementById('totalItemsTop'),
    
    // Loading and messages
    loadingMessage: document.getElementById('loadingMessage'),
    emptyStateMessage: document.getElementById('emptyStateMessage'),
    toastContainer: document.getElementById('toastContainer')
};

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    // Check if Firebase is loaded
    if (typeof firebase === 'undefined') {
        showToast('Firebase not loaded. Please refresh the page.', 'error');
        return;
    }
    
    // Set up event listeners
    setupEventListeners();
    
    // Check for existing user session
    checkExistingSession();
}

function setupEventListeners() {
    // Login form
    if (elements.loginForm) {
        elements.loginForm.addEventListener('submit', handleLogin);
    }
    
    // Logout button
    if (elements.logoutBtn) {
        elements.logoutBtn.addEventListener('click', handleLogout);
    }
    
    // Decision buttons
    if (elements.acceptBtn) {
        elements.acceptBtn.addEventListener('click', () => handleDecision('accept'));
    }
    if (elements.reviseBtn) {
        elements.reviseBtn.addEventListener('click', () => handleDecision('revise'));
    }
    if (elements.rejectBtn) {
        elements.rejectBtn.addEventListener('click', () => handleDecision('reject'));
    }
    
    // Navigation buttons
    if (elements.prevBtn) {
        elements.prevBtn.addEventListener('click', navigatePrevious);
    }
    if (elements.nextBtn) {
        elements.nextBtn.addEventListener('click', navigateNext);
    }
    
    // Auto-save on field changes
    const editableFields = [elements.scenario, elements.question, elements.answer, elements.explanation];
    editableFields.forEach(field => {
        if (field) {
            field.addEventListener('input', debounce(autoSave, 1000));
        }
    });
}

function checkExistingSession() {
    const storedUser = localStorage.getItem('dataModificationUser');
    if (storedUser) {
        try {
            currentUser = JSON.parse(storedUser);
            if (currentUser && currentUser.canModifyData) {
                isLoggedIn = true;
                updateUIAfterLogin();
                loadAnnotationData();
            } else {
                localStorage.removeItem('dataModificationUser');
            }
        } catch (error) {
            console.error('Error parsing stored user:', error);
            localStorage.removeItem('dataModificationUser');
        }
    }
}

async function handleLogin(event) {
    event.preventDefault();
    
    const userId = elements.userIdInput.value.trim();
    if (!userId) {
        showToast('Please enter a valid User ID', 'error');
        return;
    }
    
    try {
        showLoading('Validating user...');
        
        // Step 2: Read user base from firebase, get full information
        const validation = await FirebaseService.validateUserWithPermissions(userId);
        
        if (!validation.success) {
            hideLoading();
            // Step 3: If user not exist, show the user "User not exist"
            showToast('User not exist', 'error');
            return;
        }
        
        if (!validation.allowed) {
            hideLoading();
            showToast(validation.message || 'Access denied', 'error');
            return;
        }
        
        // Step 3: If canModifyData is false, show the user "No permission"
        if (!validation.userInfo.canModifyData) {
            hideLoading();
            showToast('No permission', 'error');
            return;
        }
        
        // Step 4: If canModifyData is true, get language_region (type: str)
        currentUser = {
            userId: validation.userInfo.userId,
            role: validation.userInfo.role,
            language_region: validation.userInfo.language_region,
            canModifyData: validation.userInfo.canModifyData
        };
        
        // Store user session
        localStorage.setItem('dataModificationUser', JSON.stringify(currentUser));
        isLoggedIn = true;
        
        updateUIAfterLogin();
        await loadAnnotationData();
        
        hideLoading();
        showToast('Login successful', 'success');
        
    } catch (error) {
        hideLoading();
        console.error('Login error:', error);
        showToast('Login failed: ' + error.message, 'error');
    }
}

function updateUIAfterLogin() {
    // Hide login section, show user info and annotation sections
    elements.loginSection.classList.add('hidden');
    elements.userInfoSection.classList.remove('hidden');
    
    // Update user info display
    elements.userDisplayName.textContent = `Welcome, ${currentUser.userId}`;
    elements.userIdDisplay.textContent = currentUser.userId;
    
    // Fix language_region display - handle both array and string cases properly
    let languageRegionDisplay = '';
    if (Array.isArray(currentUser.language_region)) {
        // If it's an array, join with comma, but filter out 'all' if there are specific codes
        const codes = currentUser.language_region.filter(code => code !== 'all');
        if (codes.length > 0) {
            languageRegionDisplay = codes.join(', ');
        } else {
            languageRegionDisplay = 'all';
        }
    } else {
        // If it's a string, use it directly
        languageRegionDisplay = currentUser.language_region || 'all';
    }
    elements.userLanguageCode.textContent = languageRegionDisplay;
    
    elements.userPermission.textContent = currentUser.canModifyData ? 'Can Modify Data' : 'Read Only';
}

async function loadAnnotationData() {
    try {
        showLoading('Loading annotation data...');
        
        // Step 5: Read cultural_annotations_modified, return all the data with operation is empty and language_region matches user's language_region
        const result = await FirebaseService.loadFromCollection('cultural_annotations_modified');
        
        if (!result.success) {
            throw new Error(result.error || 'Failed to load annotation data');
        }
        
        // Filter data based on user's language_region and empty operation
        annotationData = result.data.filter(item => {
            // Check if operation is empty (null, undefined, or empty string)
            const hasEmptyOperation = !item.operation || item.operation === '';
            
            // Check if language_region matches
            let languageMatches = false;
            if (Array.isArray(currentUser.language_region)) {
                languageMatches = currentUser.language_region.includes('all') || 
                                currentUser.language_region.includes(item.language_region);
            } else {
                languageMatches = currentUser.language_region === 'all' || 
                                currentUser.language_region === item.language_region;
            }
            
            return hasEmptyOperation && languageMatches;
        });
        
        hideLoading();
        
        if (annotationData.length === 0) {
            showEmptyState('No annotation items found for your language region.');
            return;
        }
        
        // Step 6: start annotation
        currentIndex = 0;
        updateProgressDisplay();
        displayCurrentItem();
        elements.annotationSection.classList.remove('hidden');
        
    } catch (error) {
        hideLoading();
        console.error('Error loading annotation data:', error);
        showToast('Failed to load annotation data: ' + error.message, 'error');
        showEmptyState('Failed to load annotation data. Please try again.');
    }
}

function displayCurrentItem() {
    if (annotationData.length === 0 || currentIndex >= annotationData.length) {
        return;
    }
    
    const item = annotationData[currentIndex];
    
    // Display read-only fields
    elements.sourceExcerpt.textContent = item.source_excerpt || '';
    elements.topic.textContent = item.topic || '';
    
    // Display editable fields
    elements.scenario.value = item.scenario || '';
    elements.question.value = item.question || '';
    elements.answer.value = item.answer || '';
    elements.explanation.value = item.explanation || '';
    
    // Reset decision state
    resetDecisionState();
    
    // Update navigation
    updateNavigationState();
    updateItemCounter();
}

function resetDecisionState() {
    // Hide rejection reason
    elements.rejectionReason.classList.remove('show');
    elements.rejectionSelect.value = '';
    
    // Reset button states
    const buttons = [elements.acceptBtn, elements.reviseBtn, elements.rejectBtn];
    buttons.forEach(btn => {
        if (btn) {
            btn.classList.remove('selected');
        }
    });
}

async function handleDecision(decision) {
    if (annotationData.length === 0 || currentIndex >= annotationData.length) {
        return;
    }
    
    const currentItem = annotationData[currentIndex];
    
    try {
        let updateData = {
            operation: decision,
            annotatedBy: currentUser.userId,
            annotatedAt: new Date().toISOString()
        };
        
        if (decision === 'accept') {
            // Accept: Keep original data, just mark as accepted
            updateData.status = 'accepted';
            
        } else if (decision === 'revise') {
            // Revise: Update with modified data
            updateData.status = 'revised';
            updateData.scenario = elements.scenario.value;
            updateData.question = elements.question.value;
            updateData.answer = elements.answer.value;
            updateData.explanation = elements.explanation.value;
            
        } else if (decision === 'reject') {
            // Reject: Need rejection reason
            const rejectionReason = elements.rejectionSelect.value;
            if (!rejectionReason) {
                elements.rejectionReason.classList.add('show');
                showToast('Please select a rejection reason', 'error');
                return;
            }
            updateData.status = 'rejected';
            updateData.rejectionReason = rejectionReason;
        }
        
        showLoading('Saving annotation...');
        
        // Step 7: save annotation to firebase
        const result = await FirebaseService.updateAnnotation(
            currentItem.id, 
            updateData, 
            'cultural_annotations_modified'
        );
        
        if (!result.success) {
            throw new Error(result.error || 'Failed to save annotation');
        }
        
        // Update local data
        annotationData[currentIndex] = { ...currentItem, ...updateData };
        
        hideLoading();
        showToast(`Item ${decision}ed successfully`, 'success');
        
        // Step 8: get to the next sample
        navigateNext();
        
    } catch (error) {
        hideLoading();
        console.error('Error saving annotation:', error);
        showToast('Failed to save annotation: ' + error.message, 'error');
    }
}

function navigateNext() {
    if (currentIndex < annotationData.length - 1) {
        currentIndex++;
        displayCurrentItem();
        updateProgressDisplay();
    } else {
        // All items completed
        showToast('All items completed!', 'success');
        showEmptyState('Congratulations! You have completed all annotation items.');
    }
}

function navigatePrevious() {
    if (currentIndex > 0) {
        currentIndex--;
        displayCurrentItem();
        updateProgressDisplay();
    }
}

function updateNavigationState() {
    if (elements.prevBtn) {
        elements.prevBtn.disabled = currentIndex === 0;
    }
    if (elements.nextBtn) {
        elements.nextBtn.disabled = currentIndex >= annotationData.length - 1;
    }
}

function updateItemCounter() {
    if (elements.currentItemIndex) {
        elements.currentItemIndex.textContent = currentIndex + 1;
    }
    if (elements.totalItems) {
        elements.totalItems.textContent = annotationData.length;
    }
    // Update top counter as well
    if (elements.currentItemIndexTop) {
        elements.currentItemIndexTop.textContent = currentIndex + 1;
    }
    if (elements.totalItemsTop) {
        elements.totalItemsTop.textContent = annotationData.length;
    }
}

function updateProgressDisplay() {
    const completed = annotationData.filter(item => item.operation && item.operation !== '').length;
    const total = annotationData.length;
    
    if (elements.progressNumber) {
        elements.progressNumber.textContent = `${completed}/${total}`;
    }
}

function autoSave() {
    // Auto-save current changes (optional feature)
    if (annotationData.length > 0 && currentIndex < annotationData.length) {
        const currentItem = annotationData[currentIndex];
        currentItem.scenario = elements.scenario.value;
        currentItem.question = elements.question.value;
        currentItem.answer = elements.answer.value;
        currentItem.explanation = elements.explanation.value;
        currentItem.lastModified = new Date().toISOString();
    }
}

function handleLogout() {
    // Clear user session
    localStorage.removeItem('dataModificationUser');
    currentUser = null;
    isLoggedIn = false;
    annotationData = [];
    currentIndex = 0;
    
    // Reset UI
    elements.userInfoSection.classList.add('hidden');
    elements.annotationSection.classList.add('hidden');
    elements.emptyState.classList.add('hidden');
    elements.loginSection.classList.remove('hidden');
    
    // Clear form
    elements.userIdInput.value = '';
    
    showToast('Logged out successfully', 'info');
}

function showEmptyState(message) {
    elements.emptyStateMessage.textContent = message;
    elements.emptyState.classList.remove('hidden');
    elements.annotationSection.classList.add('hidden');
}

function showLoading(message) {
    elements.loadingMessage.textContent = message;
    elements.loadingOverlay.classList.remove('hidden');
}

function hideLoading() {
    elements.loadingOverlay.classList.add('hidden');
}

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    
    elements.toastContainer.appendChild(toast);
    
    // Trigger animation
    setTimeout(() => toast.classList.add('show'), 100);
    
    // Remove toast after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }, 3000);
}

// Utility function for debouncing
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Handle rejection button click to show reason dropdown
if (elements.rejectBtn) {
    elements.rejectBtn.addEventListener('click', function() {
        elements.rejectionReason.classList.add('show');
    });
}

// Hide rejection reason when other buttons are clicked
if (elements.acceptBtn) {
    elements.acceptBtn.addEventListener('click', function() {
        elements.rejectionReason.classList.remove('show');
    });
}

if (elements.reviseBtn) {
    elements.reviseBtn.addEventListener('click', function() {
        elements.rejectionReason.classList.remove('show');
    });
}