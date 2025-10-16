// Helper function to check if FirebaseService is available
function checkFirebaseService() {
    if (typeof FirebaseService === 'undefined') {
        console.error('FirebaseService is not defined. Please check firebase-config.js');
        showToast('Firebase service not loaded, please refresh the page and try again', 'error');
        return false;
    }
    return true;
}

// Application state
let annotations = [];
let currentIndex = 0;
let filteredAnnotations = [];
let isEditing = false;
let currentTaskMode = 'modification'; // 'modification' or 'creation'

// User management state
let currentUser = null;
let currentSession = null;
let allUsers = [];
let allAssignments = [];
let isLoggedIn = false;

// DOM elements
const elements = {
    // Task mode
    taskMode: document.getElementById('taskMode'),
    
    // User management elements
    loginBtn: document.getElementById('loginBtn'),
    logoutBtn: document.getElementById('logoutBtn'),
    manageBtn: document.getElementById('manageBtn'),
    userInfo: document.getElementById('userInfo'),
    userName: document.getElementById('userName'),
    userRole: document.getElementById('userRole'),
    dataActions: document.getElementById('dataActions'),
    
    // Modal elements
    loginModal: document.getElementById('loginModal'),
    loginModalClose: document.getElementById('loginModalClose'),
    loginForm: document.getElementById('loginForm'),
    loginUserId: document.getElementById('loginUserId'),
    loginRole: document.getElementById('loginRole'),
    loginCancel: document.getElementById('loginCancel'),
    
    // CSV Upload Modal elements
    csvUploadModal: document.getElementById('csvUploadModal'),
    csvUploadModalClose: document.getElementById('csvUploadModalClose'),
    csvUploadInput: document.getElementById('csvUploadInput'),
    csvDropArea: document.getElementById('csvDropArea'),
    uploadCollection: document.getElementById('uploadCollection'),
    clearBeforeUpload: document.getElementById('clearBeforeUpload'),
    uploadProgress: document.getElementById('uploadProgress'),
    uploadProgressBar: document.getElementById('uploadProgressBar'),
    uploadStatus: document.getElementById('uploadStatus'),
    selectedFiles: document.getElementById('selectedFiles'),
    filesList: document.getElementById('filesList'),
    uploadCsvBtn: document.getElementById('uploadCsvBtn'),
    csvUploadCancel: document.getElementById('csvUploadCancel'),
    
    manageModal: document.getElementById('manageModal'),
    manageModalClose: document.getElementById('manageModalClose'),
    
    assignmentModal: document.getElementById('assignmentModal'),
    assignmentModalClose: document.getElementById('assignmentModalClose'),
    assignmentForm: document.getElementById('assignmentForm'),
    assignmentAnnotator: document.getElementById('assignmentAnnotator'),
    assignmentCount: document.getElementById('assignmentCount'),
    assignmentTopicFilter: document.getElementById('assignmentTopicFilter'),
    assignmentDueDate: document.getElementById('assignmentDueDate'),
    assignmentNotes: document.getElementById('assignmentNotes'),
    assignmentCancel: document.getElementById('assignmentCancel'),
    
    // Tab elements
    annotatorsTab: document.getElementById('annotatorsTab'),
    assignmentsTab: document.getElementById('assignmentsTab'),
    progressTab: document.getElementById('progressTab'),
    
    // Table elements
    annotatorsTableBody: document.getElementById('annotatorsTableBody'),
    assignmentsTableBody: document.getElementById('assignmentsTableBody'),
    
    // Statistics elements
    totalAnnotators: document.getElementById('totalAnnotators'),
    totalAssignments: document.getElementById('totalAssignments'),
    totalCompleted: document.getElementById('totalCompleted'),
    overallProgress: document.getElementById('overallProgress'),
    
    // Filter elements
    reportAnnotatorFilter: document.getElementById('reportAnnotatorFilter'),
    reportPeriodFilter: document.getElementById('reportPeriodFilter'),
    generateReportBtn: document.getElementById('generateReportBtn'),
    
    // Action buttons
    addAnnotatorBtn: document.getElementById('addAnnotatorBtn'),
    createAssignmentBtn: document.getElementById('createAssignmentBtn'),
    
    // Form elements
    sourceExcerpt: document.getElementById('sourceExcerpt'),
    topicSelect: document.getElementById('topic'),
    scenarioInput: document.getElementById('scenario'),
    questionInput: document.getElementById('question'),
    answerInput: document.getElementById('answer'),
    explanationInput: document.getElementById('explanation'),
    annotationStatus: document.getElementById('annotationStatus'),
    rejectionReason: document.getElementById('rejectionReason'),
    
    // Annotation decision buttons
    acceptBtn: document.getElementById('acceptBtn'),
    reviseBtn: document.getElementById('reviseBtn'),
    rejectBtn: document.getElementById('rejectBtn'),
    
    // Form groups
    sourceExcerptGroup: document.getElementById('sourceExcerptGroup'),
    annotationDecisionGroup: document.getElementById('annotationDecisionGroup'),
    rejectionReasonGroup: document.getElementById('rejectionReasonGroup'),
    annotationFilter: document.getElementById('annotationFilter'),
    
    // Action buttons
    addNewBtn: document.getElementById('addNewBtn'),
    updateBtn: document.getElementById('updateBtn'),
    deleteBtn: document.getElementById('deleteBtn'),
    clearFormBtn: document.getElementById('clearFormBtn'),
    saveBtn: document.getElementById('saveBtn'),
    importBtn: document.getElementById('importBtn'),
    exportBtn: document.getElementById('exportBtn'),
    prevBtn: document.getElementById('prevBtn'),
    nextBtn: document.getElementById('nextBtn'),
    startBtn: document.getElementById('startBtn'),
    
    // Filters
    topicFilter: document.getElementById('topicFilter'),
    statusFilter: document.getElementById('statusFilter'),
    annotationStatusFilter: document.getElementById('annotationStatusFilter'),
    clearFilters: document.getElementById('clearFilters'),
    
    // Display elements
    totalCount: document.getElementById('totalCount'),
    completedCount: document.getElementById('completedCount'),
    acceptedCount: document.getElementById('acceptedCount'),
    revisedCount: document.getElementById('revisedCount'),
    rejectedCount: document.getElementById('rejectedCount'),
    progressPercent: document.getElementById('progressPercent'),
    itemCounter: document.getElementById('itemCounter'),
    
    // Stats items
    acceptedStat: document.getElementById('acceptedStat'),
    revisedStat: document.getElementById('revisedStat'),
    rejectedStat: document.getElementById('rejectedStat'),
    
    // Containers
    annotationForm: document.getElementById('annotationForm'),
    emptyState: document.getElementById('emptyState'),
    emptyStateText: document.getElementById('emptyStateText'),
    loadingOverlay: document.getElementById('loadingOverlay'),
    toastContainer: document.getElementById('toastContainer'),
    csvFileInput: document.getElementById('csvFileInput')
};

