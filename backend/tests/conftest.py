import pytest
from django.test import Client

from tests.factories import (
    auth_header_for,
    make_club,
    make_court,
    make_enrollment,
    make_match,
    make_organization,
    make_stage,
    make_team,
    make_tournament,
    make_user,
)


@pytest.fixture
def api_client():
    return Client()


@pytest.fixture
def organization(db):
    return make_organization()


@pytest.fixture
def other_organization(db):
    return make_organization(name='Otra Liga')


@pytest.fixture
def admin_user(organization):
    return make_user(organization=organization, role='ADMIN', email='admin@test.com', username='admin_test')


@pytest.fixture
def referee_user(organization):
    return make_user(organization=organization, role='REFEREE', email='ref@test.com', username='ref_test')


@pytest.fixture
def scorer_user(organization):
    return make_user(organization=organization, role='SCORER', email='scorer@test.com', username='scorer_test')


@pytest.fixture
def club(organization):
    return make_club(organization, name='Club Alpha')


@pytest.fixture
def club_b(organization):
    return make_club(organization, name='Club Beta')


@pytest.fixture
def player_user(organization, club):
    return make_user(
        organization=organization,
        role='PLAYER',
        email='player@test.com',
        username='player_test',
        club=club,
        gender='M',
    )


@pytest.fixture
def coach_user(organization, club):
    return make_user(
        organization=organization,
        role='COACH',
        email='coach@test.com',
        username='coach_test',
        club=club,
    )


@pytest.fixture
def club_admin_user(organization, club):
    return make_user(
        organization=organization,
        role='CLUB_ADMIN',
        email='clubadmin@test.com',
        username='clubadmin_test',
        club=club,
    )


@pytest.fixture
def court(club):
    return make_court(club, name='Cancha Central')


@pytest.fixture
def court_b(club_b):
    return make_court(club_b, name='Cancha Visitante')


@pytest.fixture
def team_a(club, coach_user):
    return make_team(club, name='Equipo A', category='PRIMERA', branch='MALE', coach=coach_user)


@pytest.fixture
def team_b(club_b):
    return make_team(club_b, name='Equipo B', category='PRIMERA', branch='MALE')


@pytest.fixture
def team_c(club):
    return make_team(club, name='Equipo C', category='PRIMERA', branch='MALE')


@pytest.fixture
def tournament(organization):
    return make_tournament(organization)


@pytest.fixture
def stage(tournament):
    return make_stage(tournament)


@pytest.fixture
def enrolled_tournament(tournament, team_a, team_b, team_c):
    make_enrollment(tournament, team_a)
    make_enrollment(tournament, team_b)
    make_enrollment(tournament, team_c)
    return tournament


@pytest.fixture
def match_prep(stage, team_a, team_b, court, referee_user, scorer_user):
    return make_match(
        stage,
        team_a,
        team_b,
        court=court,
        referee=referee_user,
        scorer=scorer_user,
        status='PREPARATION',
    )


@pytest.fixture
def auth_header(admin_user):
    return auth_header_for(admin_user)


@pytest.fixture
def referee_auth_header(referee_user):
    return auth_header_for(referee_user)


@pytest.fixture
def scorer_auth_header(scorer_user):
    return auth_header_for(scorer_user)


@pytest.fixture
def club_admin_auth_header(club_admin_user):
    return auth_header_for(club_admin_user)


@pytest.fixture
def coach_auth_header(coach_user):
    return auth_header_for(coach_user)


@pytest.fixture
def player_auth_header(player_user):
    return auth_header_for(player_user)
