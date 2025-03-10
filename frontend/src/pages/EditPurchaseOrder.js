import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Spinner, Alert, Button } from 'react-bootstrap';
import axios from 'axios';
import { toast } from 'react-toastify';
import CreatePurchaseOrder from './CreatePurchaseOrder';

const EditPurchaseOrder = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [purchaseOrder, setPurchaseOrder] = useState(null);

  useEffect(() => {
    const fetchPurchaseOrder = async () => {
      setLoading(true);
      setError(null);
      try {
        console.log(`Fetching purchase order with ID: ${id}`);
        const response = await axios.get(`/api/purchase-orders/${id}/`);
        console.log('Purchase order data:', response.data);
        
        // Process the data to match the expected format for the form
        const processedPO = {
          ...response.data,
          // Ensure line_items are in the correct format for the form
          line_items: response.data.line_items.map(item => ({
            id: item.id,
            quantity: item.quantity,
            description: item.description,
            rate: item.rate
          }))
        };
        
        setPurchaseOrder(processedPO);
      } catch (error) {
        console.error('Error fetching purchase order:', error);
        setError('Failed to load purchase order. It may not exist or you may not have permission to view it.');
        toast.error('Failed to load purchase order');
      } finally {
        setLoading(false);
      }
    };

    fetchPurchaseOrder();
  }, [id]);

  if (loading) {
    return (
      <Container className="text-center py-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
        <p className="mt-3">Loading purchase order...</p>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="py-5">
        <Alert variant="danger">
          <Alert.Heading>Error</Alert.Heading>
          <p>{error}</p>
          <hr />
          <div className="d-flex justify-content-end">
            <Button variant="outline-danger" onClick={() => navigate('/purchase-orders')}>
              Back to Purchase Orders
            </Button>
          </div>
        </Alert>
      </Container>
    );
  }

  // If purchase order is loaded, render the CreatePurchaseOrder component with initialValues
  return <CreatePurchaseOrder isEditing={true} initialPurchaseOrder={purchaseOrder} />;
};

export default EditPurchaseOrder; 