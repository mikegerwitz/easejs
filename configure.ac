# For use by automake and autoconf
#
#  Copyright (C) 2013, 2014 Free Software Foundation, Inc.
#
#  This file is part of GNU ease.js.
#
#  This program is free software: you can redistribute it and/or modify
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
##

# version string is dynamically generated
m4_define([ver], m4_esyscmd(./tools/vergen))
m4_if(ver, [], [m4_exit(1)])

AC_INIT([easejs], [ver], [bug-easejs@gnu.org])
AC_CONFIG_AUX_DIR([tools])
AM_INIT_AUTOMAKE([foreign])

# provide more granular version numbers based on the version string, using
# the format MAJOR.MINOR.REV[-SUFFIX], where SUFFIX can itself contain
# dashes (and often will)
m4_define([ver_split],
  m4_split(
    patsubst(AC_PACKAGE_VERSION, [^\([^-]+\)-], [\1.]),
    [\.]))
AC_SUBST(MAJOR, m4_argn(1, ver_split))
AC_SUBST(MINOR, m4_argn(2, ver_split))
AC_SUBST(REV, m4_argn(3, ver_split))
AC_SUBST(SUFFIX, m4_argn(4, ver_split))

AC_PROG_MKDIR_P

# check for node, which is required for nearly every operation
AC_ARG_VAR([NODE], [The node.js interpreter])
AC_CHECK_PROGS(NODE, [node nodejs])
AM_CONDITIONAL(HAS_NODE, [test "$NODE"])

# certain portions of the build process require that node be installed (in the
# future, we may be able to allow alternatives, such as SpiderMonkey)
test "$NODE" || AC_MSG_WARN([

  Node.js is not installed; certain make targets have been disabled.
])

# yes, this isn't necessarily a good practice, however the directory itself can
# be loaded and used without being built, so it's important that our resulting
# file includes exactly what is contained within the dir and is rebuilt if /any/
# of the files change
AC_MSG_CHECKING([for source js files])
SRC_JS_LIB="$(find lib/*.js | tr '\n' ' ' )"
SRC_JS="index.js $SRC_JS_LIB"
AC_SUBST(SRC_JS)
if test -n "$SRC_JS_LIB"; then
    AC_MSG_RESULT(ok)
else
    AC_MSG_ERROR(failed!)
fi

# Java is used for Closure Compiler
AC_ARG_VAR([JAVA], [The Java executable])
AC_ARG_VAR([CCJAR], [The Clojure Compiler jar file])
AC_CHECK_PROGS(JAVA, [java])
AM_CONDITIONAL(HAS_JAVA, [test "$JAVA"])

ccjar=
AS_IF(test "$JAVA" -a ! "$CCJAR",
  [AC_CHECK_FILE([$srcdir/tools/closure-compiler.jar],
        [AC_SUBST([CCJAR], [$srcdir/tools/closure-compiler.jar])],
        [AC_MSG_NOTICE([

    If you wish perform minification of the combined source file, you must
    download closure-compiler.jar into the tools sub-directory; it is
    available here:

    https://developers.google.com/closure/compiler/

    If it is installed elsewhere on your system, specify its location with
    the CCJAR environment variable.
  ])])], [])

AM_CONDITIONAL(HAS_CCJAR, [test "$CCJAR"])

# check for performance tests
AC_MSG_CHECKING([for performance tests])
PERF_TESTS=$( find test/perf -name 'perf-*.js' | tr '\n' ' ' )
AC_SUBST(PERF_TESTS)
AS_IF([test "$PERF_TESTS"], [AC_MSG_RESULT(ok)], [AC_MSG_WARN(none found)])

AC_CONFIG_FILES([Makefile doc/Makefile package.json lib/version.js])
AC_CONFIG_FILES([test/runner], [chmod +x test/runner])
AC_CONFIG_FILES([test/perf/runner], [chmod +x test/perf/runner])

AC_OUTPUT
