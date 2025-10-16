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
    
    // Load modification-specific fields
    if (currentTaskMode === 'modification') {
        elements.sourceExcerpt.value = annotation.sourceExcerpt || '';
        elements.annotationStatus.value = annotation.annotationStatus || 'pending';
        elements.rejectionReason.value = annotation.rejectionReason || '';
        
        // Update decision buttons
        document.querySelectorAll('.btn-decision').forEach(btn => btn.classList.remove('active'));
        if (annotation.annotationStatus) {
            const activeBtn = document.getElementById(annotation.annotationStatus + 'Btn');
            if (activeBtn) activeBtn.classList.add('active');
            
            // Show/hide rejection reason
            if (annotation.annotationStatus === 'reject') {
                elements.rejectionReasonGroup.style.display = 'block';
                setFormFieldsReadonly(true);
            } else if (annotation.annotationStatus === 'accept') {
                elements.rejectionReasonGroup.style.display = 'none';
                setFormFieldsReadonly(true);
            } else {
                elements.rejectionReasonGroup.style.display = 'none';
                setFormFieldsReadonly(false);
            }
        }
    }
    
    isEditing = true;
}

function clearForm() {
    elements.topicSelect.value = '';
    elements.scenarioInput.value = '';
    elements.questionInput.value = '';
    elements.answerInput.value = '';
    elements.explanationInput.value = '';
    
    if (currentTaskMode === 'modification') {
        elements.sourceExcerpt.value = '';
        elements.annotationStatus.value = '';
        elements.rejectionReason.value = '';
        elements.rejectionReasonGroup.style.display = 'none';
        document.querySelectorAll('.btn-decision').forEach(btn => btn.classList.remove('active'));
        setFormFieldsReadonly(false);
    }
    
    isEditing = false;
}

function getFormData() {
    const data = {
        topic: elements.topicSelect.value.trim(),
        scenario: elements.scenarioInput.value.trim(),
        question: elements.questionInput.value.trim(),
        answer: elements.answerInput.value.trim(),
        explanation: elements.explanationInput.value.trim()
    };
    
    if (currentTaskMode === 'modification') {
        data.sourceExcerpt = elements.sourceExcerpt.value.trim();
        data.annotationStatus = elements.annotationStatus.value;
        data.rejectionReason = elements.rejectionReason.value;
    }
    
    return data;
}

function isAnnotationComplete(annotation) {
    const basicComplete = annotation.topic && annotation.scenario && annotation.question && 
                         annotation.answer && annotation.explanation;
    
    if (currentTaskMode === 'modification') {
        return basicComplete && annotation.annotationStatus && annotation.annotationStatus !== 'pending';
    }
    
    return basicComplete;
}

// Auto-save functionality
function autoSave() {
    if (isEditing && filteredAnnotations.length > 0) {
        updateCurrentAnnotation();
    }
}

// Filtering
function applyFilters() {
    const topicFilter = elements.topicFilter.value;
    const statusFilter = elements.statusFilter.value;
    const annotationStatusFilter = elements.annotationStatusFilter.value;
    
    filteredAnnotations = annotations.filter(annotation => {
        const topicMatch = !topicFilter || annotation.topic === topicFilter;
        const statusMatch = !statusFilter || 
            (statusFilter === 'completed' && annotation.completed) ||
            (statusFilter === 'incomplete' && !annotation.completed);
        
        let annotationMatch = true;
        if (currentTaskMode === 'modification' && annotationStatusFilter) {
            annotationMatch = annotation.annotationStatus === annotationStatusFilter ||
                            (annotationStatusFilter === 'pending' && (!annotation.annotationStatus || annotation.annotationStatus === 'pending'));
        }
        
        return topicMatch && statusMatch && annotationMatch;
    });
    
    // Adjust current index
    if (currentIndex >= filteredAnnotations.length) {
        currentIndex = Math.max(0, filteredAnnotations.length - 1);
    }
    
    updateTopicFilter();
}

function clearFilters() {
    elements.topicFilter.value = '';
    elements.statusFilter.value = '';
    elements.annotationStatusFilter.value = '';
    applyFilters();
    updateUI();
}

function updateTopicFilter() {
    const topics = [...new Set(annotations.map(a => a.topic).filter(t => t))];
    const currentValue = elements.topicFilter.value;
    
    elements.topicFilter.innerHTML = '<option value="">All Topics</option>';
    topics.forEach(topic => {
        const option = document.createElement('option');
        option.value = topic;
        option.textContent = topic;
        if (topic === currentValue) option.selected = true;
        elements.topicFilter.appendChild(option);
    });
}

// UI updates
function updateUI() {
    updateStats();
    updateNavigation();
    updateFormVisibility();
    updateButtons();
}

function updateStats() {
    const total = annotations.length;
    const completed = annotations.filter(a => a.completed).length;
    const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    elements.totalCount.textContent = total;
    elements.completedCount.textContent = completed;
    elements.progressPercent.textContent = `${progress}%`;
    
    if (currentTaskMode === 'modification') {
        const accepted = annotations.filter(a => a.annotationStatus === 'accept').length;
        const revised = annotations.filter(a => a.annotationStatus === 'revise').length;
        const rejected = annotations.filter(a => a.annotationStatus === 'reject').length;
        
        elements.acceptedCount.textContent = accepted;
        elements.revisedCount.textContent = revised;
        elements.rejectedCount.textContent = rejected;
    }
}

function updateNavigation() {
    const hasItems = filteredAnnotations.length > 0;
    
    elements.prevBtn.disabled = !hasItems;
    elements.nextBtn.disabled = !hasItems;
    
    if (hasItems) {
        elements.itemCounter.textContent = `${currentIndex + 1} / ${filteredAnnotations.length}`;
    } else {
        elements.itemCounter.textContent = '0 / 0';
    }
}

function updateFormVisibility() {
    const hasItems = filteredAnnotations.length > 0;
    
    if (hasItems) {
        elements.annotationForm.classList.add('active');
        elements.emptyState.classList.add('hidden');
    } else {
        elements.annotationForm.classList.remove('active');
        elements.emptyState.classList.remove('hidden');
    }
}