// User Management Functions
function initializeUserManagement() {
    // Initialize user management UI elements
    const userLoginSection = document.getElementById('userLoginSection');
    const userInfoSection = document.getElementById('userInfoSection');
    const loginForm = document.getElementById('loginForm');
    const logoutBtn = document.getElementById('logoutBtn');
    
    // Set up login form event listener
    if (loginForm) {
        loginForm.addEventListener('submit', handleUserLogin);
    }
    
    // Set up logout button event listener
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleUserLogout);
    }
    
    // Check for existing user session
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
        try {
            currentUser = JSON.parse(storedUser);
            updateUserUI();
        } catch (error) {
            console.error('Error parsing stored user data:', error);
            localStorage.removeItem('currentUser');
        }
    }
}

async function handleUserLogin(event) {
    event.preventDefault();
    
    const userIdInput = document.getElementById('userIdInput');
    const userId = userIdInput?.value?.trim();
    
    if (!userId) {
        showToast('Please enter a valid User ID', 'error');
        return;
    }
    
    try {
        showLoading('Validating user...');
        
        // Validate user with Firebase
        const validation = await FirebaseService.validateUserWithPermissions(userId);
        
        if (!validation.success) {
            throw new Error(validation.error || 'User validation failed');
        }
        
        if (!validation.allowed) {
            throw new Error(validation.message || 'User not authorized');
        }
        
        // Try to get existing user or create new one
        let userResult = await FirebaseService.getUserByUserId(userId);
        
        if (!userResult.success) {
            // Create new user
            const userData = {
                userId: userId,
                role: validation.userInfo.role,
                accessibleCsvs: validation.userInfo.accessibleCsvs,
                name: userId, // Default name to userId
                email: '', // Can be updated later
                isActive: true
            };
            
            userResult = await FirebaseService.createUser(userData);
            if (!userResult.success) {
                throw new Error('Failed to create user account');
            }
            
            currentUser = { id: userResult.id, ...userData };
        } else {
            currentUser = userResult.user;
        }
        
        // Store user in localStorage
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        
        // Update UI
        updateUserUI();
        showToast(`Welcome, ${currentUser.name || currentUser.userId}!`, 'success');
        
        // Clear form
        if (userIdInput) userIdInput.value = '';
        
    } catch (error) {
        console.error('Login error:', error);
        showToast(`Login failed: ${error.message}`, 'error');
    } finally {
        hideLoading();
    }
}

function handleUserLogout() {
    currentUser = null;
    localStorage.removeItem('currentUser');
    updateUserUI();
    showToast('Logged out successfully', 'success');
}

function updateUserUI() {
    const userLoginSection = document.getElementById('userLoginSection');
    const userInfoSection = document.getElementById('userInfoSection');
    const currentUserName = document.getElementById('currentUserName');
    const currentUserRole = document.getElementById('currentUserRole');
    
    if (currentUser) {
        // User is logged in
        if (userLoginSection) userLoginSection.style.display = 'none';
        if (userInfoSection) userInfoSection.style.display = 'block';
        if (currentUserName) currentUserName.textContent = currentUser.name || currentUser.userId;
        if (currentUserRole) currentUserRole.textContent = currentUser.role || 'annotator';
    } else {
        // User is not logged in
        if (userLoginSection) userLoginSection.style.display = 'block';
        if (userInfoSection) userInfoSection.style.display = 'none';
    }
}

// Initialize application
document.addEventListener('DOMContentLoaded', function() {
    initializeEventListeners();
    initializeUserManagement();
    switchTaskMode(currentTaskMode);
    checkLoginStatus();
    updateUI();
});

