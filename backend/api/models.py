from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
import uuid
from datetime import datetime

class Vendor(models.Model):
    """Model for storing vendor information"""
    name = models.CharField(max_length=255)
    address = models.CharField(max_length=255)
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=100)
    zip_code = models.CharField(max_length=20)
    country = models.CharField(max_length=100)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return self.name

class SavedVendor(models.Model):
    """Model for storing vendor templates"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='saved_vendors')
    vendor = models.ForeignKey(Vendor, on_delete=models.CASCADE)
    name = models.CharField(max_length=255, help_text="Template name for this saved vendor")
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.name} - {self.vendor.name}"

class LineItem(models.Model):
    """Model for storing line items in purchase orders"""
    quantity = models.DecimalField(max_digits=10, decimal_places=2)
    description = models.TextField()
    rate = models.DecimalField(max_digits=10, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    @property
    def amount(self):
        """Calculate the total amount for this line item"""
        return self.quantity * self.rate
    
    def __str__(self):
        return f"{self.description} ({self.quantity} x ${self.rate})"

class SavedLineItem(models.Model):
    """Model for storing line item templates"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='saved_line_items')
    line_item = models.ForeignKey(LineItem, on_delete=models.CASCADE)
    name = models.CharField(max_length=255, help_text="Template name for this saved line item")
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.name} - {self.line_item.description}"

class PurchaseOrder(models.Model):
    """Model for storing purchase orders"""
    APPROVAL_STAMP_CHOICES = [
        ('original', 'Original Stamp'),
        ('cit', 'CIT Stamp'),
        ('none', 'No Stamp'),
    ]
    
    po_number = models.CharField(max_length=50, unique=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='purchase_orders')
    vendor = models.ForeignKey(Vendor, on_delete=models.CASCADE)
    date = models.DateField(default=timezone.now)
    payment_terms = models.CharField(max_length=255, blank=True)
    payment_days = models.PositiveIntegerField(default=30)
    line_items = models.ManyToManyField(LineItem, related_name='purchase_orders')
    notes = models.TextField(blank=True)
    approval_stamp = models.CharField(max_length=20, choices=APPROVAL_STAMP_CHOICES, default='none')
    signature = models.ImageField(upload_to='signatures/', blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    @property
    def total_amount(self):
        """Calculate the total amount for this purchase order"""
        return sum(item.amount for item in self.line_items.all())
    
    def save(self, *args, **kwargs):
        """Override save method to generate PO number if not provided"""
        if not self.po_number:
            # Generate PO number in format CITMMDDYY-[PO number of the day]
            today = timezone.now().date()
            date_part = today.strftime('%m%d%y')
            
            # Find the highest PO number for today
            today_pos = PurchaseOrder.objects.filter(
                created_at__year=today.year,
                created_at__month=today.month,
                created_at__day=today.day
            ).order_by('-po_number')
            
            # Get the highest number or start with 1
            if today_pos.exists():
                # Extract the number after the dash
                last_po = today_pos.first()
                try:
                    last_number = int(last_po.po_number.split('-')[-1])
                    new_number = last_number + 1
                except (ValueError, IndexError):
                    new_number = 1
            else:
                new_number = 1
                
            self.po_number = f"CIT{date_part}-{new_number}"
        
        # Always update the date to the current date
        self.date = timezone.now().date()
        
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"PO #{self.po_number} - {self.vendor.name}" 