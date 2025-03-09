from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Vendor, SavedVendor, LineItem, SavedLineItem, PurchaseOrder

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name']
        read_only_fields = ['id']

class VendorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Vendor
        fields = '__all__'

class SavedVendorSerializer(serializers.ModelSerializer):
    vendor = VendorSerializer(read_only=True)
    vendor_id = serializers.PrimaryKeyRelatedField(
        queryset=Vendor.objects.all(),
        write_only=True,
        source='vendor'
    )
    
    class Meta:
        model = SavedVendor
        fields = ['id', 'user', 'vendor', 'vendor_id', 'name', 'created_at']
        read_only_fields = ['id', 'user', 'created_at']
    
    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)

class LineItemSerializer(serializers.ModelSerializer):
    amount = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    
    class Meta:
        model = LineItem
        fields = ['id', 'quantity', 'description', 'rate', 'amount', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

class SavedLineItemSerializer(serializers.ModelSerializer):
    line_item = LineItemSerializer(read_only=True)
    line_item_id = serializers.PrimaryKeyRelatedField(
        queryset=LineItem.objects.all(),
        write_only=True,
        source='line_item'
    )
    
    class Meta:
        model = SavedLineItem
        fields = ['id', 'user', 'line_item', 'line_item_id', 'name', 'created_at']
        read_only_fields = ['id', 'user', 'created_at']
    
    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)

class PurchaseOrderSerializer(serializers.ModelSerializer):
    vendor = VendorSerializer(read_only=True)
    vendor_id = serializers.PrimaryKeyRelatedField(
        queryset=Vendor.objects.all(),
        write_only=True,
        source='vendor'
    )
    line_items = LineItemSerializer(many=True, read_only=True)
    line_item_ids = serializers.PrimaryKeyRelatedField(
        queryset=LineItem.objects.all(),
        write_only=True,
        many=True,
        source='line_items',
        required=False
    )
    total_amount = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = PurchaseOrder
        fields = [
            'id', 'po_number', 'user', 'vendor', 'vendor_id', 'date', 
            'payment_terms', 'payment_days', 'line_items', 'line_item_ids',
            'notes', 'approval_stamp', 'signature', 'total_amount',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'po_number', 'user', 'created_at', 'updated_at']
    
    def validate(self, data):
        """
        Validate that at least one line item is provided.
        """
        # For updates, we need to check if line_items are in the data
        if self.instance and 'line_items' not in data:
            # If not updating line items, use existing ones
            return data
            
        # For creates or if updating line items
        line_items = data.get('line_items', [])
        if not line_items:
            raise serializers.ValidationError({"line_items": "At least one line item is required."})
        return data
    
    def create(self, validated_data):
        line_items = validated_data.pop('line_items', [])
        validated_data['user'] = self.context['request'].user
        
        # Print debug information
        print(f"Creating purchase order with validated data: {validated_data}")
        print(f"Line items: {line_items}")
        
        purchase_order = PurchaseOrder.objects.create(**validated_data)
        
        if line_items:
            purchase_order.line_items.set(line_items)
            print(f"Set line items: {purchase_order.line_items.all()}")
        else:
            print("No line items to set")
        
        return purchase_order
    
    def update(self, instance, validated_data):
        line_items = validated_data.pop('line_items', None)
        
        # Print debug information
        print(f"Updating purchase order {instance.id} with validated data: {validated_data}")
        if line_items is not None:
            print(f"Updating line items: {line_items}")
        else:
            print("Not updating line items")
        
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        instance.save()
        
        if line_items is not None:
            instance.line_items.set(line_items)
            print(f"Updated line items: {instance.line_items.all()}")
        
        return instance 