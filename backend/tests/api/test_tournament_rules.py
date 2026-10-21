import json
from datetime import timedelta

import pytest
from django.utils import timezone

from tests.factories import (
    make_match,
    make_team,
    make_tournament,
)


@pytest.mark.django_db
class TestTournamentRules:
    def test_second_tournament_is_pending_when_one_is_active(
        self, api_client, auth_header, organization, tournament
    ):
        assert tournament.status == 'PREPARATION'
        res = api_client.post(
            '/internal/torneos/',
            data=json.dumps({
                'name': 'Otro Torneo',
                'year': 2026,
                'category': tournament.category,
                'branch': tournament.branch,
                'organization_id': organization.id,
                'status': 'PREPARATION',
            }),
            content_type='application/json',
            **auth_header,
        )
        assert res.status_code == 201
        assert res.json()['data']['status'] == 'PENDING'

    def test_can_create_when_previous_finished(
        self, api_client, auth_header, organization, tournament
    ):
        tournament.status = 'FINISHED'
        tournament.save(update_fields=['status'])
        res = api_client.post(
            '/internal/torneos/',
            data=json.dumps({
                'name': 'Nuevo Torneo',
                'year': 2027,
                'category': tournament.category,
                'branch': tournament.branch,
                'organization_id': organization.id,
            }),
            content_type='application/json',
            **auth_header,
        )
        assert res.status_code == 201

    def test_cannot_reopen_finished(self, api_client, auth_header, tournament):
        tournament.status = 'FINISHED'
        tournament.save(update_fields=['status'])
        res = api_client.put(
            f'/internal/torneos/{tournament.id}/',
            data=json.dumps({'status': 'IN_PROGRESS'}),
            content_type='application/json',
            **auth_header,
        )
        assert res.status_code == 400
        assert 'finalizado' in res.json()['error']

    def test_cannot_reopen_cancelled(self, api_client, auth_header, tournament):
        tournament.status = 'CANCELLED'
        tournament.save(update_fields=['status'])
        res = api_client.put(
            f'/internal/torneos/{tournament.id}/',
            data=json.dumps({'status': 'PREPARATION'}),
            content_type='application/json',
            **auth_header,
        )
        assert res.status_code == 400
        assert 'cancelado' in res.json()['error']

    def test_cancel_cascades_to_non_terminal_matches(
        self, api_client, auth_header, tournament, stage, team_a, team_b, court
    ):
        m_prep = make_match(stage, team_a, team_b, court=court, status='PREPARATION')
        m_fin = make_match(stage, team_b, team_a, court=court, status='FINISHED')
        res = api_client.put(
            f'/internal/torneos/{tournament.id}/',
            data=json.dumps({'status': 'CANCELLED'}),
            content_type='application/json',
            **auth_header,
        )
        assert res.status_code == 200
        m_prep.refresh_from_db()
        m_fin.refresh_from_db()
        assert m_prep.status == 'CANCELLED'
        assert m_fin.status == 'FINISHED'

    def test_finish_cascades_to_non_terminal_matches(
        self, api_client, auth_header, tournament, stage, team_a, team_b, court
    ):
        m_prep = make_match(stage, team_a, team_b, court=court, status='PREPARATION')
        m_cancel = make_match(stage, team_b, team_a, court=court, status='CANCELLED')
        res = api_client.put(
            f'/internal/torneos/{tournament.id}/',
            data=json.dumps({'status': 'FINISHED'}),
            content_type='application/json',
            **auth_header,
        )
        assert res.status_code == 200
        m_prep.refresh_from_db()
        m_cancel.refresh_from_db()
        assert m_prep.status == 'FINISHED'
        assert m_cancel.status == 'CANCELLED'


@pytest.mark.django_db
class TestEnrollmentRules:
    def test_category_branch_mismatch(self, api_client, auth_header, tournament, club):
        wrong = make_team(club, name='Sub16', category='SUB_16', branch='MALE')
        res = api_client.post(
            '/internal/torneos/inscripciones/',
            data=json.dumps({'tournament_id': str(tournament.id), 'team_id': str(wrong.id)}),
            content_type='application/json',
            **auth_header,
        )
        assert res.status_code == 400
        assert 'categoría' in res.json()['error']

    def test_enrollment_success(self, api_client, auth_header, tournament, team_a):
        res = api_client.post(
            '/internal/torneos/inscripciones/',
            data=json.dumps({'tournament_id': str(tournament.id), 'team_id': str(team_a.id)}),
            content_type='application/json',
            **auth_header,
        )
        assert res.status_code == 201


