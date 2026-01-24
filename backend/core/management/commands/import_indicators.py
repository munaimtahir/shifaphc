import csv
from django.core.management.base import BaseCommand
from core.models import Indicator

class Command(BaseCommand):
  help = "Import indicators from the PHC CSV"

  def add_arguments(self, parser):
    parser.add_argument("--path", required=True)

  def handle(self, *args, **opts):
    path = opts["path"]
    created = 0
    with open(path, "r", encoding="utf-8") as f:
      reader = csv.DictReader(f)
      for row in reader:
        Indicator.objects.create(
          section=(row.get("Section") or "").strip(),
          standard=(row.get("Standard") or "").strip(),
          indicator_text=(row.get("Indicator") or "").strip(),
          evidence_required_text=(row.get("Evidence Required") or "").strip() or None,
          responsible_person=(row.get("Responsible Person") or "").strip() or None,
        )
        created += 1
    self.stdout.write(self.style.SUCCESS(f"Imported {created} indicators"))
