import json
from django.core.serializers.json import DjangoJSONEncoder
from .models import AuditLog

def log_audit(actor, action, entity_type, entity_id=None, summary="", before=None, after=None, metadata=None, request=None):
    ip_address = None
    user_agent = None
    if request:
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip_address = x_forwarded_for.split(',')[0]
        else:
            ip_address = request.META.get('REMOTE_ADDR')
        user_agent = request.META.get('HTTP_USER_AGENT')

    def sanitize(obj):
        if obj is None: return None
        try:
            return json.loads(json.dumps(obj, cls=DjangoJSONEncoder))
        except Exception:
            return str(obj)

    return AuditLog.objects.create(
        actor=actor,
        action=action,
        entity_type=entity_type,
        entity_id=str(entity_id) if entity_id else None,
        summary=summary,
        before_snapshot=sanitize(before),
        after_snapshot=sanitize(after),
        metadata=sanitize(metadata),
        ip_address=ip_address,
        user_agent=user_agent
    )
