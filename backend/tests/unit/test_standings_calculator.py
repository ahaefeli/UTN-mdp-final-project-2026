import pytest

from public.utils.standings_calculator import calculate_standings
from tests.factories import make_enrollment, make_match, make_team


def _by_name(standings):
    return {row['team_name']: row for row in standings}


@pytest.mark.django_db
class TestCalculateStandingsPoints:
    def test_3_0_via_sets_data_local_points(self, enrolled_tournament, stage, team_a, team_b):
        make_match(
            stage,
            team_a,
            team_b,
            status='FINISHED',
            sets_data={
                'sets': [
                    {'local_points': 25, 'visitor_points': 20},
                    {'local_points': 25, 'visitor_points': 18},
                    {'local_points': 25, 'visitor_points': 22},
                ]
            },
        )
        rows = _by_name(calculate_standings(enrolled_tournament.id))
        assert rows['Equipo A']['puntos'] == 3
        assert rows['Equipo A']['pg'] == 1
        assert rows['Equipo A']['pp'] == 0
        assert rows['Equipo A']['sets_ganados'] == 3
        assert rows['Equipo A']['sets_perdidos'] == 0
        assert rows['Equipo B']['puntos'] == 0
        assert rows['Equipo B']['pp'] == 1

    def test_3_1_via_local_score_alias(self, enrolled_tournament, stage, team_a, team_b):
        make_match(
            stage,
            team_a,
            team_b,
            status='FINISHED',
            sets_data={
                'sets': [
                    {'local_score': 25, 'visitor_score': 20},
                    {'local_score': 20, 'visitor_score': 25},
                    {'local_score': 25, 'visitor_score': 18},
                    {'local_score': 25, 'visitor_score': 22},
                ]
            },
        )
        rows = _by_name(calculate_standings(enrolled_tournament.id))
        assert rows['Equipo A']['puntos'] == 3
        assert rows['Equipo A']['sets_ganados'] == 3
        assert rows['Equipo A']['sets_perdidos'] == 1
        assert rows['Equipo B']['puntos'] == 0

    def test_3_2_awards_two_and_one(self, enrolled_tournament, stage, team_a, team_b):
        make_match(
            stage,
            team_a,
            team_b,
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
        rows = _by_name(calculate_standings(enrolled_tournament.id))
        assert rows['Equipo A']['puntos'] == 2
        assert rows['Equipo B']['puntos'] == 1

    def test_visitor_wins_3_0(self, enrolled_tournament, stage, team_a, team_b):
        make_match(
            stage,
            team_a,
            team_b,
            status='FINISHED',
            sets_data={
                'sets': [
                    {'local_points': 20, 'visitor_points': 25},
                    {'local_points': 18, 'visitor_points': 25},
                    {'local_points': 22, 'visitor_points': 25},
                ]
            },
        )
        rows = _by_name(calculate_standings(enrolled_tournament.id))
        assert rows['Equipo B']['puntos'] == 3
        assert rows['Equipo B']['pg'] == 1
        assert rows['Equipo A']['puntos'] == 0
        assert rows['Equipo A']['pp'] == 1

    def test_visitor_wins_3_2(self, enrolled_tournament, stage, team_a, team_b):
        make_match(
            stage,
            team_a,
            team_b,
            status='FINISHED',
            sets_data={
                'sets': [
                    {'local_points': 25, 'visitor_points': 20},
                    {'local_points': 20, 'visitor_points': 25},
                    {'local_points': 25, 'visitor_points': 22},
                    {'local_points': 22, 'visitor_points': 25},
                    {'local_points': 12, 'visitor_points': 15},
                ]
            },
        )
        rows = _by_name(calculate_standings(enrolled_tournament.id))
        assert rows['Equipo B']['puntos'] == 2
        assert rows['Equipo A']['puntos'] == 1


@pytest.mark.django_db
class TestCalculateStandingsScoreSummaryFallback:
    def test_comma_separated_set_scores(self, enrolled_tournament, stage, team_a, team_b):
        make_match(
            stage,
            team_a,
            team_b,
            status='FINISHED',
            score_summary='25-20, 25-18, 25-22',
        )
        rows = _by_name(calculate_standings(enrolled_tournament.id))
        assert rows['Equipo A']['puntos'] == 3
        assert rows['Equipo A']['sets_ganados'] == 3

    def test_compact_set_count_format(self, enrolled_tournament, stage, team_a, team_b):
        make_match(
            stage,
            team_a,
            team_b,
            status='FINISHED',
            score_summary='3-1',
        )
        rows = _by_name(calculate_standings(enrolled_tournament.id))
        assert rows['Equipo A']['puntos'] == 3
        assert rows['Equipo A']['sets_ganados'] == 3
        assert rows['Equipo A']['sets_perdidos'] == 1
        assert rows['Equipo B']['puntos'] == 0

    def test_sets_data_takes_precedence_over_summary(self, enrolled_tournament, stage, team_a, team_b):
        make_match(
            stage,
            team_a,
            team_b,
            status='FINISHED',
            score_summary='3-0',
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
        rows = _by_name(calculate_standings(enrolled_tournament.id))
        assert rows['Equipo A']['puntos'] == 2
        assert rows['Equipo B']['puntos'] == 1


@pytest.mark.django_db
class TestCalculateStandingsEdgeCases:
    def test_only_finished_matches_count(self, enrolled_tournament, stage, team_a, team_b, team_c):
        make_match(stage, team_a, team_b, status='FINISHED', score_summary='3-0')
        make_match(stage, team_a, team_c, status='PREPARATION', score_summary='3-0')
        make_match(stage, team_b, team_c, status='IN_PROGRESS', score_summary='3-0')
        rows = _by_name(calculate_standings(enrolled_tournament.id))
        assert rows['Equipo A']['pj'] == 1
        assert rows['Equipo B']['pj'] == 1
        assert rows['Equipo C']['pj'] == 0
        assert rows['Equipo C']['puntos'] == 0

    def test_enrolled_teams_without_matches_remain_zero(self, enrolled_tournament):
        rows = _by_name(calculate_standings(enrolled_tournament.id))
        assert set(rows) == {'Equipo A', 'Equipo B', 'Equipo C'}
        for row in rows.values():
            assert row['puntos'] == 0
            assert row['pj'] == 0

    def test_team_in_match_but_not_enrolled_is_added(self, tournament, stage, team_a, team_b, club):
        make_enrollment(tournament, team_a)
        outsider = make_team(club, name='Forastero', category='PRIMERA', branch='MALE')
        make_match(stage, team_a, outsider, status='FINISHED', score_summary='3-0')
        rows = _by_name(calculate_standings(tournament.id))
        assert 'Forastero' in rows
        assert rows['Forastero']['puntos'] == 0
        assert rows['Forastero']['pp'] == 1
        assert rows['Equipo A']['puntos'] == 3

    def test_empty_or_invalid_summary_does_not_award_points(self, enrolled_tournament, stage, team_a, team_b):
        make_match(stage, team_a, team_b, status='FINISHED', score_summary='')
        make_match(stage, team_a, team_b, status='FINISHED', score_summary='invalid')
        rows = _by_name(calculate_standings(enrolled_tournament.id))
        assert rows['Equipo A']['pj'] == 0
        assert rows['Equipo B']['pj'] == 0
        assert rows['Equipo A']['puntos'] == 0
        assert rows['Equipo B']['puntos'] == 0
        assert rows['Equipo A']['pg'] == 0
        assert rows['Equipo B']['pg'] == 0

    def test_sorting_by_points_then_pg_then_set_coeff(self, enrolled_tournament, stage, team_a, team_b, team_c):
        # A: 3 pts, 1 PG, 3-0
        make_match(stage, team_a, team_b, status='FINISHED', score_summary='3-0')
        # C: 3 pts, 1 PG, 3-2 (worse set coeff than A)
        make_match(
            stage,
            team_c,
            team_b,
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
        # B has 1 pt from 3-2 loss to C and 0 from loss to A
        standings = calculate_standings(enrolled_tournament.id)
        names = [r['team_name'] for r in standings]
        assert names[0] == 'Equipo A'
        assert names[1] == 'Equipo C'
        assert names[2] == 'Equipo B'

    def test_perfect_set_coeff_ranks_above_same_points_same_pg(
        self, enrolled_tournament, stage, team_a, team_b, team_c
    ):
        make_match(stage, team_a, team_b, status='FINISHED', score_summary='3-0')  # A: 3pts, coeff inf
        make_match(stage, team_c, team_b, status='FINISHED', score_summary='3-1')  # C: 3pts, coeff 3
        standings = calculate_standings(enrolled_tournament.id)
        assert standings[0]['team_name'] == 'Equipo A'
        assert standings[1]['team_name'] == 'Equipo C'

    def test_compact_visitor_wins(self, enrolled_tournament, stage, team_a, team_b):
        make_match(stage, team_a, team_b, status='FINISHED', score_summary='0-3')
        rows = _by_name(calculate_standings(enrolled_tournament.id))
        assert rows['Equipo B']['puntos'] == 3
        assert rows['Equipo A']['puntos'] == 0

        make_match(stage, team_a, team_b, status='FINISHED', score_summary='1-3')
        rows = _by_name(calculate_standings(enrolled_tournament.id))
        assert rows['Equipo B']['pg'] == 2

    def test_invalid_summary_skipped_no_visitor_win(self, enrolled_tournament, stage, team_a, team_b):
        make_match(stage, team_a, team_b, status='FINISHED', score_summary='')
        rows = _by_name(calculate_standings(enrolled_tournament.id))
        assert rows['Equipo B']['pg'] == 0
        assert rows['Equipo B']['puntos'] == 0
        assert rows['Equipo A']['pp'] == 0
        assert rows['Equipo A']['pj'] == 0

    def test_tied_set_scores_ignored_in_sets_data(self, enrolled_tournament, stage, team_a, team_b):
        make_match(
            stage,
            team_a,
            team_b,
            status='FINISHED',
            sets_data={
                'sets': [
                    {'local_points': 25, 'visitor_points': 25},
                    {'local_points': 25, 'visitor_points': 20},
                    {'local_points': 25, 'visitor_points': 18},
                    {'local_points': 25, 'visitor_points': 22},
                ]
            },
        )
        rows = _by_name(calculate_standings(enrolled_tournament.id))
        assert rows['Equipo A']['sets_ganados'] == 3
        assert rows['Equipo A']['puntos'] == 3

    def test_club_fields_present(self, enrolled_tournament, stage, team_a, team_b):
        make_match(stage, team_a, team_b, status='FINISHED', score_summary='3-0')
        rows = _by_name(calculate_standings(enrolled_tournament.id))
        assert rows['Equipo A']['club_id'] == str(team_a.club_id)
        assert rows['Equipo A']['club_name'] == team_a.club.name
        assert 'club_logo_url' in rows['Equipo A']

    def test_unknown_tournament_returns_empty(self, db):
        import uuid
        assert calculate_standings(uuid.uuid4()) == []
