// Application state
let annotations = [];
let currentIndex = 0;
let filteredAnnotations = [];
let isEditing = false;
let currentTaskMode = 'modification'; // 'modification' or 'creation'

// DOM elements
const elements = {
    // Task mode
    taskMode: document.getElementById('taskMode'),
    
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
    switchTaskMode(currentTaskMode);
    loadFromFirebase();
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

function updateCurrentAnnotation() {
    if (filteredAnnotations.length === 0) return;
    
    const annotation = filteredAnnotations[currentIndex];
    const formData = getFormData();
    
    // Update the annotation
    Object.assign(annotation, formData);
    annotation.completed = isAnnotationComplete(annotation);
    annotation.lastModified = new Date().toISOString();
    
    // Update in main array
    const mainIndex = annotations.findIndex(a => a.id === annotation.id);
    if (mainIndex !== -1) {
        annotations[mainIndex] = annotation;
    }
    
    updateUI();
    showToast('Annotation updated', 'success');
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
    if (annotations.length === 0) {
        showToast('No data to save', 'warning');
        return;
    }
    
    showLoading(true);
    
    try {
        const collectionName = currentTaskMode === 'modification' ? 
            'cultural_annotations_modified' : 'cultural_annotations_created';
        
        // Clear existing data first
        const clearResult = await FirebaseService.clearCollection(collectionName);
        if (!clearResult.success) {
            throw new Error(clearResult.error);
        }
        
        // Save all annotations
        const saveResult = await FirebaseService.saveAllToCollection(collectionName, annotations);
        if (!saveResult.success) {
            throw new Error(saveResult.error);
        }
        
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