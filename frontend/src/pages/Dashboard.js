import React, { useState, useEffect, useContext } from 'react';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaFileAlt, FaBuilding, FaList, FaPlus } from 'react-icons/fa';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

const Dashboard = () => {
  const [stats, setStats] = useState({
    purchaseOrders: 0,
    vendors: 0,
    lineItems: 0,
    recentPOs: []
  });
  const [loading, setLoading] = useState(true);
  const { user } = useContext(AuthContext);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch counts
        const [poResponse, vendorResponse, lineItemResponse] = await Promise.all([
          axios.get('/api/purchase-orders/'),
          axios.get('/api/vendors/'),
          axios.get('/api/line-items/')
        ]);

        setStats({
          purchaseOrders: poResponse.data.count || poResponse.data.results.length,
          vendors: vendorResponse.data.count || vendorResponse.data.results.length,
          lineItems: lineItemResponse.data.count || lineItemResponse.data.results.length,
          recentPOs: poResponse.data.results.slice(0, 5) // Get the 5 most recent POs
        });
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <Container>
      <h1 className="my-4">Dashboard</h1>
      <p>Welcome, {user?.first_name || user?.username || 'User'}!</p>

      <Row className="mb-4">
        <Col md={4}>
          <Card className="text-center h-100">
            <Card.Body>
              <FaFileAlt size={40} className="mb-3 text-primary" />
              <Card.Title>Purchase Orders</Card.Title>
              <Card.Text className="display-4">{stats.purchaseOrders}</Card.Text>
              <Link to="/purchase-orders">
                <Button variant="outline-primary">View All</Button>
              </Link>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="text-center h-100">
            <Card.Body>
              <FaBuilding size={40} className="mb-3 text-success" />
              <Card.Title>Vendors</Card.Title>
              <Card.Text className="display-4">{stats.vendors}</Card.Text>
              <Link to="/vendors">
                <Button variant="outline-success">View All</Button>
              </Link>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="text-center h-100">
            <Card.Body>
              <FaList size={40} className="mb-3 text-info" />
              <Card.Title>Line Items</Card.Title>
              <Card.Text className="display-4">{stats.lineItems}</Card.Text>
              <Link to="/line-items">
                <Button variant="outline-info">View All</Button>
              </Link>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="mb-4">
        <Col>
          <Card>
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Recent Purchase Orders</h5>
              <Link to="/purchase-orders/create">
                <Button variant="primary" size="sm">
                  <FaPlus className="me-1" /> New PO
                </Button>
              </Link>
            </Card.Header>
            <Card.Body>
              {loading ? (
                <p>Loading recent purchase orders...</p>
              ) : stats.recentPOs.length > 0 ? (
                <div className="list-group">
                  {stats.recentPOs.map(po => (
                    <Link 
                      key={po.id} 
                      to={`/purchase-orders/${po.id}`} 
                      className="list-group-item list-group-item-action"
                    >
                      <div className="d-flex w-100 justify-content-between">
                        <h5 className="mb-1">PO #{po.po_number}</h5>
                        <small>{new Date(po.date).toLocaleDateString()}</small>
                      </div>
                      <p className="mb-1">Vendor: {po.vendor.name}</p>
                      <small>Total: ${po.total_amount}</small>
                    </Link>
                  ))}
                </div>
              ) : (
                <p>No purchase orders found. Create your first one!</p>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row>
        <Col>
          <Card>
            <Card.Header>
              <h5 className="mb-0">Quick Actions</h5>
            </Card.Header>
            <Card.Body>
              <div className="d-grid gap-2 d-md-flex">
                <Link to="/purchase-orders/create">
                  <Button variant="primary">
                    <FaPlus className="me-1" /> Create Purchase Order
                  </Button>
                </Link>
                <Link to="/vendors">
                  <Button variant="success">
                    <FaPlus className="me-1" /> Add Vendor
                  </Button>
                </Link>
                <Link to="/line-items">
                  <Button variant="info">
                    <FaPlus className="me-1" /> Add Line Item
                  </Button>
                </Link>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Dashboard; 