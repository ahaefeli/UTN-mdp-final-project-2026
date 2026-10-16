import json
from datetime import timedelta

import pytest
from django.utils import timezone

from tests.factories import make_match


@pytest.mark.django_db
class TestTournamentStages:
    def test_requires_jwt(self, api_client, tournament):
        res = api_client.get(f'/internal/torneos/fechas/?tournament_id={tournament.id}')
        assert res.status_code == 401

    def test_list_stages(self, api_client, auth_header, tournament, stage):
        res = api_client.get(
            f'/internal/torneos/fechas/?tournament_id={tournament.id}',
            **auth_header,
        )
        assert res.status_code == 200
        assert len(res.json()['data']) >= 1

    def test_create_stage(self, api_client, auth_header, tournament):
        res = api_client.post(
            '/internal/torneos/fechas/',
            data=json.dumps({
                'tournament_id': str(tournament.id),
                'date': timezone.now().date().isoformat(),
                'name': 'Fecha Extra',
            }),
            content_type='application/json',
            **auth_header,
        )
        assert res.status_code == 201
        assert res.json()['data']['name'] == 'Fecha Extra'

    def test_reject_past_date(self, api_client, auth_header, tournament):
        yesterday = (timezone.localdate() - timedelta(days=1)).isoformat()
        res = api_client.post(
            '/internal/torneos/fechas/',
            data=json.dumps({
                'tournament_id': str(tournament.id),
                'date': yesterday,
                'name': 'Fecha Pasada',
            }),
            content_type='application/json',
            **auth_header,
        )
        assert res.status_code == 400
        assert 'pasó' in res.json()['error']

    def test_stages_are_chronological(self, api_client, auth_header, tournament):
        later = (timezone.localdate() + timedelta(days=10)).isoformat()
        sooner = (timezone.localdate() + timedelta(days=2)).isoformat()
        for name, stage_date in (('Tarde', later), ('Temprano', sooner)):
            created = api_client.post(
                '/internal/torneos/fechas/',
                data=json.dumps({
                    'tournament_id': str(tournament.id),
                    'date': stage_date,
                    'name': name,
                }),
                content_type='application/json',
                **auth_header,
            )
            assert created.status_code == 201

        res = api_client.get(
            f'/internal/torneos/fechas/?tournament_id={tournament.id}',
            **auth_header,
        )
        dates = [stage['date'] for stage in res.json()['data']]
        assert dates == sorted(dates)

    def test_create_missing_fields(self, api_client, auth_header):
        res = api_client.post(
            '/internal/torneos/fechas/',
            data=json.dumps({'name': 'X'}),
            content_type='application/json',
            **auth_header,
        )
        assert res.status_code == 400

    def test_delete_empty_stage(self, api_client, auth_header, tournament):
        created = api_client.post(
            '/internal/torneos/fechas/',
            data=json.dumps({
                'tournament_id': str(tournament.id),
                'date': timezone.now().date().isoformat(),
                'name': 'Borrar',
            }),
            content_type='application/json',
            **auth_header,
        ).json()['data']
        res = api_client.delete(f'/internal/torneos/fechas/{created["id"]}/', **auth_header)
        assert res.status_code == 200

    def test_delete_stage_with_matches_fails(
        self, api_client, auth_header, stage, team_a, team_b, court
    ):
        make_match(stage, team_a, team_b, court=court)
        res = api_client.delete(f'/internal/torneos/fechas/{stage.id}/', **auth_header)
        assert res.status_code == 200
        from core.models import Match
        assert not Match.objects.filter(tournament_stage=stage).exists()
