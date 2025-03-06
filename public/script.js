document.addEventListener('DOMContentLoaded', () => {
  // Set today's date as default in the date picker
  const today = new Date();
  const formattedDate = today.toISOString().split('T')[0]; // YYYY-MM-DD format
  document.getElementById('poDate').value = formattedDate;
  
  // Also set today's date for invoice fields
  if (document.getElementById('invoiceDate')) {
    document.getElementById('invoiceDate').value = formattedDate;
    
    // Set due date as today + 30 days
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30);
    document.getElementById('dueDate').value = dueDate.toISOString().split('T')[0];
  }
  
  // Initialize item rows
  initializeLineItems();
  
  // Set up all live preview listeners
  setupLivePreviewListeners();
  
  // Initialize approval stamp if selected
  updateApprovalStamp();
  
  // Initialize the preview with current date and PO number
  updatePreviewDateAndPONumber();
  
  // Add event listeners
  document.getElementById('addItemBtn').addEventListener('click', addItemRow);
  document.getElementById('addInvoiceItemBtn')?.addEventListener('click', addInvoiceItemRow);
  document.getElementById('useDefaultLogo').addEventListener('change', toggleLogoOptions);
  document.getElementById('uploadCustomLogo').addEventListener('change', toggleLogoOptions);
  document.getElementById('logoFile').addEventListener('change', previewCustomLogo);
  
  // Document type toggle
  document.querySelectorAll('input[name="documentType"]').forEach(radio => {
    radio.addEventListener('change', toggleDocumentType);
  });
  
  // Approval stamp selection
  document.getElementById('useOriginalStamp').addEventListener('change', updateApprovalStamp);
  document.getElementById('useCitStamp').addEventListener('change', updateApprovalStamp);
  
  // Reset button
  document.querySelector('button[type="reset"]').addEventListener('click', handleFormReset);
  
  // Form submission
  document.getElementById('poForm').addEventListener('submit', handleFormSubmit);
  
  // Print preview button
  document.getElementById('printPreviewBtn')?.addEventListener('click', () => {
    showPrintPreview();
  });
  
  // Success modal print button
  document.getElementById('printPdfBtn')?.addEventListener('click', () => {
    preparePrintPreview();
  });
  
  // Payment terms controls
  document.getElementById('includePaymentTermsLine1').addEventListener('change', toggleCustomPaymentTerms);
  document.getElementById('includePaymentTermsLine2').addEventListener('change', toggleCustomPaymentTerms);
  document.getElementById('paymentDays').addEventListener('input', updatePreviewPaymentTerms);
  document.getElementById('paymentTermsLine1').addEventListener('input', updatePreviewPaymentTerms);
  document.getElementById('paymentTermsLine2').addEventListener('input', updatePreviewPaymentTerms);
  
  // Setup real-time preview for all form fields
  setupLivePreviewListeners();
  
  // Initialize the preview with default values
  toggleLogoOptions();
  updatePreview();
  toggleCustomPaymentTerms(); // Initialize payment terms display
});

/**
 * Sets up listeners for real-time preview updates
 */
function setupLivePreviewListeners() {
  // Company name, contact info, etc.
  document.getElementById('activityDescription').addEventListener('input', updatePreviewActivity);
  
  // Document date
  document.getElementById('poDate').addEventListener('input', updatePreviewDateAndPONumber);
  document.getElementById('poSuffix').addEventListener('input', updatePreviewDateAndPONumber);
  
  // Vendor info
  document.getElementById('vendorName').addEventListener('input', updatePreviewVendor);
  document.getElementById('vendorAddress').addEventListener('input', updatePreviewVendor);
  document.getElementById('vendorCity').addEventListener('input', updatePreviewVendor);
  document.getElementById('vendorState').addEventListener('input', updatePreviewVendor);
  document.getElementById('vendorZip').addEventListener('input', updatePreviewVendor);
  document.getElementById('vendorCountry').addEventListener('input', updatePreviewVendor);
  
  // Line Items - Initial row
  setupLineItemListeners(document.querySelector('.line-item'));
  
  // Payment Terms
  document.getElementById('paymentDays').addEventListener('input', updatePreviewPaymentTerms);
  document.getElementById('includePaymentTermsLine1').addEventListener('change', updatePreviewPaymentTerms);
  document.getElementById('includePaymentTermsLine2').addEventListener('change', updatePreviewPaymentTerms);
  
  // Invoice Information
  if (document.getElementById('invoiceNumber')) {
    document.getElementById('invoiceNumber').addEventListener('input', updateInvoicePreview);
    document.getElementById('invoiceDate').addEventListener('input', updateInvoicePreview);
    document.getElementById('dueDate').addEventListener('input', updateInvoicePreview);
    document.getElementById('paymentTerms').addEventListener('change', updateInvoicePreview);
    document.getElementById('notes').addEventListener('input', updateInvoicePreview);
    
    // Initial invoice item
    const initialInvoiceItem = document.querySelector('.invoice-item');
    if (initialInvoiceItem) {
      setupInvoiceItemListeners(initialInvoiceItem);
    }
  }
}

/**
 * Sets up listeners for a single line item row
 */
function setupLineItemListeners(itemRow) {
  const quantityInput = itemRow.querySelector('.item-quantity');
  const descriptionInput = itemRow.querySelector('.item-description');
  const rateInput = itemRow.querySelector('.item-rate');
  
  quantityInput.addEventListener('input', (e) => {
    updateRowAmount(e);
    updatePreviewLineItems();
  });
  
  descriptionInput.addEventListener('input', updatePreviewLineItems);
  
  rateInput.addEventListener('input', (e) => {
    updateRowAmount(e);
    updatePreviewLineItems();
  });
}

