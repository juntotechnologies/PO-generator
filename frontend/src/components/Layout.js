import React, { useContext } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Nav, Button } from 'react-bootstrap';
import { FaFileAlt, FaBuilding, FaList, FaSignOutAlt, FaTachometerAlt } from 'react-icons/fa';
import { AuthContext } from '../context/AuthContext';

const Layout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useContext(AuthContext);

  const isActive = (path) => {
    return location.pathname === path ? 'active' : '';
  };

  return (
    <Container fluid className="p-0">
      <Row className="g-0">
        {/* Sidebar */}
        <Col md={2} className="sidebar p-0">
          <div className="d-flex flex-column p-3 text-white h-100">
            <div className="d-flex align-items-center mb-3 mb-md-0 me-md-auto">
              <span className="fs-4">PO Generator</span>
            </div>
            <hr />
            <Nav className="flex-column mb-auto">
              <Nav.Item>
                <Link to="/" className={`nav-link text-white ${isActive('/')}`}>
                  <FaTachometerAlt className="me-2" />
                  Dashboard
                </Link>
              </Nav.Item>
              <Nav.Item>
                <Link to="/purchase-orders" className={`nav-link text-white ${isActive('/purchase-orders')}`}>
                  <FaFileAlt className="me-2" />
                  Purchase Orders
                </Link>
              </Nav.Item>
              <Nav.Item>
                <Link to="/vendors" className={`nav-link text-white ${isActive('/vendors')}`}>
                  <FaBuilding className="me-2" />
                  Vendors
                </Link>
              </Nav.Item>
              <Nav.Item>
                <Link to="/line-items" className={`nav-link text-white ${isActive('/line-items')}`}>
                  <FaList className="me-2" />
                  Line Items
                </Link>
              </Nav.Item>
            </Nav>
            <hr />
            <div className="dropdown">
              <div className="d-flex align-items-center text-white text-decoration-none">
                <strong>{user?.username || 'User'}</strong>
              </div>
              <Button 
                variant="link" 
                className="text-white p-0 mt-2" 
                onClick={logout}
              >
                <FaSignOutAlt className="me-2" />
                Sign out
              </Button>
            </div>
          </div>
        </Col>

        {/* Main content */}
        <Col md={10} className="main-content">
          <Outlet />
        </Col>
      </Row>
    </Container>
  );
};

export default Layout; 