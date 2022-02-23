from setuptools import setup, find_packages

setup(
    name="webviz-config-editor",
    packages=find_packages(exclude=["tests"]),
    setup_requires=["setuptools_scm~=3.2"],
    python_requires="~=3.6",
    use_scm_version=True,
    package_data={
        "webviz_config_editor": [
            "webviz-config-editor-binary",
        ]
    },
    classifiers=[
        "Programming Language :: Python :: 3",
        "Operating System :: Unix",
        "Natural Language :: English",
    ],
    zip_safe=False,
)
