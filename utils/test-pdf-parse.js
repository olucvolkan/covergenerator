// Test script for pdf-parse functionality
const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');

async function testPdfParse() {
  try {
    console.log("Starting PDF parse test");
    
    // Sample PDF path - create a sample PDF file in the project root for testing
    const samplePdfPath = path.join(__dirname, '../sample.pdf');
    
    // Check if the sample PDF exists
    console.log(`Checking for sample PDF at: ${samplePdfPath}`);
    const fileExists = fs.existsSync(samplePdfPath);
    
    if (!fileExists) {
      console.error("Sample PDF not found. Please create a sample.pdf file in the project root.");
      return;
    }
    
    // Read the PDF file
    console.log("Reading PDF file...");
    const dataBuffer = fs.readFileSync(samplePdfPath);
    console.log(`PDF file read, buffer size: ${dataBuffer.length} bytes`);
    
    // Parse the PDF
    console.log("Parsing PDF...");
    try {
      const data = await pdfParse(dataBuffer);
      
      console.log("PDF parsing successful!");
      console.log("PDF Info:");
      console.log(`- Number of pages: ${data.numpages}`);
      console.log(`- Text length: ${data.text.length} characters`);
      console.log(`- First 100 characters: "${data.text.substring(0, 100)}..."`);
    } catch (parseError) {
      console.error("PDF parsing failed:", parseError);
    }
  } catch (error) {
    console.error("Test failed:", error);
  }
}

// Run the test
testPdfParse().then(() => {
  console.log("Test completed");
}).catch(err => {
  console.error("Test failed with uncaught error:", err);
}); 