// Utility functions
function formatDate(dateInput) {
  if (!dateInput) return 'MM/DD/YYYY';
  
  // Parse the input date string (YYYY-MM-DD) and adjust for timezone
  const [year, month, day] = dateInput.split('-');
  const dateObj = new Date(year, month - 1, day); // month is 0-based in JavaScript Date
  
  return `${(dateObj.getMonth() + 1).toString().padStart(2, '0')}/${dateObj.getDate().toString().padStart(2, '0')}/${dateObj.getFullYear()}`;
}

function formatPONumber(dateInput, suffix = '1') {
  if (!dateInput) return 'CITMMDDYY-1';
  
  // Parse the input date string (YYYY-MM-DD) and adjust for timezone
  const [year, month, day] = dateInput.split('-');
  const dateObj = new Date(year, month - 1, day); // month is 0-based in JavaScript Date
  
  return `CIT${(dateObj.getMonth() + 1).toString().padStart(2, '0')}${dateObj.getDate().toString().padStart(2, '0')}${dateObj.getFullYear().toString().slice(-2)}-${suffix}`;
}

/**
 * Update the preview based on the current form values
 */
function updatePreview() {
  const documentType = document.querySelector('input[name="documentType"]:checked').value;
  
  if (documentType === 'invoice') {
    updateInvoicePreview();
    updateInvoicePreviewItems();
  } else {
    // Update logo
    updatePreviewLogo();
    
    // Update date and PO number
    updatePreviewDateAndPONumber();
    
    // Update vendor information
    updatePreviewVendor();
    
    // Update line items
    updatePreviewLineItems();
    
    // Update activity description
    updatePreviewActivity();
    
    // Update payment terms
    updatePreviewPaymentTerms();
  }
}

/**
 * Update the logo in the preview
 */
function updatePreviewLogo() {
  const useDefaultLogo = document.getElementById('useDefaultLogo').checked;
  const customLogoUploaded = document.getElementById('customLogoPreview') && 
                             !document.getElementById('customLogoPreview').classList.contains('d-none');
  
  if (useDefaultLogo) {
    document.getElementById('preview-logo').src = 'assets/images/chem-is-try-logo.png';
  } else if (customLogoUploaded) {
    document.getElementById('preview-logo').src = document.getElementById('previewImage').src;
  }
}

// Update date and PO number in preview
function updatePreviewDateAndPONumber() {
  const dateInput = document.getElementById('poDate').value;
  const suffix = document.getElementById('poSuffix').value || '1';
  
  // Format date for display
  const formattedDate = formatDate(dateInput);
  
  // Format PO number
  const poNumber = formatPONumber(dateInput, suffix);
  
  document.getElementById('preview-date').textContent = formattedDate;
  document.getElementById('preview-po-number').textContent = poNumber;
}

// Update vendor information in preview
function updatePreviewVendor() {
  const name = document.getElementById('vendorName').value;
  const address = document.getElementById('vendorAddress').value;
  const city = document.getElementById('vendorCity').value;
  const state = document.getElementById('vendorState').value;
  const zip = document.getElementById('vendorZip').value;
  const country = document.getElementById('vendorCountry').value || 'USA';
  
  document.getElementById('preview-vendor-name').textContent = name || '--';
  document.getElementById('preview-vendor-address').textContent = address || '--';
  
  let cityStateZip = '--';
  if (city || state || zip) {
    cityStateZip = `${city || '--'}, ${state || '--'} ${zip || '-----'} ${country}`;
  }
  document.getElementById('preview-vendor-city-state').textContent = cityStateZip;
}

