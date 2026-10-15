"""Club and team membership resolved the same way for login and user serialization."""

def resolve_user_membership(user):
    """Return the user's club (direct, or via team for coach/player) and team context.

    club_id, club_name and club_logo_url are None when the user has no club.
    """
    team = None
    team_id = None
    team_info = None

    if user.role == 'COACH':
        team = user.coached_teams.select_related('club').first()
        if team:
            team_id = str(team.id)
    elif user.role == 'PLAYER':
        from core.models import Team
        team = (
            Team.objects.filter(players=user, is_deleted=False)
            .select_related('club')
            .first()
        )
        if team:
            team_id = str(team.id)
            team_info = {
                'id': str(team.id),
                'name': team.name,
                'category': team.category,
                'branch': team.branch,
            }

    club = user.club
    if club is None and team is not None:
        club = team.club

    return {
        'club_id': str(club.id) if club else None,
        'club_name': club.name if club else None,
        'club_logo_url': club.logo_url if club else None,
        'team_id': team_id,
        'team_info': team_info,
    }
