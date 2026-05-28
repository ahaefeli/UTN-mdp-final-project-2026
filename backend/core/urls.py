from django.urls import path, include

urlpatterns = [
    path('api/internal/', include('internal.urls')),
]
