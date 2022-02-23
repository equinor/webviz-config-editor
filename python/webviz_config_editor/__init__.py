import pathlib
import subprocess

def start_editor():

    subprocess.run(
        [
            str(pathlib.Path(__file__).resolve().parent / "webviz-config-editor-binary"),
            "--no-sandbox",
        ]
    )
