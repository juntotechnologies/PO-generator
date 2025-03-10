import React, { useState, useEffect, useContext } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { Formik } from 'formik';
import * as Yup from 'yup';
import axios from '../api/axios';
import { toast } from 'react-toastify';
import { AuthContext } from '../context/AuthContext';

// Validation schema for user profile
const UserProfileSchema = Yup.object().shape({
  first_name: Yup.string().required('First name is required'),
  last_name: Yup.string().required('Last name is required'),
  email: Yup.string().email('Invalid email').required('Email is required'),
});

const UserProfile = () => {
  const { user, updateUserInfo } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userProfile, setUserProfile] = useState(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/users/me/');
        setUserProfile(response.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching user profile:', err);
        setError('Failed to load user profile. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  const handleUpdateProfile = async (values, { setSubmitting }) => {
    try {
      setSubmitting(true);
      const response = await axios.patch('/api/users/me/', values);
      
      // Update the user context with new information
      if (updateUserInfo) {
        updateUserInfo(response.data);
      }
      
      toast.success('Profile updated successfully');
      setUserProfile(response.data);
    } catch (err) {
      console.error('Error updating profile:', err);
      
      if (err.response && err.response.data) {
        // Handle validation errors
        const serverErrors = err.response.data;
        let errorMessage = 'Failed to update profile: ';
        
        Object.keys(serverErrors).forEach(key => {
          errorMessage += `${key}: ${serverErrors[key].join(', ')}; `;
        });
        
        toast.error(errorMessage);
      } else {
        toast.error('Failed to update profile. Please try again later.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Container className="py-4">
        <div className="text-center my-5">
          <Spinner animation="border" />
          <p className="mt-2">Loading user profile...</p>
        </div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="py-4">
        <Alert variant="danger">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <h1 className="mb-4">User Profile</h1>
      
      <Row>
        <Col md={8}>
          <Card>
            <Card.Header>
              <h5 className="mb-0">Profile Information</h5>
            </Card.Header>
            <Card.Body>
              <Formik
                initialValues={{
                  first_name: userProfile?.first_name || '',
                  last_name: userProfile?.last_name || '',
                  email: userProfile?.email || '',
                }}
                validationSchema={UserProfileSchema}
                onSubmit={handleUpdateProfile}
              >
                {({
                  values,
                  errors,
                  touched,
                  handleChange,
                  handleBlur,
                  handleSubmit,
                  isSubmitting,
                }) => (
                  <Form onSubmit={handleSubmit}>
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>First Name</Form.Label>
                          <Form.Control
                            type="text"
                            name="first_name"
                            value={values.first_name}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            isInvalid={touched.first_name && errors.first_name}
                          />
                          <Form.Control.Feedback type="invalid">
                            {errors.first_name}
                          </Form.Control.Feedback>
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Last Name</Form.Label>
                          <Form.Control
                            type="text"
                            name="last_name"
                            value={values.last_name}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            isInvalid={touched.last_name && errors.last_name}
                          />
                          <Form.Control.Feedback type="invalid">
                            {errors.last_name}
                          </Form.Control.Feedback>
                        </Form.Group>
                      </Col>
                    </Row>
                    
                    <Form.Group className="mb-3">
                      <Form.Label>Email</Form.Label>
                      <Form.Control
                        type="email"
                        name="email"
                        value={values.email}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        isInvalid={touched.email && errors.email}
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.email}
                      </Form.Control.Feedback>
                    </Form.Group>
                    
                    <Form.Group className="mb-3">
                      <Form.Label>Username</Form.Label>
                      <Form.Control
                        type="text"
                        value={userProfile?.username || ''}
                        disabled
                      />
                      <Form.Text className="text-muted">
                        Username cannot be changed.
                      </Form.Text>
                    </Form.Group>
                    
                    <div className="d-grid gap-2 d-md-flex justify-content-md-end">
                      <Button variant="primary" type="submit" disabled={isSubmitting}>
                        {isSubmitting ? (
                          <>
                            <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
                            Saving...
                          </>
                        ) : (
                          'Save Changes'
                        )}
                      </Button>
                    </div>
                  </Form>
                )}
              </Formik>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={4}>
          <Card>
            <Card.Header>
              <h5 className="mb-0">Signature Preview</h5>
            </Card.Header>
            <Card.Body>
              <div className="signature-preview p-3 border rounded mb-3">
                {userProfile?.first_name && userProfile?.last_name ? (
                  <div className="text-center">
                    <div style={{ fontFamily: '"Brush Script MT", cursive', fontSize: '2rem' }}>
                      {`${userProfile.first_name} ${userProfile.last_name}`}
                    </div>
                    <hr className="mt-0" />
                  </div>
                ) : (
                  <Alert variant="warning">
                    Please provide your first and last name to see your signature preview.
                  </Alert>
                )}
              </div>
              <p className="text-muted small">
                This is how your signature will appear on purchase orders. Make sure your name is spelled correctly.
              </p>
            </Card.Body>
          </Card>
          
          <Card className="mt-3">
            <Card.Header>
              <h5 className="mb-0">Account Information</h5>
            </Card.Header>
            <Card.Body>
              <p><strong>Last Login:</strong> {userProfile?.last_login ? new Date(userProfile.last_login).toLocaleString() : 'Never'}</p>
              <p><strong>Date Joined:</strong> {userProfile?.date_joined ? new Date(userProfile.date_joined).toLocaleDateString() : 'Unknown'}</p>
              <p className="text-muted small">
                For security reasons, password changes and account creation must be handled by an administrator.
              </p>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default UserProfile; 