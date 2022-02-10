import sys
try:
    # Python 3.8+
    from importlib.metadata import entry_points
except ModuleNotFoundError:
    # Python < 3.8
    from importlib_metadata import entry_points  # type: ignore

from webviz_config import WebvizConfigTheme
import json

installed_themes = {}

ep = entry_points()

for entry_point in entry_points().get("webviz_config_themes", []):
    theme = entry_point.load()

    globals()[entry_point.name] = theme

    if isinstance(theme, WebvizConfigTheme):
        installed_themes[theme.theme_name] = theme

output = { "themes": list(installed_themes.keys())}
print(json.dumps(output), file = sys.stdout)
