"""Helpers to build domain objects for tests."""
from __future__ import annotations

import datetime
import uuid

import jwt
from django.conf import settings
from django.utils import timezone

from core.models import (
    Club,
    ClubRegistrationRequest,
    Court,
    Match,
    Organization,
    Team,
    Tournament,
    TournamentEnrollment,
    TournamentStage,
    User,
)


def make_organization(name: str = 'Liga Test') -> Organization:
    return Organization.objects.create(name=name)


def make_user(
    *,
    organization: Organization | None = None,
    role: str = 'ADMIN',
    email: str | None = None,
    username: str | None = None,
    password: str = 'testpass123',
    club: Club | None = None,
    is_deleted: bool = False,
    **extra,
) -> User:
    suffix = uuid.uuid4().hex[:8]
    user = User(
        username=username or f'user_{suffix}',
        email=email or f'user_{suffix}@test.com',
        role=role,
        organization=organization,
        club=club,
        is_deleted=is_deleted,
        first_name=extra.pop('first_name', 'Test'),
        last_name=extra.pop('last_name', 'User'),
        **extra,
    )
    user.set_password(password)
    user.save()
    return user


def make_club(
    organization: Organization,
    *,
    name: str | None = None,
) -> Club:
    return Club.objects.create(
        organization=organization,
        name=name or f'Club {uuid.uuid4().hex[:6]}',
    )


def make_court(club: Club, *, name: str = 'Cancha 1') -> Court:
    return Court.objects.create(club=club, name=name, enabled=True)


def make_team(
    club: Club,
    *,
    name: str | None = None,
    category: str = 'PRIMERA',
    branch: str = 'MALE',
    coach: User | None = None,
) -> Team:
    return Team.objects.create(
        club=club,
        name=name or f'Team {uuid.uuid4().hex[:6]}',
        category=category,
        branch=branch,
        coach=coach,
    )


def make_tournament(
    organization: Organization,
    *,
    name: str = 'Torneo Test',
    year: int = 2026,
    category: str = 'PRIMERA',
    branch: str = 'MALE',
    status: str = 'PREPARATION',
) -> Tournament:
    return Tournament.objects.create(
        organization=organization,
        name=name,
        year=year,
        category=category,
        branch=branch,
        status=status,
    )


def make_stage(
    tournament: Tournament,
    *,
    name: str = 'Fecha 1',
    date=None,
) -> TournamentStage:
    return TournamentStage.objects.create(
        tournament=tournament,
        name=name,
        date=date or timezone.now().date(),
    )


def make_enrollment(tournament: Tournament, team: Team) -> TournamentEnrollment:
    return TournamentEnrollment.objects.create(tournament=tournament, team=team)


def make_match(
    stage: TournamentStage,
    local_team: Team,
    visitor_team: Team,
    *,
    court: Court | None = None,
    match_datetime=None,
    referee: User | None = None,
    scorer: User | None = None,
    status: str = 'PREPARATION',
    score_summary: str | None = None,
    sets_data=None,
    is_deleted: bool = False,
) -> Match:
    return Match.objects.create(
        tournament_stage=stage,
        local_team=local_team,
        visitor_team=visitor_team,
        court=court,
        match_datetime=match_datetime,
        referee=referee,
        scorer=scorer,
        status=status,
        score_summary=score_summary,
        sets_data=sets_data,
        is_deleted=is_deleted,
    )


def make_registration_request(
    organization: Organization,
    *,
    role: str = 'CLUB_ADMIN',
    token: str | None = None,
    status: str = 'PENDING',
    expires_at=None,
    club_name: str | None = None,
    admin_email: str | None = None,
    admin_username: str | None = None,
    admin_first_name: str = 'Admin',
    admin_last_name: str = 'Club',
    password_raw: str | None = None,
    **extra,
) -> ClubRegistrationRequest:
    import uuid as _uuid
    from django.contrib.auth.hashers import make_password

    req_id = _uuid.uuid4()
    tok = token or str(req_id)
    req = ClubRegistrationRequest(
        id=req_id,
        organization=organization,
        token=tok,
        role=role,
        status=status,
        expires_at=expires_at or (timezone.now() + datetime.timedelta(hours=48)),
        club_name=club_name,
        admin_email=admin_email,
        admin_username=admin_username,
        admin_first_name=admin_first_name,
        admin_last_name=admin_last_name,
        **extra,
    )
    if password_raw:
        req.password = make_password(password_raw)
    req.save()
    return req


def auth_header_for(user: User, *, expired: bool = False) -> dict[str, str]:
    now = datetime.datetime.utcnow()
    exp = now - datetime.timedelta(hours=1) if expired else now + datetime.timedelta(days=1)
    payload = {
        'user_id': str(user.id),
        'email': user.email,
        'role': user.role,
        'club_id': str(user.club_id) if user.club_id else None,
        'exp': exp,
        'iat': now,
    }
    token = jwt.encode(payload, settings.SECRET_KEY, algorithm='HS256')
    if isinstance(token, bytes):
        token = token.decode('utf-8')
    return {'HTTP_AUTHORIZATION': f'Bearer {token}'}


def sets_3_0_local():
    return [
        {'set_number': 1, 'local_points': 25, 'visitor_points': 20},
        {'set_number': 2, 'local_points': 25, 'visitor_points': 18},
        {'set_number': 3, 'local_points': 25, 'visitor_points': 22},
    ]


def sets_3_2_local():
    return [
        {'set_number': 1, 'local_points': 25, 'visitor_points': 20},
        {'set_number': 2, 'local_points': 20, 'visitor_points': 25},
        {'set_number': 3, 'local_points': 25, 'visitor_points': 22},
        {'set_number': 4, 'local_points': 22, 'visitor_points': 25},
        {'set_number': 5, 'local_points': 15, 'visitor_points': 12},
    ]


def sets_3_1_visitor():
    return [
        {'set_number': 1, 'local_points': 20, 'visitor_points': 25},
        {'set_number': 2, 'local_points': 25, 'visitor_points': 18},
        {'set_number': 3, 'local_points': 22, 'visitor_points': 25},
        {'set_number': 4, 'local_points': 19, 'visitor_points': 25},
    ]
