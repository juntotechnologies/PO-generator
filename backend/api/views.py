from django.contrib.auth.models import User
from django.http import HttpResponse
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Vendor, SavedVendor, LineItem, SavedLineItem, PurchaseOrder
from .serializers import (
    UserSerializer, VendorSerializer, SavedVendorSerializer,
    LineItemSerializer, SavedLineItemSerializer, PurchaseOrderSerializer
)
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.lib import colors
from io import BytesIO
from django.conf import settings
import os
import json

class UserViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint that allows users to be viewed.
    """
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    @action(detail=False, methods=['get'])
    def me(self, request):
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)

class VendorViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows vendors to be viewed or edited.
    """
    queryset = Vendor.objects.all()
    serializer_class = VendorSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def create(self, request, *args, **kwargs):
        """Override create method to add better error handling"""
        print(f"Creating vendor with data: {request.data}")
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            print(f"Validation errors: {serializer.errors}")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
    
    def update(self, request, *args, **kwargs):
        """Override update method to add better error handling"""
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        print(f"Updating vendor {instance.id} with data: {request.data}")
        
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        if not serializer.is_valid():
            print(f"Validation errors: {serializer.errors}")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
        self.perform_update(serializer)
        return Response(serializer.data)

class SavedVendorViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows saved vendor templates to be viewed or edited.
    """
    serializer_class = SavedVendorSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return SavedVendor.objects.filter(user=self.request.user)

class LineItemViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows line items to be viewed or edited.
    """
    queryset = LineItem.objects.all()
    serializer_class = LineItemSerializer
    permission_classes = [permissions.IsAuthenticated]

class SavedLineItemViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows saved line item templates to be viewed or edited.
    """
    serializer_class = SavedLineItemSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return SavedLineItem.objects.filter(user=self.request.user)

class PurchaseOrderViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows purchase orders to be viewed or edited.
    """
    serializer_class = PurchaseOrderSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return PurchaseOrder.objects.filter(user=self.request.user)
    
    def create(self, request, *args, **kwargs):
        """Override create method to add better error handling"""
        print(f"Creating purchase order with data keys: {request.data.keys()}")
        
        # Check if signature is provided
        if 'signature' not in request.data or not request.data['signature']:
            print("No signature provided in request data")
            return Response(
                {"signature": ["Signature is required."]}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Handle line_item_ids from form data
        data = request.data.copy()
        if 'line_item_ids' in data:
            try:
                line_item_ids = json.loads(data['line_item_ids'])
                print(f"Parsed line_item_ids: {line_item_ids}")
                
                # Validate line item IDs
                if not line_item_ids or not isinstance(line_item_ids, list):
                    return Response(
                        {"line_item_ids": ["Invalid line item IDs format."]},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                # Convert to the format expected by the serializer
                data.pop('line_item_ids')
                for line_item_id in line_item_ids:
                    data.appendlist('line_item_ids', line_item_id)
                
            except json.JSONDecodeError as e:
                print(f"Error parsing line_item_ids: {e}")
                return Response(
                    {"line_item_ids": ["Invalid JSON format."]},
                    status=status.HTTP_400_BAD_REQUEST
                )
        else:
            print("No line_item_ids provided in request data")
            return Response(
                {"line_item_ids": ["At least one line item is required."]},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        serializer = self.get_serializer(data=data)
        if not serializer.is_valid():
            print(f"Validation errors: {serializer.errors}")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
    
    def update(self, request, *args, **kwargs):
        """Override update method to add better error handling"""
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        print(f"Updating purchase order {instance.id} with data keys: {request.data.keys()}")
        
        # Check if signature is provided
        if 'signature' not in request.data or not request.data['signature']:
            print("No signature provided in request data")
            return Response(
                {"signature": ["Signature is required."]}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Handle line_item_ids from form data
        data = request.data.copy()
        if 'line_item_ids' in data:
            try:
                line_item_ids = json.loads(data['line_item_ids'])
                print(f"Parsed line_item_ids: {line_item_ids}")
                
                # Validate line item IDs
                if not line_item_ids or not isinstance(line_item_ids, list):
                    return Response(
                        {"line_item_ids": ["Invalid line item IDs format."]},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                # Convert to the format expected by the serializer
                data.pop('line_item_ids')
                for line_item_id in line_item_ids:
                    data.appendlist('line_item_ids', line_item_id)
                
            except json.JSONDecodeError as e:
                print(f"Error parsing line_item_ids: {e}")
                return Response(
                    {"line_item_ids": ["Invalid JSON format."]},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
        serializer = self.get_serializer(instance, data=data, partial=partial)
        if not serializer.is_valid():
            print(f"Validation errors: {serializer.errors}")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
        self.perform_update(serializer)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def pdf(self, request, pk=None):
        """
        Generate a PDF for the purchase order
        """
        purchase_order = self.get_object()
        
        # Create a file-like buffer to receive PDF data
        buffer = BytesIO()
        
        # Create the PDF object, using the buffer as its "file"
        p = canvas.Canvas(buffer, pagesize=letter)
        width, height = letter
        
        # Set up the document
        p.setTitle(f"Purchase Order #{purchase_order.po_number}")
        
        # Add company logo - try multiple paths to find the logo
        logo_paths = [
            os.path.join(settings.BASE_DIR, 'static', 'images', 'cit-logo.png'),
            os.path.abspath(os.path.join(settings.BASE_DIR, '..', 'static', 'images', 'cit-logo.png')),
            os.path.join(settings.STATIC_ROOT, 'images', 'cit-logo.png') if hasattr(settings, 'STATIC_ROOT') else None,
            os.path.join(os.path.dirname(settings.BASE_DIR), 'backend', 'static', 'images', 'cit-logo.png'),
            '/Users/shaun/Documents/GitHub/projects/PO-generator/backend/static/images/cit-logo.png'  # Direct path as a fallback
        ]
        
        logo_found = False
        for path in logo_paths:
            if path and os.path.exists(path):
                try:
                    print(f"Found logo at: {path}")
                    p.drawImage(path, width - 2.5*inch, height - 1.2*inch, width=2*inch, preserveAspectRatio=True)
                    logo_found = True
                    break
                except Exception as e:
                    print(f"Error drawing logo from {path}: {str(e)}")
        
        if not logo_found:
            print("Logo not found in any of the attempted paths")
            for path in logo_paths:
                if path:
                    print(f"Attempted path: {path}, exists: {os.path.exists(path)}")
        
        # Add header
        p.setFont("Helvetica-Bold", 18)
        p.drawString(1*inch, height - 1*inch, f"PURCHASE ORDER #{purchase_order.po_number}")
        
        # Add date
        p.setFont("Helvetica", 12)
        p.drawString(1*inch, height - 1.3*inch, f"Date: {purchase_order.date.strftime('%B %d, %Y')}")
        
        # Add company information
        p.setFont("Helvetica", 10)
        p.drawString(1*inch, height - 1.6*inch, "Chem Is Try Inc")
        p.drawString(1*inch, height - 1.8*inch, "160-4 Liberty Street")
        p.drawString(1*inch, height - 2.0*inch, "Metuchen, NJ 08840")
        p.drawString(1*inch, height - 2.2*inch, "Phone: 732-372-7311")
        p.drawString(1*inch, height - 2.4*inch, "Email: info@chem-is-try.com")
        p.drawString(1*inch, height - 2.6*inch, "Website: www.chem-is-try.com")
        
        # Add vendor information
        p.setFont("Helvetica-Bold", 12)
        p.drawString(1*inch, height - 3.0*inch, "Vendor:")
        p.setFont("Helvetica", 10)
        p.drawString(1*inch, height - 3.2*inch, purchase_order.vendor.name)
        p.drawString(1*inch, height - 3.4*inch, purchase_order.vendor.address)
        p.drawString(1*inch, height - 3.6*inch, f"{purchase_order.vendor.city}, {purchase_order.vendor.state} {purchase_order.vendor.zip_code}")
        p.drawString(1*inch, height - 3.8*inch, purchase_order.vendor.country)
        
        # Add shipping information
        p.setFont("Helvetica-Bold", 12)
        p.drawString(5*inch, height - 3.0*inch, "Ship To:")
        p.setFont("Helvetica", 10)
        p.drawString(5*inch, height - 3.2*inch, "Chem Is Try Inc")
        p.drawString(5*inch, height - 3.4*inch, "160-4 Liberty Street")
        p.drawString(5*inch, height - 3.6*inch, "Metuchen, NJ 08840 US")
        
        # Add payment terms
        p.setFont("Helvetica-Bold", 12)
        p.drawString(1*inch, height - 4.2*inch, "Payment Terms:")
        p.setFont("Helvetica", 10)
        payment_terms = f"Net {purchase_order.payment_days} days"
        if purchase_order.payment_terms:
            payment_terms += f" - {purchase_order.payment_terms}"
        p.drawString(1*inch, height - 4.4*inch, payment_terms)
        
        # Add line items table
        p.setFont("Helvetica-Bold", 12)
        p.drawString(1*inch, height - 4.8*inch, "Line Items:")
        
        # Table headers
        p.setFont("Helvetica-Bold", 10)
        p.drawString(1*inch, height - 5.1*inch, "Qty")
        p.drawString(1.5*inch, height - 5.1*inch, "Description")
        p.drawString(5*inch, height - 5.1*inch, "Rate")
        p.drawString(6*inch, height - 5.1*inch, "Amount")
        
        # Draw a line under the headers
        p.line(1*inch, height - 5.2*inch, 7*inch, height - 5.2*inch)
        
        # Add line items
        y_position = height - 5.5*inch
        p.setFont("Helvetica", 10)
        
        for item in purchase_order.line_items.all():
            p.drawString(1*inch, y_position, str(item.quantity))
            
            # Handle multi-line descriptions
            description_lines = [item.description[i:i+50] for i in range(0, len(item.description), 50)]
            for i, line in enumerate(description_lines):
                p.drawString(1.5*inch, y_position - i*0.2*inch, line)
            
            p.drawString(5*inch, y_position, f"${item.rate:.2f}")
            p.drawString(6*inch, y_position, f"${item.amount:.2f}")
            
            # Move down for the next item, accounting for multi-line descriptions
            y_position -= (0.2*inch) * (len(description_lines) + 1)
        
        # Draw a line above the total
        p.line(1*inch, y_position - 0.1*inch, 7*inch, y_position - 0.1*inch)
        
        # Add total - explicitly set fill color to ensure no black box
        p.setFillColorRGB(0, 0, 0)  # Set fill color to black (text)
        p.setStrokeColorRGB(1, 1, 1)  # Set stroke color to white (no visible border)
        
        # Reset any drawing state that might cause unwanted artifacts
        p.saveState()
        
        p.setFont("Helvetica-Bold", 12)
        p.drawString(5*inch, y_position - 0.4*inch, "Total:")
        p.drawString(6*inch, y_position - 0.4*inch, f"${purchase_order.total_amount:.2f}")
        
        p.restoreState()
        
        # Add notes if any
        if purchase_order.notes:
            p.setFont("Helvetica-Bold", 12)
            p.drawString(1*inch, y_position - 0.8*inch, "Notes:")
            p.setFont("Helvetica", 10)
            
            # Handle multi-line notes
            notes_lines = [purchase_order.notes[i:i+80] for i in range(0, len(purchase_order.notes), 80)]
            for i, line in enumerate(notes_lines):
                p.drawString(1*inch, y_position - (1 + i*0.2)*inch, line)
            
            y_position -= (1 + len(notes_lines)*0.2)*inch
        
        # Add approval stamp if selected
        if purchase_order.approval_stamp != 'none':
            stamp_filename = f"stamp-{purchase_order.approval_stamp}.png"
            stamp_path = os.path.join(settings.BASE_DIR, 'static', 'images', stamp_filename)
            if os.path.exists(stamp_path):
                # Position the stamp in the bottom right area
                p.drawImage(stamp_path, 5*inch, y_position - 1.5*inch, width=1.5*inch, preserveAspectRatio=True)
            else:
                print(f"Stamp not found at: {stamp_path}")
        
        # Add signature line
        p.line(1*inch, y_position - 2*inch, 3*inch, y_position - 2*inch)
        p.setFont("Helvetica", 10)
        p.drawString(1*inch, y_position - 2.2*inch, "Authorized Signature")
        
        # Add signature image if available
        if purchase_order.signature:
            p.drawImage(purchase_order.signature.path, 1*inch, y_position - 1.9*inch, width=2*inch, preserveAspectRatio=True)
        
        # Add user name
        p.drawString(1*inch, y_position - 2.5*inch, f"Generated by: {purchase_order.user.get_full_name() or purchase_order.user.username}")
        
        # Close the PDF object cleanly
        p.showPage()
        p.save()
        
        # Get the value of the BytesIO buffer and return it
        buffer.seek(0)
        response = HttpResponse(buffer, content_type='application/pdf')
        
        # Check if the request wants to download or view the PDF
        disposition = request.query_params.get('disposition', 'attachment')
        if disposition == 'inline':
            response['Content-Disposition'] = f'inline; filename="PO_{purchase_order.po_number}.pdf"'
        else:
            response['Content-Disposition'] = f'attachment; filename="PO_{purchase_order.po_number}.pdf"'
        
        return response 