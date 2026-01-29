from django.contrib.auth.models import User, Group
from django.db import transaction

def create_groups():
    groups = ['Admin', 'Contributor', 'Reviewer']
    for name in groups:
        Group.objects.get_or_create(name=name)
    print("Groups created.")

def create_users():
    users = [
        {'username': 'admin', 'password': 'password123', 'groups': ['Admin'], 'is_staff': True, 'is_superuser': True},
        {'username': 'contrib1', 'password': 'password123', 'groups': ['Contributor']},
        {'username': 'review1', 'password': 'password123', 'groups': ['Reviewer']},
    ]

    for u_data in users:
        u, created = User.objects.get_or_create(username=u_data['username'])
        u.set_password(u_data['password'])
        if u_data.get('is_staff'):
            u.is_staff = True
        if u_data.get('is_superuser'):
            u.is_superuser = True
        u.save()

        for g_name in u_data['groups']:
            g = Group.objects.get(name=g_name)
            u.groups.add(g)

        print(f"User {u.username} created/updated.")

with transaction.atomic():
    create_groups()
    create_users()
