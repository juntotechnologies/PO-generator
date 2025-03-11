import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Button, Card, Container, Alert, Spinner } from 'react-bootstrap';
import { AuthContext } from '../context/AuthContext';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { login, user } = useContext(AuthContext);
  const navigate = useNavigate();
  
  useEffect(() => {
    // If user is already logged in, redirect to dashboard
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!username || !password) {
      setError('Please enter both username and password');
      return;
    }
    
    setIsLoading(true);
    try {
      console.log('Attempting login with:', { username, password: '********' });
      const success = await login(username, password);
      if (!success) {
        setError('Invalid credentials. Please check your username and password.');
        console.error('Login failed with success=false');
      }
    } catch (err) {
      console.error('Login error details:', err);
      setError('An error occurred during login. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container className="auth-container" style={{ maxWidth: '320px', width: '320px' }}>
      <Card className="auth-form" style={{ maxWidth: '320px', width: '100%' }}>
        <Card.Body>
          <h4 className="text-center mb-3 login-title">PO Generator</h4>
          <p className="text-center login-subtitle mb-3">Login</p>
          
          {error && <Alert variant="danger" className="mb-3">{error}</Alert>}
          
          <Form onSubmit={handleSubmit} className="mt-3">
            <Form.Group className="mb-3" controlId="username">
              <Form.Label>Username</Form.Label>
              <Form.Control
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username"
                required
                style={{ fontSize: '14px' }}
              />
            </Form.Group>

            <Form.Group className="mb-4" controlId="password">
              <Form.Label>Password</Form.Label>
              <Form.Control
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                required
                style={{ fontSize: '14px' }}
              />
            </Form.Group>

            <div className="d-flex justify-content-center mt-4">
              <Button 
                variant="primary" 
                type="submit" 
                className="px-4" 
                disabled={isLoading}
                style={{ fontSize: '14px' }}
              >
                {isLoading ? (
                  <>
                    <Spinner
                      as="span"
                      animation="border"
                      size="sm"
                      role="status"
                      aria-hidden="true"
                      className="me-2"
                    />
                    <span>Login</span>
                  </>
                ) : (
                  'Login'
                )}
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default Login; 