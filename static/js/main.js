// Main JavaScript for the Model Prediction Visualizer

// Global state
let currentDatapoint = '';
let currentVariable = '';

// DOM elements
const datapointSelect = document.getElementById('datapoint-select');
const variableSelect = document.getElementById('variable-select');
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

// Grouping section DOM elements
const groupingLoadingSpinner = document.getElementById('grouping-loading-spinner');
const groupingPlaceholderMessage = document.getElementById('grouping-placeholder-message');
const groupingImageContainer = document.getElementById('grouping-image-container');
const groupingImage = document.getElementById('grouping-image');
const groupingError = document.getElementById('grouping-error');

// Segmentation section DOM elements
const segmentationLoadingSpinner = document.getElementById('segmentation-loading-spinner');
const segmentationPlaceholderMessage = document.getElementById('segmentation-placeholder-message');
const segmentationImageContainer = document.getElementById('segmentation-image-container');
const segmentationImage = document.getElementById('segmentation-image');
const segmentationError = document.getElementById('segmentation-error');

// Spatial evaluation section DOM elements
const spatialEvalLoadingSpinner = document.getElementById('spatial-eval-loading-spinner');
const spatialEvalPlaceholderMessage = document.getElementById('spatial-eval-placeholder-message');
const spatialEvalImageContainer = document.getElementById('spatial-eval-image-container');
const spatialEvalImagesWrapper = document.getElementById('spatial-eval-images-wrapper');
const spatialEvalError = document.getElementById('spatial-eval-error');

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

// Update the load button state based on selections
function updateLoadButtonState() {
    const hasDatapoint = currentDatapoint !== '';
    const hasVariable = currentVariable !== '';
    
    const allSelected = hasDatapoint && hasVariable;
    
    loadButton.disabled = !allSelected;
    
    if (allSelected) {
        loadButton.innerHTML = '<i class="fas fa-eye"></i> Load Visualization';
    } else {
        loadButton.innerHTML = '<i class="fas fa-eye"></i> Select datapoint and variable';
    }
}

