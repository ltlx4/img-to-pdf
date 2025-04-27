async function createSinglePagePdf(imageFile) {
    const { PDFDocument, rgb } = PDFLib;
    
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage();
    
    // Read the image file
    const imageBytes = await readFileAsArrayBuffer(imageFile);
    
    // Embed the image based on its type
    let image;
    if (imageFile.type === 'image/jpeg' || imageFile.type === 'image/jpg') {
        image = await pdfDoc.embedJpg(imageBytes);
    } else if (imageFile.type === 'image/png') {
        image = await pdfDoc.embedPng(imageBytes);
    } else {
        throw new Error('Unsupported image format');
    }
    
    // Set page size to match image aspect ratio
    const { width, height } = image.scale(1);
    page.setSize(width, height);
    
    // Draw the image on the page
    page.drawImage(image, {
        x: 0,
        y: 0,
        width,
        height,
    });
    
    // Save the PDF
    return await pdfDoc.save();
}

async function createMergedPdf(imageFiles) {
    const { PDFDocument, rgb } = PDFLib;
    
    const pdfDoc = await PDFDocument.create();
    
    for (const imageFile of imageFiles) {
        // Read the image file
        const imageBytes = await readFileAsArrayBuffer(imageFile);
        
        // Embed the image based on its type
        let image;
        if (imageFile.type === 'image/jpeg' || imageFile.type === 'image/jpg') {
            image = await pdfDoc.embedJpg(imageBytes);
        } else if (imageFile.type === 'image/png') {
            image = await pdfDoc.embedPng(imageBytes);
        } else {
            console.warn(`Skipping unsupported image format: ${imageFile.type}`);
            continue;
        }
        
        // Add a new page for this image
        const page = pdfDoc.addPage();
        
        // Set page size to match image aspect ratio
        const { width, height } = image.scale(1);
        page.setSize(width, height);
        
        // Draw the image on the page
        page.drawImage(image, {
            x: 0,
            y: 0,
            width,
            height,
        });
    }
    
    // Save the PDF
    return await pdfDoc.save();
}

function readFileAsArrayBuffer(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
    });
}

async function compressPdf(pdfBytes) {
    // Simple compression by reducing quality
    // Note: For more advanced compression, you might want to use a server-side solution
    // or a more comprehensive PDF library
    
    // This is a basic approach - in a real app, you might want to use a proper PDF compression library
    try {
        const { PDFDocument } = PDFLib;
        const pdfDoc = await PDFDocument.load(pdfBytes);
        
        // Re-save with reduced quality
        const compressedBytes = await pdfDoc.save({
            useObjectStreams: true,
            // Reduce image quality
            // Note: PDF-lib's image embedding options are limited
            // For better compression, you'd need a more advanced solution
        });
        
        return compressedBytes;
    } catch (error) {
        console.warn('Compression failed, returning original PDF', error);
        return pdfBytes;
    }
}