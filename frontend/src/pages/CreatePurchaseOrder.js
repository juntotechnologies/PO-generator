import React, { useState, useEffect, useContext } from 'react';
import { Container, Row, Col, Card, Button, Form, Table, Spinner, Alert, Modal } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { Formik, FieldArray, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { FaPlus, FaTrash, FaSave, FaBookmark, FaCheck } from 'react-icons/fa';
import axios from 'axios';
import { toast } from 'react-toastify';
import { AuthContext } from '../context/AuthContext';
import SignatureCanvas from 'react-signature-canvas';

// Validation schema for purchase order
const PurchaseOrderSchema = Yup.object().shape({
  vendor_id: Yup.string().required('Vendor is required'),
  date: Yup.date().required('Date is required'),
  payment_days: Yup.number()
    .required('Payment days is required')
    .positive('Payment days must be positive')
    .integer('Payment days must be an integer'),
  payment_terms: Yup.string(),
  notes: Yup.string(),
  approval_stamp: Yup.string().required('Approval stamp selection is required'),
  line_items: Yup.array()
    .of(
      Yup.object().shape({
        id: Yup.number(),
        quantity: Yup.number()
          .required('Quantity is required')
          .positive('Quantity must be positive'),
        description: Yup.string().required('Description is required'),
        rate: Yup.number()
          .required('Rate is required')
          .positive('Rate must be positive')
      })
    )
    .min(1, 'At least one line item is required')
});

// Validation schema for vendor
const VendorSchema = Yup.object().shape({
  name: Yup.string().required('Name is required'),
  address: Yup.string().required('Address is required'),
  city: Yup.string().required('City is required'),
  state: Yup.string().required('State is required'),
  zip_code: Yup.string().required('ZIP code is required'),
  country: Yup.string().required('Country is required')
});

const CreatePurchaseOrder = ({ isEditing = false, initialPurchaseOrder = null }) => {
  const [vendors, setVendors] = useState([]);
  const [savedVendors, setSavedVendors] = useState([]);
  const [lineItems, setLineItems] = useState([]);
  const [savedLineItems, setSavedLineItems] = useState([]);
  const [selectedSavedLineItems, setSelectedSavedLineItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showSavedVendorsModal, setShowSavedVendorsModal] = useState(false);
  const [showSavedLineItemsModal, setShowSavedLineItemsModal] = useState(false);
  const [formValues, setFormValues] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [showNewVendorModal, setShowNewVendorModal] = useState(false);
  
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  // Update the page title based on whether we're editing or creating
  const pageTitle = isEditing ? 'Edit Purchase Order' : 'Create Purchase Order';

  // Fetch vendors, saved vendors, and saved line items
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        console.log('Fetching data for purchase order creation...');
        const [vendorsResponse, savedVendorsResponse, savedLineItemsResponse] = await Promise.all([
          axios.get('/api/vendors/'),
          axios.get('/api/saved-vendors/'),
          axios.get('/api/saved-line-items/')
        ]);
        
        console.log('Vendors response:', vendorsResponse.data);
        console.log('Saved vendors response:', savedVendorsResponse.data);
        console.log('Saved line items response:', savedLineItemsResponse.data);
        
        setVendors(vendorsResponse.data.results || vendorsResponse.data);
        setSavedVendors(savedVendorsResponse.data.results || savedVendorsResponse.data);
        setSavedLineItems(savedLineItemsResponse.data.results || savedLineItemsResponse.data);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load data. Please try again later.');
        toast.error('Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Handle selecting a saved vendor
  const handleSelectSavedVendor = (savedVendor, setFieldValue) => {
    setFieldValue('vendor_id', savedVendor.vendor.id);
    setShowSavedVendorsModal(false);
    toast.success(`Vendor template "${savedVendor.name}" applied`);
  };

  // Handle selecting saved line items
  const handleSelectSavedLineItem = (savedLineItem) => {
    // Toggle selection
    if (selectedSavedLineItems.some(item => item.id === savedLineItem.id)) {
      setSelectedSavedLineItems(selectedSavedLineItems.filter(item => item.id !== savedLineItem.id));
    } else {
      setSelectedSavedLineItems([...selectedSavedLineItems, savedLineItem]);
    }
  };

  // Handle applying selected line items
  const handleApplySavedLineItems = (values, setFieldValue) => {
    const newLineItems = selectedSavedLineItems.map(savedItem => ({
      ...savedItem.line_item,
      // Ensure we don't carry over any existing IDs to avoid conflicts
      id: undefined
    }));
    
    setFieldValue('line_items', [...values.line_items, ...newLineItems]);
    setShowSavedLineItemsModal(false);
    setSelectedSavedLineItems([]);
    toast.success(`${newLineItems.length} line item template(s) applied`);
  };

  // Calculate amount (quantity * rate)
  const calculateAmount = (quantity, rate) => {
    return (parseFloat(quantity) * parseFloat(rate)).toFixed(2);
  };

  // Calculate total amount for all line items
  const calculateTotalAmount = (lineItems) => {
    return lineItems
      .reduce((total, item) => total + (parseFloat(item.quantity) * parseFloat(item.rate)), 0)
      .toFixed(2);
  };

  // Replace the clearSignature and saveSignature functions with a single function to generate a signature
  const generateSignature = () => {
    if (!user) {
      console.error('User information not available');
      return null;
    }
    
    // Create a canvas element
    const canvas = document.createElement('canvas');
    canvas.width = 500;
    canvas.height = 200;
    
    // Get the canvas context
    const ctx = canvas.getContext('2d');
    
    // Clear the canvas with a white background
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Set up the canvas for a signature
    ctx.font = '60px "Brush Script MT", cursive';
    ctx.fillStyle = 'black';
    
    // Determine the name to use for signature
    const signatureName = user.first_name && user.last_name 
      ? `${user.first_name} ${user.last_name}`
      : user.username;
    
    // Position the signature in the middle of the canvas
    ctx.fillText(signatureName, canvas.width / 6, canvas.height / 2);
    
    // Add a signature line
    ctx.beginPath();
    ctx.moveTo(canvas.width / 6 - 20, canvas.height / 2 + 10);
    ctx.lineTo(canvas.width / 6 + ctx.measureText(signatureName).width + 20, canvas.height / 2 + 10);
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 1;
    ctx.stroke();
    
    // Return the signature as a data URL
    return canvas.toDataURL('image/png');
  };

  // Modify the handleSubmit function to immediately submit the form without setting formValues
  const handleSubmit = (values, { setSubmitting: formikSetSubmitting, setErrors }) => {
    console.log('Form values before submission:', values);
    
    // Validate that there's at least one line item
    if (!values.line_items || values.line_items.length === 0) {
      setErrors({ line_items: 'At least one line item is required' });
      formikSetSubmitting(false);
      return;
    }
    
    // Validate that all line items have required fields
    const invalidLineItems = values.line_items.filter(
      item => !item.quantity || !item.description || !item.rate
    );
    
    if (invalidLineItems.length > 0) {
      toast.error('Please fill in all required fields for line items');
      formikSetSubmitting(false);
      return;
    }
    
    // Instead of setting formValues and then calling submitPurchaseOrder in a separate step,
    // directly call submitPurchaseOrder with the values
    submitPurchaseOrderWithValues(values);
    formikSetSubmitting(false);
  };

  // Create a new function that takes values directly
  const submitPurchaseOrderWithValues = async (values) => {
    setSubmitting(true);
    
    try {
      console.log(`${isEditing ? 'Updating' : 'Submitting'} purchase order with values:`, values);
      
      // Generate signature automatically
      const signature = generateSignature();
      if (!signature) {
        toast.error('Failed to generate signature');
        setSubmitting(false);
        return;
      }
      
      console.log('Signature generated successfully');
      
      // Convert signature data URL to a file
      const signatureBlob = await fetch(signature).then(res => res.blob());
      const signatureFile = new File([signatureBlob], 'signature.png', { type: 'image/png' });
      
      console.log('Signature converted to file');
      
      // Create form data for multipart/form-data submission
      const formData = new FormData();
      formData.append('vendor_id', values.vendor_id);
      // Don't send date for updates - the backend will use the current date
      // formData.append('date', values.date);
      formData.append('payment_days', values.payment_days);
      formData.append('payment_terms', values.payment_terms || '');
      formData.append('notes', values.notes || '');
      formData.append('approval_stamp', values.approval_stamp);
      formData.append('signature', signatureFile);
      
      console.log('Form data created with the following fields:');
      for (let [key, value] of formData.entries()) {
        console.log(`${key}: ${key === 'signature' ? 'File data' : value}`);
      }
      
      // Add line items as JSON
      const existingLineItemIds = values.line_items.filter(item => item.id).map(item => item.id);
      if (existingLineItemIds.length > 0) {
        formData.append('line_item_ids', JSON.stringify(existingLineItemIds));
        console.log('Existing line item IDs:', existingLineItemIds);
      } else {
        console.log('No existing line items to add');
      }
      
      // Create new line items first if needed
      const newLineItems = values.line_items.filter(item => !item.id);
      if (newLineItems.length > 0) {
        console.log('Creating new line items:', newLineItems);
        
        try {
          // Ensure all required fields are present
          for (const item of newLineItems) {
            if (!item.quantity || !item.description || !item.rate) {
              console.error('Invalid line item:', item);
              toast.error('All line items must have quantity, description, and rate');
              setSubmitting(false);
              return;
            }
          }
          
          const lineItemPromises = newLineItems.map(item => 
            axios.post('/api/line-items/', {
              quantity: item.quantity,
              description: item.description,
              rate: item.rate
            })
          );
          
          const lineItemResponses = await Promise.all(lineItemPromises);
          const createdLineItemIds = lineItemResponses.map(response => response.data.id);
          console.log('Created line item IDs:', createdLineItemIds);
          
          // Make sure we have at least one line item
          if (existingLineItemIds.length === 0 && createdLineItemIds.length === 0) {
            console.error('No line items available');
            toast.error('At least one line item is required');
            setSubmitting(false);
            return;
          }
          
          // Add newly created line item IDs
          if (existingLineItemIds.length > 0) {
            // If we already have existing line items, we need to combine them
            const allLineItemIds = [...existingLineItemIds, ...createdLineItemIds];
            // Remove the previous line_item_ids entry
            formData.delete('line_item_ids');
            // Add the combined list
            formData.append('line_item_ids', JSON.stringify(allLineItemIds));
            console.log('Combined line item IDs:', allLineItemIds);
          } else {
            // If we only have new line items
            formData.append('line_item_ids', JSON.stringify(createdLineItemIds));
            console.log('Only new line item IDs:', createdLineItemIds);
          }
        } catch (lineItemError) {
          console.error('Error creating line items:', lineItemError);
          if (lineItemError.response) {
            console.error('Line item error response:', lineItemError.response.data);
          }
          toast.error('Failed to create line items');
          setSubmitting(false);
          return;
        }
      } else {
        console.log('No new line items to create');
        
        // Make sure we have at least one existing line item
        if (existingLineItemIds.length === 0) {
          console.error('No line items available');
          toast.error('At least one line item is required');
          setSubmitting(false);
          return;
        }
      }
      
      let response;
      
      try {
        if (isEditing && initialPurchaseOrder) {
          // Update existing purchase order
          console.log(`Sending PUT request to /api/purchase-orders/${initialPurchaseOrder.id}/`);
          response = await axios.put(`/api/purchase-orders/${initialPurchaseOrder.id}/`, formData, {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          });
          console.log('Purchase order updated:', response.data);
          toast.success('Purchase order updated successfully');
        } else {
          // Create new purchase order
          console.log('Sending POST request to /api/purchase-orders/');
          response = await axios.post('/api/purchase-orders/', formData, {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          });
          console.log('Purchase order created:', response.data);
          toast.success('Purchase order created successfully');
        }
        
        // Navigate to the purchase orders list
        navigate('/purchase-orders');
      } catch (requestError) {
        console.error(`Error ${isEditing ? 'updating' : 'creating'} purchase order:`, requestError);
        
        if (requestError.response) {
          console.error('Error response status:', requestError.response.status);
          console.error('Error response data:', requestError.response.data);
          
          // Display more specific error messages
          if (typeof requestError.response.data === 'object') {
            const errorMessages = Object.entries(requestError.response.data)
              .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
              .join('; ');
            toast.error(`Failed to ${isEditing ? 'update' : 'create'} purchase order: ${errorMessages}`);
          } else {
            toast.error(`Failed to ${isEditing ? 'update' : 'create'} purchase order: ${requestError.response.data}`);
          }
        } else if (requestError.request) {
          console.error('No response received:', requestError.request);
          toast.error(`Failed to ${isEditing ? 'update' : 'create'} purchase order: No response from server`);
        } else {
          console.error('Error message:', requestError.message);
          toast.error(`Failed to ${isEditing ? 'update' : 'create'} purchase order: ${requestError.message}`);
        }
        
        setSubmitting(false);
        return;
      }
    } catch (error) {
      console.error(`Unexpected error ${isEditing ? 'updating' : 'creating'} purchase order:`, error);
      toast.error(`An unexpected error occurred: ${error.message}`);
      setSubmitting(false);
    }
  };

  // Keep the old submitPurchaseOrder function for backward compatibility
  // but make it call the new function
  const submitPurchaseOrder = async () => {
    if (!formValues) {
      toast.error('Form values are missing');
      return;
    }
    
    await submitPurchaseOrderWithValues(formValues);
  };

  // Handle creating a new vendor
  const handleSaveNewVendor = async (values, { setSubmitting, resetForm, setFieldError }) => {
    try {
      console.log('Creating new vendor:', values);
      const response = await axios.post('/api/vendors/', values);
      console.log('Vendor creation response:', response.data);
      
      // Add to vendors list
      setVendors([...vendors, response.data]);
      
      // Close modal and reset form
      setShowNewVendorModal(false);
      resetForm();
      
      // Select the newly created vendor in the purchase order form
      // We need to use setFieldValue from the Formik context to update the form
      // This will be passed from the Formik render prop
      toast.success('Vendor created successfully');
      
      // Return the created vendor so it can be used by the caller
      return response.data;
    } catch (error) {
      console.error('Error creating vendor:', error);
      
      if (error.response && error.response.data) {
        // Handle validation errors from the server
        const serverErrors = error.response.data;
        Object.keys(serverErrors).forEach(key => {
          setFieldError(key, serverErrors[key].join(', '));
        });
      } else {
        toast.error('Failed to create vendor');
      }
      return null;
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Container className="text-center py-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
        <p className="mt-3">Loading data...</p>
      </Container>
    );
  }

  return (
    <Container>
      <h1 className="my-4">{pageTitle}</h1>
      
      {error && (
        <Alert variant="danger" className="mb-4">
          {error}
        </Alert>
      )}
      
      <Formik
        initialValues={
          initialPurchaseOrder
            ? {
                vendor_id: initialPurchaseOrder.vendor.id,
                date: initialPurchaseOrder.date,
                payment_days: initialPurchaseOrder.payment_days,
                payment_terms: initialPurchaseOrder.payment_terms || '',
                notes: initialPurchaseOrder.notes || '',
                approval_stamp: initialPurchaseOrder.approval_stamp,
                line_items: initialPurchaseOrder.line_items || []
              }
            : {
                vendor_id: '',
                date: new Date().toISOString().split('T')[0],
                payment_days: 30,
                payment_terms: '',
                notes: '',
                approval_stamp: 'both',
                line_items: []
              }
        }
        validationSchema={PurchaseOrderSchema}
        onSubmit={handleSubmit}
      >
        {({
          values,
          errors,
          touched,
          handleChange,
          handleBlur,
          handleSubmit,
          isSubmitting,
          setFieldValue
        }) => (
          <Form onSubmit={handleSubmit}>
            <Row className="mb-4">
              <Col md={8}>
                <Card className="mb-4">
                  <Card.Header>
                    <h5 className="mb-0">Vendor Information</h5>
                  </Card.Header>
                  <Card.Body>
                    <Row className="mb-3">
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label>Vendor</Form.Label>
                          <Form.Select
                            name="vendor_id"
                            value={values.vendor_id}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            isInvalid={touched.vendor_id && errors.vendor_id}
                          >
                            <option value="">Select a vendor</option>
                            {vendors.map(vendor => (
                              <option key={vendor.id} value={vendor.id}>
                                {vendor.name} - {vendor.city}, {vendor.state}
                              </option>
                            ))}
                          </Form.Select>
                          <Form.Control.Feedback type="invalid">
                            {errors.vendor_id}
                          </Form.Control.Feedback>
                        </Form.Group>
                      </Col>
                      <Col md={3} className="d-flex align-items-end">
                        <Button 
                          variant="outline-primary" 
                          className="w-100"
                          onClick={() => setShowSavedVendorsModal(true)}
                          disabled={savedVendors.length === 0}
                        >
                          <FaBookmark className="me-1" /> Use Template
                        </Button>
                      </Col>
                      <Col md={3} className="d-flex align-items-end">
                        <Button 
                          variant="success" 
                          className="w-100"
                          onClick={() => setShowNewVendorModal(true)}
                        >
                          <FaPlus className="me-1" /> Add Vendor
                        </Button>
                      </Col>
                    </Row>
                    
                    {values.vendor_id && (
                      <div className="mt-3">
                        {vendors.filter(v => v.id === parseInt(values.vendor_id)).map(vendor => (
                          <Card key={vendor.id} className="bg-light">
                            <Card.Body>
                              <h6>{vendor.name}</h6>
                              <p className="mb-1">{vendor.address}</p>
                              <p className="mb-1">{vendor.city}, {vendor.state} {vendor.zip_code}</p>
                              <p className="mb-0">{vendor.country}</p>
                            </Card.Body>
                          </Card>
                        ))}
                      </div>
                    )}
                  </Card.Body>
                </Card>
                
                <Card className="mb-4">
                  <Card.Header className="d-flex justify-content-between align-items-center">
                    <h5 className="mb-0">Line Items</h5>
                    <div>
                      <Button 
                        variant="outline-primary" 
                        className="me-2"
                        onClick={() => setShowSavedLineItemsModal(true)}
                        disabled={savedLineItems.length === 0}
                      >
                        <FaBookmark className="me-1" /> Use Templates
                      </Button>
                      <Button 
                        variant="primary"
                        onClick={() => setFieldValue('line_items', [
                          ...values.line_items, 
                          { quantity: '', description: '', rate: '' }
                        ])}
                      >
                        <FaPlus className="me-1" /> Add Line Item
                      </Button>
                    </div>
                  </Card.Header>
                  <Card.Body>
                    <FieldArray name="line_items">
                      {({ remove, push }) => (
                        <>
                          {values.line_items.length > 0 ? (
                            <Table responsive>
                              <thead>
                                <tr>
                                  <th style={{ width: '10%' }}>Quantity</th>
                                  <th style={{ width: '50%' }}>Description</th>
                                  <th style={{ width: '15%' }}>Rate</th>
                                  <th style={{ width: '15%' }}>Amount</th>
                                  <th style={{ width: '10%' }}>Actions</th>
                                </tr>
                              </thead>
                              <tbody>
                                {values.line_items.map((item, index) => (
                                  <tr key={index}>
                                    <td>
                                      <Form.Control
                                        type="number"
                                        step="0.01"
                                        name={`line_items.${index}.quantity`}
                                        value={item.quantity}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        isInvalid={
                                          touched.line_items?.[index]?.quantity && 
                                          errors.line_items?.[index]?.quantity
                                        }
                                      />
                                      <ErrorMessage
                                        name={`line_items.${index}.quantity`}
                                        component="div"
                                        className="text-danger small"
                                      />
                                    </td>
                                    <td>
                                      <Form.Control
                                        as="textarea"
                                        rows={2}
                                        name={`line_items.${index}.description`}
                                        value={item.description}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        isInvalid={
                                          touched.line_items?.[index]?.description && 
                                          errors.line_items?.[index]?.description
                                        }
                                      />
                                      <ErrorMessage
                                        name={`line_items.${index}.description`}
                                        component="div"
                                        className="text-danger small"
                                      />
                                    </td>
                                    <td>
                                      <Form.Control
                                        type="number"
                                        step="0.01"
                                        name={`line_items.${index}.rate`}
                                        value={item.rate}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        isInvalid={
                                          touched.line_items?.[index]?.rate && 
                                          errors.line_items?.[index]?.rate
                                        }
                                      />
                                      <ErrorMessage
                                        name={`line_items.${index}.rate`}
                                        component="div"
                                        className="text-danger small"
                                      />
                                    </td>
                                    <td>
                                      ${item.quantity && item.rate 
                                        ? calculateAmount(item.quantity, item.rate) 
                                        : '0.00'
                                      }
                                    </td>
                                    <td>
                                      <Button
                                        variant="outline-danger"
                                        size="sm"
                                        onClick={() => remove(index)}
                                      >
                                        <FaTrash />
                                      </Button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                              <tfoot>
                                <tr>
                                  <td colSpan={3} className="text-end">
                                    <strong>Total:</strong>
                                  </td>
                                  <td>
                                    <strong>
                                      ${calculateTotalAmount(values.line_items)}
                                    </strong>
                                  </td>
                                  <td></td>
                                </tr>
                              </tfoot>
                            </Table>
                          ) : (
                            <div className="text-center py-4">
                              <p>No line items added yet.</p>
                              <Button 
                                variant="primary"
                                onClick={() => push({ quantity: '', description: '', rate: '' })}
                              >
                                <FaPlus className="me-1" /> Add Line Item
                              </Button>
                            </div>
                          )}
                          
                          {errors.line_items && typeof errors.line_items === 'string' && (
                            <Alert variant="danger" className="mt-3">
                              {errors.line_items}
                            </Alert>
                          )}
                        </>
                      )}
                    </FieldArray>
                  </Card.Body>
                </Card>
                
                <Card>
                  <Card.Header>
                    <h5 className="mb-0">Notes</h5>
                  </Card.Header>
                  <Card.Body>
                    <Form.Group>
                      <Form.Control
                        as="textarea"
                        rows={3}
                        name="notes"
                        value={values.notes}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        placeholder="Enter any additional notes or instructions"
                      />
                    </Form.Group>
                  </Card.Body>
                </Card>
              </Col>
              
              <Col md={4}>
                <Card className="mb-4">
                  <Card.Header>
                    <h5 className="mb-0">Purchase Order Details</h5>
                  </Card.Header>
                  <Card.Body>
                    <Form.Group className="mb-3">
                      <Form.Label>Date</Form.Label>
                      <Form.Control
                        type="date"
                        name="date"
                        value={values.date}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        isInvalid={touched.date && errors.date}
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.date}
                      </Form.Control.Feedback>
                    </Form.Group>
                    
                    <Form.Group className="mb-3">
                      <Form.Label>Payment Days</Form.Label>
                      <Form.Control
                        type="number"
                        name="payment_days"
                        value={values.payment_days}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        isInvalid={touched.payment_days && errors.payment_days}
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.payment_days}
                      </Form.Control.Feedback>
                    </Form.Group>
                    
                    <Form.Group className="mb-3">
                      <Form.Label>Payment Terms (Optional)</Form.Label>
                      <Form.Control
                        type="text"
                        name="payment_terms"
                        value={values.payment_terms}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        placeholder="e.g., 2% 10 Net 30"
                      />
                    </Form.Group>
                    
                    {/* Hidden field for approval_stamp - we now include both stamps by default */}
                    <input 
                      type="hidden" 
                      name="approval_stamp" 
                      value="both" 
                    />
                  </Card.Body>
                </Card>
                
                <Card>
                  <Card.Header>
                    <h5 className="mb-0">Summary</h5>
                  </Card.Header>
                  <Card.Body>
                    <p><strong>Vendor:</strong> {values.vendor_id ? vendors.find(v => v.id === parseInt(values.vendor_id))?.name : 'Not selected'}</p>
                    <p><strong>Date:</strong> {values.date}</p>
                    <p><strong>Payment Terms:</strong> {values.payment_terms ? `${values.payment_terms} (${values.payment_days} days)` : `Net ${values.payment_days} days`}</p>
                    <p><strong>Line Items:</strong> {values.line_items.length}</p>
                    <p><strong>Total Amount:</strong> ${calculateTotalAmount(values.line_items)}</p>
                    <p><strong>Approval Stamps:</strong> Both CIT and Original stamps will be included</p>
                    
                    <div className="d-grid gap-2 mt-4">
                      <Button 
                        variant="primary" 
                        type="submit" 
                        disabled={isSubmitting || submitting}
                        size="lg"
                      >
                        {isSubmitting || submitting ? (
                          <>
                            <Spinner
                              as="span"
                              animation="border"
                              size="sm"
                              role="status"
                              aria-hidden="true"
                              className="me-2"
                            />
                            {isEditing ? 'Updating...' : 'Creating...'}
                          </>
                        ) : (
                          <>
                            <FaSave className="me-1" /> {isEditing ? 'Update Purchase Order' : 'Create Purchase Order'}
                          </>
                        )}
                      </Button>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
            
            {/* Saved Vendors Modal */}
            <Modal show={showSavedVendorsModal} onHide={() => setShowSavedVendorsModal(false)} size="lg">
              <Modal.Header closeButton>
                <Modal.Title>Saved Vendor Templates</Modal.Title>
              </Modal.Header>
              <Modal.Body>
                {savedVendors.length > 0 ? (
                  <Table responsive hover>
                    <thead>
                      <tr>
                        <th>Template Name</th>
                        <th>Vendor Name</th>
                        <th>Location</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {savedVendors.map(savedVendor => (
                        <tr key={savedVendor.id}>
                          <td>{savedVendor.name}</td>
                          <td>{savedVendor.vendor.name}</td>
                          <td>{savedVendor.vendor.city}, {savedVendor.vendor.state}</td>
                          <td>
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => handleSelectSavedVendor(savedVendor, setFieldValue)}
                            >
                              <FaCheck className="me-1" /> Select
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                ) : (
                  <p>No saved vendor templates found.</p>
                )}
              </Modal.Body>
              <Modal.Footer>
                <Button variant="secondary" onClick={() => setShowSavedVendorsModal(false)}>
                  Cancel
                </Button>
              </Modal.Footer>
            </Modal>
            
            {/* Saved Line Items Modal */}
            <Modal show={showSavedLineItemsModal} onHide={() => setShowSavedLineItemsModal(false)} size="lg">
              <Modal.Header closeButton>
                <Modal.Title>Saved Line Item Templates</Modal.Title>
              </Modal.Header>
              <Modal.Body>
                {savedLineItems.length > 0 ? (
                  <>
                    <p>Select one or more line item templates to add to your purchase order:</p>
                    <Table responsive hover>
                      <thead>
                        <tr>
                          <th>Select</th>
                          <th>Template Name</th>
                          <th>Description</th>
                          <th>Quantity</th>
                          <th>Rate</th>
                        </tr>
                      </thead>
                      <tbody>
                        {savedLineItems.map(savedItem => (
                          <tr 
                            key={savedItem.id} 
                            className={selectedSavedLineItems.some(item => item.id === savedItem.id) ? 'table-primary' : ''}
                            onClick={() => handleSelectSavedLineItem(savedItem)}
                            style={{ cursor: 'pointer' }}
                          >
                            <td>
                              <Form.Check
                                type="checkbox"
                                checked={selectedSavedLineItems.some(item => item.id === savedItem.id)}
                                onChange={() => handleSelectSavedLineItem(savedItem)}
                                onClick={e => e.stopPropagation()}
                              />
                            </td>
                            <td>{savedItem.name}</td>
                            <td>{savedItem.line_item.description}</td>
                            <td>{savedItem.line_item.quantity}</td>
                            <td>${parseFloat(savedItem.line_item.rate).toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </>
                ) : (
                  <p>No saved line item templates found.</p>
                )}
              </Modal.Body>
              <Modal.Footer>
                <Button variant="secondary" onClick={() => setShowSavedLineItemsModal(false)}>
                  Cancel
                </Button>
                <Button 
                  variant="primary" 
                  onClick={() => handleApplySavedLineItems(values, setFieldValue)}
                  disabled={selectedSavedLineItems.length === 0}
                >
                  <FaCheck className="me-1" /> Apply Selected ({selectedSavedLineItems.length})
                </Button>
              </Modal.Footer>
            </Modal>
            
            {/* New Vendor Modal */}
            <Modal show={showNewVendorModal} onHide={() => setShowNewVendorModal(false)} size="lg">
              <Modal.Header closeButton>
                <Modal.Title>Add New Vendor</Modal.Title>
              </Modal.Header>
              <Formik
                initialValues={{
                  name: '',
                  address: '',
                  city: '',
                  state: '',
                  zip_code: '',
                  country: ''
                }}
                validationSchema={VendorSchema}
                onSubmit={async (values, formikHelpers) => {
                  const newVendor = await handleSaveNewVendor(values, formikHelpers);
                  if (newVendor) {
                    // Use the setFieldValue from the parent Formik form to update the vendor_id
                    setFieldValue('vendor_id', newVendor.id.toString());
                  }
                }}
              >
                {({
                  values,
                  errors,
                  touched,
                  handleChange,
                  handleBlur,
                  handleSubmit,
                  isSubmitting
                }) => (
                  <Form onSubmit={handleSubmit}>
                    <Modal.Body>
                      <Form.Group className="mb-3">
                        <Form.Label>Name</Form.Label>
                        <Form.Control
                          type="text"
                          name="name"
                          value={values.name}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          isInvalid={touched.name && errors.name}
                        />
                        <Form.Control.Feedback type="invalid">
                          {errors.name}
                        </Form.Control.Feedback>
                      </Form.Group>

                      <Form.Group className="mb-3">
                        <Form.Label>Address</Form.Label>
                        <Form.Control
                          type="text"
                          name="address"
                          value={values.address}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          isInvalid={touched.address && errors.address}
                        />
                        <Form.Control.Feedback type="invalid">
                          {errors.address}
                        </Form.Control.Feedback>
                      </Form.Group>

                      <Row>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>City</Form.Label>
                            <Form.Control
                              type="text"
                              name="city"
                              value={values.city}
                              onChange={handleChange}
                              onBlur={handleBlur}
                              isInvalid={touched.city && errors.city}
                            />
                            <Form.Control.Feedback type="invalid">
                              {errors.city}
                            </Form.Control.Feedback>
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>State</Form.Label>
                            <Form.Control
                              type="text"
                              name="state"
                              value={values.state}
                              onChange={handleChange}
                              onBlur={handleBlur}
                              isInvalid={touched.state && errors.state}
                            />
                            <Form.Control.Feedback type="invalid">
                              {errors.state}
                            </Form.Control.Feedback>
                          </Form.Group>
                        </Col>
                      </Row>

                      <Row>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>ZIP Code</Form.Label>
                            <Form.Control
                              type="text"
                              name="zip_code"
                              value={values.zip_code}
                              onChange={handleChange}
                              onBlur={handleBlur}
                              isInvalid={touched.zip_code && errors.zip_code}
                            />
                            <Form.Control.Feedback type="invalid">
                              {errors.zip_code}
                            </Form.Control.Feedback>
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>Country</Form.Label>
                            <Form.Control
                              type="text"
                              name="country"
                              value={values.country}
                              onChange={handleChange}
                              onBlur={handleBlur}
                              isInvalid={touched.country && errors.country}
                            />
                            <Form.Control.Feedback type="invalid">
                              {errors.country}
                            </Form.Control.Feedback>
                          </Form.Group>
                        </Col>
                      </Row>
                    </Modal.Body>
                    <Modal.Footer>
                      <Button variant="secondary" onClick={() => setShowNewVendorModal(false)}>
                        Cancel
                      </Button>
                      <Button variant="primary" type="submit" disabled={isSubmitting}>
                        {isSubmitting ? (
                          <>
                            <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
                            Saving...
                          </>
                        ) : (
                          'Save Vendor'
                        )}
                      </Button>
                    </Modal.Footer>
                  </Form>
                )}
              </Formik>
            </Modal>
          </Form>
        )}
      </Formik>
    </Container>
  );
};

export default CreatePurchaseOrder; 