from datetime import timedelta

import pytest
from django.utils import timezone

from internal.views.matches import validate_match_collisions
from tests.factories import make_match


@pytest.mark.django_db
class TestValidateMatchCollisions:
    def test_none_datetime_returns_none(self, stage, team_a, team_b, court, referee_user):
        assert (
            validate_match_collisions(
                None,
                referee_user.id,
                team_a.id,
                team_b.id,
                court.id,
            )
            is None
        )

    def test_referee_same_datetime(self, stage, team_a, team_b, team_c, court, court_b, referee_user):
        dt = timezone.now() + timedelta(days=1)
        make_match(stage, team_a, team_b, court=court, match_datetime=dt, referee=referee_user)
        err = validate_match_collisions(dt, referee_user.id, team_c.id, team_b.id, court_b.id)
        assert err == 'El árbitro ya tiene un partido asignado con menos de 1 hora de diferencia.'

    def test_local_team_same_datetime_as_visitor(self, stage, team_a, team_b, team_c, court, court_b):
        dt = timezone.now() + timedelta(days=1)
        make_match(stage, team_a, team_b, court=court, match_datetime=dt)
        err = validate_match_collisions(dt, None, team_b.id, team_c.id, court_b.id)
        assert err == 'El equipo local ya tiene otro partido programado con menos de 1 hora de diferencia.'

    def test_visitor_team_same_datetime(self, stage, team_a, team_b, team_c, court, court_b):
        dt = timezone.now() + timedelta(days=1)
        make_match(stage, team_a, team_b, court=court, match_datetime=dt)
        err = validate_match_collisions(dt, None, team_c.id, team_a.id, court_b.id)
        assert err == 'El equipo visitante ya tiene otro partido programado con menos de 1 hora de diferencia.'

    def test_court_within_one_hour_window(self, stage, team_a, team_b, team_c, club_b, court):
        from tests.factories import make_team

        dt = timezone.now() + timedelta(days=1)
        make_match(stage, team_a, team_b, court=court, match_datetime=dt)
        team_d = make_team(club_b, name='Equipo D')
        err = validate_match_collisions(
            dt + timedelta(minutes=30),
            None,
            team_c.id,
            team_d.id,
            court.id,
        )
        assert err == 'La cancha ya tiene un partido asignado con menos de 1 hora de diferencia.'

    def test_court_exactly_one_hour_apart_allowed(self, stage, team_a, team_b, team_c, club_b, court):
        from tests.factories import make_team

        dt = timezone.now() + timedelta(days=1)
        make_match(stage, team_a, team_b, court=court, match_datetime=dt)
        team_d = make_team(club_b, name='Equipo D')
        err = validate_match_collisions(
            dt + timedelta(hours=1),
            None,
            team_c.id,
            team_d.id,
            court.id,
        )
        assert err is None

    def test_finished_match_does_not_block(self, stage, team_a, team_b, team_c, club_b, court, referee_user):
        from tests.factories import make_team

        dt = timezone.now() + timedelta(days=1)
        make_match(
            stage,
            team_a,
            team_b,
            court=court,
            match_datetime=dt,
            referee=referee_user,
            status='FINISHED',
        )
        team_d = make_team(club_b, name='Equipo D')
        err = validate_match_collisions(dt, referee_user.id, team_c.id, team_d.id, court.id)
        assert err is None

    def test_scheduled_and_in_progress_block(self, stage, team_a, team_b, team_c, club_b, court):
        from tests.factories import make_team

        dt = timezone.now() + timedelta(days=1)
        make_match(stage, team_a, team_b, court=court, match_datetime=dt, status='IN_PROGRESS')
        team_d = make_team(club_b, name='Equipo D')
        err = validate_match_collisions(dt, None, team_c.id, team_d.id, court.id)
        assert 'cancha' in err

        make_match(stage, team_a, team_c, court=court, match_datetime=dt + timedelta(days=2), status='SCHEDULED')
        team_e = make_team(club_b, name='Equipo E')
        err2 = validate_match_collisions(
            dt + timedelta(days=2),
            None,
            team_b.id,
            team_e.id,
            court.id,
        )
        assert 'cancha' in err2

    def test_exclude_id_skips_current_match(self, stage, team_a, team_b, court, referee_user):
        dt = timezone.now() + timedelta(days=1)
        m = make_match(
            stage,
            team_a,
            team_b,
            court=court,
            match_datetime=dt,
            referee=referee_user,
        )
        err = validate_match_collisions(
            dt,
            referee_user.id,
            team_a.id,
            team_b.id,
            court.id,
            exclude_id=m.id,
        )
        assert err is None

    def test_optional_referee_and_court_skipped(self, stage, team_a, team_b, team_c, court, referee_user):
        from tests.factories import make_team

        dt = timezone.now() + timedelta(days=1)
        make_match(stage, team_a, team_b, court=court, match_datetime=dt, referee=referee_user)
        team_d = make_team(team_a.club, name='Equipo Libre')
        err = validate_match_collisions(dt, None, team_c.id, team_d.id, None)
        assert err is None

    def test_cancelled_does_not_block(self, stage, team_a, team_b, team_c, club_b, court, referee_user):
        from tests.factories import make_team

        dt = timezone.now() + timedelta(days=1)
        make_match(
            stage,
            team_a,
            team_b,
            court=court,
            match_datetime=dt,
            referee=referee_user,
            status='CANCELLED',
        )
        team_d = make_team(club_b, name='Equipo D')
        err = validate_match_collisions(dt, referee_user.id, team_c.id, team_d.id, court.id)
        assert err is None

    def test_local_team_collides_as_local_again(self, stage, team_a, team_b, team_c, court, court_b):
        dt = timezone.now() + timedelta(days=1)
        make_match(stage, team_a, team_b, court=court, match_datetime=dt, status='PREPARATION')
        err = validate_match_collisions(dt, None, team_a.id, team_c.id, court_b.id)
        assert err == 'El equipo local ya tiene otro partido programado con menos de 1 hora de diferencia.'

    def test_soft_deleted_match_does_not_collide(self, stage, team_a, team_b, team_c, club_b, court, referee_user):
        from tests.factories import make_team

        dt = timezone.now() + timedelta(days=1)
        make_match(
            stage,
            team_a,
            team_b,
            court=court,
            match_datetime=dt,
            referee=referee_user,
            status='PREPARATION',
            is_deleted=True,
        )
        team_d = make_team(club_b, name='Equipo D')
        err = validate_match_collisions(dt, referee_user.id, team_c.id, team_d.id, court.id)
        assert err is None
