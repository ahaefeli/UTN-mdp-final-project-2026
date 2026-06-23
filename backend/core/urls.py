from django.urls import path, include
from core.auth import LoginView
from internal.views.club_requests import GenerateLinkView, ClubRequestListView, ReviewClubRequestView, ClubRequestDetailView
from internal.views.public_registration import PublicClubRegistrationView

urlpatterns = [
    path('api/auth/login/', LoginView.as_view(), name='login'),
    path('api/internal/', include('internal.urls')),
    path('api/admin/club-requests/generate-link/', GenerateLinkView.as_view(), name='generate_link'),
    path('api/admin/club-requests/', ClubRequestListView.as_view(), name='club_requests_list'),
    path('api/admin/club-requests/<uuid:pk>/', ClubRequestDetailView.as_view(), name='club_request_detail'),
    path('api/admin/club-requests/<uuid:pk>/review/', ReviewClubRequestView.as_view(), name='review_club_request'),
    path('api/public/club-registration/', PublicClubRegistrationView.as_view(), name='public_club_registration'),
]
