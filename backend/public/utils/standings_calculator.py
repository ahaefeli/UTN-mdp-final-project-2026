from core.models import Match, TournamentEnrollment, Team, Tournament

def calculate_standings(tournament_id):
    tournament = Tournament.objects.filter(id=tournament_id).first()
    best_of = getattr(tournament, 'best_of', 5) or 5
    sets_to_win = (best_of // 2) + 1

    # Initialize all enrolled teams
    enrollments = TournamentEnrollment.objects.filter(tournament_id=tournament_id).select_related('team__club')
    teams_dict = {}
    for env in enrollments:
        t = env.team
        teams_dict[t.id] = {
            'team_id': str(t.id),
            'team_name': t.name,
            'club_id': str(t.club.id) if t.club else None,
            'club_name': t.club.name if t.club else None,
            'club_logo_url': t.club.logo_url if t.club else None,
            'puntos': 0,
            'pj': 0,
            'pg': 0,
            'pp': 0,
            'sets_ganados': 0,
            'sets_perdidos': 0
        }

    # Query all finished matches of the tournament
    matches = Match.objects.filter(
        tournament_stage__tournament_id=tournament_id,
        status='FINISHED'
    ).select_related('local_team__club', 'visitor_team__club')

    for m in matches:
        # Add teams dynamically if they are in the match but not in enrollments
        for team in [m.local_team, m.visitor_team]:
            if team.id not in teams_dict:
                teams_dict[team.id] = {
                    'team_id': str(team.id),
                    'team_name': team.name,
                    'club_id': str(team.club.id) if team.club else None,
                    'club_name': team.club.name if team.club else None,
                    'club_logo_url': team.club.logo_url if team.club else None,
                    'puntos': 0,
                    'pj': 0,
                    'pg': 0,
                    'pp': 0,
                    'sets_ganados': 0,
                    'sets_perdidos': 0
                }

        # Parse match sets
        sets_won_home = 0
        sets_won_visitor = 0
        
        # 1. Parse via sets_data if available
        if m.sets_data and isinstance(m.sets_data, dict) and "sets" in m.sets_data:
            for s in m.sets_data["sets"]:
                ls = s.get("local_score") or s.get("local_points") or 0
                vs = s.get("visitor_score") or s.get("visitor_points") or 0
                if ls > vs:
                    sets_won_home += 1
                elif vs > ls:
                    sets_won_visitor += 1
        else:
            # 2. Parse via score_summary
            summary = m.score_summary or ""
            if "," in summary:
                # Format: "25-20, 25-18, 25-22"
                for part in summary.split(','):
                    part = part.strip()
                    if '-' in part:
                        try:
                            lp, vp = map(int, part.split('-'))
                            if lp > vp:
                                sets_won_home += 1
                            elif vp > lp:
                                sets_won_visitor += 1
                        except ValueError:
                            pass
            elif "-" in summary:
                # Format: "3-0", "3-1", "3-2" etc.
                try:
                    sets_won_home, sets_won_visitor = map(int, summary.strip().split('-'))
                except ValueError:
                    pass

        # Solo contar resultados decisivos de vóley
        # Partidos FINISHED sin planilla válida (0-0 / summary inválido) se omiten.
        decisive = (
            sets_won_home != sets_won_visitor
            and max(sets_won_home, sets_won_visitor) == sets_to_win
        )
        if not decisive:
            continue

        # Update stats
        home_stats = teams_dict[m.local_team_id]
        visitor_stats = teams_dict[m.visitor_team_id]

        home_stats['pj'] += 1
        visitor_stats['pj'] += 1
        home_stats['sets_ganados'] += sets_won_home
        home_stats['sets_perdidos'] += sets_won_visitor
        visitor_stats['sets_ganados'] += sets_won_visitor
        visitor_stats['sets_perdidos'] += sets_won_home

        is_tiebreak = (min(sets_won_home, sets_won_visitor) == sets_to_win - 1)
        pts_winner = 2 if is_tiebreak else 3
        pts_loser = 1 if is_tiebreak else 0

        if sets_won_home > sets_won_visitor:
            home_stats['pg'] += 1
            visitor_stats['pp'] += 1
            home_stats['puntos'] += pts_winner
            visitor_stats['puntos'] += pts_loser
        else:
            visitor_stats['pg'] += 1
            home_stats['pp'] += 1
            visitor_stats['puntos'] += pts_winner
            home_stats['puntos'] += pts_loser

    # Convert to list and sort
    standings_list = list(teams_dict.values())
    
    # Sort criteria:
    # 1. Points (descending)
    # 2. Match Won (PG) (descending)
    # 3. Sets Coeff (SG / SP) (descending)
    def sort_key(x):
        pts = x['puntos']
        pg = x['pg']
        sg = x['sets_ganados']
        sp = x['sets_perdidos']
        coeff = sg / sp if sp > 0 else float('inf')
        return (pts, pg, coeff)

    standings_list.sort(key=sort_key, reverse=True)
    return standings_list
