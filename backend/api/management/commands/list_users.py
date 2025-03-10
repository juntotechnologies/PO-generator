from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from django.utils import timezone


class Command(BaseCommand):
    help = 'Lists all users in the PO Generator application'

    def add_arguments(self, parser):
        parser.add_argument('--active', action='store_true', help='Show only active users')
        parser.add_argument('--staff', action='store_true', help='Show only staff users')
        parser.add_argument('--superusers', action='store_true', help='Show only superusers')

    def handle(self, *args, **options):
        users = User.objects.all().order_by('username')
        
        # Apply filters if specified
        if options.get('active'):
            users = users.filter(is_active=True)
        if options.get('staff'):
            users = users.filter(is_staff=True)
        if options.get('superusers'):
            users = users.filter(is_superuser=True)
        
        if not users.exists():
            self.stdout.write(self.style.WARNING('No users found matching the criteria'))
            return
        
        self.stdout.write(self.style.SUCCESS(f'Found {users.count()} users:'))
        self.stdout.write('=' * 80)
        self.stdout.write(f'{"ID":<5} {"Username":<15} {"Full Name":<25} {"Email":<25} {"Staff":<6} {"Super":<6} {"Last Login":<20}')
        self.stdout.write('-' * 80)
        
        for user in users:
            last_login = user.last_login.strftime('%Y-%m-%d %H:%M') if user.last_login else 'Never'
            full_name = user.get_full_name() or '-'
            
            self.stdout.write(
                f'{user.id:<5} {user.username:<15} {full_name:<25} {user.email:<25} '
                f'{"Yes" if user.is_staff else "No":<6} {"Yes" if user.is_superuser else "No":<6} {last_login:<20}'
            )
        
        self.stdout.write('=' * 80) 