function updateButtons() {
    const hasItems = filteredAnnotations.length > 0;
    
    elements.updateBtn.disabled = !hasItems;
    elements.deleteBtn.disabled = !hasItems;
    elements.exportBtn.disabled = annotations.length === 0;
    elements.saveBtn.disabled = annotations.length === 0;
}

// File operations
function handleFileImport(event) {
    const files = Array.from(event.target.files);
    if (!files.length) return;
    
    // Validate all files first
    const invalidFiles = files.filter(file => {
        const isCSV = file.type === 'text/csv' || file.name.endsWith('.csv');
        const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');
        return !isCSV && !isExcel;
    });
    
    if (invalidFiles.length > 0) {
        showToast(`Invalid file types: ${invalidFiles.map(f => f.name).join(', ')}. Please select only CSV or Excel files.`, 'error');
        return;
    }
    
    showLoading(true);
    
    let totalImported = 0;
    let processedFiles = 0;
    let allImportedData = [];
    let hasErrors = false;
    
    // Process each file
    files.forEach((file, index) => {
        const isCSV = file.type === 'text/csv' || file.name.endsWith('.csv');
        const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');
        
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                let imported;
                if (isCSV) {
                    imported = parseCSV(e.target.result);
                } else {
                    // For Excel files, we'll treat them as CSV for now
                    // In a real implementation, you'd use a library like SheetJS
                    showToast(`Excel import not fully implemented for ${file.name}. Please convert to CSV first.`, 'warning');
                    hasErrors = true;
                    imported = [];
                }
                
                if (imported.length > 0) {
                    allImportedData = allImportedData.concat(imported);
                    totalImported += imported.length;
                }
                
            } catch (error) {
                console.error(`Import error for ${file.name}:`, error);
                showToast(`Error importing ${file.name}: ${error.message}`, 'error');
                hasErrors = true;
            }
            
            processedFiles++;
            
            // When all files are processed
            if (processedFiles === files.length) {
                try {
                    if (allImportedData.length > 0) {
                        // Append to existing annotations instead of replacing
                        annotations = annotations.concat(allImportedData);
                        currentIndex = 0;
                        applyFilters();
                        
                        if (filteredAnnotations.length > 0) {
                            loadAnnotation(currentIndex);
                        }
                        
                        updateUI();
                        
                        const successMessage = files.length === 1 
                            ? `Imported ${totalImported} annotations from ${files[0].name}`
                            : `Imported ${totalImported} annotations from ${files.length} files`;
                        showToast(successMessage, 'success');
                    } else {
                        showToast('No valid data found in any file', 'warning');
                    }
                } catch (error) {
                    console.error('Final processing error:', error);
                    showToast('Error processing imported data: ' + error.message, 'error');
                } finally {
                    showLoading(false);
                    event.target.value = ''; // Reset file input
                }
            }
        };
        
        reader.onerror = function() {
            showToast(`Error reading file: ${file.name}`, 'error');
            hasErrors = true;
            processedFiles++;
            
            if (processedFiles === files.length) {
                showLoading(false);
                event.target.value = '';
            }
        };
        
        reader.readAsText(file);
    });
}

function parseCSV(csv) {
    const lines = csv.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];
    
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, '').toLowerCase());
    const requiredHeaders = ['topic', 'scenario', 'question', 'answer', 'explanation'];
    const modificationHeaders = ['source_excerpt'];
    
    // Check for required headers
    const hasRequiredHeaders = requiredHeaders.every(header => 
        headers.some(h => h === header)
    );
    
    if (!hasRequiredHeaders) {
        throw new Error('CSV must contain columns: ' + requiredHeaders.join(', '));
    }
    
    // Check if this is modification data
    const hasModificationData = modificationHeaders.some(header =>
        headers.some(h => h === header)
    );
    
    const annotations = [];
    
    for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);
        if (values.length >= headers.length) {
            const annotation = {
                id: generateId(),
                topic: '',
                scenario: '',
                question: '',
                answer: '',
                explanation: '',
                completed: false,
                createdAt: new Date().toISOString()
            };
            
            // Add modification-specific fields if detected
            if (hasModificationData) {
                annotation.sourceExcerpt = '';
                annotation.annotationStatus = 'pending';
                annotation.rejectionReason = '';
            }
            
            headers.forEach((header, index) => {
                const value = values[index] || '';
                switch(header) {
                    case 'topic':
                        annotation.topic = value;
                        break;
                    case 'scenario':
                        annotation.scenario = value;
                        break;
                    case 'question':
                        annotation.question = value;
                        break;
                    case 'answer':
                        annotation.answer = value;
                        break;
                    case 'explanation':
                        annotation.explanation = value;
                        break;
                    case 'source_excerpt':
                        annotation.sourceExcerpt = value;
                        break;
                }
            });
            
            annotation.completed = isAnnotationComplete(annotation);
            annotations.push(annotation);
        }
    }
    
    return annotations;
}

function parseCSVLine(line) {
    const values = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            values.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }
    
    values.push(current.trim());
    return values.map(v => v.replace(/^"|"$/g, ''));
}

