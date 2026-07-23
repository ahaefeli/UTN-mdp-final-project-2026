import pytest

from tests.factories import (
    auth_header_for,
    make_match,
    make_registration_request,
    make_user,
)


@pytest.mark.django_db
class TestAdminDashboard:
    def test_counts_org_scoped(
        self,
        api_client,
        auth_header,
        organization,
        other_organization,
        club,
        player_user,
        tournament,
        stage,
        team_a,
        team_b,
        court,
    ):
        make_user(
            organization=organization, role='PLAYER', email='f@t.com', username='fem_p', gender='F', club=club
        )
        make_match(stage, team_a, team_b, court=court, referee=None, status='PREPARATION')
        make_registration_request(
            organization, role='CLUB_ADMIN', club_name='Pendiente', admin_email='p@t.com'
        )
        # noise in other org
        from tests.factories import make_club, make_tournament

        make_club(other_organization, name='Otro')
        make_tournament(other_organization)

        res = api_client.get('/internal/dashboard/admin/', **auth_header)
        assert res.status_code == 200
        body = res.json()
        assert body['total_clubs'] >= 1
        assert body['federated_players']['total'] >= 2
        assert body['federated_players']['femenino'] >= 1
        assert body['active_tournaments'] >= 1
        assert body['matches_without_referee'] >= 1
        assert body['pending_counts']['clubs'] >= 1

    def test_user_without_org_forbidden(self, api_client, db):
        orphan = make_user(organization=None, role='ADMIN', email='dash@t.com', username='dash')
        res = api_client.get('/internal/dashboard/admin/', **auth_header_for(orphan))
        assert res.status_code == 403
