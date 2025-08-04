// Main JavaScript for the Model Prediction Visualizer

// Global state
let currentDatapoint = '';
let currentVariable = '';
let currentEpoch = '';

// DOM elements
const datapointSelect = document.getElementById('datapoint-select');
const variableSelect = document.getElementById('variable-select');
const epochSelect = document.getElementById('epoch-select');
const loadButton = document.getElementById('load-visualization');
const resetButton = document.getElementById('reset-controls');
const loadingSpinner = document.getElementById('loading-spinner');
const placeholderMessage = document.getElementById('placeholder-message');
const imageContainer = document.getElementById('image-container');
const predictionImage = document.getElementById('prediction-image');
const groundTruthImage = document.getElementById('ground-truth-image');
const predictionError = document.getElementById('prediction-error');
const groundTruthError = document.getElementById('ground-truth-error');
const datapointName = document.getElementById('datapoint-name');
const variableName = document.getElementById('variable-name');
const epochName = document.getElementById('epoch-name');

// Grouping section DOM elements
const groupingLoadingSpinner = document.getElementById('grouping-loading-spinner');
const groupingPlaceholderMessage = document.getElementById('grouping-placeholder-message');
const groupingImageContainer = document.getElementById('grouping-image-container');
const groupingImage = document.getElementById('grouping-image');
const groupingError = document.getElementById('grouping-error');

// Initialize the visualization controls
function initializeVisualizationControls() {
    console.log('Initializing visualization controls...');
    
    // Debug: Check if all DOM elements are found
    console.log('DOM elements check:');
    console.log('predictionImage:', predictionImage);
    console.log('groundTruthImage:', groundTruthImage);
    console.log('predictionError:', predictionError);
    console.log('groundTruthError:', groundTruthError);
    
    // Add event listeners
    datapointSelect.addEventListener('change', handleDatapointChange);
    variableSelect.addEventListener('change', handleVariableChange);
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
    const hasEpoch = currentEpoch !== '';
    
    const allSelected = hasDatapoint && hasVariable && hasEpoch;
    
    loadButton.disabled = !allSelected;
    
    if (allSelected) {
        loadButton.innerHTML = '<i class="fas fa-eye"></i> Load Visualization';
    } else {
        const missing = [];
        if (!hasDatapoint) missing.push('datapoint');
        if (!hasVariable) missing.push('variable');
        if (!hasEpoch) missing.push('epoch');
        
        loadButton.innerHTML = `<i class="fas fa-eye"></i> Select ${missing.join(', ')}`;
    }
}

