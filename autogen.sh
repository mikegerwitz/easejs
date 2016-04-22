#!/bin/sh
#
# Generate configure script from repository
#
#  Copyright (C) 2016 Free Software Foundation, Inc.
#
#  This file is part of GNU ease.js.
#
#  GNU ease.js is free software: you can redistribute it and/or modify
#  it under the terms of the GNU General Public License as published by
#  the Free Software Foundation, either version 3 of the License, or
#  (at your option) any later version.
#
#  This program is distributed in the hope that it will be useful,
#  but WITHOUT ANY WARRANTY; without even the implied warranty of
#  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
#  GNU General Public License for more details.
#
#  You should have received a copy of the GNU General Public License
#  along with this program.  If not, see <http://www.gnu.org/licenses/>.
#
# This script is not necessary to configure GNU ease.js; it is provided for
# convenience.
##


which autoreconf >/dev/null || {
  echo "fatal: missing autoreconf" >&2
  exit 1
}

exec autoreconf -fvi

