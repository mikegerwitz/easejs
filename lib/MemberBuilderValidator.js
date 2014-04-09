/**
 * Validation rules for members
 *
 *  Copyright (C) 2011, 2012, 2013, 2014 Free Software Foundation, Inc.
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

module.exports = exports = function MemberBuilderValidator( warn_handler )
{
    // permit omitting 'new' keyword
    if ( !( this instanceof module.exports ) )
    {
        return new module.exports( warn_handler );
    }

    this._warningHandler = warn_handler || function() {};
};


/**
 * Initialize validation state if not already done
 *
 * @param  {Object}  state  validation state
 *
 * @return  {Object}  provided state object STATE
 */
exports.prototype._initState = function( state )
{
    if ( state.__vready ) return state;

    state.warn = {};
    state.__vready = true;
    return state;
};


/**
 * Perform post-processing on and invalidate validation state
 *
 * All queued warnings will be triggered.
 *
 * @param  {Object}  state  validation state
 *
 * @return  {undefined}
 */
exports.prototype.end = function( state )
{
    // trigger warnings
    for ( var f in state.warn )
    {
        var warns = state.warn[ f ];
        for ( var id in warns )
        {
            this._warningHandler( warns[ id ] );
        }
    }

    state.__vready = false;
};


/**
 * Enqueue warning within validation state
 *
 * @param  {Object}   state   validation state
 * @param  {string}   member  member name
 * @param  {string}   id      warning identifier
 * @param  {Warning}  warn    warning
 *
 * @return  {undefined}
 */
function _addWarn( state, member, id, warn )
{
    ( state.warn[ member ] = state.warn[ member ] || {} )[ id ] = warn;
}


/**
 * Remove warning from validation state
 *
 * @param  {Object}   state   validation state
 * @param  {string}   member  member name
 * @param  {string}   id      warning identifier
 *
 * @return  {undefined}
 */
function _clearWarn( state, member, id, warn )
{
    delete ( state.warn[ member ] || {} )[ id ];
}


/**
 * Validates a method declaration, ensuring that keywords are valid,
 * overrides make sense, etc.
 *
 * Throws exception on validation failure. Warnings are stored in the state
 * object for later processing. The state object will be initialized if it
 * has not been already; for the initial validation, the state object should
 * be empty.
 *
 * @param  {string}  name  method name
 * @param  {*}       value method value
 *
 * @param  {Object.<string,boolean>}  keywords  parsed keywords
 *
 * @param  {Object}  prev_data      data of member being overridden
 * @param  {Object}  prev_keywords  keywords of member being overridden
 *
 * @param  {Object}  state  pre-initialized state object
 *
 * @return {undefined}
 */
