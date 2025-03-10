from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from django.db import IntegrityError


class Command(BaseCommand):
    help = 'Creates a new user for the PO Generator application'

    def add_arguments(self, parser):
        parser.add_argument('username', type=str, help='Username for the new user')
        parser.add_argument('password', type=str, help='Password for the new user')
        parser.add_argument('--email', type=str, help='Email address for the new user')
        parser.add_argument('--first_name', type=str, help='First name for the new user')
        parser.add_argument('--last_name', type=str, help='Last name for the new user')
        parser.add_argument('--is_staff', action='store_true', help='Set user as staff member')
        parser.add_argument('--is_superuser', action='store_true', help='Set user as superuser')

    def handle(self, *args, **options):
        username = options['username']
        password = options['password']
        email = options.get('email', '')
        first_name = options.get('first_name', '')
        last_name = options.get('last_name', '')
        is_staff = options.get('is_staff', False)
        is_superuser = options.get('is_superuser', False)

        try:
            user = User.objects.create_user(
                username=username,
                email=email,
                password=password,
                first_name=first_name,
                last_name=last_name,
                is_staff=is_staff,
                is_superuser=is_superuser
            )
            self.stdout.write(self.style.SUCCESS(f'Successfully created user "{username}"'))
            
            # Print additional details
            self.stdout.write(f'User ID: {user.id}')
            self.stdout.write(f'Full Name: {user.get_full_name() or "Not provided"}')
            self.stdout.write(f'Email: {user.email or "Not provided"}')
            self.stdout.write(f'Staff Status: {"Yes" if user.is_staff else "No"}')
            self.stdout.write(f'Superuser Status: {"Yes" if user.is_superuser else "No"}')
            
        except IntegrityError:
            self.stdout.write(self.style.ERROR(f'User "{username}" already exists'))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error creating user: {str(e)}')) 