// Load and display the visualization
async function loadVisualization() {
    if (!currentDatapoint || !currentVariable || !currentEpoch) {
        showNotification('Please select all parameters: datapoint, variable, and epoch', 'error');
        return;
    }
    
    console.log(`Loading visualization for datapoint: ${currentDatapoint}, variable: ${currentVariable}, epoch: ${currentEpoch}`);
    
    // Show loading state
    showLoadingState();
    
    try {
        // Determine which images to load based on variable and epoch
        let predictionImageUrl;
        let groundTruthImageUrl;
        
        if (currentEpoch === '5' || currentEpoch === '10' || currentEpoch === '20' || currentEpoch === '40' || currentEpoch === '60' || currentEpoch === '80') {
            // For epochs 5, 10, 20, 40, 60, and 80, use the specific datetime-based images
            let variableCode;
            if (currentVariable === 'temperature') {
                variableCode = 't2m';
            } else if (currentVariable === 'windspeed') {
                variableCode = 'windspeed';
            } else if (currentVariable === 'u500') {
                variableCode = 'u500';
            }
            
            if (variableCode) {
                predictionImageUrl = `/static/images/predictions/epoch${currentEpoch}/visualization_output_${variableCode}_epoch${currentEpoch}_${currentDatapoint}_pred.png`;
                groundTruthImageUrl = `/static/images/predictions/epoch${currentEpoch}/visualization_output_${variableCode}_epoch${currentEpoch}_${currentDatapoint}_target.png`;
            } else {
                // Fallback to placeholder images
                predictionImageUrl = '/static/images/placeholder.svg';
                groundTruthImageUrl = '/static/images/predictions/ground_truth.png';
            }
        } else if (parseInt(currentEpoch) > 80) {
            // For epochs >80, use epoch 80 images as fallback
            let variableCode;
            if (currentVariable === 'temperature') {
                variableCode = 't2m';
            } else if (currentVariable === 'windspeed') {
                variableCode = 'windspeed';
            } else if (currentVariable === 'u500') {
                variableCode = 'u500';
            }
            
            if (variableCode) {
                predictionImageUrl = `/static/images/predictions/epoch80/visualization_output_${variableCode}_epoch80_${currentDatapoint}_pred.png`;
                groundTruthImageUrl = `/static/images/predictions/epoch80/visualization_output_${variableCode}_epoch80_${currentDatapoint}_target.png`;
            } else {
                // Fallback to placeholder images
                predictionImageUrl = '/static/images/placeholder.svg';
                groundTruthImageUrl = '/static/images/predictions/ground_truth.png';
            }
        } else {
            // For any other epochs, use the static variable-based images
            if (currentVariable === 'temperature') {
                predictionImageUrl = '/static/images/predictions/visualization_output_t2m_pred.png';
                groundTruthImageUrl = '/static/images/predictions/visualization_output_t2m_target.png';
            } else if (currentVariable === 'windspeed') {
                predictionImageUrl = '/static/images/predictions/visualization_output_windspeed_pred.png';
                groundTruthImageUrl = '/static/images/predictions/visualization_output_windspeed_target.png';
            } else if (currentVariable === 'u500') {
                predictionImageUrl = '/static/images/predictions/visualization_output_u500_pred.png';
                groundTruthImageUrl = '/static/images/predictions/visualization_output_u500_target.png';
            } else {
                // Fallback to placeholder images
                predictionImageUrl = '/static/images/placeholder.svg';
                groundTruthImageUrl = '/static/images/predictions/ground_truth.png';
            }
        }
        
        // Load both prediction images and grouping image
        await Promise.all([
            loadPredictionImage(predictionImageUrl),
            loadGroundTruthImage(groundTruthImageUrl),
            loadGroupingImage()
        ]);
        
        // Update UI with image info
        updateImageInfo();
        
        // Show success state
        showImageState();
        
        console.log('Visualization loaded successfully');
        showNotification('Prediction, ground truth, and grouping images loaded successfully', 'success');
        
    } catch (error) {
        console.error('Error loading visualization:', error);
        showErrorState();
        showNotification('Failed to load one or more images. Please check if the files exist.', 'error');
    }
}

// Load prediction image with promise-based approach
function loadPredictionImage(url) {
    console.log('Loading prediction image from:', url);
    return new Promise((resolve, reject) => {
        const img = new Image();
        
        img.onload = () => {
            console.log('Prediction image loaded successfully');
            predictionImage.src = url;
            predictionError.style.display = 'none';
            resolve();
        };
        
        img.onerror = () => {
            console.error('Failed to load prediction image');
            predictionError.style.display = 'flex';
            reject(new Error('Failed to load prediction image'));
        };
        
        // Set a timeout for loading
        setTimeout(() => {
            reject(new Error('Prediction image loading timeout'));
        }, 10000);
        
        img.src = url;
    });
}

// Load ground truth image
function loadGroundTruthImage(url) {
    console.log('Loading ground truth image from:', url);
    return new Promise((resolve, reject) => {
        const img = new Image();
        
        img.onload = () => {
            console.log('Ground truth image loaded successfully');
            groundTruthImage.src = url;
            groundTruthError.style.display = 'none';
            resolve();
        };
        
        img.onerror = () => {
            console.error('Failed to load ground truth image');
            groundTruthError.style.display = 'flex';
            reject(new Error('Failed to load ground truth image'));
        };
        
        // Set a timeout for loading
        setTimeout(() => {
            reject(new Error('Ground truth image loading timeout'));
        }, 10000);
        
        img.src = url;
    });
}

