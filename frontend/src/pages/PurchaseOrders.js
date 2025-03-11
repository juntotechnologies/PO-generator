import React, { useState, useEffect, useContext } from 'react';
import { Container, Row, Col, Card, Button, Table, Spinner, Alert, Badge } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaPlus, FaEdit, FaTrash, FaFilePdf, FaEye, FaCopy } from 'react-icons/fa';
import axios from '../api/axios';
import { toast } from 'react-toastify';
import { AuthContext } from '../context/AuthContext';

const PurchaseOrders = () => {
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { } = useContext(AuthContext);

  // Fetch purchase orders
  useEffect(() => {
    const fetchPurchaseOrders = async () => {
      setLoading(true);
      setError(null);
      try {
        console.log('Fetching purchase orders...');
        const response = await axios.get('/api/purchase-orders/');
        console.log('Purchase orders response:', response.data);
        
        // Get the purchase orders data
        const poData = response.data.results || response.data;
        
        // Sort purchase orders by created_at in descending order (newest first)
        const sortedPOs = [...poData].sort((a, b) => {
          return new Date(b.created_at) - new Date(a.created_at);
        });
        
        setPurchaseOrders(sortedPOs);
      } catch (error) {
        console.error('Error fetching purchase orders:', error);
        setError('Failed to load purchase orders. Please try again later.');
        toast.error('Failed to load purchase orders');
      } finally {
        setLoading(false);
      }
    };

    fetchPurchaseOrders();
  }, []);

  // Handle deleting a purchase order
  const handleDeletePurchaseOrder = async (poId) => {
    if (window.confirm('Are you sure you want to delete this purchase order?')) {
      try {
        console.log('Deleting purchase order ID:', poId);
        await axios.delete(`/api/purchase-orders/${poId}/`);
        
        // Remove from purchase orders list
        setPurchaseOrders(purchaseOrders.filter(po => po.id !== poId));
        toast.success('Purchase order deleted successfully');
      } catch (error) {
        console.error('Error deleting purchase order:', error);
        toast.error('Failed to delete purchase order');
      }
    }
  };

  // Handle duplicating a purchase order
  const handleDuplicatePurchaseOrder = async (po) => {
    try {
      console.log('Duplicating purchase order:', po);
      
      // Create a new purchase order with the same data but without the ID and PO number
      const duplicateData = {
        vendor_id: po.vendor.id,
        payment_terms: po.payment_terms,
        payment_days: po.payment_days,
        notes: po.notes,
        approval_stamp: po.approval_stamp,
        line_item_ids: po.line_items.map(item => item.id)
      };
      
      // Create a FormData object for the multipart/form-data request
      const formData = new FormData();
      Object.keys(duplicateData).forEach(key => {
        if (key === 'line_item_ids') {
          formData.append(key, JSON.stringify(duplicateData[key]));
        } else {
          formData.append(key, duplicateData[key]);
        }
      });
      
      // Add a blank signature (required by the backend)
      // Create a small blank canvas and convert to blob
      const canvas = document.createElement('canvas');
      canvas.width = 500;
      canvas.height = 200;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      const signatureBlob = await new Promise(resolve => {
        canvas.toBlob(resolve, 'image/png');
      });
      
      const signatureFile = new File([signatureBlob], 'signature.png', { type: 'image/png' });
      formData.append('signature', signatureFile);
      
      // Create the duplicate purchase order
      const response = await axios.post('/api/purchase-orders/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      console.log('Duplicate purchase order created:', response.data);
      
      // Add the new purchase order to the list
      setPurchaseOrders([response.data, ...purchaseOrders]);
      
      toast.success(`Purchase order duplicated with new PO number: ${response.data.po_number}`);
    } catch (error) {
      console.error('Error duplicating purchase order:', error);
      toast.error('Failed to duplicate purchase order');
    }
  };

  // Handle downloading a purchase order PDF
  const handleDownloadPDF = async (poId, poNumber) => {
    try {
      console.log('Downloading PDF for purchase order ID:', poId);
      const response = await axios.get(`/api/purchase-orders/${poId}/pdf/`, {
        responseType: 'blob'
      });
      
      // Create a blob URL and trigger download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `PO_${poNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success('PDF downloaded successfully');
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast.error('Failed to download PDF');
    }
  };

  // Handle previewing a purchase order PDF
  const handlePreviewPDF = async (poId) => {
    try {
      console.log('Previewing PDF for purchase order ID:', poId);
      const response = await axios.get(`/api/purchase-orders/${poId}/pdf/?disposition=inline`, {
        responseType: 'blob'
      });
      
      // Create a blob URL for the PDF viewer
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      
      // Open the PDF in a new tab instead of using the modal
      window.open(url, '_blank');
    } catch (error) {
      console.error('Error previewing PDF:', error);
      toast.error('Failed to preview PDF');
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  if (loading) {
    return (
      <Container className="text-center py-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
        <p className="mt-3">Loading purchase orders...</p>
      </Container>
    );
  }

  return (
    <Container>
      <h1 className="my-4">Purchase Orders</h1>
      
      {error && (
        <Alert variant="danger" className="mb-4">
          {error}
        </Alert>
      )}
      
      <Row className="mb-4">
        <Col className="d-flex justify-content-end">
          <Link to="/purchase-orders/create">
            <Button variant="primary">
              <FaPlus className="me-1" /> Create Purchase Order
            </Button>
          </Link>
        </Col>
      </Row>
      
      <Row>
        <Col>
          <Card>
            <Card.Header>
              <h5 className="mb-0">All Purchase Orders</h5>
            </Card.Header>
            <Card.Body>
              {purchaseOrders.length > 0 ? (
                <Table responsive hover>
                  <thead>
                    <tr>
                      <th>PO Number</th>
                      <th>Date</th>
                      <th>Vendor</th>
                      <th>Total Amount</th>
                      <th>Payment Terms</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {purchaseOrders.map(po => (
                      <tr key={po.id} className="po-list-item">
                        <td>
                          <Badge bg="secondary" className="me-2">{po.po_number}</Badge>
                        </td>
                        <td>{formatDate(po.date)}</td>
                        <td>{po.vendor.name}</td>
                        <td>${parseFloat(po.total_amount).toFixed(2)}</td>
                        <td>
                          {po.payment_terms ? 
                            `${po.payment_terms} (${po.payment_days} days)` : 
                            `Net ${po.payment_days} days`
                          }
                        </td>
                        <td>
                          <Link to={`/purchase-orders/edit/${po.id}`}>
                            <Button 
                              variant="outline-primary" 
                              size="sm" 
                              className="me-1"
                              title="Edit Purchase Order"
                            >
                              <FaEdit />
                            </Button>
                          </Link>
                          <Button 
                            variant="outline-danger" 
                            size="sm"
                            className="me-1"
                            onClick={() => handleDeletePurchaseOrder(po.id)}
                            title="Delete Purchase Order"
                          >
                            <FaTrash />
                          </Button>
                          <Button 
                            variant="outline-success" 
                            size="sm"
                            className="me-1"
                            onClick={() => handleDownloadPDF(po.id, po.po_number)}
                            title="Download PDF"
                          >
                            <FaFilePdf />
                          </Button>
                          <Button 
                            variant="outline-info" 
                            size="sm"
                            className="me-1"
                            onClick={() => handlePreviewPDF(po.id)}
                            title="Preview PDF"
                          >
                            <FaEye />
                          </Button>
                          <Button 
                            variant="outline-secondary" 
                            size="sm"
                            onClick={() => handleDuplicatePurchaseOrder(po)}
                            title="Duplicate Purchase Order"
                          >
                            <FaCopy />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              ) : (
                <div className="text-center py-4">
                  <p>No purchase orders found.</p>
                  <Link to="/purchase-orders/create">
                    <Button variant="primary">
                      <FaPlus className="me-1" /> Create Your First Purchase Order
                    </Button>
                  </Link>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default PurchaseOrders; 