@pytest.mark.django_db
class TestMatchRules:
    def test_same_team_rejected(self, api_client, auth_header, stage, team_a, court):
        res = api_client.post(
            '/internal/torneos/partidos/',
            data=json.dumps({
                'tournament_stage_id': stage.id,
                'local_team_id': str(team_a.id),
                'visitor_team_id': str(team_a.id),
                'court_id': court.id,
            }),
            content_type='application/json',
            **auth_header,
        )
        assert res.status_code == 400
        assert 'distintos' in res.json()['error']

    def test_collision_on_create(
        self, api_client, auth_header, stage, team_a, team_b, team_c, club_b, court, referee_user
    ):
        dt = timezone.now() + timedelta(days=2)
        make_match(
            stage,
            team_a,
            team_b,
            court=court,
            match_datetime=dt,
            referee=referee_user,
            status='PREPARATION',
        )
        team_d = make_team(club_b, name='Equipo D')
        res = api_client.post(
            '/internal/torneos/partidos/',
            data=json.dumps({
                'tournament_stage_id': stage.id,
                'local_team_id': str(team_c.id),
                'visitor_team_id': str(team_d.id),
                'court_id': court.id,
                'match_datetime': dt.isoformat(),
                'referee_id': str(referee_user.id),
            }),
            content_type='application/json',
            **auth_header,
        )
        assert res.status_code == 400
        assert 'árbitro' in res.json()['error'] or 'cancha' in res.json()['error']

    def test_cannot_edit_finished(self, api_client, auth_header, match_prep):
        match_prep.status = 'FINISHED'
        match_prep.save(update_fields=['status'])
        res = api_client.put(
            f'/internal/torneos/partidos/{match_prep.id}/',
            data=json.dumps({'score_summary': '3-0'}),
            content_type='application/json',
            **auth_header,
        )
        assert res.status_code == 400
        assert 'finalizado' in res.json()['error']

    def test_put_finished_rejected_for_admin(self, api_client, auth_header, match_prep):
        res = api_client.put(
            f'/internal/torneos/partidos/{match_prep.id}/',
            data=json.dumps({'status': 'FINISHED'}),
            content_type='application/json',
            **auth_header,
        )
        assert res.status_code == 400
        assert 'finalizar' in res.json()['error']

    def test_put_finished_rejected_for_referee(self, api_client, referee_auth_header, match_prep):
        res = api_client.put(
            f'/internal/torneos/partidos/{match_prep.id}/',
            data=json.dumps({'status': 'FINISHED'}),
            content_type='application/json',
            **referee_auth_header,
        )
        assert res.status_code == 400
        assert 'finalizar' in res.json()['error']
        match_prep.refresh_from_db()
        assert match_prep.status == 'PREPARATION'

    def test_org_isolation_on_get(
        self, api_client, auth_header, other_organization
    ):
        from tests.factories import make_club, make_court, make_stage

        oclub = make_club(other_organization)
        oa = make_team(oclub, name='OA')
        ob = make_team(oclub, name='OB')
        ocourt = make_court(oclub)
        ot = make_tournament(other_organization)
        os_ = make_stage(ot)
        m = make_match(os_, oa, ob, court=ocourt)
        res = api_client.get(f'/internal/torneos/partidos/{m.id}/', **auth_header)
        assert res.status_code == 404