// Event listeners
function initializeEventListeners() {
    // Task mode selector
    elements.taskMode.addEventListener('change', (e) => {
        switchTaskMode(e.target.value);
    });
    
    // Annotation decision buttons
    elements.acceptBtn.addEventListener('click', () => setAnnotationDecision('accept'));
    elements.reviseBtn.addEventListener('click', () => setAnnotationDecision('revise'));
    elements.rejectBtn.addEventListener('click', () => setAnnotationDecision('reject'));
    
    // Form buttons
    elements.addNewBtn.addEventListener('click', addNewAnnotation);
    elements.updateBtn.addEventListener('click', updateCurrentAnnotation);
    elements.deleteBtn.addEventListener('click', deleteCurrentAnnotation);
    elements.clearFormBtn.addEventListener('click', clearForm);
    
    // Navigation
    elements.prevBtn.addEventListener('click', navigatePrevious);
    elements.nextBtn.addEventListener('click', navigateNext);
    elements.startBtn.addEventListener('click', addNewAnnotation);
    
    // Data operations
    elements.saveBtn.addEventListener('click', saveToFirebase);
    elements.importBtn.addEventListener('click', () => elements.csvFileInput.click());
    elements.exportBtn.addEventListener('click', exportToCSV);
    elements.csvFileInput.addEventListener('change', handleFileImport);
    
    // User data operations
    const searchUserBtn = document.getElementById('searchUserBtn');
    const loadMyDataBtn = document.getElementById('loadMyDataBtn');
    
    if (searchUserBtn) {
        searchUserBtn.addEventListener('click', searchUserData);
    }
    
    if (loadMyDataBtn) {
        loadMyDataBtn.addEventListener('click', loadCurrentUserData);
    }
    
    // Filters
    elements.topicFilter.addEventListener('change', applyFilters);
    elements.statusFilter.addEventListener('change', applyFilters);
    elements.annotationStatusFilter.addEventListener('change', applyFilters);
    elements.clearFilters.addEventListener('click', clearFilters);
    
    // Rejection reason
    elements.rejectionReason.addEventListener('change', updateCurrentAnnotation);
    
    // Form inputs - auto-save on change
    const formInputs = [
        elements.topicSelect,
        elements.scenarioInput,
        elements.questionInput,
        elements.answerInput,
        elements.explanationInput
    ];
    
    formInputs.forEach(input => {
        input.addEventListener('input', debounce(autoSave, 1000));
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', handleKeyboardShortcuts);
}

// Task mode management
function switchTaskMode(mode) {
    currentTaskMode = mode;
    elements.taskMode.value = mode;
    
    if (mode === 'modification') {
        // Show modification-specific elements
        elements.sourceExcerptGroup.classList.remove('hidden');
        elements.annotationDecisionGroup.classList.remove('hidden');
        elements.annotationFilter.classList.remove('hidden');
        elements.acceptedStat.classList.remove('hidden');
        elements.revisedStat.classList.remove('hidden');
        elements.rejectedStat.classList.remove('hidden');
        
        // Update empty state text
        elements.emptyStateText.textContent = 'Import LLM-generated data to start annotation review.';
        
        // Update import button text
        elements.importBtn.innerHTML = '<i class="fas fa-upload"></i> Import Data (Multiple Files)';
        
    } else if (mode === 'creation') {
        // Hide modification-specific elements
        elements.sourceExcerptGroup.classList.add('hidden');
        elements.annotationDecisionGroup.classList.add('hidden');
        elements.rejectionReasonGroup.classList.add('hidden');
        elements.annotationFilter.classList.add('hidden');
        elements.acceptedStat.classList.add('hidden');
        elements.revisedStat.classList.add('hidden');
        elements.rejectedStat.classList.add('hidden');
        
        // Update empty state text
        elements.emptyStateText.textContent = 'Create new cultural benchmark data from scratch.';
        
        // Update import button text
        elements.importBtn.innerHTML = '<i class="fas fa-upload"></i> Import CSV (Multiple Files)';
    }
    
    // Clear current data and reset
    annotations = [];
    currentIndex = 0;
    clearForm();
    applyFilters();
    updateUI();
}

// Annotation decision management
function setAnnotationDecision(decision) {
    // Update button states
    document.querySelectorAll('.btn-decision').forEach(btn => btn.classList.remove('active'));
    
    if (decision === 'accept') {
        elements.acceptBtn.classList.add('active');
        elements.rejectionReasonGroup.style.display = 'none';
        // Make form fields readonly for accept
        setFormFieldsReadonly(true);
    } else if (decision === 'revise') {
        elements.reviseBtn.classList.add('active');
        elements.rejectionReasonGroup.style.display = 'none';
        // Make form fields editable for revise
        setFormFieldsReadonly(false);
    } else if (decision === 'reject') {
        elements.rejectBtn.classList.add('active');
        elements.rejectionReasonGroup.style.display = 'block';
        // Make form fields readonly for reject
        setFormFieldsReadonly(true);
    }
    
    elements.annotationStatus.value = decision;
    updateCurrentAnnotation();
}

function setFormFieldsReadonly(readonly) {
    const fields = [elements.topicSelect, elements.scenarioInput, elements.questionInput, elements.answerInput, elements.explanationInput];
    fields.forEach(field => {
        if (readonly) {
            field.setAttribute('readonly', true);
            if (field.tagName === 'SELECT') {
                field.disabled = true;
            }
        } else {
            field.removeAttribute('readonly');
            if (field.tagName === 'SELECT') {
                field.disabled = false;
            }
        }
    });
}

// Keyboard shortcuts
function handleKeyboardShortcuts(e) {
    if (e.ctrlKey || e.metaKey) {
        switch(e.key) {
            case 's':
                e.preventDefault();
                saveToFirebase();
                break;
            case 'n':
                e.preventDefault();
                addNewAnnotation();
                break;
            case 'ArrowLeft':
                e.preventDefault();
                navigatePrevious();
                break;
            case 'ArrowRight':
                e.preventDefault();
                navigateNext();
                break;
        }
    }
    
    // Annotation decision shortcuts (only in modification mode)
    if (currentTaskMode === 'modification' && filteredAnnotations.length > 0) {
        switch(e.key) {
            case '1':
                e.preventDefault();
                setAnnotationDecision('accept');
                break;
            case '2':
                e.preventDefault();
                setAnnotationDecision('revise');
                break;
            case '3':
                e.preventDefault();
                setAnnotationDecision('reject');
                break;
        }
    }
}

// Annotation management
function addNewAnnotation() {
    const newAnnotation = {
        id: generateId(),
        sourceExcerpt: currentTaskMode === 'modification' ? '' : undefined,
        topic: '',
        scenario: '',
        question: '',
        answer: '',
        explanation: '',
        annotationStatus: currentTaskMode === 'modification' ? 'pending' : undefined,
        rejectionReason: currentTaskMode === 'modification' ? '' : undefined,
        completed: false,
        createdAt: new Date().toISOString()
    };
    
    annotations.unshift(newAnnotation);
    currentIndex = 0;
    isEditing = true;
    
    applyFilters();
    loadAnnotation(currentIndex);
    updateUI();
    
    // Focus on first input
    if (currentTaskMode === 'creation') {
        elements.topicSelect.focus();
    } else {
        elements.sourceExcerpt.focus();
    }
    
    showToast('New annotation created', 'success');
}

async function updateCurrentAnnotation() {
    if (filteredAnnotations.length === 0) return;
    
    const annotation = filteredAnnotations[currentIndex];
    const formData = getFormData();
    const wasCompleted = annotation.completed;
    
    // Update the annotation
    Object.assign(annotation, formData);
    annotation.completed = isAnnotationComplete(annotation);
    annotation.lastModified = new Date().toISOString();
    
    // Add user tracking if logged in
    if (isLoggedIn && currentUser) {
        annotation.lastModifiedBy = currentUser.id;
    }
    
    // Update in main array
    const mainIndex = annotations.findIndex(a => a.id === annotation.id);
    if (mainIndex !== -1) {
        annotations[mainIndex] = annotation;
    }
    
    // Update assignment progress if annotation was just completed
    if (!wasCompleted && annotation.completed && isLoggedIn && currentUser) {
        await updateAssignmentProgress();
    }
    
    updateUI();
    showToast('Annotation updated', 'success');
}

async function updateAssignmentProgress() {
    try {
        // Check if FirebaseService is available first
        if (!checkFirebaseService()) {
            return;
        }

        // Get user's current assignment
        const assignmentsResult = await FirebaseService.getAssignmentsByUser(currentUser.id);
        
        if (assignmentsResult.success && assignmentsResult.assignments.length > 0) {
            const activeAssignment = assignmentsResult.assignments.find(a => a.status === 'active');
            
            if (activeAssignment) {
                // Calculate progress based on completed annotations
                const completedCount = annotations.filter(a => a.completed && a.annotatorId === currentUser.id).length;
                const totalCount = activeAssignment.itemCount || annotations.length;
                const progress = Math.min(100, Math.round((completedCount / totalCount) * 100));
                
                // Update assignment progress
                const updateResult = await FirebaseService.updateAssignmentProgress(activeAssignment.id, {
                    progress,
                    completedItems: completedCount,
                    lastActivity: new Date().toISOString(),
                    status: progress >= 100 ? 'completed' : 'active'
                });
                
                if (updateResult.success) {
                    // Update local assignment data
                    const assignmentIndex = allAssignments.findIndex(a => a.id === activeAssignment.id);
                    if (assignmentIndex !== -1) {
                        allAssignments[assignmentIndex] = {
                            ...allAssignments[assignmentIndex],
                            progress,
                            completedItems: completedCount,
                            lastActivity: new Date().toISOString(),
                            status: progress >= 100 ? 'completed' : 'active'
                        };
                    }
                    
                    if (progress >= 100) {
                        showToast('Congratulations! Assignment completed!', 'success');
                    }
                }
            }
        }
    } catch (error) {
        console.error('Error updating assignment progress:', error);
        // Don't show error to user as this is background operation
    }
}

function deleteCurrentAnnotation() {
    if (filteredAnnotations.length === 0) return;
    
    if (confirm('Are you sure you want to delete this annotation?')) {
        const annotation = filteredAnnotations[currentIndex];
        
        // Remove from main array
        annotations = annotations.filter(a => a.id !== annotation.id);
        
        // Adjust current index
        if (currentIndex >= filteredAnnotations.length - 1) {
            currentIndex = Math.max(0, filteredAnnotations.length - 2);
        }
        
        applyFilters();
        
        if (filteredAnnotations.length > 0) {
            loadAnnotation(currentIndex);
        } else {
            clearForm();
        }
        
        updateUI();
        showToast('Annotation deleted', 'success');
    }
}

function navigatePrevious() {
    if (filteredAnnotations.length === 0) return;
    
    currentIndex = currentIndex > 0 ? currentIndex - 1 : filteredAnnotations.length - 1;
    loadAnnotation(currentIndex);
    updateUI();
}

function navigateNext() {
    if (filteredAnnotations.length === 0) return;
    
    currentIndex = currentIndex < filteredAnnotations.length - 1 ? currentIndex + 1 : 0;
    loadAnnotation(currentIndex);
    updateUI();
}

// Form management
function loadAnnotation(index) {
    if (filteredAnnotations.length === 0 || index < 0 || index >= filteredAnnotations.length) {
        clearForm();
        return;
    }
    
    const annotation = filteredAnnotations[index];
    
    // Load common fields
    elements.topicSelect.value = annotation.topic || '';
    elements.scenarioInput.value = annotation.scenario || '';
    elements.questionInput.value = annotation.question || '';
    elements.answerInput.value = annotation.answer || '';
    elements.explanationInput.value = annotation.explanation || '';
    elements.annotationStatus.value = annotation.annotationStatus || '';
    elements.rejectionReason.value = annotation.rejectionReason || '';
    elements.sourceExcerpt.value = annotation.sourceExcerpt || '';
    
    // Set form fields based on annotation status
    if (annotation.annotationStatus === 'pending') {
        setAnnotationDecision('accept');
    } else if (annotation.annotationStatus === 'revise') {
        setAnnotationDecision('revise');
    } else if (annotation.annotationStatus === 'rejected') {
        setAnnotationDecision('reject');
    }
    
    // Set form fields based on completion status
    if (annotation.completed) {
        elements.acceptBtn.classList.add('active');
        elements.rejectionReasonGroup.style.display = 'none';
        setFormFieldsReadonly(true);
    } else {
        elements.acceptBtn.classList.remove('active');
        elements.rejectionReasonGroup.style.display = 'none';
        setFormFieldsReadonly(false);
    }
    
    // Set form fields based on task mode
    if (currentTaskMode === 'creation') {
        elements.topicSelect.focus();
    } else {
        elements.sourceExcerpt.focus();
    }
}

function clearForm() {
    elements.topicSelect.value = '';
    elements.scenarioInput.value = '';
    elements.questionInput.value = '';
    elements.answerInput.value = '';
    elements.explanationInput.value = '';
    elements.annotationStatus.value = '';
    elements.rejectionReason.value = '';
    elements.sourceExcerpt.value = '';
    
    setAnnotationDecision('');
    setFormFieldsReadonly(false);
}

function getFormData() {
    return {
        topic: elements.topicSelect.value,
        scenario: elements.scenarioInput.value,
        question: elements.questionInput.value,
        answer: elements.answerInput.value,
        explanation: elements.explanationInput.value,
        annotationStatus: elements.annotationStatus.value,
        rejectionReason: elements.rejectionReason.value
    };
}

function isAnnotationComplete(annotation) {
    return annotation.topic && annotation.scenario && annotation.question && annotation.answer && annotation.explanation;
}

// Auto-save function for form inputs
function autoSave() {
    if (filteredAnnotations.length === 0 || currentIndex < 0 || currentIndex >= filteredAnnotations.length) {
        return;
    }
    
    try {
        // Get current form data
        const formData = getFormData();
        
        // Update the current annotation
        const annotation = filteredAnnotations[currentIndex];
        Object.assign(annotation, formData);
        annotation.lastModified = new Date().toISOString();
        
        // Add user tracking if logged in
        if (isLoggedIn && currentUser) {
            annotation.lastModifiedBy = currentUser.id || currentUser.userId;
        }
        
        // Update completion status
        annotation.completed = isAnnotationComplete(annotation);
        
        // Update in main array
        const mainIndex = annotations.findIndex(a => a.id === annotation.id);
        if (mainIndex !== -1) {
            annotations[mainIndex] = annotation;
        }
        
        // Update UI to reflect changes
        updateUI();
        
        // Optional: Show a subtle indication that auto-save occurred
        console.log('Auto-saved annotation:', annotation.id);
        
    } catch (error) {
        console.error('Error during auto-save:', error);
    }
}

function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

// User Data Retrieval Functions
async function searchUserData() {
    if (!checkFirebaseService()) {
        return;
    }
    
    const userId = prompt('Enter User ID to search for their data:');
    if (!userId || !userId.trim()) {
        showToast('Please enter a valid User ID', 'error');
        return;
    }
    
    try {
        showLoading('Searching user data...');
        
        const result = await loadUserRelatedData(userId.trim());
        
        if (result.success) {
            annotations = result.data;
            currentIndex = 0;
            applyFilters();
            
            if (annotations.length > 0) {
                loadAnnotation(currentIndex);
                showToast(`Loaded ${annotations.length} annotations for user: ${userId}`, 'success');
            } else {
                showToast(`No data found for user: ${userId}`, 'info');
            }
            
            updateUI();
        } else {
            showToast(`Error loading user data: ${result.error}`, 'error');
        }
    } catch (error) {
        console.error('Error searching user data:', error);
        showToast('Error searching user data', 'error');
    } finally {
        hideLoading();
    }
}

async function loadCurrentUserData() {
    if (!isLoggedIn || !currentUser) {
        showToast('Please login first to load your data', 'error');
        return;
    }
    
    if (!checkFirebaseService()) {
        return;
    }
    
    try {
        showLoading('Loading your data...');
        
        const result = await loadUserRelatedData(currentUser.userId || currentUser.id);
        
        if (result.success) {
            annotations = result.data;
            currentIndex = 0;
            applyFilters();
            
            if (annotations.length > 0) {
                loadAnnotation(currentIndex);
                showToast(`Loaded ${annotations.length} of your annotations`, 'success');
            } else {
                showToast('No annotations found for your account', 'info');
            }
            
            updateUI();
        } else {
            showToast(`Error loading your data: ${result.error}`, 'error');
        }
    } catch (error) {
        console.error('Error loading current user data:', error);
        showToast('Error loading your data', 'error');
    } finally {
        hideLoading();
    }
}

async function loadUserRelatedData(userId) {
    try {
        // Get user information and validate permissions
        const userResult = await FirebaseService.getUserByUserIdWithValidation(userId);
        
        if (!userResult.success) {
            return { success: false, error: userResult.error };
        }
        
        const userInfo = userResult.user;
        
        // Get user's accessible language region codes
        const accessResult = await FirebaseService.getUserAccessibleCsvs(userId);
        
        if (!accessResult.success) {
            return { success: false, error: 'Unable to determine user access permissions' };
        }
        
        const accessibleRegions = accessResult.csvs;
        const hasFullAccess = accessResult.hasFullAccess;
        
        // Load annotations from both collections
        const [creationResult, modificationResult] = await Promise.all([
            FirebaseService.getAnnotationsByUser(userId, FirebaseService.COLLECTIONS.CREATION),
            FirebaseService.getAnnotationsByUser(userId, FirebaseService.COLLECTIONS.MODIFICATION)
        ]);
        
        let allAnnotations = [];
        
        // Combine annotations from both collections
        if (creationResult.success) {
            allAnnotations = allAnnotations.concat(creationResult.data || []);
        }
        
        if (modificationResult.success) {
            allAnnotations = allAnnotations.concat(modificationResult.data || []);
        }
        
        // Filter annotations based on user's accessible regions
        let filteredAnnotations = allAnnotations;
        
        if (!hasFullAccess && accessibleRegions.length > 0) {
            filteredAnnotations = allAnnotations.filter(annotation => {
                // Check if annotation has language region information
                const annotationRegion = annotation.languageRegionCode || annotation.language_region || 
                                       extractRegionFromData(annotation);
                
                if (!annotationRegion) {
                    // If no region info, allow access (backward compatibility)
                    return true;
                }
                
                return accessibleRegions.includes(annotationRegion);
            });
        }
        
        // Sort by timestamp (newest first)
        filteredAnnotations.sort((a, b) => {
            const timeA = new Date(a.timestamp || a.createdAt || 0);
            const timeB = new Date(b.timestamp || b.createdAt || 0);
            return timeB - timeA;
        });
        
        return {
            success: true,
            data: filteredAnnotations,
            userInfo: userInfo,
            totalCount: allAnnotations.length,
            filteredCount: filteredAnnotations.length,
            accessibleRegions: accessibleRegions
        };
        
    } catch (error) {
        console.error('Error loading user related data:', error);
        return { success: false, error: error.message };
    }
}

function extractRegionFromData(annotation) {
    // Try to extract region code from various possible fields
    if (annotation.metadata && annotation.metadata.region) {
        return annotation.metadata.region;
    }
    
    if (annotation.sourceFile) {
        // Try to extract from filename like "zh_cn_data.csv"
        const match = annotation.sourceFile.match(/([a-z]{2}_[a-z]{2})/i);
        if (match) {
            return match[1].toLowerCase();
        }
    }
    
    if (annotation.topic) {
        // Some topics might contain region info
        const match = annotation.topic.match(/([a-z]{2}_[a-z]{2})/i);
        if (match) {
            return match[1].toLowerCase();
        }
    }
    
    return null;
}

async function saveUserRelatedData(targetUserId) {
    if (!checkFirebaseService()) {
        return { success: false, error: 'Firebase service not available' };
    }
    
    if (!targetUserId) {
        targetUserId = currentUser ? (currentUser.userId || currentUser.id) : null;
    }
    
    if (!targetUserId) {
        return { success: false, error: 'No target user specified' };
    }
    
    try {
        showLoading('Saving annotations...');
        
        // Determine which collection to use based on task mode
        const collectionName = currentTaskMode === 'modification' 
            ? FirebaseService.COLLECTIONS.MODIFICATION 
            : FirebaseService.COLLECTIONS.CREATION;
        
        // Add user tracking to all annotations
        const annotationsToSave = annotations.map(annotation => ({
            ...annotation,
            annotatorId: targetUserId,
            lastModifiedBy: currentUser ? (currentUser.userId || currentUser.id) : targetUserId,
            lastModified: new Date().toISOString(),
            taskMode: currentTaskMode
        }));
        
        // Save all annotations
        const saveResult = await FirebaseService.saveAllToCollection(collectionName, annotationsToSave);
        
        if (saveResult.success) {
            // Update assignment progress if user is logged in
            if (isLoggedIn && currentUser && targetUserId === (currentUser.userId || currentUser.id)) {
                await updateAssignmentProgress();
            }
            
            showToast(`Successfully saved ${annotationsToSave.length} annotations`, 'success');
            return { success: true, count: annotationsToSave.length };
        } else {
            showToast(`Error saving annotations: ${saveResult.error}`, 'error');
            return { success: false, error: saveResult.error };
        }
        
    } catch (error) {
        console.error('Error saving user related data:', error);
        showToast('Error saving annotations', 'error');
        return { success: false, error: error.message };
    } finally {
        hideLoading();
    }
}

// UI functions
function updateUI() {
    updateStatistics();
    updateFilteredAnnotations();
    updateDisplayElements();
}

function updateStatistics() {
    elements.totalAnnotators.textContent = `Total Annotators: ${allUsers.length}`;
    elements.totalAssignments.textContent = `Total Assignments: ${allAssignments.length}`;
    elements.totalCompleted.textContent = `Total Completed: ${annotations.filter(a => a.completed).length}`;
}

// Filter annotations based on current filter settings
function applyFilters() {
    if (!annotations || annotations.length === 0) {
        filteredAnnotations = [];
        updateUI();
        return;
    }
    
    const topicFilter = elements.topicFilter ? elements.topicFilter.value.toLowerCase() : '';
    const statusFilter = elements.statusFilter ? elements.statusFilter.value.toLowerCase() : '';
    const annotationStatusFilter = elements.annotationStatusFilter ? elements.annotationStatusFilter.value.toLowerCase() : '';
    
    filteredAnnotations = annotations.filter(annotation => {
        // Topic filter
        const topicMatch = !topicFilter || 
            (annotation.topic && annotation.topic.toLowerCase().includes(topicFilter));
        
        // Status filter (for completion status)
        let statusMatch = true;
        if (statusFilter) {
            if (statusFilter === 'completed') {
                statusMatch = annotation.completed === true;
            } else if (statusFilter === 'incomplete') {
                statusMatch = annotation.completed !== true;
            } else {
                statusMatch = (annotation.status && annotation.status.toLowerCase().includes(statusFilter));
            }
        }
        
        // Annotation status filter (for accept/revise/reject)
        const annotationStatusMatch = !annotationStatusFilter || 
            (annotation.annotationStatus && annotation.annotationStatus.toLowerCase().includes(annotationStatusFilter));
        
        return topicMatch && statusMatch && annotationStatusMatch;
    });
    
    // Update current index if it's out of bounds
    if (currentIndex >= filteredAnnotations.length) {
        currentIndex = Math.max(0, filteredAnnotations.length - 1);
    }
    
    // Load current annotation if available
    if (filteredAnnotations.length > 0) {
        loadAnnotation(currentIndex);
    } else {
        clearForm();
    }
    
    updateUI();
}

// Clear all filters
function clearFilters() {
    if (elements.topicFilter) elements.topicFilter.value = '';
    if (elements.statusFilter) elements.statusFilter.value = '';
    if (elements.annotationStatusFilter) elements.annotationStatusFilter.value = '';
    
    applyFilters();
    showToast('Filters cleared', 'success');
}

function updateFilteredAnnotations() {
    filteredAnnotations = annotations.filter(annotation => {
        const topicMatch = !elements.topicFilter.value || annotation.topic.toLowerCase().includes(elements.topicFilter.value.toLowerCase());
        const statusMatch = !elements.statusFilter.value || annotation.annotationStatus.toLowerCase().includes(elements.statusFilter.value.toLowerCase());
        const annotationStatusMatch = !elements.annotationStatusFilter.value || annotation.annotationStatus.toLowerCase().includes(elements.annotationStatusFilter.value.toLowerCase());
        return topicMatch && statusMatch && annotationStatusMatch;
    });
    
    elements.totalCount.textContent = `Total Annotations: ${filteredAnnotations.length}`;
}

function updateDisplayElements() {
    if (filteredAnnotations.length === 0) {
        elements.emptyState.classList.remove('hidden');
        elements.loadingOverlay.classList.add('hidden');
    } else {
        elements.emptyState.classList.add('hidden');
        elements.loadingOverlay.classList.remove('hidden');
    }
    
    elements.annotatorsTableBody.innerHTML = '';
    elements.assignmentsTableBody.innerHTML = '';
    
    filteredAnnotations.forEach((annotation, index) => {
        const row = document.createElement('tr');
        row.dataset.index = index;
        
        row.innerHTML = `
            <td>${annotation.topic}</td>
            <td>${annotation.scenario}</td>
            <td>${annotation.question}</td>
            <td>${annotation.answer}</td>
            <td>${annotation.explanation}</td>
            <td>${annotation.annotationStatus}</td>
            <td>${annotation.completed ? 'Yes' : 'No'}</td>
            <td>
                <button class="btn btn-primary" onclick="loadAnnotation(${index})">Edit</button>
                <button class="btn btn-danger" onclick="deleteCurrentAnnotation()">Delete</button>
            </td>
        `;
        
        elements.annotatorsTableBody.appendChild(row);
    });
}

function showToast(message, type) {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    elements.toastContainer.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 5000);
}

function showLoading(message) {
    elements.loadingOverlay.classList.remove('hidden');
    elements.loadingOverlay.textContent = message;
}

function hideLoading() {
    elements.loadingOverlay.classList.add('hidden');
    elements.loadingOverlay.textContent = '';
}

// Utility functions
function generateId() {
    return Math.random().toString(36).substr(2, 9);
}

// Save data to Firebase
async function saveToFirebase() {
    if (typeof FirebaseService === 'undefined') {
        console.error('FirebaseService is not defined. Please check firebase-config.js');
        showToast('Firebase service not available. Please refresh the page.', 'error');
        return;
    }

    if (!currentUser) {
        showToast('Please login first to save data.', 'error');
        return;
    }

    try {
        showLoading('Saving data to Firebase...');
        
        // Determine which collection to save to based on current task mode
        const collectionName = currentTaskMode === 'modification' 
            ? 'cultural_annotations_modified' 
            : 'cultural_annotations_created';
        
        // Save all annotations to Firebase
        const result = await FirebaseService.saveAllToCollection(collectionName, filteredAnnotations);
        
        if (result.success) {
            showToast('Data saved successfully to Firebase!', 'success');
            console.log('Data saved to Firebase successfully');
        } else {
            throw new Error(result.error || 'Failed to save data');
        }
    } catch (error) {
        console.error('Error saving to Firebase:', error);
        showToast(`Failed to save data: ${error.message}`, 'error');
    } finally {
        hideLoading();
    }
}

// Export annotations to CSV file
function exportToCSV() {
    try {
        if (!filteredAnnotations || filteredAnnotations.length === 0) {
            showToast('No data to export. Please load or create some annotations first.', 'error');
            return;
        }

        // Create CSV headers
        const headers = [
            'ID',
            'Topic',
            'Scenario', 
            'Question',
            'Answer',
            'Explanation',
            'Language Region',
            'Annotation Status',
            'Completed',
            'Annotator ID',
            'Created At',
            'Last Modified'
        ];

        // Convert annotations to CSV rows
        const csvRows = [headers.join(',')];
        
        filteredAnnotations.forEach((annotation, index) => {
            const row = [
                annotation.id || index + 1,
                `"${(annotation.topic || '').replace(/"/g, '""')}"`,
                `"${(annotation.scenario || '').replace(/"/g, '""')}"`,
                `"${(annotation.question || '').replace(/"/g, '""')}"`,
                `"${(annotation.answer || '').replace(/"/g, '""')}"`,
                `"${(annotation.explanation || '').replace(/"/g, '""')}"`,
                annotation.languageRegion || '',
                annotation.annotationStatus || 'pending',
                annotation.completed ? 'Yes' : 'No',
                annotation.annotatorId || currentUser?.userId || '',
                annotation.createdAt || new Date().toISOString(),
                annotation.lastModified || new Date().toISOString()
            ];
            csvRows.push(row.join(','));
        });

        // Create CSV content
        const csvContent = csvRows.join('\n');
        
        // Create and download file
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            
            // Generate filename with timestamp
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const mode = currentTaskMode || 'annotations';
            const filename = `cultural_${mode}_${timestamp}.csv`;
            
            link.setAttribute('download', filename);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            showToast(`Successfully exported ${filteredAnnotations.length} annotations to ${filename}`, 'success');
            console.log(`Exported ${filteredAnnotations.length} annotations to CSV`);
        } else {
            throw new Error('CSV download not supported in this browser');
        }
    } catch (error) {
        console.error('Error exporting to CSV:', error);
        showToast(`Failed to export CSV: ${error.message}`, 'error');
    }
}

