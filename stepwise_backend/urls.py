
from django.contrib import admin
from django.urls import path, include
from rest_framework.authtoken.views import obtain_auth_token
from django.conf import settings # Required for media files in DEBUG mode
from django.conf.urls.static import static # Required for media files in DEBUG mode

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('accounts.urls')),
    path('api/token-auth/', obtain_auth_token, name='api_token_auth'), # Django REST framework token auth
    path('api/', include('content.urls')),
    path('api/', include('notifications.urls')), # Add notifications app URLs
]

# Serve media files during development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