function exportToCSV() {
    if (annotations.length === 0) {
        showToast('No data to export', 'warning');
        return;
    }
    
    let headers, filename;
    
    if (currentTaskMode === 'modification') {
        headers = ['source_excerpt', 'topic', 'scenario', 'question', 'answer', 'explanation', 'annotation_status', 'rejection_reason'];
        filename = `cultural_annotations_modified_${new Date().toISOString().split('T')[0]}.csv`;
    } else {
        headers = ['topic', 'scenario', 'question', 'answer', 'explanation'];
        filename = `cultural_annotations_created_${new Date().toISOString().split('T')[0]}.csv`;
    }
    
    const csvContent = [
        headers.join(','),
        ...annotations.map(annotation => 
            headers.map(header => {
                const key = header.replace('_', '');
                const value = annotation[key] || '';
                return `"${value.replace(/"/g, '""')}"`;
            }).join(',')
        )
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showToast('CSV exported successfully', 'success');
}

// Firebase operations
async function saveToFirebase() {
    if (!isLoggedIn || !currentUser) {
        showToast('Please log in to save data', 'warning');
        showLoginModal();
        return;
    }
    
    if (annotations.length === 0) {
        showToast('No data to save', 'warning');
        return;
    }
    
    showLoading(true);
    
    try {
        const collectionName = currentTaskMode === 'modification' ? 
            'cultural_annotations_modified' : 'cultural_annotations_created';
        
        // Add user information to each annotation
        const annotationsWithUser = annotations.map(annotation => ({
            ...annotation,
            annotatorId: currentUser.id,
            annotatorName: currentUser.name,
            lastModifiedBy: currentUser.id,
            lastModified: new Date().toISOString()
        }));
        
        // Clear existing data first
        const clearResult = await FirebaseService.clearCollection(collectionName);
        if (!clearResult.success) {
            throw new Error(clearResult.error);
        }
        
        // Save all annotations with user tracking
        const saveResult = await FirebaseService.saveAllToCollection(collectionName, annotationsWithUser);
        if (!saveResult.success) {
            throw new Error(saveResult.error);
        }
        
        // Update user activity
        await FirebaseService.updateUserActivity(currentUser.id);
        
        showToast('Data saved to Firebase successfully', 'success');
    } catch (error) {
        console.error('Firebase save error:', error);
        showToast('Error saving to Firebase: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

async function loadFromFirebase() {
    showLoading(true);
    
    try {
        const collectionName = currentTaskMode === 'modification' ? 
            'cultural_annotations_modified' : 'cultural_annotations_created';
        
        const result = await FirebaseService.loadFromCollection(collectionName);
        if (result.success && result.data.length > 0) {
            annotations = result.data.map(item => ({
                id: item.id,
                sourceExcerpt: item.sourceExcerpt || '',
                topic: item.topic || '',
                scenario: item.scenario || '',
                question: item.question || '',
                answer: item.answer || '',
                explanation: item.explanation || '',
                annotationStatus: item.annotationStatus || 'pending',
                rejectionReason: item.rejectionReason || '',
                completed: item.completed || false,
                createdAt: item.createdAt || new Date().toISOString(),
                lastModified: item.lastModified
            }));
            
            currentIndex = 0;
            applyFilters();
            
            if (filteredAnnotations.length > 0) {
                loadAnnotation(currentIndex);
            }
            
            updateUI();
            showToast(`Loaded ${annotations.length} annotations from Firebase`, 'success');
        }
    } catch (error) {
        console.error('Firebase load error:', error);
        showToast('Error loading from Firebase: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

// Utility functions
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

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

// User Management Functions
function initializeUserManagement() {
    // Add user management event listeners
    if (elements.loginBtn) {
        elements.loginBtn.addEventListener('click', showLoginModal);
    }
    
    if (elements.logoutBtn) {
        elements.logoutBtn.addEventListener('click', handleLogout);
    }
    
    if (elements.manageBtn) {
        elements.manageBtn.addEventListener('click', showManageModal);
    }
    
    // Modal close events
    if (elements.loginModalClose) {
        elements.loginModalClose.addEventListener('click', hideLoginModal);
    }
    
    if (elements.manageModalClose) {
        elements.manageModalClose.addEventListener('click', hideManageModal);
    }
    
    if (elements.assignmentModalClose) {
        elements.assignmentModalClose.addEventListener('click', hideAssignmentModal);
    }
    
    // Form events
    if (elements.loginForm) {
        elements.loginForm.addEventListener('submit', handleLogin);
    }
    
    if (elements.loginCancel) {
        elements.loginCancel.addEventListener('click', hideLoginModal);
    }
    
    if (elements.assignmentForm) {
        elements.assignmentForm.addEventListener('submit', handleCreateAssignment);
    }
    
    if (elements.assignmentCancel) {
        elements.assignmentCancel.addEventListener('click', hideAssignmentModal);
    }
    
    // Tab switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const tabName = e.target.dataset.tab;
            switchTab(tabName);
        });
    });
    
    // Management actions
    if (elements.addAnnotatorBtn) {
        elements.addAnnotatorBtn.addEventListener('click', showAddAnnotatorForm);
    }
    
    if (elements.createAssignmentBtn) {
        elements.createAssignmentBtn.addEventListener('click', showAssignmentModal);
    }
    
    if (elements.generateReportBtn) {
        elements.generateReportBtn.addEventListener('click', generateProgressReport);
    }
    
    // Close modals when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            e.target.classList.remove('active');
        }
    });
}

function checkLoginStatus() {
    // Check if user is stored in localStorage
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
        try {
            currentUser = JSON.parse(storedUser);
            isLoggedIn = true;
            updateUserInterface();
            loadUserData();
        } catch (error) {
            console.error('Error parsing stored user:', error);
            localStorage.removeItem('currentUser');
        }
    } else {
        updateUserInterface();
    }
}

function updateUserInterface() {
    if (isLoggedIn && currentUser) {
        // Show logged in state
        if (elements.loginBtn) elements.loginBtn.style.display = 'none';
        if (elements.userInfo) elements.userInfo.style.display = 'flex';
        if (elements.dataActions) elements.dataActions.style.display = 'flex';
        
        // Update user info
        if (elements.userName) elements.userName.textContent = currentUser.name;
        if (elements.userRole) elements.userRole.textContent = currentUser.role;
        
        // Show manage button for admins
        if (elements.manageBtn) {
            elements.manageBtn.style.display = currentUser.role === 'admin' ? 'inline-flex' : 'none';
        }
        
        // Load user's data
        loadFromFirebase();
    } else {
        // Show logged out state
        if (elements.loginBtn) elements.loginBtn.style.display = 'inline-flex';
        if (elements.userInfo) elements.userInfo.style.display = 'none';
        if (elements.dataActions) elements.dataActions.style.display = 'none';
        
        // Clear data
        annotations = [];
        updateUI();
    }
}

