import React, { useState, useEffect, useContext } from 'react';
import { Container, Row, Col, Card, Button, Modal, Form, Table, Spinner } from 'react-bootstrap';
import { FaPlus, FaEdit, FaTrash, FaSave, FaBookmark } from 'react-icons/fa';
import axios from '../api/axios';
import { toast } from 'react-toastify';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { AuthContext } from '../context/AuthContext';

// Validation schema for vendor form
const VendorSchema = Yup.object().shape({
  name: Yup.string().required('Name is required'),
  address: Yup.string().required('Address is required'),
  city: Yup.string().required('City is required'),
  state: Yup.string().required('State is required'),
  zip_code: Yup.string().required('Zip code is required'),
  country: Yup.string().required('Country is required')
});

// Validation schema for saved vendor template
const SavedVendorSchema = Yup.object().shape({
  name: Yup.string().required('Template name is required')
});

const Vendors = () => {
  const [vendors, setVendors] = useState([]);
  const [savedVendors, setSavedVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showVendorModal, setShowVendorModal] = useState(false);
  const [showSaveTemplateModal, setShowSaveTemplateModal] = useState(false);
  const [currentVendor, setCurrentVendor] = useState(null);
  const [templateVendor, setTemplateVendor] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const { user } = useContext(AuthContext);

  // Fetch vendors and saved vendor templates
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [vendorsResponse, savedVendorsResponse] = await Promise.all([
          axios.get('/api/vendors/'),
          axios.get('/api/saved-vendors/')
        ]);
        
        setVendors(vendorsResponse.data.results || vendorsResponse.data);
        setSavedVendors(savedVendorsResponse.data.results || savedVendorsResponse.data);
      } catch (error) {
        console.error('Error fetching vendors:', error);
        toast.error('Failed to load vendors');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Handle opening the vendor modal for creating or editing
  const handleOpenVendorModal = (vendor = null) => {
    setCurrentVendor(vendor);
    setIsEditing(!!vendor);
    setShowVendorModal(true);
  };

  // Handle opening the save template modal
  const handleOpenSaveTemplateModal = (vendor) => {
    setTemplateVendor(vendor);
    setShowSaveTemplateModal(true);
  };

  // Handle saving a vendor
  const handleSaveVendor = async (values, { setSubmitting, resetForm, setFieldError }) => {
    try {
      console.log('Attempting to save vendor with values:', values);
      let response;
      
      if (isEditing) {
        // Update existing vendor
        console.log(`Updating vendor with ID: ${currentVendor.id}`);
        response = await axios.put(`/api/vendors/${currentVendor.id}/`, values);
        console.log('Vendor update response:', response.data);
        
        // Update vendors list
        setVendors(vendors.map(v => v.id === currentVendor.id ? response.data : v));
        toast.success('Vendor updated successfully');
      } else {
        // Create new vendor
        console.log('Creating new vendor');
        response = await axios.post('/api/vendors/', values);
        console.log('Vendor creation response:', response.data);
        
        // Add to vendors list
        setVendors([...vendors, response.data]);
        toast.success('Vendor created successfully');
      }
      
      // Close modal and reset form
      setShowVendorModal(false);
      resetForm();
    } catch (error) {
      console.error('Error saving vendor:', error);
      
      // More detailed error logging
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error('Error response data:', error.response.data);
        console.error('Error response status:', error.response.status);
        console.error('Error response headers:', error.response.headers);
        
        // Handle validation errors from the server
        if (error.response.data) {
          const serverErrors = error.response.data;
          Object.keys(serverErrors).forEach(key => {
            if (key in values) {
              setFieldError(key, Array.isArray(serverErrors[key]) 
                ? serverErrors[key][0] 
                : serverErrors[key]);
            }
          });
        }
      } else if (error.request) {
        // The request was made but no response was received
        console.error('Error request:', error.request);
        toast.error('No response received from server. Please check your network connection.');
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error('Error message:', error.message);
        toast.error(`Error: ${error.message}`);
      }
      
      toast.error('Failed to save vendor. See console for details.');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle saving a vendor template
  const handleSaveTemplate = async (values, { setSubmitting, resetForm }) => {
    try {
      const response = await axios.post('/api/saved-vendors/', {
        vendor_id: templateVendor.id,
        name: values.name
      });
      
      // Add to saved vendors list
      setSavedVendors([...savedVendors, response.data]);
      toast.success('Vendor template saved successfully');
      
      // Close modal and reset form
      setShowSaveTemplateModal(false);
      resetForm();
    } catch (error) {
      console.error('Error saving vendor template:', error);
      toast.error('Failed to save vendor template');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle deleting a vendor
  const handleDeleteVendor = async (vendorId) => {
    if (window.confirm('Are you sure you want to delete this vendor?')) {
      try {
        await axios.delete(`/api/vendors/${vendorId}/`);
        
        // Remove from vendors list
        setVendors(vendors.filter(v => v.id !== vendorId));
        toast.success('Vendor deleted successfully');
      } catch (error) {
        console.error('Error deleting vendor:', error);
        toast.error('Failed to delete vendor');
      }
    }
  };

  // Handle deleting a saved vendor template
  const handleDeleteSavedVendor = async (savedVendorId) => {
    if (window.confirm('Are you sure you want to delete this vendor template?')) {
      try {
        await axios.delete(`/api/saved-vendors/${savedVendorId}/`);
        
        // Remove from saved vendors list
        setSavedVendors(savedVendors.filter(sv => sv.id !== savedVendorId));
        toast.success('Vendor template deleted successfully');
      } catch (error) {
        console.error('Error deleting vendor template:', error);
        toast.error('Failed to delete vendor template');
      }
    }
  };

  if (loading) {
    return (
      <Container className="text-center py-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </Container>
    );
  }

  return (
    <Container>
      <h1 className="my-4">Vendors</h1>
      
      <Row className="mb-4">
        <Col>
          <Card>
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">All Vendors</h5>
              <Button variant="primary" onClick={() => handleOpenVendorModal()}>
                <FaPlus className="me-1" /> Add Vendor
              </Button>
            </Card.Header>
            <Card.Body>
              {vendors.length > 0 ? (
                <Table responsive hover>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Address</th>
                      <th>City</th>
                      <th>State</th>
                      <th>Zip</th>
                      <th>Country</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vendors.map(vendor => (
                      <tr key={vendor.id}>
                        <td>{vendor.name}</td>
                        <td>{vendor.address}</td>
                        <td>{vendor.city}</td>
                        <td>{vendor.state}</td>
                        <td>{vendor.zip_code}</td>
                        <td>{vendor.country}</td>
                        <td>
                          <Button 
                            variant="outline-primary" 
                            size="sm" 
                            className="me-1"
                            onClick={() => handleOpenVendorModal(vendor)}
                          >
                            <FaEdit />
                          </Button>
                          <Button 
                            variant="outline-danger" 
                            size="sm"
                            className="me-1"
                            onClick={() => handleDeleteVendor(vendor.id)}
                          >
                            <FaTrash />
                          </Button>
                          <Button 
                            variant="outline-success" 
                            size="sm"
                            onClick={() => handleOpenSaveTemplateModal(vendor)}
                          >
                            <FaBookmark />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              ) : (
                <p>No vendors found. Add your first vendor!</p>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row>
        <Col>
          <Card>
            <Card.Header>
              <h5 className="mb-0">Saved Vendor Templates</h5>
            </Card.Header>
            <Card.Body>
              {savedVendors.length > 0 ? (
                <Table responsive hover>
                  <thead>
                    <tr>
                      <th>Template Name</th>
                      <th>Vendor Name</th>
                      <th>Address</th>
                      <th>City</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {savedVendors.map(savedVendor => (
                      <tr key={savedVendor.id}>
                        <td>{savedVendor.name}</td>
                        <td>{savedVendor.vendor.name}</td>
                        <td>{savedVendor.vendor.address}</td>
                        <td>{savedVendor.vendor.city}</td>
                        <td>
                          <Button 
                            variant="outline-danger" 
                            size="sm"
                            onClick={() => handleDeleteSavedVendor(savedVendor.id)}
                          >
                            <FaTrash />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              ) : (
                <p>No saved vendor templates found. Save a vendor as a template for quick reuse!</p>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Vendor Modal */}
      <Modal show={showVendorModal} onHide={() => setShowVendorModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>{isEditing ? 'Edit Vendor' : 'Add Vendor'}</Modal.Title>
        </Modal.Header>
        <Formik
          initialValues={
            isEditing
              ? { ...currentVendor }
              : {
                  name: '',
                  address: '',
                  city: '',
                  state: '',
                  zip_code: '',
                  country: ''
                }
          }
          validationSchema={VendorSchema}
          onSubmit={handleSaveVendor}
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
                      <Form.Label>Zip Code</Form.Label>
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
                <Button variant="secondary" onClick={() => setShowVendorModal(false)}>
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
          <Modal.Title>Save Vendor as Template</Modal.Title>
        </Modal.Header>
        <Formik
          initialValues={{ name: '' }}
          validationSchema={SavedVendorSchema}
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
                {templateVendor && (
                  <p>
                    Save <strong>{templateVendor.name}</strong> as a template for quick reuse.
                  </p>
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

export default Vendors; 