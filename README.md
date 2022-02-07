> ⚠️ Please note that this is a beta version.

<h1 align="center"> Webviz Config Editor </h1> <br>

<p align="center">
  <a href="https://gitpoint.co/">
    <img alt="GitPoint" title="Webviz Config Editor" src="./public/icon.png" width="200">
  </a>
</p>

<p align="center">
  An open-source editor for creating Webviz dashboards.
</p>

<p align="center" style="margin-bottom: 64px;">
  <img alt="Webviz Logo" title="Webviz Logo" src="https://github.com/equinor/webviz-config/raw/master/webviz_config/_docs/static/webviz-logo.svg?sanitize=true" width="16">
  <a href="https://github.com/equinor/webviz-config-editor/releases" style="margin-left: 4px;">
    Checkout Main Project
  </a>
  <span style="margin: 8px;">&middot;</span>
  📦 
  <a href="https://github.com/equinor/webviz-config-editor/releases" style="margin-left: 4px">
    Download Binaries
  </a>
</p>

## Table of Contents

-   [Introduction](#introduction)
-   [Features](#features)

## Introduction

![GitHub](https://img.shields.io/github/license/equinor/webviz-config-editor)
[![Build Status](https://github.com/equinor/webviz-config-editor/workflows/wce-publish/badge.svg)](https://github.com/equinor/webviz-config-editor/actions?query=branch%3Amain)
[![Total alerts](https://img.shields.io/lgtm/alerts/g/equinor/webviz-config-editor.svg?logo=lgtm&logoWidth=18)](https://lgtm.com/projects/g/equinor/webviz-config-editor/alerts/)
[![Language grade: JavaScript](https://img.shields.io/lgtm/grade/javascript/g/equinor/webviz-config-editor.svg?logo=lgtm&logoWidth=18)](https://lgtm.com/projects/g/equinor/webviz-config-editor/context:javascript)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier%20%28JavaScript%29-ff69b4.svg)](https://github.com/prettier/prettier)
![Libraries.io dependency status for latest release](https://img.shields.io/librariesio/release/equinor/webviz-config-editor)

Enhance your work with Webviz config files with file validation, autocompletion, live preview and an integrated build and play environment. All in one simple and lightweight app. Built with React, Electron, Monaco Editor and Redux.

Available for both Linux and Windows.

<p align="center">
  <img src="https://i.imgur.com/InSpbng.png" height="600">
</p>

## Features

A few of the features of Webviz Config Editor:

-   Edit and preview Webviz config files
-   Autocompletion and file format validation
-   Select content in live-preview to quickly find its corresponding lines in the editor
-   Build and view your final Webviz dashboard
-   Select your preferred Python interpreter and Webviz theme

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.\
You will also see any lint errors in the console.

### Feedback

Feel free to send us feedback in the 💬 [discussions forum](https://github.com/equinor/webviz-config-editor/discussions) or ❗[file an issue](https://github.com/equinor/webviz-config-editor/issues). Feature requests are always welcome 😊👍. If you wish to contribute, please take a look at our 📜 [guidelines](https://github.com/equinor/webviz-config-editor/blob/master/CONTRIBUTING.md).

### Build Process

1. Install Node.js (https://nodejs.org/en/ or for Node Version Manager https://github.com/nvm-sh/nvm).
2. Install dependencies:
    ```bash
    npm install
    ```
3. Start electron app in developer mode:
    ```bash
    npm run electron:dev
    ```
4. In order to test the production-ready app, run:
    ```bash
    npm run electron:build
    ```
