# Sheet Logger

## Overview

This repository holds a serverless React SPA for consultants to track time against project tasks for various clients.

The client-task hierarchy is:

Client -> Project -> Phase -> Task

Phase and task may not be known or may be added/changed after the time is logged.

Logged time entries will require at least (client, project) to be specified.

A time entry includes a duration of work (in hours with 15 mins as the minimum granularity) and a note of the work done. The consultant is responsible for providing the note.

Consultants are provided with a timer to aid in task timing. When the timer is started, the consultant specifies a project task and optionally a note of the work done. The consultant can also optionally give an estimate for the work. If the timer is still running for the estimate duration, Sheet Logger will notify the consultant and check if the task is still being worked on.

Consultants can also manually enter a time entry. They'd need to provide the project-task info and duration or start/stop time, plus note.

The goal of the consultant is to have 8 hours of client-billable work per day. Sheet Logger shows a "day" view tracking the day's work and progress towards the 8 hours of work. The day view shows a list of the work done. Each list item represents a client task that the consultant worked on that day (or expects to work on) and allows logging work or starting a timer for each task.

Sheet Logger also keeps a tally of the work done for the work week, which of course is to have 40 hours of client-billable work, presented in a easy-to-digest view. The "week" view also shows a table of the work done, where each record represents a client task and has columns for hours logged on each day (plus a way to copy the notes for the day). This allows easy manual transfer of the week's work into the consultant's timesheet software.

## Tenets

The tenets of Sheet Logger are:

- client application operating on local data only. NO DATA TRANSFER!
- can leverage browser features, even ones that are considered annoying (notifications and sounds)
- lightweight and scrappy.

## How to run

```sh
yarn dev       # run dev server
yarn build     # build the dist
yarn test run  # run vitest
yarn lint      # run eslint
```
