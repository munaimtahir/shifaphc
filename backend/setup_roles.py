import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'accredcheck.settings')
django.setup()

from django.contrib.auth.models import Group

def setup_groups():
    groups = ['Admin', 'Contributor', 'Reviewer']
    for group_name in groups:
        Group.objects.get_or_create(name=group_name)
    print("Groups setup complete.")

if __name__ == "__main__":
    setup_groups()
