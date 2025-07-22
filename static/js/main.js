// Main JavaScript for the Model Prediction Visualizer

// Global state
let currentDatapoint = '';
let currentVariable = '';
let currentLeadTime = '';
let currentEpoch = '';

// DOM elements
const datapointSelect = document.getElementById('datapoint-select');
const variableSelect = document.getElementById('variable-select');
const leadTimeSelect = document.getElementById('lead-time-select');
const epochSelect = document.getElementById('epoch-select');
const loadButton = document.getElementById('load-visualization');
const resetButton = document.getElementById('reset-controls');
const loadingSpinner = document.getElementById('loading-spinner');
const placeholderMessage = document.getElementById('placeholder-message');
const imageContainer = document.getElementById('image-container');
const predictionImage = document.getElementById('prediction-image');
const imageError = document.getElementById('image-error');
const datapointName = document.getElementById('datapoint-name');
const variableName = document.getElementById('variable-name');
const leadTimeName = document.getElementById('lead-time-name');
const epochName = document.getElementById('epoch-name');

// Initialize the visualization controls
function initializeVisualizationControls() {
    console.log('Initializing visualization controls...');
    
    // Add event listeners
    datapointSelect.addEventListener('change', handleDatapointChange);
    variableSelect.addEventListener('change', handleVariableChange);
    leadTimeSelect.addEventListener('change', handleLeadTimeChange);
    epochSelect.addEventListener('change', handleEpochChange);
    loadButton.addEventListener('click', loadVisualization);
    resetButton.addEventListener('click', resetControls);
    
    // Initialize button state
    updateLoadButtonState();
    
    console.log('Visualization controls initialized successfully');
}

// Handle datapoint selection change
function handleDatapointChange(event) {
    currentDatapoint = event.target.value;
    console.log('Datapoint changed to:', currentDatapoint);
    updateLoadButtonState();
}

// Handle variable selection change
function handleVariableChange(event) {
    currentVariable = event.target.value;
    console.log('Variable changed to:', currentVariable);
    updateLoadButtonState();
}

// Handle lead time selection change
function handleLeadTimeChange(event) {
    currentLeadTime = event.target.value;
    console.log('Lead time changed to:', currentLeadTime);
    updateLoadButtonState();
}

// Handle epoch selection change
function handleEpochChange(event) {
    currentEpoch = event.target.value;
    console.log('Epoch changed to:', currentEpoch);
    updateLoadButtonState();
}

// Update the load button state based on selections
function updateLoadButtonState() {
    const hasDatapoint = currentDatapoint !== '';
    const hasVariable = currentVariable !== '';
    const hasLeadTime = currentLeadTime !== '';
    const hasEpoch = currentEpoch !== '';
    
    const allSelected = hasDatapoint && hasVariable && hasLeadTime && hasEpoch;
    
    loadButton.disabled = !allSelected;
    
    if (allSelected) {
        loadButton.innerHTML = '<i class="fas fa-eye"></i> Load Visualization';
    } else {
        const missing = [];
        if (!hasDatapoint) missing.push('datapoint');
        if (!hasVariable) missing.push('variable');
        if (!hasLeadTime) missing.push('lead time');
        if (!hasEpoch) missing.push('epoch');
        
        loadButton.innerHTML = `<i class="fas fa-eye"></i> Select ${missing.join(', ')}`;
    }
}

// Load and display the visualization
async function loadVisualization() {
    if (!currentDatapoint || !currentVariable || !currentLeadTime || !currentEpoch) {
        showNotification('Please select all parameters: datapoint, variable, lead time, and epoch', 'error');
        return;
    }
    
    console.log(`Loading visualization for datapoint: ${currentDatapoint}, variable: ${currentVariable}, lead time: ${currentLeadTime}, epoch: ${currentEpoch}`);
    
    // Show loading state
    showLoadingState();
    
    try {
        // Construct image URL with all parameters
        const imageUrl = `/api/image/${currentDatapoint}/${currentVariable}/${currentLeadTime}/${currentEpoch}`;
        
        // Load the image
        await loadImage(imageUrl);
        
        // Update UI with image info
        updateImageInfo();
        
        // Show success state
        showImageState();
        
        console.log('Visualization loaded successfully');
        showNotification('Visualization loaded successfully', 'success');
        
    } catch (error) {
        console.error('Error loading visualization:', error);
        showErrorState();
        showNotification('Failed to load visualization. Please check if the image exists.', 'error');
    }
}