@pytest.mark.django_db
class TestTournamentRulesExtras:
    def test_second_tournament_pending_when_one_in_progress(self, api_client, auth_header, organization, tournament):
        tournament.status = 'IN_PROGRESS'
        tournament.save(update_fields=['status'])
        res = api_client.post(
            '/internal/torneos/',
            data=json.dumps({
                'name': 'Otro',
                'year': 2026,
                'category': tournament.category,
                'branch': tournament.branch,
                'organization_id': organization.id,
            }),
            content_type='application/json',
            **auth_header,
        )
        assert res.status_code == 201
        assert res.json()['data']['status'] == 'PENDING'

    def test_cannot_promote_pending_while_another_is_active(
        self, api_client, auth_header, organization, tournament
    ):
        pending = make_tournament(
            organization,
            name='Pendiente',
            category=tournament.category,
            branch=tournament.branch,
            status='PENDING',
        )
        res = api_client.put(
            f'/internal/torneos/{pending.id}/',
            data=json.dumps({'status': 'PREPARATION'}),
            content_type='application/json',
            **auth_header,
        )
        assert res.status_code == 400
        assert 'vigente' in res.json()['error']
        pending.refresh_from_db()
        assert pending.status == 'PENDING'

    def test_can_promote_pending_when_previous_finished(
        self, api_client, auth_header, organization, tournament
    ):
        tournament.status = 'FINISHED'
        tournament.save(update_fields=['status'])
        pending = make_tournament(
            organization,
            name='Pendiente',
            category=tournament.category,
            branch=tournament.branch,
            status='PENDING',
        )
        res = api_client.put(
            f'/internal/torneos/{pending.id}/',
            data=json.dumps({'status': 'PREPARATION'}),
            content_type='application/json',
            **auth_header,
        )
        assert res.status_code == 200
        assert res.json()['data']['status'] == 'PREPARATION'

    def test_different_category_allowed(self, api_client, auth_header, organization, tournament):
        res = api_client.post(
            '/internal/torneos/',
            data=json.dumps({
                'name': 'Sub16',
                'year': 2026,
                'category': 'SUB_16',
                'branch': tournament.branch,
                'organization_id': organization.id,
            }),
            content_type='application/json',
            **auth_header,
        )
        assert res.status_code == 201

    def test_create_with_nested_stages(self, api_client, auth_header, organization):
        from django.utils import timezone
        res = api_client.post(
            '/internal/torneos/',
            data=json.dumps({
                'name': 'Con Fechas',
                'year': 2026,
                'category': 'MAXI',
                'branch': 'FEMALE',
                'organization_id': organization.id,
                'stages': [{'name': 'J1', 'date': timezone.now().date().isoformat()}],
            }),
            content_type='application/json',
            **auth_header,
        )
        assert res.status_code == 201
        from core.models import TournamentStage
        tid = res.json()['data']['id']
        assert TournamentStage.objects.filter(tournament_id=tid).count() == 1

    def test_enrollment_duplicate(self, api_client, auth_header, tournament, team_a):
        payload = json.dumps({'tournament_id': str(tournament.id), 'team_id': str(team_a.id)})
        assert api_client.post(
            '/internal/torneos/inscripciones/', data=payload, content_type='application/json', **auth_header
        ).status_code == 201
        res = api_client.post(
            '/internal/torneos/inscripciones/', data=payload, content_type='application/json', **auth_header
        )
        assert res.status_code == 400
        assert 'inscripto' in res.json()['error']

    def test_enrollment_list_and_unenroll(self, api_client, auth_header, tournament, team_a):
        api_client.post(
            '/internal/torneos/inscripciones/',
            data=json.dumps({'tournament_id': str(tournament.id), 'team_id': str(team_a.id)}),
            content_type='application/json',
            **auth_header,
        )
        listed = api_client.get(
            f'/internal/torneos/inscripciones/?tournament_id={tournament.id}',
            **auth_header,
        )
        assert listed.status_code == 200
        assert len(listed.json()['data']) == 1
        deleted = api_client.delete(
            f'/internal/torneos/inscripciones/{tournament.id}/{team_a.id}/',
            **auth_header,
        )
        assert deleted.status_code == 200

    def test_internal_standings_requires_auth(self, api_client, tournament):
        res = api_client.get(f'/internal/torneos/{tournament.id}/posiciones/')
        assert res.status_code == 401

    def test_delete_tournament_cascades_with_matches(
        self, api_client, auth_header, tournament, stage, team_a, team_b, court
    ):
        """PIN: FK CASCADE permite borrar torneo con partidos (mensaje Cannot delete no se dispara)."""
        make_match(stage, team_a, team_b, court=court)
        res = api_client.delete(f'/internal/torneos/{tournament.id}/', **auth_header)
        assert res.status_code == 200
        from core.models import Tournament
        assert not Tournament.objects.filter(id=tournament.id).exists()

    def test_archive_hides_tournament_until_restored(self, api_client, auth_header, tournament):
        archived = api_client.put(
            f'/internal/torneos/{tournament.id}/',
            data=json.dumps({'is_deleted': True}),
            content_type='application/json',
            **auth_header,
        )
        assert archived.status_code == 200
        listed = api_client.get('/internal/torneos/', **auth_header)
        assert str(tournament.id) not in {str(item['id']) for item in listed.json()['data']}
        only_archived = api_client.get('/internal/torneos/?archived=1', **auth_header)
        assert str(tournament.id) in {str(item['id']) for item in only_archived.json()['data']}
        public = api_client.get('/public/torneos/')
        assert str(tournament.id) not in {str(item['id']) for item in public.json()['data']}

        restored = api_client.put(
            f'/internal/torneos/{tournament.id}/',
            data=json.dumps({'is_deleted': False}),
            content_type='application/json',
            **auth_header,
        )
        assert restored.status_code == 200
        listed_again = api_client.get('/internal/torneos/', **auth_header)
        assert str(tournament.id) in {str(item['id']) for item in listed_again.json()['data']}

    def test_delete_blocked_when_match_is_finished(
        self, api_client, auth_header, tournament, stage, team_a, team_b, court
    ):
        make_match(stage, team_a, team_b, court=court, status='FINISHED', score_summary='3-0')
        res = api_client.delete(f'/internal/torneos/{tournament.id}/', **auth_header)
        assert res.status_code == 400
        assert 'Archiv' in res.json()['error']
