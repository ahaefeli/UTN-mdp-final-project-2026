from django.urls import path, include
from core.auth import LoginView
from internal.views.club_requests import GenerateLinkView, ClubRequestListView, ReviewClubRequestView, ClubRequestDetailView
from internal.views.public_registration import PublicClubRegistrationView

urlpatterns = [
    path('auth/login/', LoginView.as_view(), name='login'),
    path('internal/', include('internal.urls')),
    path('admin/club-requests/generate-link/', GenerateLinkView.as_view(), name='generate_link'),
    path('admin/club-requests/', ClubRequestListView.as_view(), name='club_requests_list'),
    path('admin/club-requests/<uuid:pk>/', ClubRequestDetailView.as_view(), name='club_request_detail'),
    path('admin/club-requests/<uuid:pk>/review/', ReviewClubRequestView.as_view(), name='review_club_request'),
    path('public/club-registration/', PublicClubRegistrationView.as_view(), name='public_club_registration'),
]