// Load grouping image
function loadGroupingImage() {
    console.log('Loading grouping image');
    return new Promise((resolve, reject) => {
        const img = new Image();
        
        // Determine the correct grouping image URL based on epoch
        let groupingImageUrl;
        if (currentEpoch === '5' || currentEpoch === '10' || currentEpoch === '20' || currentEpoch === '40') {
            // For epochs 5, 10, 20, and 40, use the epoch-specific segmentation images
            groupingImageUrl = `/static/images/attention/epoch${currentEpoch}/segmentation_output_epoch${currentEpoch}_${currentDatapoint}.png`;
        } else if (parseInt(currentEpoch) > 40) {
            // For epochs > 40, use epoch 40 images as fallback
            groupingImageUrl = `/static/images/attention/epoch40/segmentation_output_epoch40_${currentDatapoint}.png`;
        } else {
            // For all other epochs (< 5), use the default grouping image
            groupingImageUrl = '/static/images/attention/grouping.png';
        }
        
        console.log('Loading grouping image from:', groupingImageUrl);
        
        img.onload = () => {
            console.log('Grouping image loaded successfully');
            groupingImage.src = groupingImageUrl;
            groupingError.style.display = 'none';
            resolve();
        };
        
        img.onerror = () => {
            console.error('Failed to load grouping image');
            groupingError.style.display = 'flex';
            reject(new Error('Failed to load grouping image'));
        };
        
        // Set a timeout for loading
        setTimeout(() => {
            reject(new Error('Grouping image loading timeout'));
        }, 10000);
        
        img.src = groupingImageUrl;
    });
}

// Update image information display
function updateImageInfo() {
    const datapointText = datapointSelect.options[datapointSelect.selectedIndex].text;
    const variableText = variableSelect.options[variableSelect.selectedIndex].text;
    const epochText = epochSelect.options[epochSelect.selectedIndex].text;
    
    datapointName.textContent = datapointText;
    variableName.textContent = variableText;
    epochName.textContent = epochText;
}

// Show loading state
function showLoadingState() {
    placeholderMessage.style.display = 'none';
    imageContainer.style.display = 'none';
    loadingSpinner.style.display = 'flex';
    
    groupingPlaceholderMessage.style.display = 'none';
    groupingImageContainer.style.display = 'none';
    groupingLoadingSpinner.style.display = 'flex';
    
    loadButton.disabled = true;
    loadButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
}

// Show image state
function showImageState() {
    loadingSpinner.style.display = 'none';
    placeholderMessage.style.display = 'none';
    imageContainer.style.display = 'block';
    predictionError.style.display = 'none';
    groundTruthError.style.display = 'none';
    
    groupingLoadingSpinner.style.display = 'none';
    groupingPlaceholderMessage.style.display = 'none';
    groupingImageContainer.style.display = 'block';
    groupingError.style.display = 'none';
    
    loadButton.disabled = false;
    updateLoadButtonState();
}

// Show error state
function showErrorState() {
    loadingSpinner.style.display = 'none';
    placeholderMessage.style.display = 'none';
    imageContainer.style.display = 'block';
    
    groupingLoadingSpinner.style.display = 'none';
    groupingPlaceholderMessage.style.display = 'none';
    groupingImageContainer.style.display = 'block';
    
    loadButton.disabled = false;
    updateLoadButtonState();
}

// Reset all controls
function resetControls() {
    console.log('Resetting controls...');
    
    // Reset selections
    datapointSelect.value = '';
    variableSelect.value = '';
    epochSelect.value = '';
    currentDatapoint = '';
    currentVariable = '';
    currentEpoch = '';
    
    // Reset UI state
    placeholderMessage.style.display = 'flex';
    imageContainer.style.display = 'none';
    loadingSpinner.style.display = 'none';
    
    groupingPlaceholderMessage.style.display = 'flex';
    groupingImageContainer.style.display = 'none';
    groupingLoadingSpinner.style.display = 'none';
    
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