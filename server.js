const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');
const PdfPrinter = require('pdfmake');
const multer = require('multer');

const app = express();
// Use port 3000 for development, 4789 for production
const PORT = process.env.PORT || 3000;

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // Limit to 5MB
  }
});

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(morgan('dev'));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Ensure directories exist
const tempDir = path.join(__dirname, 'temp');
const uploadsDir = path.join(__dirname, 'uploads');

if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir);
}

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

/**
 * Safely parse JSON data with proper error handling
 * @param {string} str - The JSON string to parse
 * @param {any} defaultValue - Default value if parsing fails
 * @returns {any} - The parsed JSON or default value
 */
function safeJsonParse(str, defaultValue = {}) {
  try {
    return JSON.parse(str);
  } catch (error) {
    console.error('Error parsing JSON:', error);
    return defaultValue;
  }
}

// PDF Generation endpoint
app.post('/api/generate-po', upload.single('logo'), async (req, res) => {
  console.log('Received PO generation request');
  console.log('Request body:', req.body);
  
  try {
    console.log('Successfully parsed form data');
    
    // Parse form data
    const documentType = req.body.documentType || 'po';
    const date = req.body.date || new Date().toISOString().split('T')[0];
    
    // Payment terms options
    const includePaymentTermsLine1 = req.body.includePaymentTermsLine1 === 'true';
    const includePaymentTermsLine2 = req.body.includePaymentTermsLine2 === 'true';
    const paymentDays = req.body.paymentDays || '30';
    
    // Get approval stamp info
    const useOriginalStamp = req.body.useOriginalStamp === 'true';
    const useCitStamp = req.body.useCitStamp === 'true';
    
    // Logo options
    const useDefaultLogo = req.body.useDefaultLogo === 'true';
    
    // Font configuration
    const fonts = {
      Helvetica: {
        normal: 'Helvetica',
        bold: 'Helvetica-Bold',
        italics: 'Helvetica-Oblique',
        bolditalics: 'Helvetica-BoldOblique'
      }
    };
    
    console.log('Font configuration set', fonts);
    
    // Initialize the PDF printer with fonts
    const printer = new PdfPrinter(fonts);
    
    // Get the uploaded logo file or use default
    let logoBase64 = null;
    if (useDefaultLogo) {
      // Use default logo
      const defaultLogoPath = path.join(__dirname, 'public', 'assets', 'images', 'chem-is-try-logo.png');
      console.log('Using default logo path:', defaultLogoPath);
      
      if (fs.existsSync(defaultLogoPath)) {
        const logoFile = fs.readFileSync(defaultLogoPath);
        logoBase64 = `data:image/png;base64,${logoFile.toString('base64')}`;
        console.log('Logo successfully converted to base64');
      } else {
        console.log('Logo file not found');
      }
    } else if (req.file) {
      // Use uploaded logo
      const logoFile = fs.readFileSync(req.file.path);
      const fileExtension = path.extname(req.file.originalname).toLowerCase();
      const mimeType = fileExtension === '.png' ? 'image/png' : 'image/jpeg';
      logoBase64 = `data:${mimeType};base64,${logoFile.toString('base64')}`;
      console.log('Uploaded logo converted to base64');
    } else {
      console.log('Logo file not found or not specified');
    }
    
    // Format the date for display in the document
    const dateObj = new Date(date);
    const formattedDate = `${(dateObj.getMonth() + 1).toString().padStart(2, '0')}/${dateObj.getDate().toString().padStart(2, '0')}/${dateObj.getFullYear()}`;
    
    // Define the document content based on document type
    let docDefinition;
    
    if (documentType === 'po') {
      // Purchase Order Document
      const poSuffix = req.body.poSuffix || '1';
      const activityDescription = req.body.activityDescription || '';
      
      // Create PO number in format CIT-MMDDYY-1
      const poNumber = `CIT${(dateObj.getMonth() + 1).toString().padStart(2, '0')}${dateObj.getDate().toString().padStart(2, '0')}${dateObj.getFullYear().toString().slice(-2)}-${poSuffix}`;
      
      console.log('Creating document definition');
      
      // Parse vendor and items from request
      const vendor = safeJsonParse(req.body.vendor, {});
      const items = safeJsonParse(req.body.items, []);
      
      // Calculate the total
      const total = items.reduce((sum, item) => {
        const quantity = parseFloat(item.quantity) || 0;
        const rate = parseFloat(item.rate) || 0;
        return sum + (quantity * rate);
      }, 0);
      
      // Get approval stamp if requested
      let originalStampBase64 = null;
      let citStampBase64 = null;
      
      // Get original stamp if checked
      if (useOriginalStamp) {
        const stampPath = path.join(__dirname, 'public', 'assets', 'images', 'stamp-original.png');
        
        if (fs.existsSync(stampPath)) {
          const stampFile = fs.readFileSync(stampPath);
          originalStampBase64 = `data:image/png;base64,${stampFile.toString('base64')}`;
          console.log('Original stamp loaded successfully');
        }
      }
      
      // Get CIT stamp if checked
      if (useCitStamp) {
        const stampPath = path.join(__dirname, 'public', 'assets', 'images', 'stamp-cit.png');
        
        if (fs.existsSync(stampPath)) {
          const stampFile = fs.readFileSync(stampPath);
          citStampBase64 = `data:image/png;base64,${stampFile.toString('base64')}`;
          console.log('CIT stamp loaded successfully');
        }
      }
      
      // Create the PDF definition
      docDefinition = {
        pageSize: 'LETTER',
        pageMargins: [40, 40, 40, 60],
        defaultStyle: {
          font: 'Helvetica'
        },
        styles: {
          header: {
            fontSize: 18,
            bold: true,
            margin: [0, 0, 0, 10]
          },
          subheader: {
            fontSize: 14,
            bold: true,
            margin: [0, 10, 0, 5]
          },
          normalText: {
            fontSize: 12,
            margin: [0, 5, 0, 5]
          },
          tableHeader: {
            bold: true,
            fontSize: 12,
            color: 'black'
          }
        },
        content: [
          // Header with logo and PO details
          {
            columns: [
              {
                width: '50%',
                stack: logoBase64 ? [{
                  image: logoBase64,
                  width: 200,
                  margin: [0, 0, 0, 10]
                }] : [{
                  text: 'CHEM-IS-TRY, INC.',
                  style: 'header'
                }]
              },
              {
                width: '50%',
                stack: [
                  {
                    text: 'PURCHASE ORDER',
                    style: 'header',
                    alignment: 'right'
                  },
                  {
                    text: `PO NO. ${poNumber}`,
                    style: 'subheader',
                    alignment: 'right'
                  },
                  {
                    text: `DATE: ${formattedDate}`,
                    style: 'normalText',
                    alignment: 'right'
                  },
                  {
                    text: 'Approved By',
                    margin: [0, 30, 0, 0]
                  },
                  {
                    columns: [
                      // Add both stamps if both are selected
                      (originalStampBase64 && citStampBase64) ? {
                        stack: [
                          {
                            image: originalStampBase64,
                            width: 100,
                            height: 50,
                            absolutePosition: { x: 70, y: 535 }
                          },
                          {
                            image: citStampBase64,
                            width: 100,
                            height: 50,
                            absolutePosition: { x: 150, y: 525 }
                          }
                        ]
                      } : 
                      // Otherwise add just one stamp if available
                      originalStampBase64 ? {
                        image: originalStampBase64,
                        width: 120,
                        height: 60,
                        absolutePosition: { x: 70, y: 530 }
                      } : 
                      citStampBase64 ? {
                        image: citStampBase64,
                        width: 120,
                        height: 60,
                        absolutePosition: { x: 70, y: 530 }
                      } : {},
                      { text: '', width: '*' }
                    ]
                  }
                ]
              }
            ],
            margin: [0, 0, 0, 20]
          },
          // Vendor information
          {
            text: 'VENDOR:',
            style: 'subheader'
          },
          {
            text: vendor.name || '',
            style: 'normalText'
          },
          {
            text: vendor.address || '',
            style: 'normalText'
          },
          {
            text: `${vendor.city || ''}, ${vendor.state || ''} ${vendor.zip || ''}`,
            style: 'normalText'
          },
          {
            text: vendor.country || '',
            style: 'normalText',
            margin: [0, 0, 0, 15]
          },
          // Activity description
          {
            text: activityDescription,
            margin: [0, 0, 0, 10]
          },
          // Table of items
          {
            table: {
              headerRows: 1,
              widths: ['10%', '60%', '15%', '15%'],
              body: [
                [
                  { text: 'QTY', style: 'tableHeader' },
                  { text: 'DESCRIPTION', style: 'tableHeader' },
                  { text: 'RATE', style: 'tableHeader', alignment: 'right' },
                  { text: 'AMOUNT', style: 'tableHeader', alignment: 'right' }
                ],
                ...items.map(item => {
                  const quantity = parseFloat(item.quantity) || 0;
                  const rate = parseFloat(item.rate) || 0;
                  const amount = quantity * rate;
                  
                  return [
                    { text: quantity.toString(), alignment: 'center' },
                    { text: item.description || '' },
                    { text: `$${rate.toFixed(2)}`, alignment: 'right' },
                    { text: `$${amount.toFixed(2)}`, alignment: 'right' }
                  ];
                })
              ]
            },
            layout: 'lightHorizontalLines',
            margin: [0, 0, 0, 20]
          },
          // Total
          {
            columns: [
              { width: '*', text: '' },
              {
                width: 'auto',
                table: {
                  body: [
                    ['TOTAL:', `$${total.toFixed(2)}`]
                  ]
                },
                layout: 'noBorders',
                alignment: 'right'
              }
            ],
            margin: [0, 0, 0, 20]
          },
          // Payment terms
          {
            text: 'PAYMENT TERMS:',
            style: 'subheader'
          },
          {
            stack: [
              includePaymentTermsLine1 ? { 
                text: `Payment : Net ${paymentDays} days`,
                margin: [0, 2, 0, 0]
              } : null,
              includePaymentTermsLine2 ? { 
                text: 'All prices are delivered prices',
                margin: [0, 2, 0, 0]
              } : null
            ].filter(Boolean), // Filter out null values
            style: 'normalText',
            margin: [0, 0, 0, 20]
          }
        ]
      };
    } else {
      // Invoice Document
      // Implementation for invoice document would go here
      // ... (invoice specific code)
    }
    
    console.log('Creating PDF document');
    const pdfDoc = printer.createPdfKitDocument(docDefinition);
    
    // Generate filename based on document type and number
    let filename;
    if (documentType === 'po') {
      const poSuffix = req.body.poSuffix || '1';
      const poNumber = `CIT${(dateObj.getMonth() + 1).toString().padStart(2, '0')}${dateObj.getDate().toString().padStart(2, '0')}${dateObj.getFullYear().toString().slice(-2)}-${poSuffix}`;
      filename = `PO_${poNumber}_${Date.now()}.pdf`;
    } else {
      const invoiceNumber = req.body.invoiceNumber || Date.now().toString().slice(-6);
      filename = `INVOICE_${invoiceNumber}_${Date.now()}.pdf`;
    }
    
    const filePath = path.join(__dirname, 'temp', filename);
    const writeStream = fs.createWriteStream(filePath);
    
    console.log(`Writing PDF to file: ${filePath}`);
    pdfDoc.pipe(writeStream);
    pdfDoc.end();
    
    writeStream.on('finish', () => {
      console.log('PDF generation completed successfully');
      res.json({
        success: true,
        filename: filename,
        downloadUrl: `/download/${filename}`
      });
    });
    
  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Download route for generated PDFs
app.get('/download/:filename', (req, res) => {
  const filename = req.params.filename;
  const filepath = path.join(__dirname, 'temp', filename);
  
  if (fs.existsSync(filepath)) {
    res.download(filepath, filename, (err) => {
      if (err) {
        console.error('Error downloading file:', err);
        return res.status(500).send('Error downloading file');
      }
      
      // Delete file after download (optional)
      setTimeout(() => {
        fs.unlink(filepath, (err) => {
          if (err) console.error('Error deleting temp file:', err);
        });
      }, 60000); // Delete after 1 minute
    });
  } else {
    res.status(404).send('File not found');
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`To access from other devices on your network, use your IP address: http://<your-ip-address>:${PORT}`);
}); 