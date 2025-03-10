import os
import json
from datetime import timedelta
from io import BytesIO
from django.http import HttpResponse
from django.conf import settings
from django.contrib.auth.models import User
from django.utils import timezone
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.lib import colors
from .models import Vendor, SavedVendor, LineItem, SavedLineItem, PurchaseOrder
from .serializers import (
    UserSerializer, VendorSerializer, SavedVendorSerializer,
    LineItemSerializer, SavedLineItemSerializer, PurchaseOrderSerializer
)

class UserViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint that allows users to be viewed.
    """
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    @action(detail=False, methods=['get', 'patch'])
    def me(self, request):
        """
        Get or update the current user's information
        """
        user = request.user
        
        if request.method == 'PATCH':
            # Only allow updating specific fields
            allowed_fields = ['first_name', 'last_name', 'email']
            data = {k: v for k, v in request.data.items() if k in allowed_fields}
            
            serializer = self.get_serializer(user, data=data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        serializer = self.get_serializer(user)
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
        p.setTitle(f"Purchase Order - {purchase_order.po_number}")
        
        # Add company logo - using PIL approach that worked temporarily
        try:
            # Import required libraries
            from PIL import Image
            import tempfile
            
            # Define the logo path
            logo_path = '/Users/shaun/Documents/GitHub/projects/PO-generator/backend/static/images/cit-logo.png'
            
            # Check if the file exists
            if os.path.exists(logo_path):
                print(f"Logo file exists at: {logo_path}")
                
                # Open the image with PIL
                img = Image.open(logo_path)
                print(f"Image opened: format={img.format}, size={img.size}, mode={img.mode}")
                
                # Convert to RGB if needed
                if img.mode != 'RGB':
                    img = img.convert('RGB')
                    print("Converted image to RGB mode")
                
                # Create a temporary file
                with tempfile.NamedTemporaryFile(suffix='.png', delete=False) as temp_file:
                    temp_path = temp_file.name
                    print(f"Created temporary file: {temp_path}")
                
                # Save the image to the temporary file
                img.save(temp_path, format='PNG')
                print(f"Saved image to temporary file")
                
                # Get the original image dimensions
                img_width, img_height = img.size
                aspect_ratio = img_width / img_height
                print(f"Original image dimensions: {img_width}x{img_height}, aspect ratio: {aspect_ratio}")
                
                # Calculate new dimensions that maintain the aspect ratio
                target_height = 1*inch
                target_width = target_height * aspect_ratio
                print(f"Target dimensions: {target_width}x{target_height}")
                
                # Add the image to the PDF - now in the top left with proper aspect ratio
                p.drawInlineImage(temp_path, 0.3*inch, height - 1*inch, width=target_width*0.7, height=target_height*0.7)
                print("Added logo to PDF using drawInlineImage with calculated dimensions")
                
                # Clean up the temporary file
                os.unlink(temp_path)
                print("Removed temporary file")
            else:
                print(f"Logo file does not exist at: {logo_path}")
        except Exception as e:
            print(f"Error adding logo to PDF: {str(e)}")
            import traceback
            traceback.print_exc()
        
        # Add header - moved further to the right
        p.setFont("Helvetica-Bold", 18)
        p.drawString(width - 2.7*inch, height - 0.5*inch, "PURCHASE ORDER")
        
        # Add PO number on a separate line below the title
        p.setFont("Helvetica-Bold", 14)
        p.drawString(width - 2.3*inch, height - 0.8*inch, f"PO #{purchase_order.po_number}")
        
        # Add date in the top right corner below the PO number
        p.setFont("Helvetica", 12)
        date_text = f"Date: {purchase_order.date.strftime('%B %d, %Y')}"
        p.drawString(width - 2.3*inch, height - 1.1*inch, date_text)
        
        # Add company information - now below the logo
        p.setFont("Helvetica", 10)
        p.drawString(1*inch, height - 1.7*inch, "Chem Is Try Inc")
        p.drawString(1*inch, height - 1.9*inch, "160-4 Liberty Street")
        p.drawString(1*inch, height - 2.1*inch, "Metuchen, NJ 08840")
        p.drawString(1*inch, height - 2.3*inch, "Phone: 732-372-7311")
        p.drawString(1*inch, height - 2.5*inch, "Email: info@chem-is-try.com")
        p.drawString(1*inch, height - 2.7*inch, "Website: www.chem-is-try.com")
        
        # Add vendor information
        p.setFont("Helvetica-Bold", 12)
        p.drawString(1*inch, height - 3.1*inch, "Vendor:")
        p.setFont("Helvetica", 10)
        p.drawString(1*inch, height - 3.3*inch, purchase_order.vendor.name)
        p.drawString(1*inch, height - 3.5*inch, purchase_order.vendor.address)
        p.drawString(1*inch, height - 3.7*inch, f"{purchase_order.vendor.city}, {purchase_order.vendor.state} {purchase_order.vendor.zip_code}")
        p.drawString(1*inch, height - 3.9*inch, purchase_order.vendor.country)
        
        # Add shipping information
        p.setFont("Helvetica-Bold", 12)
        p.drawString(5*inch, height - 3.1*inch, "Ship To:")
        p.setFont("Helvetica", 10)
        p.drawString(5*inch, height - 3.3*inch, "Chem Is Try Inc")
        p.drawString(5*inch, height - 3.5*inch, "160-4 Liberty Street")
        p.drawString(5*inch, height - 3.7*inch, "Metuchen, NJ 08840 US")
        
        # Add payment terms
        p.setFont("Helvetica-Bold", 12)
        p.drawString(1*inch, height - 4.3*inch, "Payment Terms:")
        p.setFont("Helvetica", 10)
        payment_terms = f"Net {purchase_order.payment_days} days"
        if purchase_order.payment_terms:
            payment_terms += f" - {purchase_order.payment_terms}"
        p.drawString(1*inch, height - 4.5*inch, payment_terms)
        
        # Add line items table
        p.setFont("Helvetica-Bold", 12)
        p.drawString(1*inch, height - 4.9*inch, "Line Items:")
        
        # Table headers
        p.setFont("Helvetica-Bold", 10)
        p.drawString(1*inch, height - 5.2*inch, "Qty")
        p.drawString(1.5*inch, height - 5.2*inch, "Description")
        p.drawString(5*inch, height - 5.2*inch, "Rate")
        p.drawString(6*inch, height - 5.2*inch, "Amount")
        
        # Draw a line under the headers
        p.line(1*inch, height - 5.3*inch, 7*inch, height - 5.3*inch)
        
        # Add line items
        y_position = height - 5.6*inch
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
        
        # Create a section for signatures and stamps
        signature_y_position = y_position - 1.5*inch
        
        # Add "Generated by" first
        p.setFont("Helvetica", 10)
        p.drawString(1*inch, signature_y_position, f"Generated by: {purchase_order.user.get_full_name()}")
        
        # Add "Authorized Signature" line below
        signature_y_position -= 0.4*inch
        p.line(1*inch, signature_y_position, 3*inch, signature_y_position)
        p.drawString(1*inch, signature_y_position - 0.2*inch, "Authorized Signature")
        
        if purchase_order.signature:
            # Position the signature directly below the "Authorized Signature" text
            # Move it down to be below the "Authorized Signature" text
            signature_y_position -= 0.5*inch
            p.drawImage(purchase_order.signature.path, 1*inch, signature_y_position - 1*inch, width=2*inch, preserveAspectRatio=True)
        
        # Calculate stamp positions for better geometric placement
        # Position stamps to the right of the signature section with some spacing
        stamp_x_position = 4.5*inch + 0.7*inch
        stamp_y_position = signature_y_position + 0.5*inch
        stamp_width = 1.8*inch
        
        # Add both stamps to the right of the signature section
        # First, add the original stamp with 75% opacity (increased from 50%)
        original_stamp_path = os.path.join(settings.BASE_DIR, 'static', 'images', 'stamp-original.png')
        if os.path.exists(original_stamp_path):
            # Save the current graphics state
            p.saveState()
            # Set transparency for the original stamp (75% opacity)
            p.setFillAlpha(0.95)
            p.setStrokeAlpha(0.95)
            # Position the original stamp at the top right
            p.drawImage(original_stamp_path, stamp_x_position, stamp_y_position - 0.3*inch, width=stamp_width, preserveAspectRatio=True)
            # Restore the graphics state
            p.restoreState()
        else:
            print(f"Original stamp not found at: {original_stamp_path}")
        
        # Then, add the CIT stamp below the original stamp with 80% opacity
        cit_stamp_path = os.path.join(settings.BASE_DIR, 'static', 'images', 'stamp-cit.png')
        if os.path.exists(cit_stamp_path):
            # Save the current graphics state
            p.saveState()
            # Set transparency for the CIT stamp (80% opacity)
            p.setFillAlpha(0.8)
            p.setStrokeAlpha(0.8)
            # Position the CIT stamp below the original stamp with some overlap
            p.drawImage(cit_stamp_path, stamp_x_position, stamp_y_position - 1.2*inch, width=stamp_width, preserveAspectRatio=True)
            # Restore the graphics state
            p.restoreState()
        else:
            print(f"CIT stamp not found at: {cit_stamp_path}")
        
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