from datetime import timedelta

import pytest
from django.utils import timezone

from core.utils.match_status import evaluate_and_update_match_status
from tests.factories import make_match


@pytest.mark.django_db
class TestEvaluateAndUpdateMatchStatus:
    def test_preparation_past_datetime_free_court_becomes_in_progress(
        self, stage, team_a, team_b, court
    ):
        m = make_match(
            stage,
            team_a,
            team_b,
            court=court,
            match_datetime=timezone.now() - timedelta(minutes=5),
            status='PREPARATION',
        )
        evaluate_and_update_match_status(m)
        m.refresh_from_db()
        assert m.status == 'IN_PROGRESS'

    def test_future_datetime_stays_preparation(self, stage, team_a, team_b, court):
        m = make_match(
            stage,
            team_a,
            team_b,
            court=court,
            match_datetime=timezone.now() + timedelta(hours=2),
            status='PREPARATION',
        )
        evaluate_and_update_match_status(m)
        m.refresh_from_db()
        assert m.status == 'PREPARATION'

    def test_finished_cancelled_suspended_unchanged(self, stage, team_a, team_b, court):
        past = timezone.now() - timedelta(hours=1)
        for status in ('FINISHED', 'CANCELLED', 'SUSPENDED'):
            m = make_match(
                stage,
                team_a,
                team_b,
                court=court,
                match_datetime=past,
                status=status,
            )
            evaluate_and_update_match_status(m)
            m.refresh_from_db()
            assert m.status == status

    def test_blocked_when_other_match_in_progress_on_same_court(
        self, stage, team_a, team_b, team_c, club_b, court
    ):
        from tests.factories import make_team

        team_d = make_team(club_b, name='Equipo D')
        make_match(
            stage,
            team_a,
            team_b,
            court=court,
            match_datetime=timezone.now() - timedelta(hours=2),
            status='IN_PROGRESS',
        )
        m = make_match(
            stage,
            team_c,
            team_d,
            court=court,
            match_datetime=timezone.now() - timedelta(minutes=1),
            status='PREPARATION',
        )
        evaluate_and_update_match_status(m)
        m.refresh_from_db()
        assert m.status == 'PREPARATION'

    def test_no_datetime_stays_preparation(self, stage, team_a, team_b, court):
        m = make_match(stage, team_a, team_b, court=court, match_datetime=None, status='PREPARATION')
        evaluate_and_update_match_status(m)
        m.refresh_from_db()
        assert m.status == 'PREPARATION'

    def test_scheduled_past_auto_advances(self, stage, team_a, team_b, court):
        m = make_match(
            stage,
            team_a,
            team_b,
            court=court,
            match_datetime=timezone.now() - timedelta(minutes=5),
            status='SCHEDULED',
        )
        evaluate_and_update_match_status(m)
        m.refresh_from_db()
        assert m.status == 'IN_PROGRESS'

    def test_already_in_progress_noop(self, stage, team_a, team_b, court):
        m = make_match(
            stage,
            team_a,
            team_b,
            court=court,
            match_datetime=timezone.now() - timedelta(minutes=5),
            status='IN_PROGRESS',
        )
        evaluate_and_update_match_status(m)
        m.refresh_from_db()
        assert m.status == 'IN_PROGRESS'

    def test_null_court_does_not_block_other_null_court(
        self, stage, team_a, team_b, team_c, club_b
    ):
        from tests.factories import make_team

        team_d = make_team(club_b, name='Equipo D')
        make_match(
            stage,
            team_a,
            team_b,
            court=None,
            match_datetime=timezone.now() - timedelta(hours=1),
            status='IN_PROGRESS',
        )
        m = make_match(
            stage,
            team_c,
            team_d,
            court=None,
            match_datetime=timezone.now() - timedelta(minutes=1),
            status='PREPARATION',
        )
        evaluate_and_update_match_status(m)
        m.refresh_from_db()
        assert m.status == 'IN_PROGRESS'
