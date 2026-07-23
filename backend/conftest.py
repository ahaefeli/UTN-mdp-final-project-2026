"""Root pytest hooks for the Django backend."""
from pathlib import Path


def pretty_nodeid(item) -> str:
    """Format nodeid as 'Auth: Test login success' instead of full path."""
    stem = Path(item.fspath).stem  # e.g. test_auth
    if stem.startswith('test_'):
        stem = stem[5:]
    module = stem.replace('_', ' ').title()  # Auth, Match Finish

    func = item.name
    # Parametrized tests append [...]; strip for display of base name if present
    if '[' in func:
        func = func.split('[', 1)[0]
    if func.startswith('test_'):
        func = func[5:]
    case = f"Test {func.replace('_', ' ')}"

    return f'{module}: {case}'


def pytest_collection_modifyitems(items):
    for item in items:
        item._nodeid = pretty_nodeid(item)
