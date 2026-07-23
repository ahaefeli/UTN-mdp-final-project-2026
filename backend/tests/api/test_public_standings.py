import pytest

from tests.factories import make_match


@pytest.mark.django_db
class TestPublicStandingsEndpoint:
    def test_standings_order_and_points(
        self, api_client, enrolled_tournament, stage, team_a, team_b, team_c, court
    ):
        # A beats B 3-0 → A 3pts
        make_match(
            stage,
            team_a,
            team_b,
            court=court,
            status='FINISHED',
            score_summary='3-0',
        )
        # C beats B 3-2 → C 2pts, B +1
        make_match(
            stage,
            team_c,
            team_b,
            court=court,
            status='FINISHED',
            sets_data={
                'sets': [
                    {'local_points': 25, 'visitor_points': 20},
                    {'local_points': 20, 'visitor_points': 25},
                    {'local_points': 25, 'visitor_points': 22},
                    {'local_points': 22, 'visitor_points': 25},
                    {'local_points': 15, 'visitor_points': 12},
                ]
            },
        )
        # A beats C 3-1 → A +3 = 6pts, C 2pts
        make_match(
            stage,
            team_a,
            team_c,
            court=court,
            status='FINISHED',
            score_summary='3-1',
        )

        res = api_client.get(f'/public/torneos/{enrolled_tournament.id}/posiciones/')
        assert res.status_code == 200
        standings = res.json()
        assert isinstance(standings, list)
        assert standings[0]['team_name'] == 'Equipo A'
        assert standings[0]['puntos'] == 6
        assert standings[0]['pg'] == 2
        assert standings[1]['team_name'] == 'Equipo C'
        assert standings[1]['puntos'] == 2
        assert standings[2]['team_name'] == 'Equipo B'
        assert standings[2]['puntos'] == 1

    def test_empty_tournament_lists_enrolled_zeros(self, api_client, enrolled_tournament):
        res = api_client.get(f'/public/torneos/{enrolled_tournament.id}/posiciones/')
        assert res.status_code == 200
        standings = res.json()
        assert len(standings) == 3
        assert all(r['puntos'] == 0 for r in standings)

    def test_no_auth_required(self, api_client, enrolled_tournament):
        res = api_client.get(f'/public/torneos/{enrolled_tournament.id}/posiciones/')
        assert res.status_code == 200