// Handle CSV file import
function handleFileImport(event) {
    const files = event.target.files;
    if (!files || files.length === 0) {
        showToast('No files selected', 'error');
        return;
    }

    try {
        showLoading('Processing CSV files...');
        
        const filePromises = Array.from(files).map(file => {
            return new Promise((resolve, reject) => {
                if (!file.name.toLowerCase().endsWith('.csv')) {
                    reject(new Error(`${file.name} is not a CSV file`));
                    return;
                }

                const reader = new FileReader();
                reader.onload = function(e) {
                    try {
                        const csvContent = e.target.result;
                        const parsedData = parseCSV(csvContent, file.name);
                        resolve(parsedData);
                    } catch (error) {
                        reject(new Error(`Error parsing ${file.name}: ${error.message}`));
                    }
                };
                reader.onerror = function() {
                    reject(new Error(`Error reading ${file.name}`));
                };
                reader.readAsText(file);
            });
        });

        Promise.all(filePromises)
            .then(results => {
                // Flatten all results into a single array
                const allAnnotations = results.flat();
                
                if (allAnnotations.length === 0) {
                    showToast('No valid annotations found in the uploaded files', 'warning');
                    return;
                }

                // Add imported annotations to the existing array
                annotations = annotations.concat(allAnnotations);
                currentIndex = 0;
                
                // Apply filters and update UI
                applyFilters();
                if (filteredAnnotations.length > 0) {
                    loadAnnotation(currentIndex);
                }
                updateUI();
                
                showToast(`Successfully imported ${allAnnotations.length} annotations from ${files.length} file(s)`, 'success');
                console.log(`Imported ${allAnnotations.length} annotations from ${files.length} files`);
            })
            .catch(error => {
                console.error('Error importing files:', error);
                showToast(`Failed to import files: ${error.message}`, 'error');
            })
            .finally(() => {
                hideLoading();
                // Clear the file input
                event.target.value = '';
            });

    } catch (error) {
        console.error('Error handling file import:', error);
        showToast(`Error importing files: ${error.message}`, 'error');
        hideLoading();
    }
}

