from rest_framework.permissions import BasePermission, SAFE_METHODS


def _in_group(user, name: str) -> bool:
    return user and user.is_authenticated and user.groups.filter(name=name).exists()


def is_admin(user) -> bool:
    return user and user.is_authenticated and (user.is_superuser or _in_group(user, "Admin"))


def is_reviewer(user) -> bool:
    return _in_group(user, "Reviewer")


def is_contributor(user) -> bool:
    return _in_group(user, "Contributor")


class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        return is_admin(request.user)


class IsAdminOrReviewer(BasePermission):
    def has_permission(self, request, view):
        return is_admin(request.user) or is_reviewer(request.user)


class IsReviewerOrHigher(BasePermission):
    def has_permission(self, request, view):
        return is_admin(request.user) or is_reviewer(request.user)


class IsContributorOrAdmin(BasePermission):
    def has_permission(self, request, view):
        return is_admin(request.user) or is_contributor(request.user)


class ReadOnly(BasePermission):
    def has_permission(self, request, view):
        return request.method in SAFE_METHODS


class ReadOnlyOrAdminContributor(BasePermission):
    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return request.user.is_authenticated
        return is_admin(request.user) or is_contributor(request.user)
