import React, { useState, useEffect, useContext } from 'react';
import { Container, Row, Col, Card, Button, Modal, Form, Table, Spinner, Alert } from 'react-bootstrap';
import { FaPlus, FaEdit, FaTrash, FaSave, FaBookmark } from 'react-icons/fa';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { AuthContext } from '../context/AuthContext';

// Validation schema for line item form
const LineItemSchema = Yup.object().shape({
  quantity: Yup.number()
    .required('Quantity is required')
    .positive('Quantity must be positive')
    .typeError('Quantity must be a number'),
  description: Yup.string()
    .required('Description is required'),
  rate: Yup.number()
    .required('Rate is required')
    .positive('Rate must be positive')
    .typeError('Rate must be a number')
});

// Validation schema for saved line item template
const SavedLineItemSchema = Yup.object().shape({
  name: Yup.string().required('Template name is required')
});

const LineItems = () => {
  const [lineItems, setLineItems] = useState([]);
  const [savedLineItems, setSavedLineItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showLineItemModal, setShowLineItemModal] = useState(false);
  const [showSaveTemplateModal, setShowSaveTemplateModal] = useState(false);
  const [currentLineItem, setCurrentLineItem] = useState(null);
  const [templateLineItem, setTemplateLineItem] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const { user } = useContext(AuthContext);

  // Fetch line items and saved line item templates
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        console.log('Fetching line items and templates...');
        const [lineItemsResponse, savedLineItemsResponse] = await Promise.all([
          axios.get('/api/line-items/'),
          axios.get('/api/saved-line-items/')
        ]);
        
        console.log('Line items response:', lineItemsResponse.data);
        console.log('Saved line items response:', savedLineItemsResponse.data);
        
        setLineItems(lineItemsResponse.data.results || lineItemsResponse.data);
        setSavedLineItems(savedLineItemsResponse.data.results || savedLineItemsResponse.data);
      } catch (error) {
        console.error('Error fetching line items:', error);
        setError('Failed to load line items. Please try again later.');
        toast.error('Failed to load line items');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Handle opening the line item modal for creating or editing
  const handleOpenLineItemModal = (lineItem = null) => {
    setCurrentLineItem(lineItem);
    setIsEditing(!!lineItem);
    setShowLineItemModal(true);
  };

  // Handle opening the save template modal
  const handleOpenSaveTemplateModal = (lineItem) => {
    setTemplateLineItem(lineItem);
    setShowSaveTemplateModal(true);
  };

  // Handle saving a line item
  const handleSaveLineItem = async (values, { setSubmitting, resetForm, setFieldError }) => {
    try {
      console.log('Saving line item with values:', values);
      let response;
      
      if (isEditing) {
        // Update existing line item
        response = await axios.put(`/api/line-items/${currentLineItem.id}/`, values);
        console.log('Line item updated:', response.data);
        
        // Update line items list
        setLineItems(lineItems.map(item => item.id === currentLineItem.id ? response.data : item));
        toast.success('Line item updated successfully');
      } else {
        // Create new line item
        response = await axios.post('/api/line-items/', values);
        console.log('Line item created:', response.data);
        
        // Add to line items list
        setLineItems([...lineItems, response.data]);
        toast.success('Line item created successfully');
      }
      
      // Close modal and reset form
      setShowLineItemModal(false);
      resetForm();
    } catch (error) {
      console.error('Error saving line item:', error);
      
      // Handle validation errors from the server
      if (error.response?.data) {
        const serverErrors = error.response.data;
        Object.keys(serverErrors).forEach(key => {
          if (key in values) {
            setFieldError(key, serverErrors[key][0]);
          }
        });
      }
      
      toast.error('Failed to save line item');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle saving a line item template
  const handleSaveTemplate = async (values, { setSubmitting, resetForm, setFieldError }) => {
    try {
      console.log('Saving line item template:', values.name, 'for line item ID:', templateLineItem.id);
      const response = await axios.post('/api/saved-line-items/', {
        line_item_id: templateLineItem.id,
        name: values.name
      });
      
      console.log('Template saved:', response.data);
      
      // Add to saved line items list
      setSavedLineItems([...savedLineItems, response.data]);
      toast.success('Line item template saved successfully');
      
      // Close modal and reset form
      setShowSaveTemplateModal(false);
      resetForm();
    } catch (error) {
      console.error('Error saving line item template:', error);
      
      // Handle validation errors from the server
      if (error.response?.data) {
        const serverErrors = error.response.data;
        Object.keys(serverErrors).forEach(key => {
          if (key in values) {
            setFieldError(key, serverErrors[key][0]);
          }
        });
      }
      
      toast.error('Failed to save line item template');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle deleting a line item
  const handleDeleteLineItem = async (lineItemId) => {
    if (window.confirm('Are you sure you want to delete this line item?')) {
      try {
        console.log('Deleting line item ID:', lineItemId);
        await axios.delete(`/api/line-items/${lineItemId}/`);
        
        // Remove from line items list
        setLineItems(lineItems.filter(item => item.id !== lineItemId));
        toast.success('Line item deleted successfully');
      } catch (error) {
        console.error('Error deleting line item:', error);
        toast.error('Failed to delete line item. It may be in use in a purchase order.');
      }
    }
  };

  // Handle deleting a saved line item template
  const handleDeleteSavedLineItem = async (savedLineItemId) => {
    if (window.confirm('Are you sure you want to delete this line item template?')) {
      try {
        console.log('Deleting saved line item template ID:', savedLineItemId);
        await axios.delete(`/api/saved-line-items/${savedLineItemId}/`);
        
        // Remove from saved line items list
        setSavedLineItems(savedLineItems.filter(item => item.id !== savedLineItemId));
        toast.success('Line item template deleted successfully');
      } catch (error) {
        console.error('Error deleting line item template:', error);
        toast.error('Failed to delete line item template');
      }
    }
  };

  // Calculate amount (quantity * rate)
  const calculateAmount = (quantity, rate) => {
    return (parseFloat(quantity) * parseFloat(rate)).toFixed(2);
  };

  if (loading) {
    return (
      <Container className="text-center py-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
        <p className="mt-3">Loading line items...</p>
      </Container>
    );
  }

  return (
    <Container>
      <h1 className="my-4">Line Items</h1>
      
      {error && (
        <Alert variant="danger" className="mb-4">
          {error}
        </Alert>
      )}
      
      <Row className="mb-4">
        <Col>
          <Card>
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">All Line Items</h5>
              <Button variant="primary" onClick={() => handleOpenLineItemModal()}>
                <FaPlus className="me-1" /> Add Line Item
              </Button>
            </Card.Header>
            <Card.Body>
              {lineItems.length > 0 ? (
                <Table responsive hover>
                  <thead>
                    <tr>
                      <th>Quantity</th>
                      <th>Description</th>
                      <th>Rate</th>
                      <th>Amount</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lineItems.map(item => (
                      <tr key={item.id} className="line-item-row">
                        <td>{item.quantity}</td>
                        <td>{item.description}</td>
                        <td>${parseFloat(item.rate).toFixed(2)}</td>
                        <td>${item.amount || calculateAmount(item.quantity, item.rate)}</td>
                        <td>
                          <Button 
                            variant="outline-primary" 
                            size="sm" 
                            className="me-1"
                            onClick={() => handleOpenLineItemModal(item)}
                          >
                            <FaEdit />
                          </Button>
                          <Button 
                            variant="outline-danger" 
                            size="sm"
                            className="me-1"
                            onClick={() => handleDeleteLineItem(item.id)}
                          >
                            <FaTrash />
                          </Button>
                          <Button 
                            variant="outline-success" 
                            size="sm"
                            onClick={() => handleOpenSaveTemplateModal(item)}
                          >
                            <FaBookmark />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              ) : (
                <p>No line items found. Add your first line item!</p>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row>
        <Col>
          <Card>
            <Card.Header>
              <h5 className="mb-0">Saved Line Item Templates</h5>
            </Card.Header>
            <Card.Body>
              {savedLineItems.length > 0 ? (
                <Table responsive hover>
                  <thead>
                    <tr>
                      <th>Template Name</th>
                      <th>Description</th>
                      <th>Quantity</th>
                      <th>Rate</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {savedLineItems.map(savedItem => (
                      <tr key={savedItem.id}>
                        <td>{savedItem.name}</td>
                        <td>{savedItem.line_item.description}</td>
                        <td>{savedItem.line_item.quantity}</td>
                        <td>${parseFloat(savedItem.line_item.rate).toFixed(2)}</td>
                        <td>
                          <Button 
                            variant="outline-danger" 
                            size="sm"
                            onClick={() => handleDeleteSavedLineItem(savedItem.id)}
                          >
                            <FaTrash />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              ) : (
                <p>No saved line item templates found. Save a line item as a template for quick reuse!</p>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Line Item Modal */}
      <Modal show={showLineItemModal} onHide={() => setShowLineItemModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>{isEditing ? 'Edit Line Item' : 'Add Line Item'}</Modal.Title>
        </Modal.Header>
        <Formik
          initialValues={
            isEditing
              ? { ...currentLineItem }
              : {
                  quantity: '',
                  description: '',
                  rate: ''
                }
          }
          validationSchema={LineItemSchema}
          onSubmit={handleSaveLineItem}
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
              <Modal.Body>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Quantity</Form.Label>
                      <Form.Control
                        type="number"
                        step="0.01"
                        name="quantity"
                        value={values.quantity}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        isInvalid={touched.quantity && errors.quantity}
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.quantity}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Rate</Form.Label>
                      <Form.Control
                        type="number"
                        step="0.01"
                        name="rate"
                        value={values.rate}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        isInvalid={touched.rate && errors.rate}
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.rate}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-3">
                  <Form.Label>Description</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    name="description"
                    value={values.description}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    isInvalid={touched.description && errors.description}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.description}
                  </Form.Control.Feedback>
                </Form.Group>

                {values.quantity && values.rate && (
                  <div className="mb-3">
                    <strong>Amount: </strong>
                    ${calculateAmount(values.quantity, values.rate)}
                  </div>
                )}
              </Modal.Body>
              <Modal.Footer>
                <Button variant="secondary" onClick={() => setShowLineItemModal(false)}>
                  Cancel
                </Button>
                <Button variant="primary" type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Spinner
                        as="span"
                        animation="border"
                        size="sm"
                        role="status"
                        aria-hidden="true"
                        className="me-2"
                      />
                      Saving...
                    </>
                  ) : (
                    <>
                      <FaSave className="me-1" /> Save
                    </>
                  )}
                </Button>
              </Modal.Footer>
            </Form>
          )}
        </Formik>
      </Modal>

      {/* Save Template Modal */}
      <Modal show={showSaveTemplateModal} onHide={() => setShowSaveTemplateModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Save Line Item as Template</Modal.Title>
        </Modal.Header>
        <Formik
          initialValues={{ name: '' }}
          validationSchema={SavedLineItemSchema}
          onSubmit={handleSaveTemplate}
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
                {templateLineItem && (
                  <div className="mb-3">
                    <p>
                      Save the following line item as a template for quick reuse:
                    </p>
                    <Card>
                      <Card.Body>
                        <p><strong>Description:</strong> {templateLineItem.description}</p>
                        <p><strong>Quantity:</strong> {templateLineItem.quantity}</p>
                        <p><strong>Rate:</strong> ${parseFloat(templateLineItem.rate).toFixed(2)}</p>
                        <p><strong>Amount:</strong> ${templateLineItem.amount || calculateAmount(templateLineItem.quantity, templateLineItem.rate)}</p>
                      </Card.Body>
                    </Card>
                  </div>
                )}
                <Form.Group className="mb-3">
                  <Form.Label>Template Name</Form.Label>
                  <Form.Control
                    type="text"
                    name="name"
                    value={values.name}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    isInvalid={touched.name && errors.name}
                    placeholder="Enter a name for this template"
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.name}
                  </Form.Control.Feedback>
                </Form.Group>
              </Modal.Body>
              <Modal.Footer>
                <Button variant="secondary" onClick={() => setShowSaveTemplateModal(false)}>
                  Cancel
                </Button>
                <Button variant="primary" type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Spinner
                        as="span"
                        animation="border"
                        size="sm"
                        role="status"
                        aria-hidden="true"
                        className="me-2"
                      />
                      Saving...
                    </>
                  ) : (
                    <>
                      <FaBookmark className="me-1" /> Save Template
                    </>
                  )}
                </Button>
              </Modal.Footer>
            </Form>
          )}
        </Formik>
      </Modal>
    </Container>
  );
};

export default LineItems; 