// Load image with promise-based approach
function loadImage(url) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        
        img.onload = () => {
            predictionImage.src = url;
            resolve();
        };
        
        img.onerror = () => {
            reject(new Error('Failed to load image'));
        };
        
        // Set a timeout for loading
        setTimeout(() => {
            reject(new Error('Image loading timeout'));
        }, 10000);
        
        img.src = url;
    });
}

// Update image information display
function updateImageInfo() {
    const datapointText = datapointSelect.options[datapointSelect.selectedIndex].text;
    const variableText = variableSelect.options[variableSelect.selectedIndex].text;
    const leadTimeText = leadTimeSelect.options[leadTimeSelect.selectedIndex].text;
    const epochText = epochSelect.options[epochSelect.selectedIndex].text;
    
    datapointName.textContent = datapointText;
    variableName.textContent = variableText;
    leadTimeName.textContent = leadTimeText;
    epochName.textContent = epochText;
    
    document.getElementById('image-title').textContent = 
        `${variableText} Prediction for ${datapointText} (${leadTimeText}, ${epochText})`;
}

// Show loading state
function showLoadingState() {
    placeholderMessage.style.display = 'none';
    imageContainer.style.display = 'none';
    loadingSpinner.style.display = 'flex';
    
    loadButton.disabled = true;
    loadButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
}

// Show image state
function showImageState() {
    loadingSpinner.style.display = 'none';
    placeholderMessage.style.display = 'none';
    imageContainer.style.display = 'block';
    imageError.style.display = 'none';
    
    loadButton.disabled = false;
    updateLoadButtonState();
}

// Show error state
function showErrorState() {
    loadingSpinner.style.display = 'none';
    placeholderMessage.style.display = 'none';
    imageContainer.style.display = 'block';
    imageError.style.display = 'flex';
    
    loadButton.disabled = false;
    updateLoadButtonState();
}

// Reset all controls
function resetControls() {
    console.log('Resetting controls...');
    
    // Reset selections
    datapointSelect.value = '';
    variableSelect.value = '';
    leadTimeSelect.value = '';
    epochSelect.value = '';
    currentDatapoint = '';
    currentVariable = '';
    currentLeadTime = '';
    currentEpoch = '';
    
    // Reset UI state
    placeholderMessage.style.display = 'flex';
    imageContainer.style.display = 'none';
    loadingSpinner.style.display = 'none';
    
    // Update button state
    updateLoadButtonState();
    
    showNotification('Controls reset successfully', 'info');
}

// Show notification to user
function showNotification(message, type = 'info') {
    // Create notification element if it doesn't exist
    let notification = document.getElementById('notification');
    if (!notification) {
        notification = document.createElement('div');
        notification.id = 'notification';
        notification.className = 'notification';
        document.body.appendChild(notification);
    }
    
    // Set notification content and style
    notification.textContent = message;
    notification.className = `notification notification-${type} show`;
    
    // Auto-hide after 3 seconds
    setTimeout(() => {
        notification.className = 'notification';
    }, 3000);
}

// Add keyboard shortcuts
document.addEventListener('keydown', function(event) {
    // Ctrl/Cmd + Enter to load visualization
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
        event.preventDefault();
        if (!loadButton.disabled) {
            loadVisualization();
        }
    }
    
    // Escape to reset
    if (event.key === 'Escape') {
        event.preventDefault();
        resetControls();
    }
});

// Add CSS for notifications
const notificationCSS = `
.notification {
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 1rem 1.5rem;
    border-radius: 0.5rem;
    color: white;
    font-weight: 500;
    z-index: 1000;
    transform: translateX(100%);
    transition: transform 0.3s ease;
    max-width: 350px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.notification.show {
    transform: translateX(0);
}

.notification-success {
    background: #48bb78;
}

.notification-error {
    background: #f56565;
}

.notification-info {
    background: #4299e1;
}
`;

// Inject notification CSS
const style = document.createElement('style');
style.textContent = notificationCSS;
document.head.appendChild(style);

// Initialize when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeVisualizationControls);
} else {
    initializeVisualizationControls();
}