document.addEventListener('DOMContentLoaded', () => {
  // Set today's date as default in the date picker
  const today = new Date();
  // Convert to EST timezone
  const estOffset = -4; // EDT offset is -4, EST is -5
  const estDate = new Date(today.getTime() + (estOffset * 60 * 60 * 1000));
  const formattedDate = estDate.toISOString().split('T')[0]; // YYYY-MM-DD format
  document.getElementById('poDate').value = formattedDate;
  
  // Also set today's date for invoice fields
  if (document.getElementById('invoiceDate')) {
    document.getElementById('invoiceDate').value = formattedDate;
    
    // Set due date as today + 30 days in EST
    const dueDate = new Date(estDate);
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
  
  // Initialize saved vendors dropdown
  initializeVendorDropdown();
  
  // Initialize saved line items dropdown
  initializeLineItemsDropdown();
  
  // Add event listeners
  document.getElementById('addItemBtn').addEventListener('click', addItemRow);
  document.getElementById('addInvoiceItemBtn')?.addEventListener('click', addInvoiceItemRow);
  document.getElementById('useDefaultLogo').addEventListener('change', toggleLogoOptions);
  document.getElementById('uploadCustomLogo').addEventListener('change', toggleLogoOptions);
  document.getElementById('logoFile').addEventListener('change', previewCustomLogo);
  document.getElementById('saveVendorBtn').addEventListener('click', saveVendor);
  document.getElementById('savedVendors').addEventListener('change', loadVendor);
  document.getElementById('saveLineItemsBtn').addEventListener('click', saveLineItems);
  document.getElementById('savedLineItems').addEventListener('change', loadLineItems);
  
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
    line2Element.textContent = 'All prices are delivered prices';
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
  
  // Set positioning style for container
  stampContainer.setAttribute('style', 'position: absolute; width: 100%; right: 0; top: 0; overflow: visible;');
  
  // Add original stamp if selected
  if (useOriginalStamp) {
    const originalStamp = document.createElement('img');
    originalStamp.id = 'preview-stamp';
    originalStamp.src = 'assets/images/stamp-original.png';
    originalStamp.alt = 'Original Approval Stamp';
    originalStamp.className = 'approval-stamp';
    originalStamp.setAttribute('style', 'position: absolute !important; top: -65px !important; right: 30px !important; left: auto !important; z-index: 10 !important; max-width: 270px !important; max-height: 135px !important; transform: rotate(-10deg) !important; opacity: 0.6 !important;');
    stampContainer.appendChild(originalStamp);
  }
  
  // Add CIT stamp if selected
  if (useCitStamp) {
    const citStamp = document.createElement('img');
    citStamp.id = useOriginalStamp ? 'preview-stamp-second' : 'preview-stamp';
    citStamp.src = 'assets/images/stamp-cit.png';
    citStamp.alt = 'CIT Approval Stamp';
    citStamp.className = useOriginalStamp ? 'approval-stamp approval-stamp-second' : 'approval-stamp';
    if (useOriginalStamp) {
      citStamp.setAttribute('style', 'position: absolute !important; top: -65px !important; right: 80px !important; left: auto !important; z-index: 5 !important; max-width: 270px !important; max-height: 135px !important; transform: rotate(5deg) !important; opacity: 0.95 !important;');
    } else {
      citStamp.setAttribute('style', 'position: absolute !important; top: -65px !important; right: 30px !important; left: auto !important; z-index: 10 !important; max-width: 270px !important; max-height: 135px !important; transform: rotate(-10deg) !important; opacity: 0.6 !important;');
    }
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
  
  // Update approval stamps if they exist
  updateApprovalStamp();
  
  // Get the content from the preview
  const previewContent = document.getElementById('po-preview');
  
  // Get the values we need to recreate in the print preview
  const logo = previewContent.querySelector('#preview-logo').outerHTML;
  const documentType = previewContent.querySelector('#preview-document-type').textContent;
  const vendorName = previewContent.querySelector('#preview-vendor-name').textContent;
  const vendorAddress = previewContent.querySelector('#preview-vendor-address').textContent;
  const vendorCityState = previewContent.querySelector('#preview-vendor-city-state').textContent;
  const poNumber = previewContent.querySelector('#preview-po-number').textContent;
  const date = previewContent.querySelector('#preview-date').textContent;
  const activity = previewContent.querySelector('#preview-activity').textContent;
  
  // Get payment terms
  let paymentTerms = '';
  const poPaymentTerms = previewContent.querySelector('#po-payment-terms');
  if (poPaymentTerms && !poPaymentTerms.classList.contains('d-none')) {
    paymentTerms = poPaymentTerms.innerHTML;
  }
  
  // Get line items table
  const tableHeader = previewContent.querySelector('#table-header-row').innerHTML;
  const lineItems = previewContent.querySelector('#preview-line-items').innerHTML;
  const total = previewContent.querySelector('#preview-total').textContent;
  
  // Get stamp information
  const useOriginalStamp = document.getElementById('useOriginalStamp').checked;
  const useCitStamp = document.getElementById('useCitStamp').checked;
  
  // Create the print window
  const printWindow = window.open('', '_blank', 'width=800,height=600');
  
  // Set the document title based on the document type
  const documentTitle = documentType === 'Purchase Order' ? `PO ${poNumber}` : `Invoice ${previewContent.querySelector('#preview-invoice-number')?.textContent || ''}`;
  
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>${documentTitle} - Chem Is Try Inc</title>
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
        .signature-section {
          position: absolute;
          bottom: 100px;
          width: 100%;
        }
        .original-stamp {
          position: absolute;
          top: -65px;
          right: 30px;
          max-width: 270px;
          max-height: 135px;
          z-index: 10;
          transform: rotate(-10deg);
          opacity: 0.6;
        }
        .cit-stamp {
          position: absolute;
          top: -65px;
          right: 80px;
          max-width: 350px;
          max-height: 175px;
          z-index: 5;
          transform: rotate(5deg);
          opacity: 0.95;
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
          table td, table th {
            padding: 4px;
            font-size: 12px;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div id="po-preview" class="p-3 border rounded bg-white">
          <!-- PO Header -->
          <div class="row mb-4">
            <div class="col-6">
              ${logo}
              <div>
                <div>160-4 Liberty Street</div>
                <div>Metuchen, NJ 08840</div>
                <div>732-372-7311</div>
                <div>pporwal@chem-is-try.com</div>
                <div>www.chem-is-try.com</div>
              </div>
            </div>
            <div class="col-6 text-end">
              <h2 class="mb-0">${documentType}</h2>
            </div>
          </div>
          
          <!-- Vendor and Ship To -->
          <div class="row mb-4">
            <div class="col-6">
              <h5>VENDOR</h5>
              <div>${vendorName}</div>
              <div>${vendorAddress}</div>
              <div>${vendorCityState}</div>
            </div>
            <div class="col-6">
              <h5>SHIP TO</h5>
              <div>Chem Is Try Inc</div>
              <div>160-4 Liberty Street</div>
              <div>Metuchen, NJ 08840 US</div>
            </div>
          </div>
          
          <!-- PO Number and Date -->
          <div class="row mb-4">
            <div class="col-6">
              <h5 class="d-inline">P.O. NO. </h5>
              <span>${poNumber}</span>
            </div>
            <div class="col-6">
              <h5 class="d-inline">DATE </h5>
              <span>${date}</span>
            </div>
          </div>
          
          <!-- Activity -->
          <div class="mb-4">
            <h5>ACTIVITY</h5>
            <div>${activity}</div>
          </div>
          
          <!-- Payment Terms -->
          <div class="mb-4">
            ${paymentTerms}
          </div>
          
          <!-- Item Table -->
          <table class="table table-bordered">
            <thead>
              <tr>
                ${tableHeader}
              </tr>
            </thead>
            <tbody>
              ${lineItems}
            </tbody>
            <tfoot>
              <tr>
                <td colspan="3" class="text-end"><strong>TOTAL</strong></td>
                <td class="text-end">${total}</td>
              </tr>
            </tfoot>
          </table>
          
          <!-- Notes Section (Initially Hidden) -->
          <div class="mb-4 d-none" id="invoice-notes-section">
            <h5>NOTES</h5>
            <div id="preview-notes">--</div>
          </div>
          
          <!-- Spacer div to ensure content doesn't overlap with signature -->
          <div style="height: 250px; margin-bottom: 20px;"></div>
          
          <!-- Signature section with relative positioning -->
          <div id="signature-container" style="position: relative; height: 120px;">
            <!-- Absolutely positioned signature section -->
            <div class="signature-section" style="position: absolute; bottom: 0; width: 100%;">
              <div class="row">
                <div class="col-6">
                  <div>Approved By</div>
                  <div class="mt-3">
                    <div class="mt-1">_______________________________</div>
                  </div>
                </div>
                <div class="col-6">
                  <!-- Empty column for spacing -->
                </div>
              </div>
              
              <!-- Absolutely positioned stamps container -->
              <div style="position: absolute; width: 100%; height: 100px; top: -100px; overflow: visible;">
                ${useOriginalStamp ? '<img src="assets/images/stamp-original.png" alt="Original Approval Stamp" class="original-stamp" style="position: absolute; right: 30px; top: -65px; opacity: 0.6; z-index: 10; transform: rotate(-10deg); max-width: 270px;">' : ''}
                ${useCitStamp ? '<img src="assets/images/stamp-cit.png" alt="CIT Approval Stamp" class="cit-stamp" style="position: absolute; right: 80px; top: -65px; opacity: 0.95; z-index: 5; transform: rotate(5deg); max-width: 270px;">' : ''}
              </div>
            </div>
          </div>
        </div>
        
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
        // Auto-open print dialog immediately
        window.onload = function() {
          // Set document location to hide about:blank
          if (window.history && window.history.replaceState) {
            window.history.replaceState({}, document.title, "/print-preview");
          }
          
          // Preload images before printing
          const images = document.querySelectorAll('img');
          let imagesLoaded = 0;
          
          function checkAllImagesLoaded() {
            imagesLoaded++;
            if (imagesLoaded === images.length) {
              // All images loaded, now print
              window.print();
              
              // Auto-close window after printing
              window.addEventListener('afterprint', function() {
                window.close();
              });
              
              // Fallback in case afterprint doesn't trigger
              setTimeout(() => {
                window.close();
              }, 2000);
            }
          }
          
          // Check if we have images to load
          if (images.length > 0) {
            images.forEach(img => {
              if (img.complete) {
                checkAllImagesLoaded();
              } else {
                img.addEventListener('load', checkAllImagesLoaded);
                img.addEventListener('error', checkAllImagesLoaded); // Handle error case too
              }
            });
          } else {
            // No images, just print
            window.print();
          }
        };
      </script>
    </body>
    </html>
  `);
  
  printWindow.document.close();
}

/**
 * Save the current vendor information
 */
function saveVendor() {
  console.log("Save Vendor button clicked"); // For debugging
  
  const vendorName = document.getElementById('vendorName').value.trim();
  
  if (!vendorName) {
    alert('Please enter a vendor name');
    return;
  }

  const poDate = document.getElementById('poDate').value;
  // Convert YYYY-MM-DD to MM/DD/YY
  let formattedDate = "";
  if (poDate) {
    const [year, month, day] = poDate.split('-');
    const shortYear = year.substr(2);
    formattedDate = `${month}/${day}/${shortYear}`;
  } else {
    // Use current date if no date is entered
    const today = new Date();
    formattedDate = today.toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit', 
      year: '2-digit'
    });
  }

  const vendor = {
    name: vendorName,
    address: document.getElementById('vendorAddress').value.trim() || '',
    city: document.getElementById('vendorCity').value.trim() || '',
    state: document.getElementById('vendorState').value.trim() || '',
    zip: document.getElementById('vendorZip').value.trim() || '',
    country: document.getElementById('vendorCountry').value.trim() || 'USA',
    saveDate: formattedDate,
    originalDate: poDate // Store the original date format for future use
  };

  // Get existing saved vendors
  let savedVendors = [];
  try {
    const savedVendorsJson = localStorage.getItem('savedVendors');
    if (savedVendorsJson) {
      savedVendors = JSON.parse(savedVendorsJson);
    }
  } catch (e) {
    console.error('Error parsing saved vendors:', e);
    savedVendors = [];
  }
  
  if (!Array.isArray(savedVendors)) {
    savedVendors = [];
  }
  
  // Check if vendor already exists (case insensitive)
  const existingIndex = savedVendors.findIndex(v => v.name.toLowerCase() === vendor.name.toLowerCase());
  if (existingIndex !== -1) {
    savedVendors[existingIndex] = vendor;
  } else {
    savedVendors.push(vendor);
  }
  
  // Save back to localStorage
  localStorage.setItem('savedVendors', JSON.stringify(savedVendors));
  
  console.log('Saved to localStorage:', localStorage.getItem('savedVendors')); // For debugging
  
  // Update the dropdown immediately
  updateVendorDropdown(vendor.name);
  
  alert('Vendor information saved successfully!');
}

/**
 * Update the vendor dropdown with the current saved vendors
 * @param {string} selectedVendor - The vendor to select after updating
 */
function updateVendorDropdown(selectedVendor = '') {
  const dropdown = document.getElementById('savedVendors');
  if (!dropdown) {
    console.error('Vendor dropdown not found');
    return;
  }
  
  // Clear existing options
  dropdown.innerHTML = '<option value="">Select a saved vendor...</option>';
  
  // Get saved vendors
  let savedVendors = [];
  try {
    const savedVendorsJson = localStorage.getItem('savedVendors');
    if (savedVendorsJson) {
      savedVendors = JSON.parse(savedVendorsJson);
    }
  } catch (e) {
    console.error('Error parsing saved vendors:', e);
    return;
  }
  
  if (!Array.isArray(savedVendors) || savedVendors.length === 0) {
    console.log('No saved vendors found');
    return;
  }
  
  console.log('Adding vendors to dropdown:', savedVendors);
  
  // Add saved vendors
  savedVendors.forEach(v => {
    const option = document.createElement('option');
    option.value = v.name;
    option.textContent = `${v.name} - ${v.saveDate}`;
    dropdown.appendChild(option);
  });
  
  // Select the specified vendor if provided
  if (selectedVendor) {
    dropdown.value = selectedVendor;
  }
  
  console.log('Dropdown updated. Option count:', dropdown.options.length);
}

/**
 * Initialize the saved vendors dropdown
 */
function initializeVendorDropdown() {
  updateVendorDropdown();
}

/**
 * Load a saved vendor into the form
 */
function loadVendor(event) {
  const vendorName = event.target.value;
  if (!vendorName) return;
  
  const savedVendors = JSON.parse(localStorage.getItem('savedVendors') || '[]');
  const vendor = savedVendors.find(v => v.name === vendorName);
  
  if (vendor) {
    document.getElementById('vendorName').value = vendor.name || '';
    document.getElementById('vendorAddress').value = vendor.address || '';
    document.getElementById('vendorCity').value = vendor.city || '';
    document.getElementById('vendorState').value = vendor.state || '';
    document.getElementById('vendorZip').value = vendor.zip || '';
    document.getElementById('vendorCountry').value = vendor.country || 'USA';
    
    // If we stored the original date, use it
    if (vendor.originalDate) {
      document.getElementById('poDate').value = vendor.originalDate;
    }
    
    // Update preview
    updatePreviewVendor();
  }
}

/**
 * Save the current line items
 */
function saveLineItems() {
  const lineItemsContainer = document.getElementById('lineItems');
  const lineItemRows = lineItemsContainer.querySelectorAll('.line-item');
  
  if (lineItemRows.length === 0) {
    alert('Please add at least one line item');
    return;
  }
  
  // Get current date in MM/DD/YYYY format
  const today = new Date();
  const saveDate = today.toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric'
  });
  
  // Get existing saved line items
  let savedLineItems = [];
  try {
    const savedItemsJSON = localStorage.getItem('savedLineItems');
    if (savedItemsJSON) {
      savedLineItems = JSON.parse(savedItemsJSON);
      if (!Array.isArray(savedLineItems)) {
        savedLineItems = [];
      }
    }
  } catch (e) {
    console.error('Error loading saved line items:', e);
    savedLineItems = [];
  }
  
  // Flag to track if any items were saved
  let itemsSaved = false;
  
  // Save each line item individually
  lineItemRows.forEach(row => {
    const quantity = row.querySelector('.item-quantity').value.trim();
    const description = row.querySelector('.item-description').value.trim();
    const rate = row.querySelector('.item-rate').value.trim();
    
    // Only save items with a description
    if (description) {
      itemsSaved = true;
      
      // Create a single item entry
      const lineItem = {
        description: description,
        quantity: quantity || '1',
        rate: rate || '0.00',
        date: saveDate
      };
      
      // Check if an item with this description already exists
      const existingIndex = savedLineItems.findIndex(
        item => item.description.toLowerCase() === description.toLowerCase()
      );
      
      if (existingIndex !== -1) {
        // Update existing item
        savedLineItems[existingIndex] = lineItem;
      } else {
        // Add new item
        savedLineItems.push(lineItem);
      }
    }
  });
  
  if (!itemsSaved) {
    alert('Please enter at least one line item description');
    return;
  }
  
  // Save to localStorage
  localStorage.setItem('savedLineItems', JSON.stringify(savedLineItems));
  
  // Update dropdown
  updateLineItemsDropdown();
  
  alert('Line items saved successfully!');
}

/**
 * Load line items from the dropdown selection
 */
function loadLineItems(event) {
  const selectedIndex = event.target.selectedIndex;
  if (selectedIndex <= 0) return; // Nothing or "Select saved line items..." selected
  
  // Get saved line items
  let savedLineItems = [];
  try {
    const savedItemsJSON = localStorage.getItem('savedLineItems');
    if (savedItemsJSON) {
      savedLineItems = JSON.parse(savedItemsJSON);
    }
  } catch (e) {
    console.error('Error loading saved line items:', e);
    return;
  }
  
  // selectedIndex - 1 because the first option is the placeholder
  const selectedItem = savedLineItems[selectedIndex - 1];
  if (!selectedItem) {
    console.error('Selected item not found');
    return;
  }
  
  // Get the line items container
  const lineItemsContainer = document.getElementById('lineItems');
  
  // Get current line item rows
  const existingRows = lineItemsContainer.querySelectorAll('.line-item');
  const firstRow = existingRows[0];
  
  // If we have an existing row, update it
  if (firstRow) {
    firstRow.querySelector('.item-quantity').value = selectedItem.quantity;
    firstRow.querySelector('.item-description').value = selectedItem.description;
    firstRow.querySelector('.item-rate').value = selectedItem.rate;
    updateRowAmount({ target: firstRow.querySelector('.item-rate') });
    
    // Remove any additional rows - we only want to load a single item
    for (let i = 1; i < existingRows.length; i++) {
      existingRows[i].remove();
    }
  } else {
    // Create a new row if none exists
    const newRow = document.createElement('div');
    newRow.className = 'row mb-3 line-item';
    newRow.innerHTML = `
      <div class="col-md-1">
        <label class="form-label">Qty</label>
        <input type="number" class="form-control item-quantity" required value="${selectedItem.quantity}">
      </div>
      <div class="col-md-7">
        <label class="form-label">Description</label>
        <input type="text" class="form-control item-description" required value="${selectedItem.description}">
      </div>
      <div class="col-md-2">
        <label class="form-label">Rate</label>
        <input type="number" step="0.01" class="form-control item-rate" required value="${selectedItem.rate}">
      </div>
      <div class="col-md-2">
        <label class="form-label">Amount</label>
        <input type="text" class="form-control item-amount" readonly value="${(selectedItem.quantity * selectedItem.rate).toFixed(2)}">
      </div>
    `;
    lineItemsContainer.appendChild(newRow);
    setupLineItemListeners(newRow);
  }
  
  // Update totals and preview
  calculateTotal();
  updatePreviewLineItems();
}

/**
 * Update the line items dropdown with saved templates
 */
function updateLineItemsDropdown() {
  const dropdown = document.getElementById('savedLineItems');
  if (!dropdown) return;
  
  // Clear existing options
  dropdown.innerHTML = '<option value="">Select saved line items...</option>';
  
  // Get saved line items
  let savedLineItems = [];
  try {
    const savedItemsJSON = localStorage.getItem('savedLineItems');
    if (savedItemsJSON) {
      savedLineItems = JSON.parse(savedItemsJSON);
    }
  } catch (e) {
    console.error('Error loading saved line items:', e);
    return;
  }
  
  if (!Array.isArray(savedLineItems) || savedLineItems.length === 0) {
    return;
  }
  
  // Add options for each saved line item
  savedLineItems.forEach(item => {
    const option = document.createElement('option');
    option.value = item.description;
    option.textContent = `${item.description} - ${item.date}`;
    dropdown.appendChild(option);
  });
}

/**
 * Initialize the line items dropdown
 */
function initializeLineItemsDropdown() {
  updateLineItemsDropdown();
} 