exports.prototype.validateMethod = function(
    name, value, keywords, prev_data, prev_keywords, state
)
{
    this._initState( state );

    var prev = ( prev_data ) ? prev_data.member : null;

    if ( keywords[ 'abstract' ] )
    {
        // do not permit private abstract methods (doesn't make sense, since
        // they cannot be inherited/overridden)
        if ( keywords[ 'private' ] )
        {
            throw TypeError(
                "Method '" + name + "' cannot be both private and abstract"
            );
        }
    }

    // const doesn't make sense for methods; they're always immutable
    if ( keywords[ 'const' ] )
    {
        throw TypeError(
            "Cannot declare method '" + name + "' as constant; keyword is " +
            "redundant"
        );
    }

    // virtual static does not make sense, as static methods cannot be
    // overridden
    if ( keywords[ 'virtual' ] && ( keywords[ 'static' ] ) )
    {
        throw TypeError(
            "Cannot declare static method '" + name + "' as virtual"
        );
    }

    // do not allow overriding getters/setters
    if ( prev_data && ( prev_data.get || prev_data.set ) )
    {
        throw TypeError(
            "Cannot override getter/setter '" + name + "' with method"
        );
    }

    if ( keywords[ 'proxy' ] )
    {
        // proxies are expected to provide the name of the destination object
        if ( typeof value !== 'string' )
        {
            throw TypeError(
                "Cannot declare proxy method '" + name + "'; string value " +
                    "expected"
            );
        }
        else if ( keywords[ 'abstract' ] )
        {
            // proxies are always concrete
            throw TypeError(
                "Proxy method '" + name + "' cannot be abstract"
            );
        }
    }

    // search for any previous instances of this member
    if ( prev )
    {
        // perform this check first, as it will make more sense than those that
        // follow, should this condition be satisfied
        if ( prev_keywords[ 'private' ] )
        {
            throw TypeError(
                "Private member name '" + name + "' conflicts with supertype"
            );
        }

        // disallow overriding properties with methods
        if ( !( typeof prev === 'function' ) )
        {
            throw TypeError(
                "Cannot override property '" + name + "' with method"
            );
        }

        // disallow overriding non-virtual methods
        if ( keywords[ 'override' ] && !( prev_keywords[ 'virtual' ] ) )
        {
            if ( !( keywords[ 'abstract' ] ) )
            {
                throw TypeError(
                    "Cannot override non-virtual method '" + name + "'"
                );
            }

            // at this point, we have `abstract override'
            if ( !( prev_keywords[ 'abstract' ] ) )
            {
                // TODO: test me
                throw TypeError(
                    "Cannot perform abstract override on non-abstract " +
                    "method '" + name + "'"
                );
            }
        }

        // do not allow overriding concrete methods with abstract unless the
        // abstract method is weak
        if ( keywords[ 'abstract' ]
            && !( keywords.weak )
            && !( prev_keywords[ 'abstract' ] )
        )
        {
            throw TypeError(
                "Cannot override concrete method '" + name + "' with " +
                    "abstract method"
            );
        }


        var lenprev = ( prev.__length === undefined )
            ? prev.length
            : prev.__length;

        var lennow = ( value.__length === undefined )
            ? value.length
            : value.__length;

        if ( keywords[ 'proxy' ] )
        {
            // otherwise we'd be checking against the length of a string.
            lennow = NaN;
        }

        if ( keywords.weak && !( prev_keywords[ 'abstract' ] ) )
        {
            // weak abstract declaration found after its concrete
            // definition; check in reverse order
            var tmp = lenprev;
            lenprev = lennow;
            lennow = tmp;
        }

        // ensure parameter list is at least the length of its supertype
        if ( lennow < lenprev )
        {
            throw TypeError(
                "Declaration of method '" + name + "' must be compatible " +
                    "with that of its supertype"
            );
        }

        // do not permit visibility deescalation
        if ( this._getVisibilityValue( prev_keywords ) <
            this._getVisibilityValue( keywords )
        )
        {
            throw TypeError(
                "Cannot de-escalate visibility of method '" + name + "'"
            );
        }

        // Disallow overriding method without override keyword (unless
        // parent method is abstract). In the future, this will provide a
        // warning to default to method hiding. Note the check for a
        if ( !( keywords[ 'override' ]
            || prev_keywords[ 'abstract' ]
            || keywords.weak
        ) )
        {
            throw TypeError(
                "Attempting to override method '" + name +
                "' without 'override' keyword"
            );
        }

        // prevent non-override warning
        if ( keywords.weak && prev_keywords[ 'override' ] )
        {
            _clearWarn( state, name, 'no' );
        }
    }
    else if ( keywords[ 'override' ] )
    {
        // using the override keyword without a super method may indicate a bug,
        // but it shouldn't stop the class definition (it doesn't adversely
        // affect the functionality of the class, unless of course the method
        // attempts to reference a supertype)
        _addWarn( state, name, 'no', Error(
            "Method '" + name +
            "' using 'override' keyword without super method"
        ) );
    }
};


/**
 * Validates a property declaration, ensuring that keywords are valid, overrides
 * make sense, etc.
 *
 * Throws exception on validation failure
 *
 * @param  {string}  name  method name
 * @param  {*}       value method value
 *
 * @param  {Object.<string,boolean>}  keywords  parsed keywords
 *
 * @param  {Object}  prev_data      data of member being overridden
 * @param  {Object}  prev_keywords  keywords of member being overridden
 *
 * @return {undefined}
 */
