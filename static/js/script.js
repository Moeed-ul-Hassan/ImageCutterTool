document.addEventListener('DOMContentLoaded', function() {
    // DOM elements
    const dropArea = document.getElementById('dropArea');
    const fileInput = document.getElementById('fileInput');
    const browseBtn = document.getElementById('browseBtn');
    const fileInfo = document.getElementById('fileInfo');
    const fileName = document.getElementById('fileName');
    const removeFileBtn = document.getElementById('removeFile');
    const processBtn = document.getElementById('processBtn');
    const processingIndicator = document.getElementById('processingIndicator');
    const errorMessage = document.getElementById('errorMessage');
    const errorText = document.getElementById('errorText');
    const resultsContainer = document.getElementById('resultsContainer');
    const originalImage = document.getElementById('originalImage');
    const processedImage = document.getElementById('processedImage');
    const downloadBtn = document.getElementById('downloadBtn');
    const newImageBtn = document.getElementById('newImageBtn');
    
    // Selected file for processing
    let selectedFile = null;
    
    // Event listeners for file input
    browseBtn.addEventListener('click', function() {
        fileInput.click();
    });
    
    fileInput.addEventListener('change', function(e) {
        handleFileSelection(e.target.files[0]);
    });
    
    // Drag and drop functionality
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, preventDefaults, false);
    });
    
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    ['dragenter', 'dragover'].forEach(eventName => {
        dropArea.addEventListener(eventName, highlight, false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, unhighlight, false);
    });
    
    function highlight() {
        dropArea.classList.add('highlight');
    }
    
    function unhighlight() {
        dropArea.classList.remove('highlight');
    }
    
    dropArea.addEventListener('drop', function(e) {
        const file = e.dataTransfer.files[0];
        handleFileSelection(file);
    });
    
    // Remove selected file
    removeFileBtn.addEventListener('click', function() {
        resetFileSelection();
    });
    
    // Process image
    processBtn.addEventListener('click', function() {
        if (selectedFile) {
            processImage();
        }
    });
    
    // Download processed image
    downloadBtn.addEventListener('click', function() {
        downloadProcessedImage();
    });
    
    // Process new image button
    newImageBtn.addEventListener('click', function() {
        resetUI();
    });
    
    // Handle file selection
    function handleFileSelection(file) {
        // Check if a file was selected
        if (!file) return;
        
        // Check file type
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
        if (!validTypes.includes(file.type)) {
            showError('Please select a valid image file (JPG, PNG, or GIF).');
            return;
        }
        
        // Check file size (10MB limit)
        if (file.size > 10 * 1024 * 1024) {
            showError('File size exceeds 10MB limit. Please select a smaller image.');
            return;
        }
        
        // Store the selected file
        selectedFile = file;
        
        // Update UI
        fileName.textContent = file.name;
        fileInfo.classList.remove('d-none');
        processBtn.disabled = false;
        hideError();
    }
    
    // Reset file selection
    function resetFileSelection() {
        selectedFile = null;
        fileInput.value = '';
        fileInfo.classList.add('d-none');
        processBtn.disabled = true;
    }
    
    // Process image through the API
    function processImage() {
        // Display processing indicator
        processingIndicator.classList.remove('d-none');
        processBtn.disabled = true;
        hideError();
        resultsContainer.classList.add('d-none');
        
        // Create FormData object
        const formData = new FormData();
        formData.append('image', selectedFile);
        
        // Send request to server
        fetch('/remove-background', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            processingIndicator.classList.add('d-none');
            
            if (data.error) {
                showError(data.error);
                processBtn.disabled = false;
                return;
            }
            
            // Display the results
            displayResults(data.processed_image);
        })
        .catch(error => {
            processingIndicator.classList.add('d-none');
            showError('An error occurred while processing the image. Please try again.');
            processBtn.disabled = false;
            console.error('Error:', error);
        });
    }
    
    // Display processing results
    function displayResults(processedImageBase64) {
        // Create object URL for original image
        const originalImageUrl = URL.createObjectURL(selectedFile);
        originalImage.src = originalImageUrl;
        
        // Set processed image from base64 data
        processedImage.src = `data:image/png;base64,${processedImageBase64}`;
        
        // Show results container
        resultsContainer.classList.remove('d-none');
        
        // Scroll to results
        resultsContainer.scrollIntoView({ behavior: 'smooth' });
    }
    
    // Download processed image
    function downloadProcessedImage() {
        if (!processedImage.src) return;
        
        const link = document.createElement('a');
        link.href = processedImage.src;
        link.download = 'removed_background.png';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
    
    // Show error message
    function showError(message) {
        errorText.textContent = message;
        errorMessage.classList.remove('d-none');
    }
    
    // Hide error message
    function hideError() {
        errorMessage.classList.add('d-none');
    }
    
    // Reset the UI for a new image
    function resetUI() {
        resetFileSelection();
        resultsContainer.classList.add('d-none');
        hideError();
        processingIndicator.classList.add('d-none');
        
        // Clear images
        originalImage.src = '';
        processedImage.src = '';
        
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
});