function showLoginModal() {
    if (elements.loginModal) {
        elements.loginModal.classList.add('active');
        if (elements.loginUserId) elements.loginUserId.focus();
    }
}

function hideLoginModal() {
    if (elements.loginModal) {
        elements.loginModal.classList.remove('active');
        if (elements.loginForm) elements.loginForm.reset();
    }
}

async function handleLogin(e) {
    e.preventDefault();
    
    const userId = elements.loginUserId.value.trim();
    const role = elements.loginRole.value;
    const editingUserId = elements.loginForm.dataset.editingUserId;
    
    if (!userId || !role) {
        showToast('Please fill in all fields', 'error');
        return;
    }
    
    showLoading(true);
    
    try {
        if (editingUserId) {
            // Update existing user
            const updateResult = await FirebaseService.updateUser(editingUserId, {
                userId,
                role,
                name: userId // Use userId as name for simplified login
            });
            
            if (!updateResult.success) {
                throw new Error(updateResult.error);
            }
            
            // Update local data
            const userIndex = allUsers.findIndex(u => u.id === editingUserId);
            if (userIndex !== -1) {
                allUsers[userIndex] = { ...allUsers[userIndex], userId, role, name: userId };
            }
            
            // If editing current user, update current user data
            if (currentUser && currentUser.id === editingUserId) {
                currentUser = { ...currentUser, userId, role, name: userId };
                localStorage.setItem('currentUser', JSON.stringify(currentUser));
                updateUserInterface();
            }
            
            hideLoginModal();
            loadAnnotatorsData();
            showToast('User updated successfully', 'success');
            
            // Clear editing state
            delete elements.loginForm.dataset.editingUserId;
            
        } else {
            // Check if user exists for login/creation
            const userResult = await FirebaseService.getUserByUserId(userId);
            
            if (userResult.success) {
                // User exists, log them in
                currentUser = userResult.user;
            } else {
                // Create new user with simplified structure
                const createResult = await FirebaseService.createUser({
                    userId,
                    name: userId, // Use userId as display name
                    role,
                    email: '', // Empty email for simplified login
                    createdAt: new Date().toISOString()
                });
                
                if (!createResult.success) {
                    throw new Error(createResult.error);
                }
                
                currentUser = { 
                    id: createResult.id, 
                    userId, 
                    name: userId,
                    role,
                    email: ''
                };
            }
            
            // Update activity
            await FirebaseService.updateUserActivity(currentUser.id);
            
            // Create session
            const sessionResult = await FirebaseService.createSession(currentUser.id, {
                loginTime: new Date().toISOString(),
                userAgent: navigator.userAgent
            });
            
            if (sessionResult.success) {
                currentSession = sessionResult.sessionId;
            }
            
            // Store user in localStorage
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            
            isLoggedIn = true;
            hideLoginModal();
            updateUserInterface();
            showToast(`Welcome, ${currentUser.name}!`, 'success');
        }
        
    } catch (error) {
        console.error('Login/Update error:', error);
        showToast('Operation failed: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

async function handleLogout() {
    if (currentSession) {
        await FirebaseService.endSession(currentSession);
    }
    
    currentUser = null;
    currentSession = null;
    isLoggedIn = false;
    
    localStorage.removeItem('currentUser');
    updateUserInterface();
    showToast('Logged out successfully', 'success');
}

function showManageModal() {
    if (elements.manageModal) {
        elements.manageModal.classList.add('active');
        switchTab('annotators');
        loadManagementData();
    }
}

function hideManageModal() {
    if (elements.manageModal) {
        elements.manageModal.classList.remove('active');
    }
}

function switchTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Remove active class from all buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show selected tab
    const selectedTab = document.getElementById(tabName + 'Tab');
    if (selectedTab) {
        selectedTab.classList.add('active');
    }
    
    // Activate button
    const selectedBtn = document.querySelector(`[data-tab="${tabName}"]`);
    if (selectedBtn) {
        selectedBtn.classList.add('active');
    }
    
    // Load tab-specific data
    switch (tabName) {
        case 'annotators':
            loadAnnotatorsData();
            break;
        case 'assignments':
            loadAssignmentsData();
            break;
        case 'progress':
            loadProgressData();
            break;
    }
}

async function loadManagementData() {
    showLoading(true);
    
    try {
        const [usersResult, assignmentsResult] = await Promise.all([
            FirebaseService.getAllUsers(),
            FirebaseService.getAllAssignments()
        ]);
        
        if (usersResult.success) {
            allUsers = usersResult.users;
        }
        
        if (assignmentsResult.success) {
            allAssignments = assignmentsResult.assignments;
        }
        
        // Populate dropdowns
        populateUserDropdowns();
        
    } catch (error) {
        console.error('Error loading management data:', error);
        showToast('Error loading management data', 'error');
    } finally {
        showLoading(false);
    }
}

function populateUserDropdowns() {
    // Populate assignment annotator dropdown
    if (elements.assignmentAnnotator) {
        elements.assignmentAnnotator.innerHTML = '<option value="">Select annotator</option>';
        allUsers.filter(u => u.role === 'annotator').forEach(user => {
            const option = document.createElement('option');
            option.value = user.id;
            option.textContent = user.name;
            elements.assignmentAnnotator.appendChild(option);
        });
    }
    
    // Populate report filter dropdown
    if (elements.reportAnnotatorFilter) {
        elements.reportAnnotatorFilter.innerHTML = '<option value="">All Annotators</option>';
        allUsers.forEach(user => {
            const option = document.createElement('option');
            option.value = user.id;
            option.textContent = user.name;
            elements.reportAnnotatorFilter.appendChild(option);
        });
    }
    
    // Populate assignment topic filter
    if (elements.assignmentTopicFilter) {
        const topics = ['Belief', 'Commerce', 'Education', 'Entertainment', 'Finance', 'Food', 
                       'Government', 'Habitat', 'Health', 'Heritage', 'Language', 'Pets', 
                       'Science', 'Social', 'Travel', 'Work'];
        
        elements.assignmentTopicFilter.innerHTML = '<option value="">All topics</option>';
        topics.forEach(topic => {
            const option = document.createElement('option');
            option.value = topic;
            option.textContent = topic;
            elements.assignmentTopicFilter.appendChild(option);
        });
    }
}

function loadAnnotatorsData() {
    if (!elements.annotatorsTableBody) return;
    
    elements.annotatorsTableBody.innerHTML = '';
    
    allUsers.forEach(user => {
        const row = document.createElement('tr');
        const userAssignments = allAssignments.filter(a => a.annotatorId === user.id);
        const completedAssignments = userAssignments.filter(a => a.status === 'completed');
        
        row.innerHTML = `
            <td>${user.name || user.userId}</td>
            <td>${user.userId}</td>
            <td><span class="status-badge ${user.role}">${user.role}</span></td>
            <td>${userAssignments.length}</td>
            <td>${completedAssignments.length}</td>
            <td>${user.lastActive ? new Date(user.lastActive.toDate()).toLocaleDateString() : 'Never'}</td>
            <td class="actions">
                <button class="btn btn-outline" onclick="editUser('${user.id}')">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-danger" onclick="deleteUser('${user.id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        
        elements.annotatorsTableBody.appendChild(row);
    });
}

function loadAssignmentsData() {
    if (!elements.assignmentsTableBody) return;
    
    elements.assignmentsTableBody.innerHTML = '';
    
    allAssignments.forEach(assignment => {
        const row = document.createElement('tr');
        const user = allUsers.find(u => u.id === assignment.annotatorId);
        const dueDate = assignment.dueDate ? new Date(assignment.dueDate).toLocaleDateString() : 'No due date';
        
        row.innerHTML = `
            <td>${assignment.id.substring(0, 8)}...</td>
            <td>${user ? user.name : 'Unknown'}</td>
            <td>${assignment.itemCount || 0}</td>
            <td>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${assignment.progress || 0}%"></div>
                </div>
                <span>${assignment.progress || 0}%</span>
            </td>
            <td>${dueDate}</td>
            <td><span class="status-badge ${assignment.status}">${assignment.status}</span></td>
            <td class="actions">
                <button class="btn btn-outline" onclick="editAssignment('${assignment.id}')">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-danger" onclick="deleteAssignment('${assignment.id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        
        elements.assignmentsTableBody.appendChild(row);
    });
}

async function loadProgressData() {
    try {
        const statsResult = await FirebaseService.getOverallStatistics();
        
        if (statsResult.success) {
            const stats = statsResult.stats;
            
            if (elements.totalAnnotators) elements.totalAnnotators.textContent = stats.totalUsers;
            if (elements.totalAssignments) elements.totalAssignments.textContent = stats.totalAssignments;
            if (elements.totalCompleted) elements.totalCompleted.textContent = stats.completedAnnotations;
            if (elements.overallProgress) elements.overallProgress.textContent = stats.overallProgress + '%';
        }
    } catch (error) {
        console.error('Error loading progress data:', error);
        showToast('Error loading progress data', 'error');
    }
}

function showAssignmentModal() {
    if (elements.assignmentModal) {
        elements.assignmentModal.classList.add('active');
        
        // Set default due date to one week from now
        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 7);
        if (elements.assignmentDueDate) {
            elements.assignmentDueDate.value = nextWeek.toISOString().split('T')[0];
        }
    }
}

function hideAssignmentModal() {
    if (elements.assignmentModal) {
        elements.assignmentModal.classList.remove('active');
        if (elements.assignmentForm) elements.assignmentForm.reset();
    }
}

async function handleCreateAssignment(e) {
    e.preventDefault();
    
    const annotatorId = elements.assignmentAnnotator.value;
    const itemCount = parseInt(elements.assignmentCount.value) || 10;
    const topicFilter = elements.assignmentTopicFilter.value;
    const dueDate = elements.assignmentDueDate.value;
    const notes = elements.assignmentNotes.value;
    const editingAssignmentId = elements.assignmentForm.dataset.editingAssignmentId;
    
    if (!annotatorId) {
        showToast('Please select an annotator', 'error');
        return;
    }
    
    showLoading(true);
    
    try {
        if (editingAssignmentId) {
            // Update existing assignment
            const updateResult = await FirebaseService.updateAssignment(editingAssignmentId, {
                annotatorId,
                itemCount,
                topicFilter,
                dueDate,
                notes,
                lastModifiedBy: currentUser.id,
                lastModified: new Date().toISOString()
            });
            
            if (!updateResult.success) {
                throw new Error(updateResult.error);
            }
            
            // Update local data
            const assignmentIndex = allAssignments.findIndex(a => a.id === editingAssignmentId);
            if (assignmentIndex !== -1) {
                allAssignments[assignmentIndex] = {
                    ...allAssignments[assignmentIndex],
                    annotatorId,
                    itemCount,
                    topicFilter,
                    dueDate,
                    notes,
                    lastModifiedBy: currentUser.id,
                    lastModified: new Date().toISOString()
                };
            }
            
            hideAssignmentModal();
            loadAssignmentsData();
            showToast('Assignment updated successfully', 'success');
            
            // Clear editing state
            delete elements.assignmentForm.dataset.editingAssignmentId;
            
        } else {
            // Create new assignment
            const assignmentData = {
                annotatorId,
                itemCount,
                topicFilter,
                dueDate,
                notes,
                createdBy: currentUser.id,
                status: 'active',
                progress: 0,
                createdAt: new Date().toISOString()
            };
            
            const result = await FirebaseService.createAssignment(assignmentData);
            
            if (result.success) {
                // Add to local data
                allAssignments.push({
                    id: result.assignmentId,
                    ...assignmentData
                });
                
                hideAssignmentModal();
                showToast('Assignment created successfully', 'success');
                loadAssignmentsData();
            } else {
                throw new Error(result.error);
            }
        }
    } catch (error) {
        console.error('Error with assignment:', error);
        showToast('Error with assignment: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

function showAddAnnotatorForm() {
    // For simplicity, we'll reuse the login modal for adding annotators
    showLoginModal();
    if (elements.loginRole) {
        elements.loginRole.value = 'annotator';
    }
}

async function editUser(userId) {
    const user = allUsers.find(u => u.id === userId);
    if (!user) {
        showToast('User not found', 'error');
        return;
    }
    
    // Pre-fill the login modal with user data for editing
    if (elements.loginEmail) elements.loginEmail.value = user.email;
    if (elements.loginName) elements.loginName.value = user.name;
    if (elements.loginRole) elements.loginRole.value = user.role;
    
    // Store the user ID for updating
    elements.loginForm.dataset.editingUserId = userId;
    
    showLoginModal();
}

async function deleteUser(userId) {
    if (!confirm('Are you sure you want to delete this user?')) {
        return;
    }
    
    showLoading(true);
    
    try {
        const result = await FirebaseService.deleteUser(userId);
        
        if (result.success) {
            showToast('User deleted successfully', 'success');
            loadManagementData();
            loadAnnotatorsData();
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        console.error('Error deleting user:', error);
        showToast('Error deleting user: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

async function editAssignment(assignmentId) {
    const assignment = allAssignments.find(a => a.id === assignmentId);
    if (!assignment) {
        showToast('Assignment not found', 'error');
        return;
    }
    
    // Pre-fill the assignment modal with assignment data
    if (elements.assignmentAnnotator) elements.assignmentAnnotator.value = assignment.annotatorId;
    if (elements.assignmentCount) elements.assignmentCount.value = assignment.itemCount;
    if (elements.assignmentTopicFilter) elements.assignmentTopicFilter.value = assignment.topicFilter || '';
    if (elements.assignmentDueDate) {
        const dueDate = assignment.dueDate ? new Date(assignment.dueDate).toISOString().split('T')[0] : '';
        elements.assignmentDueDate.value = dueDate;
    }
    if (elements.assignmentNotes) elements.assignmentNotes.value = assignment.notes || '';
    
    // Store the assignment ID for updating
    elements.assignmentForm.dataset.editingAssignmentId = assignmentId;
    
    showAssignmentModal();
}

async function deleteAssignment(assignmentId) {
    if (!confirm('Are you sure you want to delete this assignment?')) {
        return;
    }
    
    showLoading(true);
    
    try {
        const result = await FirebaseService.deleteAssignment(assignmentId);
        
        if (result.success) {
            showToast('Assignment deleted successfully', 'success');
            loadAssignmentsData();
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        console.error('Error deleting assignment:', error);
        showToast('Error deleting assignment: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

async function generateProgressReport() {
    const annotatorId = elements.reportAnnotatorFilter.value;
    const period = elements.reportPeriodFilter.value;
    
    showLoading(true);
    
    try {
        let statsResult;
        let reportData = {};
        
        if (annotatorId) {
            // Generate individual user report
            statsResult = await FirebaseService.getUserStatistics(annotatorId);
            const user = allUsers.find(u => u.id === annotatorId);
            
            if (statsResult.success && user) {
                reportData = {
                    type: 'individual',
                    user: user.name,
                    stats: statsResult.stats,
                    assignments: allAssignments.filter(a => a.annotatorId === annotatorId),
                    annotations: annotations.filter(a => a.annotatorId === annotatorId)
                };
            }
        } else {
            // Generate overall report
            statsResult = await FirebaseService.getOverallStatistics();
            
            if (statsResult.success) {
                reportData = {
                    type: 'overall',
                    stats: statsResult.stats,
                    totalUsers: allUsers.length,
                    totalAssignments: allAssignments.length,
                    userBreakdown: allUsers.map(user => {
                        const userAssignments = allAssignments.filter(a => a.annotatorId === user.id);
                        const userAnnotations = annotations.filter(a => a.annotatorId === user.id);
                        const completedAnnotations = userAnnotations.filter(a => a.completed);
                        
                        return {
                            name: user.name,
                            email: user.email,
                            role: user.role,
                            assignmentsCount: userAssignments.length,
                            annotationsCount: userAnnotations.length,
                            completedCount: completedAnnotations.length,
                            completionRate: userAnnotations.length > 0 ? 
                                Math.round((completedAnnotations.length / userAnnotations.length) * 100) : 0,
                            lastActive: user.lastActive
                        };
                    })
                };
            }
        }
        
        if (statsResult.success) {
            displayProgressReport(reportData);
            showToast('Report generated successfully', 'success');
        } else {
            throw new Error(statsResult.error);
        }
    } catch (error) {
        console.error('Error generating report:', error);
        showToast('Error generating report: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

function displayProgressReport(reportData) {
    // Create a detailed report display
    let reportHtml = '';
    
    if (reportData.type === 'individual') {
        reportHtml = `
            <div class="report-container">
                <h3>Individual Report: ${reportData.user}</h3>
                <div class="report-stats">
                    <div class="stat-card">
                        <h4>Total Assignments</h4>
                        <p class="stat-number">${reportData.assignments.length}</p>
                    </div>
                    <div class="stat-card">
                        <h4>Total Annotations</h4>
                        <p class="stat-number">${reportData.annotations.length}</p>
                    </div>
                    <div class="stat-card">
                        <h4>Completed</h4>
                        <p class="stat-number">${reportData.annotations.filter(a => a.completed).length}</p>
                    </div>
                    <div class="stat-card">
                        <h4>Completion Rate</h4>
                        <p class="stat-number">${reportData.annotations.length > 0 ? 
                            Math.round((reportData.annotations.filter(a => a.completed).length / reportData.annotations.length) * 100) : 0}%</p>
                    </div>
                </div>
                <div class="assignment-breakdown">
                    <h4>Assignment Breakdown</h4>
                    <table class="report-table">
                        <thead>
                            <tr>
                                <th>Assignment ID</th>
                                <th>Progress</th>
                                <th>Status</th>
                                <th>Due Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${reportData.assignments.map(assignment => `
                                <tr>
                                    <td>${assignment.id.substring(0, 8)}...</td>
                                    <td>
                                        <div class="progress-bar">
                                            <div class="progress-fill" style="width: ${assignment.progress || 0}%"></div>
                                        </div>
                                        ${assignment.progress || 0}%
                                    </td>
                                    <td><span class="status-badge ${assignment.status}">${assignment.status}</span></td>
                                    <td>${assignment.dueDate ? new Date(assignment.dueDate).toLocaleDateString() : 'No due date'}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    } else {
        reportHtml = `
            <div class="report-container">
                <h3>Overall Progress Report</h3>
                <div class="report-stats">
                    <div class="stat-card">
                        <h4>Total Users</h4>
                        <p class="stat-number">${reportData.totalUsers}</p>
                    </div>
                    <div class="stat-card">
                        <h4>Total Assignments</h4>
                        <p class="stat-number">${reportData.totalAssignments}</p>
                    </div>
                    <div class="stat-card">
                        <h4>Active Users</h4>
                        <p class="stat-number">${reportData.userBreakdown.filter(u => u.annotationsCount > 0).length}</p>
                    </div>
                    <div class="stat-card">
                        <h4>Average Completion</h4>
                        <p class="stat-number">${Math.round(reportData.userBreakdown.reduce((sum, u) => sum + u.completionRate, 0) / reportData.userBreakdown.length) || 0}%</p>
                    </div>
                </div>
                <div class="user-breakdown">
                    <h4>User Performance Breakdown</h4>
                    <table class="report-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Role</th>
                                <th>Assignments</th>
                                <th>Annotations</th>
                                <th>Completed</th>
                                <th>Completion Rate</th>
                                <th>Last Active</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${reportData.userBreakdown.map(user => `
                                <tr>
                                    <td>${user.name}</td>
                                    <td><span class="status-badge ${user.role}">${user.role}</span></td>
                                    <td>${user.assignmentsCount}</td>
                                    <td>${user.annotationsCount}</td>
                                    <td>${user.completedCount}</td>
                                    <td>
                                        <div class="progress-bar">
                                            <div class="progress-fill" style="width: ${user.completionRate}%"></div>
                                        </div>
                                        ${user.completionRate}%
                                    </td>
                                    <td>${user.lastActive ? new Date(user.lastActive.toDate()).toLocaleDateString() : 'Never'}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }
    
    // Display the report in a modal or dedicated area
    const reportModal = document.createElement('div');
    reportModal.className = 'modal active';
    reportModal.innerHTML = `
        <div class="modal-content large">
            <div class="modal-header">
                <h2>Progress Report</h2>
                <button class="modal-close" onclick="this.closest('.modal').remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                ${reportHtml}
            </div>
            <div class="modal-footer">
                <button class="btn btn-primary" onclick="exportReport()">
                    <i class="fas fa-download"></i> Export Report
                </button>
                <button class="btn btn-outline" onclick="this.closest('.modal').remove()">Close</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(reportModal);
}

function exportReport() {
    // Simple CSV export of the current report data
    const reportModal = document.querySelector('.report-container');
    if (!reportModal) return;
    
    const tables = reportModal.querySelectorAll('.report-table');
    let csvContent = '';
    
    tables.forEach((table, index) => {
        if (index > 0) csvContent += '\n\n';
        
        const rows = table.querySelectorAll('tr');
        rows.forEach(row => {
            const cells = row.querySelectorAll('th, td');
            const rowData = Array.from(cells).map(cell => {
                // Clean up cell content (remove HTML tags and extra whitespace)
                return cell.textContent.trim().replace(/\s+/g, ' ');
            });
            csvContent += rowData.join(',') + '\n';
        });
    });
    
    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `progress_report_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showToast('Report exported successfully', 'success');
}

async function loadUserData() {
    if (!currentUser) return;
    
    try {
        // Load user's annotations
        const result = await FirebaseService.getAnnotationsByUser(currentUser.id, 
            currentTaskMode === 'modification' ? COLLECTIONS.MODIFICATION : COLLECTIONS.CREATION);
        
        if (result.success) {
            annotations = result.data || [];
            currentIndex = 0;
            applyFilters();
            
            if (filteredAnnotations.length > 0) {
                loadAnnotation(currentIndex);
            }
            
            updateUI();
        }
    } catch (error) {
        console.error('Error loading user data:', error);
        showToast('Error loading your data', 'error');
    }
}

function showLoading(show) {
    if (show) {
        elements.loadingOverlay.classList.add('active');
    } else {
        elements.loadingOverlay.classList.remove('active');
    }
}

function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const iconMap = {
        success: 'fas fa-check-circle',
        error: 'fas fa-exclamation-circle',
        warning: 'fas fa-exclamation-triangle'
    };
    
    toast.innerHTML = `
        <i class="${iconMap[type]} toast-icon"></i>
        <span class="toast-message">${message}</span>
        <button class="toast-close" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    elements.toastContainer.appendChild(toast);
    
    // Show toast
    setTimeout(() => toast.classList.add('show'), 100);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (toast.parentElement) {
            toast.remove();
        }
    }, 5000);
}

// CSV Upload to Firebase Functions
function initializeCsvUpload() {
    // Add event listeners for CSV upload modal
    if (elements.csvUploadModalClose) {
        elements.csvUploadModalClose.addEventListener('click', hideCsvUploadModal);
    }
    
    if (elements.csvUploadCancel) {
        elements.csvUploadCancel.addEventListener('click', hideCsvUploadModal);
    }
    
    if (elements.csvUploadInput) {
        elements.csvUploadInput.addEventListener('change', handleCsvFileSelection);
    }
    
    if (elements.csvDropArea) {
        elements.csvDropArea.addEventListener('dragover', handleDragOver);
        elements.csvDropArea.addEventListener('drop', handleDrop);
        elements.csvDropArea.addEventListener('click', () => elements.csvUploadInput.click());
    }
    
    if (elements.uploadCsvBtn) {
        elements.uploadCsvBtn.addEventListener('click', uploadCsvToFirebase);
    }
    
    // Add CSV upload button to header
    const csvUploadBtn = document.createElement('button');
    csvUploadBtn.className = 'btn btn-secondary';
    csvUploadBtn.innerHTML = '<i class="fas fa-cloud-upload-alt"></i> Upload CSV to Firebase';
    csvUploadBtn.addEventListener('click', showCsvUploadModal);
    
    // Insert after the existing import button
    if (elements.importBtn && elements.importBtn.parentNode) {
        elements.importBtn.parentNode.insertBefore(csvUploadBtn, elements.importBtn.nextSibling);
    }
}

function showCsvUploadModal() {
    if (elements.csvUploadModal) {
        elements.csvUploadModal.classList.add('active');
        resetCsvUploadForm();
    }
}

function hideCsvUploadModal() {
    if (elements.csvUploadModal) {
        elements.csvUploadModal.classList.remove('active');
        resetCsvUploadForm();
    }
}

function resetCsvUploadForm() {
    if (elements.csvUploadInput) elements.csvUploadInput.value = '';
    if (elements.selectedFiles) elements.selectedFiles.style.display = 'none';
    if (elements.filesList) elements.filesList.innerHTML = '';
    if (elements.uploadProgress) elements.uploadProgress.style.display = 'none';
    if (elements.uploadCsvBtn) elements.uploadCsvBtn.disabled = true;
    selectedCsvFiles = [];
}

let selectedCsvFiles = [];

function handleCsvFileSelection(event) {
    const files = Array.from(event.target.files);
    processCsvFiles(files);
}

function handleDragOver(event) {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
    elements.csvDropArea.classList.add('drag-over');
}

function handleDrop(event) {
    event.preventDefault();
    elements.csvDropArea.classList.remove('drag-over');
    
    const files = Array.from(event.dataTransfer.files);
    const csvFiles = files.filter(file => file.name.endsWith('.csv'));
    
    if (csvFiles.length !== files.length) {
        showToast('Only CSV files are allowed', 'warning');
    }
    
    if (csvFiles.length > 0) {
        processCsvFiles(csvFiles);
    }
}

function processCsvFiles(files) {
    selectedCsvFiles = files;
    
    if (files.length > 0) {
        elements.selectedFiles.style.display = 'block';
        elements.filesList.innerHTML = '';
        
        files.forEach(file => {
            const li = document.createElement('li');
            li.innerHTML = `
                <i class="fas fa-file-csv"></i>
                <span>${file.name}</span>
                <span class="file-size">(${formatFileSize(file.size)})</span>
            `;
            elements.filesList.appendChild(li);
        });
        
        elements.uploadCsvBtn.disabled = false;
    } else {
        elements.selectedFiles.style.display = 'none';
        elements.uploadCsvBtn.disabled = true;
    }
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

async function uploadCsvToFirebase() {
    if (selectedCsvFiles.length === 0) {
        showToast('Please select CSV files to upload', 'warning');
        return;
    }
    
    if (!isLoggedIn || !currentUser) {
        showToast('Please log in to upload files', 'warning');
        showLoginModal();
        return;
    }
    
    const collectionName = elements.uploadCollection.value;
    const clearBefore = elements.clearBeforeUpload.checked;
    
    elements.uploadProgress.style.display = 'block';
    elements.uploadCsvBtn.disabled = true;
    
    try {
        let totalProcessed = 0;
        let totalFiles = selectedCsvFiles.length;
        let allAnnotations = [];
        
        // Clear existing data if requested
        if (clearBefore) {
            elements.uploadStatus.textContent = 'Clearing existing data...';
            const clearResult = await FirebaseService.clearCollection(collectionName);
            if (!clearResult.success) {
                throw new Error('Failed to clear existing data: ' + clearResult.error);
            }
        }
        
        // Process each CSV file
        for (let i = 0; i < selectedCsvFiles.length; i++) {
            const file = selectedCsvFiles[i];
            elements.uploadStatus.textContent = `Processing ${file.name}...`;
            
            try {
                const csvContent = await readFileAsText(file);
                const parsedData = parseCSV(csvContent);
                
                // Add user tracking to each annotation
                const annotationsWithUser = parsedData.map(annotation => ({
                    ...annotation,
                    annotatorId: currentUser.id,
                    uploadedBy: currentUser.userId || currentUser.id,
                    uploadedAt: new Date().toISOString(),
                    sourceFile: file.name
                }));
                
                allAnnotations = allAnnotations.concat(annotationsWithUser);
                totalProcessed++;
                
                // Update progress
                const progress = Math.round((totalProcessed / totalFiles) * 100);
                elements.uploadProgressBar.style.width = progress + '%';
                
            } catch (error) {
                console.error(`Error processing ${file.name}:`, error);
                showToast(`Error processing ${file.name}: ${error.message}`, 'error');
            }
        }
        
        // Upload all annotations to Firebase
        if (allAnnotations.length > 0) {
            elements.uploadStatus.textContent = 'Uploading to Firebase...';
            
            const uploadResult = await FirebaseService.saveAllToCollection(collectionName, allAnnotations);
            
            if (uploadResult.success) {
                elements.uploadProgressBar.style.width = '100%';
                elements.uploadStatus.textContent = 'Upload completed successfully!';
                
                showToast(`Successfully uploaded ${allAnnotations.length} annotations from ${totalFiles} files`, 'success');
                
                // Refresh local data if uploading to current collection
                const currentCollection = currentTaskMode === 'modification' 
                    ? COLLECTIONS.MODIFICATION 
                    : COLLECTIONS.CREATION;
                    
                if (collectionName === currentCollection) {
                    await loadFromFirebase();
                }
                
                setTimeout(() => {
                    hideCsvUploadModal();
                }, 2000);
                
            } else {
                throw new Error(uploadResult.error);
            }
        } else {
            throw new Error('No valid data found in any CSV file');
        }
        
    } catch (error) {
        console.error('Upload error:', error);
        elements.uploadStatus.textContent = 'Upload failed';
        showToast('Upload failed: ' + error.message, 'error');
    } finally {
        elements.uploadCsvBtn.disabled = false;
    }
}

function readFileAsText(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (e) => reject(new Error('Failed to read file'));
        reader.readAsText(file);
    });
}

// Initialize CSV upload when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // ... existing initialization code ...
    initializeCsvUpload();
});