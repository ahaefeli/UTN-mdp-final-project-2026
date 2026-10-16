import pytest

from internal.views.matches import validate_volleyball_sets
from tests.factories import sets_3_0_local, sets_3_1_visitor, sets_3_2_local


class TestValidateVolleyballSetsValid:
    def test_3_0(self):
        sets, err = validate_volleyball_sets(sets_3_0_local())
        assert err is None
        assert len(sets) == 3
        assert sets[0]['local_points'] == 25

    def test_3_1(self):
        sets, err = validate_volleyball_sets(sets_3_1_visitor())
        assert err is None
        assert len(sets) == 4

    def test_3_2(self):
        sets, err = validate_volleyball_sets(sets_3_2_local())
        assert err is None
        assert len(sets) == 5

    def test_local_score_alias(self):
        detail = [
            {'set_number': 1, 'local_score': 25, 'visitor_score': 20},
            {'set_number': 2, 'local_score': 25, 'visitor_score': 18},
            {'set_number': 3, 'local_score': 25, 'visitor_score': 22},
        ]
        sets, err = validate_volleyball_sets(detail)
        assert err is None
        assert sets[0]['local_points'] == 25


class TestValidateVolleyballSetsInvalid:
    def test_empty_or_none(self):
        assert validate_volleyball_sets(None)[1]
        assert validate_volleyball_sets([])[1]
        assert validate_volleyball_sets('bad')[1]

    def test_too_few_sets(self):
        _, err = validate_volleyball_sets([
            {'local_points': 25, 'visitor_points': 20},
            {'local_points': 25, 'visitor_points': 18},
        ])
        assert '3, 4 o 5' in err

    def test_too_many_sets(self):
        detail = sets_3_2_local() + [{'local_points': 15, 'visitor_points': 10}]
        _, err = validate_volleyball_sets(detail)
        assert '3, 4 o 5' in err

    def test_set_tie(self):
        detail = [
            {'local_points': 25, 'visitor_points': 25},
            {'local_points': 25, 'visitor_points': 18},
            {'local_points': 25, 'visitor_points': 22},
        ]
        _, err = validate_volleyball_sets(detail)
        assert 'empatar' in err

    def test_match_tie_2_2_without_fifth(self):
        detail = [
            {'local_points': 25, 'visitor_points': 20},
            {'local_points': 20, 'visitor_points': 25},
            {'local_points': 25, 'visitor_points': 22},
            {'local_points': 22, 'visitor_points': 25},
        ]
        _, err = validate_volleyball_sets(detail)
        assert 'empatado' in err

    def test_winner_must_have_exactly_three(self):
        detail = [
            {'local_points': 25, 'visitor_points': 20},
            {'local_points': 25, 'visitor_points': 18},
        ]
        # too few already; also craft 2-0 padded wrongly isn't valid length
        detail3 = [
            {'local_points': 25, 'visitor_points': 20},
            {'local_points': 25, 'visitor_points': 18},
            {'local_points': 20, 'visitor_points': 25},
        ]
        _, err = validate_volleyball_sets(detail3)
        assert 'exactamente 3 sets' in err

    def test_extra_sets_after_winner(self):
        detail = [
            {'local_points': 25, 'visitor_points': 20},
            {'local_points': 25, 'visitor_points': 18},
            {'local_points': 25, 'visitor_points': 22},
            {'local_points': 25, 'visitor_points': 10},
        ]
        _, err = validate_volleyball_sets(detail)
        assert 'sets de más' in err

    def test_negative_points(self):
        detail = [
            {'local_points': -1, 'visitor_points': 20},
            {'local_points': 25, 'visitor_points': 18},
            {'local_points': 25, 'visitor_points': 22},
        ]
        _, err = validate_volleyball_sets(detail)
        assert 'negativos' in err

    def test_points_over_two_digits(self):
        detail = [
            {'local_points': 100, 'visitor_points': 20},
            {'local_points': 25, 'visitor_points': 18},
            {'local_points': 25, 'visitor_points': 22},
        ]
        _, err = validate_volleyball_sets(detail)
        assert '2 cifras' in err

    def test_invalid_points_type(self):
        detail = [
            {'local_points': 'x', 'visitor_points': 20},
            {'local_points': 25, 'visitor_points': 18},
            {'local_points': 25, 'visitor_points': 22},
        ]
        _, err = validate_volleyball_sets(detail)
        assert 'inválidos' in err

    def test_set_must_reach_25_and_win_by_two(self):
        short = [
            {'local_points': 10, 'visitor_points': 2},
            {'local_points': 25, 'visitor_points': 18},
            {'local_points': 25, 'visitor_points': 22},
        ]
        _, err = validate_volleyball_sets(short)
        assert 'se juega a 25' in err

        no_margin = [
            {'local_points': 25, 'visitor_points': 24},
            {'local_points': 25, 'visitor_points': 18},
            {'local_points': 25, 'visitor_points': 22},
        ]
        _, err = validate_volleyball_sets(no_margin)
        assert 'se juega a 25' in err

    def test_deuce_set_is_valid(self):
        detail = [
            {'local_points': 28, 'visitor_points': 26},
            {'local_points': 25, 'visitor_points': 18},
            {'local_points': 25, 'visitor_points': 22},
        ]
        _, err = validate_volleyball_sets(detail)
        assert err is None

    def test_fifth_set_is_to_15_win_by_two(self):
        detail = sets_3_2_local()
        detail[4] = {'set_number': 5, 'local_points': 14, 'visitor_points': 12}
        _, err = validate_volleyball_sets(detail)
        assert 'se juega a 15' in err

        detail[4] = {'set_number': 5, 'local_points': 15, 'visitor_points': 14}
        _, err = validate_volleyball_sets(detail)
        assert 'se juega a 15' in err

        detail[4] = {'set_number': 5, 'local_points': 16, 'visitor_points': 14}
        _, err = validate_volleyball_sets(detail)
        assert err is None

        detail[4] = {'set_number': 5, 'local_points': 25, 'visitor_points': 23}
        _, err = validate_volleyball_sets(detail)
        assert err is None

    def test_invalid_set_number_falls_back_to_index(self):
        detail = [
            {'set_number': 'bad', 'local_points': 25, 'visitor_points': 20},
            {'set_number': None, 'local_points': 25, 'visitor_points': 18},
            {'local_points': 25, 'visitor_points': 22},
        ]
        sets, err = validate_volleyball_sets(detail)
        assert err is None
        assert sets[0]['set_number'] == 1
        assert sets[1]['set_number'] == 2
        assert sets[2]['set_number'] == 3