exports.prototype.validateProperty = function(
    name, value, keywords, prev_data, prev_keywords
)
{
    var prev = ( prev_data ) ? prev_data.member : null;

    // do not permit visibility de-escalation
    if ( prev )
    {
        // perform this check first, as it will make more sense than those that
        // follow, should this condition be satisfied
        if ( prev_keywords[ 'private' ] )
        {
            throw TypeError(
                "Private member name '" + name + "' conflicts with supertype"
            );
        }

        // disallow overriding methods with properties
        if ( typeof prev === 'function' )
        {
            throw new TypeError(
                "Cannot override method '" + name + "' with property"
            );
        }

        if ( this._getVisibilityValue( prev_keywords )
            < this._getVisibilityValue( keywords )
        )
        {
            throw TypeError(
                "Cannot de-escalate visibility of property '" + name + "'"
            );
        }
    }

    // do not allow overriding getters/setters
    if ( prev_data && ( prev_data.get || prev_data.set ) )
    {
        throw TypeError(
            "Cannot override getter/setter '" + name + "' with property"
        );
    }

    // abstract properties do not make sense
    if ( keywords[ 'abstract' ] )
    {
        throw TypeError(
            "Property '" + name + "' cannot be declared as abstract"
        );
    }

    // constants are static
    if ( keywords[ 'static' ] && keywords[ 'const' ] )
    {
        throw TypeError(
            "Static keyword cannot be used with const for property '" +
            name + "'"
        );
    }

    // properties are inherently virtual
    if ( keywords['virtual'] )
    {
        throw TypeError( "Cannot declare property '" + name + "' as virtual" );
    }
};


/**
 * Performs common validations on getters/setters
 *
 * If a problem is found, an exception will be thrown.
 *
 * @param  {string}                   name      getter/setter name
 * @param  {Object.<string,boolean>}  keywords  parsed keywords
 *
 * @return {undefined}
 */
exports.prototype.validateGetterSetter = function(
    name, value, keywords, prev_data, prev_keywords
)
{
    var prev    = ( prev_data ) ? prev_data.member : null,
        prev_gs = ( ( prev_data && ( prev_data.get || prev_data.set ) )
            ? true
            : false
        )
    ;

    // abstract getters/setters are not yet supported
    if ( keywords[ 'abstract' ] )
    {
        throw TypeError(
            "Cannot declare getter/setter '" + name + "' as abstract"
        );
    }

    // for const getters/setters, omit the setter
    if ( keywords[ 'const' ] )
    {
        throw TypeError(
            "Cannot declare const getter/setter '" + name + "'"
        );
    }

    // virtual static does not make sense, as static methods cannot be
    // overridden
    if ( keywords[ 'virtual' ] && ( keywords[ 'static' ] ) )
    {
        throw TypeError(
            "Cannot declare static method '" + name + "' as virtual"
        );
    }

    if ( prev || prev_gs )
    {
        // perform this check first, as it will make more sense than those that
        // follow, should this condition be satisfied
        if ( prev_keywords && prev_keywords[ 'private' ] )
        {
            throw TypeError(
                "Private member name '" + name + "' conflicts with supertype"
            );
        }

        // To speed up the system we'll simply check for a getter/setter, rather
        // than checking separately for methods/properties. This is at the
        // expense of more detailed error messages. They'll live.
        if ( !( prev_gs ) )
        {
            throw TypeError(
                "Cannot override method or property '" + name +
                    "' with getter/setter"
            );
        }

        if ( !( prev_keywords && prev_keywords[ 'virtual' ] ) )
        {
            throw TypeError(
                "Cannot override non-virtual getter/setter '" + name + "'"
            );
        }

        if ( !( keywords[ 'override' ] ) )
        {
            throw TypeError(
                "Attempting to override getter/setter '" + name +
                "' without 'override' keyword"
            );
        }

        // do not permit visibility de-escalation
        if ( this._getVisibilityValue( prev_keywords || {} )
            < this._getVisibilityValue( keywords )
        )
        {
            throw TypeError(
                "Cannot de-escalate visibility of getter/setter '" + name + "'"
            );
        }
    }
    else if ( keywords[ 'override' ] )
    {
        // using the override keyword without a super method may indicate a bug
        // in the user's code
        this._warningHandler( Error(
            "Getter/setter '" + name +
            "' using 'override' keyword without super getter/setter"
        ) );
    }
}


/**
 * Return the visibility level as a numeric value, where 0 is public and 2 is
 * private
 *
 * @param  {Object}  keywords  keywords to scan for visibility level
 *
 * @return  {number}  visibility level as a numeric value
 */
exports.prototype._getVisibilityValue = function( keywords )
{
    if ( keywords[ 'protected' ] )
    {
        return 1;
    }
    else if ( keywords[ 'private' ] )
    {
        return 2;
    }
    else
    {
        // default is public
        return 0;
    }
}

