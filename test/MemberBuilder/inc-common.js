/**
 * Shared functions for MemberBuilder tests
 *
 *  Copyright (C) 2011, 2013, 2014 Free Software Foundation, Inc.
 *
 *  This file is part of GNU ease.js.
 *
 *  ease.js is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

/**
 * Perform common assertions on validator arguments
 *
 * @param {Object}     testcase   test case being executed
 * @param {arguments}  args       arguments to check
 * @param {string}     name       member name
 * @param {*}          value      expected value
 * @param {Object}     keywords   expected keywords
 * @param {Object}     state      validation state
 * @param {function()} prevLookup function to look up prev member data
 *
 * @return {undefined}
 */
exports.testArgs = function(
    testcase, args, name, value, keywords, state, prevLookup
)
{
    var prev = {
        value:    { expected: null, given: args[ 3 ] },
        keywords: { expected: null, given: args[ 4 ] },
    };

    prev = prevLookup( prev, prev.value.given, prev.keywords.given );

    testcase.assertEqual( name, args[ 0 ],
        "Incorrect name passed to validator"
    );

    testcase.assertDeepEqual( value, args[ 1 ],
        "Incorrect value passed to validator"
    );

    testcase.assertStrictEqual( keywords, args[ 2 ],
        "Incorrect keywords passed to validator"
    );

    testcase.assertStrictEqual( prev.value.expected, prev.value.given,
        "Previous data should contain prev value if overriding, " +
        "otherwise null"
    );

    testcase.assertDeepEqual( prev.keywords.expected, prev.keywords.given,
        "Previous keywords should contain prev keyword if " +
        "overriding, otherwise null"
    );

    testcase.assertStrictEqual( state, args[ 5 ],
        "State object was not passed to validator"
    );
};