// Load and display the visualization
async function loadVisualization() {
    if (!currentDatapoint || !currentVariable) {
        showNotification('Please select all parameters: datapoint and variable', 'error');
        return;
    }
    
    console.log(`Loading visualization for datapoint: ${currentDatapoint}, variable: ${currentVariable}`);
    
    // Show loading state
    showLoadingState();
    
    try {
        // Load rollout GIF for the selected variable and date
        let rolloutImageUrl = `/static/images/rollout/rollout_${currentVariable}_${currentDatapoint}.gif`;
        
        // Load rollout, grouping, and segmentation images
        await Promise.all([
            loadPredictionImage(rolloutImageUrl),
            loadGroupingImage(),
            loadSegmentationImage(),
            loadSpatialEvalImage()
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
        
    let groupingImageUrl = `/static/images/grouping/groupings_${currentDatapoint}T06-00-00.png`;
        
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

// Load segmentation image
function loadSegmentationImage() {
    console.log('Loading segmentation image');
    return new Promise((resolve, reject) => {
        const img = new Image();
        
        let segmentationImageUrl = `/static/images/AR_segm/ar_segmentation_${currentDatapoint}T06-00-00.png`;
        
        console.log('Loading segmentation image from:', segmentationImageUrl);
        
        img.onload = () => {
            console.log('Segmentation image loaded successfully');
            segmentationImage.src = segmentationImageUrl;
            segmentationError.style.display = 'none';
            resolve();
        };
        
        img.onerror = () => {
            console.error('Failed to load segmentation image');
            segmentationError.style.display = 'flex';
            reject(new Error('Failed to load segmentation image'));
        };
        
        setTimeout(() => {
            reject(new Error('Segmentation image loading timeout'));
        }, 10000);
        
        img.src = segmentationImageUrl;
    });
}

// Load spatial evaluation image(s)
function loadSpatialEvalImage() {
    console.log('Loading spatial evaluation image');

    // Map app variable names to rmse_diff file variable names
    let fileVars;
    if (currentVariable === 'wind') {
        fileVars = ['u10m', 'v10m'];
    } else {
        fileVars = [currentVariable];
    }

    // Clear previous images
    spatialEvalImagesWrapper.innerHTML = '';

    spatialEvalImagesWrapper.style.display = 'flex';
    spatialEvalImagesWrapper.style.flexDirection = 'column';
    spatialEvalImagesWrapper.style.gap = '1rem';
    spatialEvalImagesWrapper.style.alignItems = 'center';

    const promises = fileVars.map(varName => {
        const url = `/static/images/rmse_diff/rmse_diff_${varName}_${currentDatapoint}T06-00-00.png`;
        console.log('Loading spatial eval image from:', url);

        return new Promise((resolve, reject) => {
            const img = new Image();

            img.onload = () => {
                const wrapper = document.createElement('div');
                wrapper.className = 'image-wrapper';

                const varLabels = {
                    't2m': 'Temperature (2m)',
                    'u10m': 'U-component Wind Speed (10m)',
                    'v10m': 'V-component Wind Speed (10m)',
                    'tcwv': 'Total Column Water Vapour',
                    'z500': 'Geopotential (500hPa)'
                };
                const label = document.createElement('h4');
                label.textContent = varLabels[varName] || varName;
                label.style.textAlign = 'center';
                label.style.marginBottom = '0.5rem';
                wrapper.appendChild(label);

                const displayImg = document.createElement('img');
                displayImg.src = url;
                displayImg.alt = `RMSE Difference - ${varName}`;
                displayImg.className = 'prediction-image';
                wrapper.appendChild(displayImg);
                spatialEvalImagesWrapper.appendChild(wrapper);
                resolve();
            };

            img.onerror = () => {
                console.error(`Failed to load spatial eval image for ${varName}`);
                reject(new Error(`Failed to load spatial eval image: ${varName}`));
            };

            setTimeout(() => {
                reject(new Error('Spatial eval image loading timeout'));
            }, 10000);

            img.src = url;
        });
    });

    return Promise.all(promises);
}

// Update image information display
function updateImageInfo() {
    const datapointText = datapointSelect.options[datapointSelect.selectedIndex].text;
    const variableText = variableSelect.options[variableSelect.selectedIndex].text;
    
    datapointName.textContent = datapointText;
    variableName.textContent = variableText;
}

// Show loading state
function showLoadingState() {
    placeholderMessage.style.display = 'none';
    imageContainer.style.display = 'none';
    loadingSpinner.style.display = 'flex';
    
    groupingPlaceholderMessage.style.display = 'none';
    groupingImageContainer.style.display = 'none';
    groupingLoadingSpinner.style.display = 'flex';
    
    segmentationPlaceholderMessage.style.display = 'none';
    segmentationImageContainer.style.display = 'none';
    segmentationLoadingSpinner.style.display = 'flex';
    
    spatialEvalPlaceholderMessage.style.display = 'none';
    spatialEvalImageContainer.style.display = 'none';
    spatialEvalLoadingSpinner.style.display = 'flex';
    
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
    
    segmentationLoadingSpinner.style.display = 'none';
    segmentationPlaceholderMessage.style.display = 'none';
    segmentationImageContainer.style.display = 'block';
    segmentationError.style.display = 'none';
    
    spatialEvalLoadingSpinner.style.display = 'none';
    spatialEvalPlaceholderMessage.style.display = 'none';
    spatialEvalImageContainer.style.display = 'block';
    spatialEvalError.style.display = 'none';
    
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
    
    segmentationLoadingSpinner.style.display = 'none';
    segmentationPlaceholderMessage.style.display = 'none';
    segmentationImageContainer.style.display = 'block';
    
    spatialEvalLoadingSpinner.style.display = 'none';
    spatialEvalPlaceholderMessage.style.display = 'none';
    spatialEvalImageContainer.style.display = 'block';
    
    loadButton.disabled = false;
    updateLoadButtonState();
}

// Reset all controls
function resetControls() {
    console.log('Resetting controls...');
    
    // Reset selections
    datapointSelect.value = '';
    variableSelect.value = '';
    currentDatapoint = '';
    currentVariable = '';
    
    // Reset UI state
    placeholderMessage.style.display = 'flex';
    imageContainer.style.display = 'none';
    loadingSpinner.style.display = 'none';
    
    groupingPlaceholderMessage.style.display = 'flex';
    groupingImageContainer.style.display = 'none';
    groupingLoadingSpinner.style.display = 'none';
    
    segmentationPlaceholderMessage.style.display = 'flex';
    segmentationImageContainer.style.display = 'none';
    segmentationLoadingSpinner.style.display = 'none';
    
    spatialEvalPlaceholderMessage.style.display = 'flex';
    spatialEvalImageContainer.style.display = 'none';
    spatialEvalLoadingSpinner.style.display = 'none';
    
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