// Update line items in preview
function updatePreviewLineItems() {
  const lineItems = document.querySelectorAll('.line-item');
  const previewTable = document.getElementById('preview-line-items');
  
  // Clear existing rows
  previewTable.innerHTML = '';
  
  if (lineItems.length === 0) {
    previewTable.innerHTML = '<tr><td colspan="4" class="text-center">No items added</td></tr>';
    document.getElementById('preview-total').textContent = '$0.00';
    return;
  }
  
  let total = 0;
  
  lineItems.forEach(item => {
    const quantity = parseFloat(item.querySelector('.item-quantity').value) || 0;
    const description = item.querySelector('.item-description').value || '--';
    const rate = parseFloat(item.querySelector('.item-rate').value) || 0;
    const amount = quantity * rate;
    total += amount;
    
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${quantity}</td>
      <td>${description}</td>
      <td class="text-end">$${rate.toFixed(2)}</td>
      <td class="text-end">${amount.toLocaleString('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2
      })}</td>
    `;
    previewTable.appendChild(row);
  });
  
  // Update total amount
  document.getElementById('preview-total').textContent = total.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  });
}

// Toggle between default and custom logo options
function toggleLogoOptions() {
  const customLogoUpload = document.getElementById('customLogoUpload');
  const uploadCustomLogo = document.getElementById('uploadCustomLogo').checked;
  
  customLogoUpload.classList.toggle('d-none', !uploadCustomLogo);
  
  // Update preview logo
  if (!uploadCustomLogo) {
    document.getElementById('preview-logo').src = 'assets/images/chem-is-try-logo.png';
  }
}

// Preview the custom logo when selected
function previewCustomLogo(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  const previewContainer = document.getElementById('customLogoPreview');
  const previewImage = document.getElementById('previewImage');
  
  // Create URL for the uploaded image
  const imageUrl = URL.createObjectURL(file);
  previewImage.src = imageUrl;
  
  // Show the preview
  previewContainer.classList.remove('d-none');
  
  // Update preview logo in PO preview
  document.getElementById('preview-logo').src = imageUrl;
}

// Initialize line items with event listeners
function initializeLineItems() {
  document.querySelectorAll('.line-item').forEach(item => {
    // Add calculation events to all inputs
    const quantityInput = item.querySelector('.item-quantity');
    const rateInput = item.querySelector('.item-rate');
    
    if (quantityInput && rateInput) {
      quantityInput.addEventListener('input', updateRowAmount);
      rateInput.addEventListener('input', updateRowAmount);
    }
    
    // Add remove button if more than one item exists
    if (document.querySelectorAll('.line-item').length > 1) {
      addRemoveButton(item);
    }
  });
}

// Add a new item row
function addItemRow() {
  const lineItems = document.getElementById('lineItems');
  const newRow = document.createElement('div');
  newRow.className = 'row mb-3 line-item';
  
  newRow.innerHTML = `
    <div class="col-md-1">
      <label class="form-label">Qty</label>
      <input type="number" class="form-control item-quantity" required>
    </div>
    <div class="col-md-7">
      <label class="form-label">Description</label>
      <input type="text" class="form-control item-description" required>
    </div>
    <div class="col-md-2">
      <label class="form-label">Rate</label>
      <input type="number" step="0.01" class="form-control item-rate" required>
    </div>
    <div class="col-md-2">
      <label class="form-label">Amount</label>
      <input type="text" class="form-control item-amount" readonly>
    </div>
  `;
  
  lineItems.appendChild(newRow);
  
  // Add remove button
  addRemoveButton(newRow);
  
  // Set up real-time preview listeners for the new row
  setupLineItemListeners(newRow);
  
  // Update the preview
  updatePreviewLineItems();
}

/**
 * Adds a remove button to a line item or invoice item
 */
function addRemoveButton(item, type = 'line-item') {
  // Check if a remove button already exists
  if (item.querySelector('.remove-item-btn')) return;
  
  const removeBtn = document.createElement('button');
  removeBtn.className = 'btn btn-sm btn-outline-danger remove-item-btn';
  removeBtn.innerHTML = '<i class="bi bi-x-circle"></i>';
  removeBtn.title = 'Remove Item';
  removeBtn.type = 'button';
  
  // Add the button to the item
  item.appendChild(removeBtn);
  
  // Add event listener to the button
  removeBtn.addEventListener('click', function() {
    item.remove();
    
    // Check if we need to update line items or invoice items
    if (type === 'invoice') {
      calculateInvoiceTotal();
      updateInvoicePreviewItems();
    } else {
      calculateTotal();
      updatePreviewLineItems();
    }
  });
}

// Update the amount for a row when quantity or rate changes
function updateRowAmount(event) {
  const row = event.target.closest('.line-item');
  const quantity = parseFloat(row.querySelector('.item-quantity').value) || 0;
  const rate = parseFloat(row.querySelector('.item-rate').value) || 0;
  const amount = quantity * rate;
  
  row.querySelector('.item-amount').value = amount.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD'
  });
  
  calculateTotal();
  updatePreviewLineItems();
}

// Calculate the total of all line items
function calculateTotal() {
  let total = 0;
  
  document.querySelectorAll('.line-item').forEach(item => {
    const quantity = parseFloat(item.querySelector('.item-quantity').value) || 0;
    const rate = parseFloat(item.querySelector('.item-rate').value) || 0;
    total += quantity * rate;
  });
  
  document.getElementById('totalAmount').textContent = total.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD'
  });
}

// Handle form reset
function handleFormReset() {
  // Keep only one line item
  const lineItems = document.getElementById('lineItems');
  const items = lineItems.querySelectorAll('.line-item');
  
  // Remove all but the first item
  for (let i = 1; i < items.length; i++) {
    items[i].remove();
  }
  
  // Clear fields in remaining item
  const firstItem = lineItems.querySelector('.line-item');
  if (firstItem) {
    firstItem.querySelector('.item-quantity').value = '';
    firstItem.querySelector('.item-description').value = '';
    firstItem.querySelector('.item-rate').value = '';
    firstItem.querySelector('.item-amount').value = '';
    
    // Remove delete button from first item
    const removeBtn = firstItem.querySelector('.remove-item-btn');
    if (removeBtn) removeBtn.remove();
  }
  
  // Reset the total
  document.getElementById('totalAmount').textContent = '$0.00';
  
  // Reset the date to today
  const today = new Date();
  const formattedDate = today.toISOString().split('T')[0];
  document.getElementById('poDate').value = formattedDate;
  
  // Reset logo selection to default
  document.getElementById('useDefaultLogo').checked = true;
  document.getElementById('customLogoUpload').classList.add('d-none');
  document.getElementById('customLogoPreview').classList.add('d-none');
  document.getElementById('logoFile').value = '';
  
  // Reset preview
  document.getElementById('preview-logo').src = 'assets/images/chem-is-try-logo.png';
  updatePreview();
}

/**
 * Handles form submission
 */
function handleFormSubmit(event) {
  event.preventDefault();
  
  // Trigger form validation
  if (!document.getElementById('poForm').checkValidity()) {
    return;
  }
  
  // Show loading overlay
  document.getElementById('loadingOverlay').classList.remove('d-none');
  
  // Create form data object
  const formData = new FormData();
  
  // Determine document type
  const documentType = document.querySelector('input[name="documentType"]:checked').value;
  formData.append('documentType', documentType);
  
  // Add payment terms information
  formData.append('includePaymentTermsLine1', document.getElementById('includePaymentTermsLine1').checked);
  formData.append('includePaymentTermsLine2', document.getElementById('includePaymentTermsLine2').checked);
  
  if (document.getElementById('includePaymentTermsLine1').checked) {
    formData.append('paymentDays', document.getElementById('paymentDays').value || '30');
  }
  
  // For PO-specific fields
  if (documentType === 'po') {
    formData.append('date', document.getElementById('poDate').value);
    formData.append('poSuffix', document.getElementById('poSuffix').value || '1');
    formData.append('activityDescription', document.getElementById('activityDescription').value || '');
  } else {
    // For Invoice-specific fields
    formData.append('invoiceNumber', document.getElementById('invoiceNumber').value || '');
    formData.append('invoiceDate', document.getElementById('invoiceDate').value);
    formData.append('dueDate', document.getElementById('dueDate').value);
  }
  
  // Add logo information
  const useDefaultLogo = document.getElementById('useDefaultLogo').checked;
  formData.append('useDefaultLogo', useDefaultLogo);
  
  if (!useDefaultLogo && document.getElementById('customLogo').files.length > 0) {
    formData.append('logo', document.getElementById('customLogo').files[0]);
  }
  
  // Add approval stamp information
  const useOriginalStamp = document.getElementById('useOriginalStamp').checked;
  const useCitStamp = document.getElementById('useCitStamp').checked;
  formData.append('useOriginalStamp', useOriginalStamp);
  formData.append('useCitStamp', useCitStamp);
  
  // Add vendor information
  const vendor = {
    name: document.getElementById('vendorName').value,
    address: document.getElementById('vendorAddress').value,
    city: document.getElementById('vendorCity').value,
    state: document.getElementById('vendorState').value,
    zip: document.getElementById('vendorZip').value,
    country: document.getElementById('vendorCountry').value
  };
  
  formData.append('vendor', JSON.stringify(vendor));
  
  // Add line items
  if (documentType === 'po') {
    const lineItems = [];
    document.querySelectorAll('.line-item').forEach(row => {
      const quantityInput = row.querySelector('.item-quantity');
      const descriptionInput = row.querySelector('.item-description');
      const rateInput = row.querySelector('.item-rate');
      
      if (quantityInput && descriptionInput && rateInput) {
        // Ensure we have valid numeric values or default to 0
        const quantity = parseFloat(quantityInput.value) || 0;
        const rate = parseFloat(rateInput.value) || 0;
        
        lineItems.push({
          quantity: quantity.toString(),
          description: descriptionInput.value || '',
          rate: rate.toString()
        });
      }
    });
    
    formData.append('items', JSON.stringify(lineItems));
  } else {
    // For invoice items
    const invoiceItems = [];
    document.querySelectorAll('.invoice-item').forEach(row => {
      const quantityInput = row.querySelector('.invoice-quantity');
      const descriptionInput = row.querySelector('.invoice-description');
      const priceInput = row.querySelector('.invoice-price');
      
      if (quantityInput && descriptionInput && priceInput) {
        // Ensure we have valid numeric values or default to 0
        const quantity = parseFloat(quantityInput.value) || 0;
        const price = parseFloat(priceInput.value) || 0;
        
        invoiceItems.push({
          quantity: quantity.toString(),
          description: descriptionInput.value || '',
          price: price.toString()
        });
      }
    });
    
    formData.append('invoiceItems', JSON.stringify(invoiceItems));
  }
  
  // Send the form data
  fetch('/api/generate-po', {
    method: 'POST',
    body: formData
  })
  .then(response => {
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    return response.json();
  })
  .then(data => {
    // Hide loading overlay
    document.getElementById('loadingOverlay').classList.add('d-none');
    
    // Open the PDF in a new window
    window.open(`/download/${data.filename}`, '_blank');
  })
  .catch(error => {
    console.error('Error:', error);
    document.getElementById('loadingOverlay').classList.add('d-none');
    alert('There was an error generating the document. Please try again.');
  });
}

/**
 * Toggle between Purchase Order and Invoice document types
 */
function toggleDocumentType(event) {
  const documentType = document.querySelector('input[name="documentType"]:checked').value;
  
  // Update form title
  document.getElementById('poFormTitle').textContent = 
    documentType === 'po' ? 'Purchase Order Information' : 'Invoice Information';
  
  // Update preview title
  document.getElementById('previewTitle').textContent = 
    documentType === 'po' ? 'Purchase Order Preview' : 'Invoice Preview';
  
  // Update preview document type
  document.getElementById('preview-document-type').textContent = 
    documentType === 'po' ? 'Purchase Order' : 'Invoice';
  
  // Update activity label
  document.getElementById('activity-label').textContent = 
    documentType === 'po' ? 'ACTIVITY' : 'DESCRIPTION';
  
  // Update button text
  const submitButton = document.querySelector('#poForm button[type="submit"]');
  submitButton.innerHTML = `<i class="bi bi-file-earmark-pdf me-1"></i>Generate ${documentType === 'po' ? 'PO' : 'Invoice'}`;
  
  // Update success modal title
  document.querySelector('#successModal .modal-title').textContent = 
    documentType === 'po' ? 'Purchase Order Created' : 'Invoice Created';
  
  // Update success modal message
  document.querySelector('#successModal .modal-body p:first-child').textContent = 
    documentType === 'po' ? 'Your Purchase Order has been successfully generated.' : 'Your Invoice has been successfully generated.';
  
  // Update table header
  const headerRow = document.getElementById('table-header-row');
  if (documentType === 'po') {
    headerRow.innerHTML = `
      <th>QTY</th>
      <th>DESCRIPTION</th>
      <th class="text-end">RATE</th>
      <th class="text-end">AMOUNT</th>
    `;
  } else {
    headerRow.innerHTML = `
      <th>DESCRIPTION</th>
      <th class="text-end">QTY</th>
      <th class="text-end">UNIT PRICE</th>
      <th class="text-end">TOTAL</th>
    `;
  }
  
  // Toggle visibility of sections
  if (documentType === 'po') {
    document.getElementById('poItemsSection').classList.remove('d-none');
    document.getElementById('invoiceFieldsSection').classList.add('d-none');
    document.getElementById('po-specific-details').classList.remove('d-none');
    document.getElementById('invoice-specific-details').classList.add('d-none');
    document.getElementById('po-payment-terms').classList.remove('d-none');
    document.getElementById('invoice-payment-terms').classList.add('d-none');
    document.getElementById('invoice-notes-section').classList.add('d-none');
    document.getElementById('poPaymentTermsSection').classList.remove('d-none');
  } else {
    document.getElementById('poItemsSection').classList.add('d-none');
    document.getElementById('invoiceFieldsSection').classList.remove('d-none');
    document.getElementById('po-specific-details').classList.add('d-none');
    document.getElementById('invoice-specific-details').classList.remove('d-none');
    document.getElementById('po-payment-terms').classList.add('d-none');
    document.getElementById('invoice-payment-terms').classList.remove('d-none');
    document.getElementById('invoice-notes-section').classList.remove('d-none');
    document.getElementById('poPaymentTermsSection').classList.add('d-none');
  }
  
  // Update the preview
  updatePreview();
}

/**
 * Add a new invoice item row
 */
function addInvoiceItemRow() {
  const invoiceItems = document.getElementById('invoiceItems');
  const newRow = document.createElement('div');
  newRow.className = 'row mb-3 invoice-item';
  
  newRow.innerHTML = `
    <div class="col-md-6">
      <label class="form-label">Description</label>
      <input type="text" class="form-control invoice-description" required>
    </div>
    <div class="col-md-2">
      <label class="form-label">Quantity</label>
      <input type="number" class="form-control invoice-quantity" required>
    </div>
    <div class="col-md-2">
      <label class="form-label">Unit Price</label>
      <input type="number" step="0.01" class="form-control invoice-price" required>
    </div>
    <div class="col-md-2">
      <label class="form-label">Total</label>
      <input type="text" class="form-control invoice-total" readonly>
    </div>
  `;
  
  invoiceItems.appendChild(newRow);
  
  // Add remove button
  addRemoveButton(newRow, 'invoice');
  
  // Set up real-time preview listeners for the new row
  setupInvoiceItemListeners(newRow);
  
  // Update the preview
  updateInvoicePreviewItems();
}

/**
 * Update the amount for an invoice item row
 */
function updateInvoiceRowAmount(event) {
  const row = event.target.closest('.invoice-item');
  const quantity = parseFloat(row.querySelector('.invoice-quantity').value) || 0;
  const price = parseFloat(row.querySelector('.invoice-price').value) || 0;
  const total = quantity * price;
  
  row.querySelector('.invoice-total').value = total.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD'
  });
  
  calculateInvoiceTotal();
  updateInvoicePreviewItems();
}

/**
 * Calculate the total for all invoice items
 */
function calculateInvoiceTotal() {
  const rows = document.querySelectorAll('.invoice-item');
  let total = 0;
  
  rows.forEach(row => {
    const quantity = parseFloat(row.querySelector('.invoice-quantity').value) || 0;
    const price = parseFloat(row.querySelector('.invoice-price').value) || 0;
    total += quantity * price;
  });
  
  document.getElementById('totalAmount').textContent = total.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD'
  });
  
  document.getElementById('preview-total').textContent = total.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD'
  });
}

/**
 * Setup listeners for invoice items
 */
function setupInvoiceItemListeners(item) {
  const descriptionInput = item.querySelector('.invoice-description');
  const quantityInput = item.querySelector('.invoice-quantity');
  const priceInput = item.querySelector('.invoice-price');
  
  descriptionInput.addEventListener('input', updateInvoicePreviewItems);
  quantityInput.addEventListener('input', updateInvoicePreviewItems);
  priceInput.addEventListener('input', updateInvoicePreviewItems);
}

/**
 * Update the invoice preview fields
 */
function updateInvoicePreview() {
  const invoiceNumber = document.getElementById('invoiceNumber').value || '--';
  const invoiceDate = document.getElementById('invoiceDate').value;
  const dueDate = document.getElementById('dueDate').value;
  const paymentTerms = document.getElementById('paymentTerms');
  const notes = document.getElementById('notes').value || '--';
  
  document.getElementById('preview-invoice-number').textContent = invoiceNumber;
  
  // Format dates
  if (invoiceDate) {
    const formattedInvoiceDate = formatDate(invoiceDate);
    document.getElementById('preview-invoice-date').textContent = formattedInvoiceDate;
  }
  
  if (dueDate) {
    const formattedDueDate = formatDate(dueDate);
    document.getElementById('preview-due-date').textContent = formattedDueDate;
  }
  
  // Update payment terms
  if (paymentTerms) {
    const selectedTerms = paymentTerms.options[paymentTerms.selectedIndex].text;
    document.getElementById('preview-payment-terms').textContent = selectedTerms;
  }
  
  // Update notes
  document.getElementById('preview-notes').textContent = notes;
  
  // Update activity/services section
  document.getElementById('preview-activity').textContent = document.getElementById('activityDescription').value || '--';
}

/**
 * Update the invoice items in the preview
 */
function updateInvoicePreviewItems() {
  const invoiceItems = document.querySelectorAll('.invoice-item');
  const previewLineItems = document.getElementById('preview-line-items');
  
  if (invoiceItems.length === 0) {
    previewLineItems.innerHTML = '<tr><td colspan="4" class="text-center">No items added</td></tr>';
    return;
  }
  
  let html = '';
  
  invoiceItems.forEach(item => {
    const description = item.querySelector('.invoice-description').value || '--';
    const quantity = item.querySelector('.invoice-quantity').value || '0';
    const price = parseFloat(item.querySelector('.invoice-price').value) || 0;
    const total = parseFloat(quantity) * price;
    
    html += `
      <tr>
        <td>${quantity}</td>
        <td>${description}</td>
        <td class="text-end">${price.toFixed(2)}</td>
        <td class="text-end">${total.toLocaleString('en-US', {
          style: 'currency',
          currency: 'USD'
        })}</td>
      </tr>
    `;
  });
  
  previewLineItems.innerHTML = html;
  calculateInvoiceTotal();
}

/**
 * Update the activity description in the preview
 */
function updatePreviewActivity() {
  const activityText = document.getElementById('activityDescription').value;
  document.getElementById('preview-activity').textContent = activityText || '--';
}

/**
 * Toggles the payment terms section based on checkbox state
 */
function toggleCustomPaymentTerms() {
  const line1Checked = document.getElementById('includePaymentTermsLine1').checked;
  const line2Checked = document.getElementById('includePaymentTermsLine2').checked;
  
  // Enable/disable the payment days input based on the first checkbox
  const paymentDaysInput = document.getElementById('paymentDays');
  paymentDaysInput.disabled = !line1Checked;
  
  // Update the preview to reflect changes
  updatePreviewPaymentTerms();
}

/**
 * Updates the payment terms in the preview
 */
function updatePreviewPaymentTerms() {
  const line1Checked = document.getElementById('includePaymentTermsLine1').checked;
  const line2Checked = document.getElementById('includePaymentTermsLine2').checked;
  const paymentDays = document.getElementById('paymentDays').value || '30';
  
  const poPaymentTermsElement = document.getElementById('po-payment-terms');
  
  // Clear the payment terms section
  poPaymentTermsElement.innerHTML = '';
  
  // Add the payment terms lines if checked
  if (line1Checked) {
    const line1Element = document.createElement('div');
    line1Element.textContent = `Payment : Net ${paymentDays} days`;
    poPaymentTermsElement.appendChild(line1Element);
  }
  
  if (line2Checked) {
    const line2Element = document.createElement('div');
    line2Element.textContent = 'All Prices are delivered prices';
    poPaymentTermsElement.appendChild(line2Element);
  }
}

/**
 * Prepare document for printing by ensuring only content relevant to the selected document type is visible
 * and triggers a server-side PDF generation for direct download
 */
function preparePrintPreview() {
  console.log("PDF generation triggered");
  
  // Update preview with latest data
  updatePreview();
  
  // Make sure invoice-specific content is updated if invoice is selected
  const documentType = document.querySelector('input[name="documentType"]:checked').value;
  if (documentType === 'invoice') {
    updateInvoicePreview();
  }
  
  // Update approval stamps
  updateApprovalStamp();

  // Show loading overlay while generating PDF
  document.getElementById('loadingOverlay').classList.remove('d-none');
  
  // Create form data object
  const formData = new FormData();
  
  // Add document type
  formData.append('documentType', documentType);
  
  // Add payment terms information
  formData.append('includePaymentTermsLine1', document.getElementById('includePaymentTermsLine1').checked);
  formData.append('includePaymentTermsLine2', document.getElementById('includePaymentTermsLine2').checked);
  
  if (document.getElementById('includePaymentTermsLine1').checked) {
    formData.append('paymentDays', document.getElementById('paymentDays').value || '30');
  }
  
  // For PO-specific fields
  if (documentType === 'po') {
    formData.append('date', document.getElementById('poDate').value);
    formData.append('poSuffix', document.getElementById('poSuffix').value || '1');
    formData.append('activityDescription', document.getElementById('activityDescription').value || '');
  } else {
    // For Invoice-specific fields
    formData.append('invoiceNumber', document.getElementById('invoiceNumber').value || '');
    formData.append('invoiceDate', document.getElementById('invoiceDate').value);
    formData.append('dueDate', document.getElementById('dueDate').value);
  }
  
  // Add logo information
  const useDefaultLogo = document.getElementById('useDefaultLogo').checked;
  formData.append('useDefaultLogo', useDefaultLogo);
  
  if (!useDefaultLogo && document.getElementById('logoFile').files.length > 0) {
    formData.append('logo', document.getElementById('logoFile').files[0]);
  }
  
  // Add approval stamp information
  const useOriginalStamp = document.getElementById('useOriginalStamp').checked;
  const useCitStamp = document.getElementById('useCitStamp').checked;
  formData.append('useOriginalStamp', useOriginalStamp);
  formData.append('useCitStamp', useCitStamp);
  
  // Add vendor information
  const vendor = {
    name: document.getElementById('vendorName').value,
    address: document.getElementById('vendorAddress').value,
    city: document.getElementById('vendorCity').value,
    state: document.getElementById('vendorState').value,
    zip: document.getElementById('vendorZip').value,
    country: document.getElementById('vendorCountry').value
  };
  
  formData.append('vendor', JSON.stringify(vendor));
  
  // Add line items
  if (documentType === 'po') {
    const lineItems = [];
    document.querySelectorAll('.line-item').forEach(row => {
      const quantityInput = row.querySelector('.item-quantity');
      const descriptionInput = row.querySelector('.item-description');
      const rateInput = row.querySelector('.item-rate');
      
      if (quantityInput && descriptionInput && rateInput) {
        // Ensure we have valid numeric values or default to 0
        const quantity = parseFloat(quantityInput.value) || 0;
        const rate = parseFloat(rateInput.value) || 0;
        
        lineItems.push({
          quantity: quantity.toString(),
          description: descriptionInput.value || '',
          rate: rate.toString()
        });
      }
    });
    
    formData.append('items', JSON.stringify(lineItems));
  } else {
    // For invoice items
    const invoiceItems = [];
    document.querySelectorAll('.invoice-item').forEach(row => {
      const quantityInput = row.querySelector('.invoice-quantity');
      const descriptionInput = row.querySelector('.invoice-description');
      const priceInput = row.querySelector('.invoice-price');
      
      if (quantityInput && descriptionInput && priceInput) {
        // Ensure we have valid numeric values or default to 0
        const quantity = parseFloat(quantityInput.value) || 0;
        const price = parseFloat(priceInput.value) || 0;
        
        invoiceItems.push({
          quantity: quantity.toString(),
          description: descriptionInput.value || '',
          price: price.toString()
        });
      }
    });
    
    formData.append('invoiceItems', JSON.stringify(invoiceItems));
  }
  
  // Send the form data to generate PDF
  fetch('/api/generate-po', {
    method: 'POST',
    body: formData
  })
  .then(response => {
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    return response.json();
  })
  .then(data => {
    // Hide loading overlay
    document.getElementById('loadingOverlay').classList.add('d-none');
    
    if (data.success) {
      // Directly download the PDF
      window.location.href = `/download/${data.filename}`;
    } else {
      alert('Error generating PDF. Please try again.');
    }
  })
  .catch(error => {
    console.error('Error generating PDF:', error);
    document.getElementById('loadingOverlay').classList.add('d-none');
    alert('Error generating PDF. Please try again.');
  });
}

/**
 * Update the approval stamp in the preview based on the selected checkbox options
 */
function updateApprovalStamp() {
  const useOriginalStamp = document.getElementById('useOriginalStamp').checked;
  const useCitStamp = document.getElementById('useCitStamp').checked;
  const stampContainer = document.getElementById('preview-stamp-container');
  
  // Clear the stamp container first
  stampContainer.innerHTML = '';
  
  // If no stamps are selected, just return
  if (!useOriginalStamp && !useCitStamp) {
    return;
  }
  
  // Add original stamp if selected
  if (useOriginalStamp) {
    const originalStamp = document.createElement('img');
    originalStamp.id = 'preview-stamp';
    originalStamp.src = 'assets/images/stamp-original.png';
    originalStamp.alt = 'Original Approval Stamp';
    originalStamp.className = 'approval-stamp';
    stampContainer.appendChild(originalStamp);
  }
  
  // Add CIT stamp if selected
  if (useCitStamp) {
    const citStamp = document.createElement('img');
    citStamp.id = useOriginalStamp ? 'preview-stamp-second' : 'preview-stamp';
    citStamp.src = 'assets/images/stamp-cit.png';
    citStamp.alt = 'CIT Approval Stamp';
    citStamp.className = useOriginalStamp ? 'approval-stamp approval-stamp-second' : 'approval-stamp';
    stampContainer.appendChild(citStamp);
  }
  
  console.log("Approval stamps updated: Original:", useOriginalStamp, "CIT:", useCitStamp);
}

// Add an event listener for afterprint to handle cleanup
window.addEventListener('afterprint', function restoreAfterPrint() {
  // Restore required attributes
  const requiredFields = document.querySelectorAll('[data-required="true"]');
  requiredFields.forEach(field => {
    field.setAttribute('required', '');
    field.removeAttribute('data-required');
  });
  
  // Restore empty fields
  const emptyFields = document.querySelectorAll('[data-empty="true"]');
  emptyFields.forEach(field => {
    field.value = '';
    field.removeAttribute('data-empty');
  });
  
  // Remove temporary styles
  const tempStyle = document.getElementById('temp-print-styles');
  if (tempStyle) {
    document.head.removeChild(tempStyle);
  }
  
  window.removeEventListener('afterprint', restoreAfterPrint);
});

/**
 * Shows a print preview dialog for the current PO/Invoice
 */
function showPrintPreview() {
  // First update the preview with current data
  updatePreview();
  
  // Create a new window with just the preview content
  const previewContent = document.getElementById('po-preview').cloneNode(true);
  
  // Update approval stamps if they exist
  updateApprovalStamp();
  
  const printWindow = window.open('', '_blank', 'width=800,height=600');
  
  // Add necessary styles for the print preview
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Print Preview</title>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.0/font/bootstrap-icons.css">
      <style>
        @page {
          size: letter;
          margin: 0.5in;
        }
        body { 
          padding: 20px; 
          background-color: #fff;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
          font-size: 13px;
        }
        .container {
          max-width: 8.5in;
          margin: 0 auto;
          padding: 0.25in;
        }
        /* PO Preview specific styles */
        #po-preview {
          max-width: 100%;
          margin: 0 auto;
          padding: 10px;
          border: none !important;
          box-shadow: none !important;
          background-color: white;
          font-size: 13px;
        }
        .row {
          display: flex;
          flex-wrap: wrap;
          margin-right: -10px;
          margin-left: -10px;
          clear: both;
        }
        .col-6 {
          flex: 0 0 50%;
          max-width: 50%;
          padding-right: 10px;
          padding-left: 10px;
          float: left;
          position: relative;
          box-sizing: border-box;
        }
        .text-end {
          text-align: right !important;
        }
        .mb-4 {
          margin-bottom: 0.75rem !important;
        }
        .mt-4 {
          margin-top: 0.75rem !important;
        }
        .mt-5 {
          margin-top: 1.5rem !important;
        }
        .ms-2 {
          margin-left: 0.5rem !important;
        }
        .d-inline {
          display: inline !important;
        }
        .text-center {
          text-align: center !important;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 0.75rem;
        }
        table, th, td {
          border: 1px solid #dee2e6;
        }
        th, td {
          padding: 0.5rem;
          text-align: left;
          font-size: 13px;
        }
        th {
          font-weight: bold;
          background-color: #f8f9fa;
        }
        .table {
          width: 100%;
          margin-bottom: 0.75rem;
          color: #212529;
          border-collapse: collapse;
        }
        .table-bordered {
          border: 1px solid #dee2e6;
        }
        .table thead th {
          vertical-align: bottom;
          border-bottom: 2px solid #dee2e6;
        }
        h2, h5 {
          margin-top: 0;
          margin-bottom: 0.3rem;
          font-weight: 500;
          line-height: 1.2;
        }
        h2 {
          font-size: 1.5rem;
        }
        h5 {
          font-size: 1rem;
        }
        .btn {
          display: inline-block;
          font-weight: 400;
          text-align: center;
          vertical-align: middle;
          cursor: pointer;
          padding: 0.375rem 0.75rem;
          font-size: 1rem;
          line-height: 1.5;
          border-radius: 0.25rem;
        }
        .btn-primary {
          color: #fff;
          background-color: #0d6efd;
          border-color: #0d6efd;
        }
        .btn-secondary {
          color: #fff;
          background-color: #6c757d;
          border-color: #6c757d;
        }
        /* Approval stamp styling */
        .approval-stamp {
          position: absolute;
          max-width: 80px !important;
          max-height: 40px !important;
          opacity: 0.85;
          transform: rotate(-10deg);
        }
        .approval-stamp-second {
          left: 90px;
          transform: rotate(5deg);
        }
        #preview-stamp-container {
          position: relative;
          height: 50px;
          width: 100%;
        }
        #preview-logo {
          max-height: 60px;
          max-width: 180px;
        }
        @media print {
          .d-print-none {
            display: none !important;
          }
          body { 
            padding: 0; 
            font-size: 13px;
          }
          .container {
            padding: 0;
            max-width: none;
            width: 100%;
          }
          #po-preview {
            padding: 0;
            border: none !important;
          }
          .row {
            display: flex;
            page-break-inside: avoid;
          }
          .col-6 {
            flex: 0 0 50%;
            max-width: 50%;
            page-break-inside: avoid;
          }
          button {
            display: none;
          }
          /* Ensure approval stamp fits on page */
          .approval-stamp {
            max-width: 80px !important;
            max-height: 40px !important;
          }
          .approval-stamp-second {
            left: 90px;
          }
          #preview-stamp-container {
            height: 40px;
          }
          table td, table th {
            padding: 4px;
            font-size: 12px;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        ${previewContent.outerHTML}
        <div class="text-center mt-4 d-print-none">
          <button onclick="window.print();" class="btn btn-primary">
            <i class="bi bi-printer"></i> Print Document
          </button>
          <button onclick="window.close();" class="btn btn-secondary ms-2">
            <i class="bi bi-x-circle"></i> Close
          </button>
        </div>
      </div>
      <script>
        // Make sure Bootstrap classes are properly applied
        document.querySelectorAll('.row').forEach(row => {
          if (row.children) {
            Array.from(row.children).forEach(col => {
              if (!col.classList.contains('col-6')) {
                col.classList.add('col-6');
              }
            });
          }
        });
        
        // Modify stamp size
        const stampElements = document.querySelectorAll('.approval-stamp');
        stampElements.forEach(stamp => {
          stamp.style.maxWidth = '80px';
          stamp.style.maxHeight = '40px';
        });
        
        // Reduce spacing between elements
        document.querySelectorAll('.mb-4').forEach(el => {
          el.style.marginBottom = '0.5rem';
        });
        
        // Auto-open print dialog immediately
        window.onload = function() {
          window.print();
          // Auto-close window after printing (or when print dialog is closed)
          window.addEventListener('afterprint', function() {
            window.close();
          });
          // Fallback in case afterprint doesn't trigger
          setTimeout(() => {
            window.close();
          }, 2000);
        };
      </script>
    </body>
    </html>
  `);
  
  printWindow.document.close();
} 