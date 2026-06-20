from django.urls import path, include
from core.auth import LoginView

urlpatterns = [
    path('api/auth/login/', LoginView.as_view(), name='login'),
    path('api/internal/', include('internal.urls')),
]
