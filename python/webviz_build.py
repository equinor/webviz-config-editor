# Workaround while waiting for necessary feature in webviz-config.
# To be removed/simplified when feature is available upstream

from argparse import Namespace
import sys
from pathlib import Path

from webviz_config._build_webviz import build_webviz
args = Namespace(yaml_file = Path(sys.argv[1]), theme = sys.argv[2], tokenfile = Path(sys.argv[3]), portable=None, debug=None, loglevel="WARNING", logconfig=None)
build_webviz(args)