// Parse CSV content into annotation objects
function parseCSV(csvContent, fileName) {
    const lines = csvContent.split('\n').filter(line => line.trim());
    
    if (lines.length === 0) {
        throw new Error('CSV file is empty');
    }

    // Parse header row
    const headers = lines[0].split(',').map(header => header.trim().replace(/"/g, ''));
    
    if (lines.length === 1) {
        throw new Error('CSV file contains only headers');
    }

    const annotations = [];
    
    // Process data rows
    for (let i = 1; i < lines.length; i++) {
        try {
            const values = parseCSVLine(lines[i]);
            
            if (values.length !== headers.length) {
                console.warn(`Row ${i + 1} in ${fileName} has ${values.length} values but expected ${headers.length}. Skipping.`);
                continue;
            }

            const annotation = {
                id: generateId(),
                sourceFile: fileName,
                createdAt: new Date().toISOString(),
                lastModified: new Date().toISOString()
            };

            // Map CSV columns to annotation properties
            headers.forEach((header, index) => {
                const value = values[index];
                const normalizedHeader = header.toLowerCase().replace(/\s+/g, '');
                
                switch (normalizedHeader) {
                    case 'id':
                        // Keep original ID if provided, otherwise use generated one
                        if (value && value.trim()) {
                            annotation.originalId = value.trim();
                        }
                        break;
                    case 'topic':
                        annotation.topic = value || '';
                        break;
                    case 'scenario':
                        annotation.scenario = value || '';
                        break;
                    case 'question':
                        annotation.question = value || '';
                        break;
                    case 'answer':
                        annotation.answer = value || '';
                        break;
                    case 'explanation':
                        annotation.explanation = value || '';
                        break;
                    case 'sourceexcerpt':
                    case 'source_excerpt':
                    case 'source':
                        annotation.sourceExcerpt = value || '';
                        break;
                    case 'languageregion':
                    case 'language_region':
                    case 'region':
                        annotation.languageRegion = value || '';
                        break;
                    case 'annotationstatus':
                    case 'annotation_status':
                    case 'status':
                        annotation.annotationStatus = value || 'pending';
                        break;
                    case 'rejectionreason':
                    case 'rejection_reason':
                        annotation.rejectionReason = value || '';
                        break;
                    case 'completed':
                        annotation.completed = value === 'true' || value === 'Yes' || value === '1';
                        break;
                    case 'annotatorid':
                    case 'annotator_id':
                    case 'annotator':
                        annotation.annotatorId = value || '';
                        break;
                    case 'createdat':
                    case 'created_at':
                        if (value && value.trim()) {
                            annotation.createdAt = value.trim();
                        }
                        break;
                    case 'lastmodified':
                    case 'last_modified':
                        if (value && value.trim()) {
                            annotation.lastModified = value.trim();
                        }
                        break;
                    default:
                        // Store any additional columns as metadata
                        if (!annotation.metadata) {
                            annotation.metadata = {};
                        }
                        annotation.metadata[header] = value;
                        break;
                }
            });

            // Validate required fields
            if (!annotation.topic && !annotation.question && !annotation.answer) {
                console.warn(`Row ${i + 1} in ${fileName} is missing required fields. Skipping.`);
                continue;
            }

            // Set completion status based on content
            if (annotation.completed === undefined) {
                annotation.completed = isAnnotationComplete(annotation);
            }

            annotations.push(annotation);
            
        } catch (error) {
            console.warn(`Error parsing row ${i + 1} in ${fileName}: ${error.message}. Skipping.`);
            continue;
        }
    }

    return annotations;
}

// Parse a single CSV line, handling quoted values and commas
function parseCSVLine(line) {
    const values = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
            if (inQuotes && line[i + 1] === '"') {
                // Escaped quote
                current += '"';
                i++; // Skip next quote
            } else {
                // Toggle quote state
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            // End of field
            values.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }
    
    // Add the last field
    values.push(current.trim());
    
    return values;
}