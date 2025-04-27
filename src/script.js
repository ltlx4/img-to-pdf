document.addEventListener('DOMContentLoaded', function() {
    const fileInput = document.getElementById('fileInput');
    const dropArea = document.getElementById('dropArea');
    const preview = document.getElementById('preview');
    const convertBtn = document.getElementById('convertBtn');
    const mergeCheckbox = document.getElementById('mergeCheckbox');
    const compressCheckbox = document.getElementById('compressCheckbox');
    const statusDiv = document.getElementById('status');
    
    let files = [];
    let draggedItem = null;
    
    // Handle drag and drop for files
    dropArea.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', handleFiles);
    
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
    
    dropArea.addEventListener('drop', handleDrop, false);
    
    function handleDrop(e) {
        const dt = e.dataTransfer;
        const newFiles = dt.files;
        handleFiles({ target: { files: newFiles } });
    }
    
    function handleFiles(e) {
        const newFiles = Array.from(e.target.files);
        const imageFiles = newFiles.filter(file => file.type.startsWith('image/'));
        
        if (imageFiles.length === 0) {
            statusDiv.textContent = 'Please select only image files.';
            statusDiv.style.color = 'red';
            return;
        }
        
        files = files.concat(imageFiles);
        updatePreview();
        convertBtn.disabled = files.length === 0;
        statusDiv.textContent = '';
    }
    
    function updatePreview() {
        preview.innerHTML = '';
        
        files.forEach((file, index) => {
            const reader = new FileReader();
            reader.onload = function(e) {
                const previewItem = document.createElement('div');
                previewItem.className = 'preview-item';
                previewItem.draggable = true;
                previewItem.dataset.index = index;
                
                // Drag events for reordering
                previewItem.addEventListener('dragstart', handleDragStart);
                previewItem.addEventListener('dragover', handleDragOver);
                previewItem.addEventListener('dragenter', handleDragEnter);
                previewItem.addEventListener('dragleave', handleDragLeave);
                previewItem.addEventListener('dragend', handleDragEnd);
                previewItem.addEventListener('drop', handleDropItem);
                
                const img = document.createElement('img');
                img.src = e.target.result;
                
                const removeBtn = document.createElement('button');
                removeBtn.className = 'remove-btn';
                removeBtn.innerHTML = '×';
                removeBtn.onclick = (event) => {
                    event.stopPropagation();
                    removeFile(index);
                };
                
                previewItem.appendChild(img);
                previewItem.appendChild(removeBtn);
                preview.appendChild(previewItem);
            };
            reader.readAsDataURL(file);
        });
    }
    
    // Drag and drop reordering functions
    function handleDragStart(e) {
        draggedItem = this;
        this.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/html', this.innerHTML);
    }
    
    function handleDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    }
    
    function handleDragEnter(e) {
        e.preventDefault();
        this.classList.add('over');
    }
    
    function handleDragLeave() {
        this.classList.remove('over');
    }
    
    function handleDragEnd() {
        this.classList.remove('dragging');
        document.querySelectorAll('.preview-item.over').forEach(item => {
            item.classList.remove('over');
        });
    }
    
    function handleDropItem(e) {
        e.stopPropagation();
        e.preventDefault();
        
        if (draggedItem !== this) {
            // Get indices of dragged item and drop target
            const fromIndex = parseInt(draggedItem.dataset.index);
            const toIndex = parseInt(this.dataset.index);
            
            // Reorder files array
            const movedFile = files[fromIndex];
            files.splice(fromIndex, 1);
            files.splice(toIndex, 0, movedFile);
            
            // Update preview
            updatePreview();
        }
        
        this.classList.remove('over');
        return false;
    }
    
    function removeFile(index) {
        files.splice(index, 1);
        updatePreview();
        convertBtn.disabled = files.length === 0;
    }
    
    convertBtn.addEventListener('click', async function() {
        if (files.length === 0) return;
        
        convertBtn.disabled = true;
        statusDiv.textContent = 'Processing...';
        statusDiv.style.color = '#333';
        
        try {
            const shouldMerge = mergeCheckbox.checked;
            const shouldCompress = compressCheckbox.checked;
            
            let pdfBytes;
            
            if (shouldMerge) {
                // Create a single PDF with all images in the current order
                pdfBytes = await createMergedPdf(files);
            } else {
                // Create separate PDFs (just first one in this example)
                pdfBytes = await createSinglePagePdf(files[0]);
            }
            
            if (shouldCompress) {
                statusDiv.textContent = 'Compressing PDF...';
                pdfBytes = await compressPdf(pdfBytes);
            }
            
            downloadPdf(pdfBytes, shouldMerge ? 'merged.pdf' : 'image.pdf');
            
            statusDiv.textContent = 'Conversion complete!';
            statusDiv.style.color = 'green';
        } catch (error) {
            console.error('Error:', error);
            statusDiv.textContent = 'Error during conversion: ' + error.message;
            statusDiv.style.color = 'red';
        } finally {
            convertBtn.disabled = false;
        }
    });
    
    function downloadPdf(pdfBytes, filename) {
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
});