/**
 * Validation rules for members
 *
 *  Copyright (C) 2010 Mike Gerwitz
 *
 *  This file is part of ease.js.
 *
 *  ease.js is free software: you can redistribute it and/or modify it under the
 *  terms of the GNU Lesser General Public License as published by the Free
 *  Software Foundation, either version 3 of the License, or (at your option)
 *  any later version.
 *
 *  This program is distributed in the hope that it will be useful, but WITHOUT
 *  ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
 *  FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Lesser General Public License
 *  for more details.
 *
 *  You should have received a copy of the GNU Lesser General Public License
 *  along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 * @author  Mike Gerwitz
 * @package core
 */


module.exports = exports = function MemberBuilderValidator()
{
    // permit omitting 'new' keyword
    if ( !( this instanceof module.exports ) )
    {
        return new module.exports();
    }
};


/**
 * Validates a method declaration, ensuring that keywords are valid, overrides
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
exports.prototype.validateMethod = function(
    name, value, keywords, prev_data, prev_keywords
)
{
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

    // search for any previous instances of this member
    if ( prev )
    {
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
            throw TypeError(
                "Cannot override non-virtual method '" + name + "'"
            );
        }

        // do not allow overriding concrete methods with abstract
        if ( keywords[ 'abstract' ] && !( prev_keywords[ 'abstract' ] ) )
        {
            throw TypeError(
                "Cannot override concrete method '" + name + "' with " +
                    "abstract method"
            );
        }

        // ensure parameter list is at least the length of its supertype
        if ( ( value.__length || value.length )
            < ( prev.__length || prev.length )
        )
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

        // Disallow overriding method without override keyword (unless parent
        // method is abstract). In the future, this will provide a warning to
        // default to method hiding.
        if ( !( keywords[ 'override' ] || prev_keywords[ 'abstract' ] ) )
        {
            throw TypeError(
                "Attempting to override method '" + name +
                "' without 'override' keyword"
            );
        }
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

    // disallow overriding methods with properties
    if ( typeof prev === 'function' )
    {
        throw new TypeError(
            "Cannot override method '" + name + "' with property"
        );
    }

    // do not allow overriding getters/setters
    if ( prev_data && ( prev_data.get || prev_data.set ) )
    {
        throw TypeError(
            "Cannot override getter/setter '" + name + "' with property"
        );
    }

    // do not permit visibility de-escalation
    if ( prev &&
        ( this._getVisibilityValue( prev_keywords )
            < this._getVisibilityValue( keywords )
        )
    )
    {
        throw TypeError(
            "Cannot de-escalate visibility of property '" + name + "'"
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
    name, keywords, prev_data
)
{
    var prev = ( prev_data ) ? prev_data.member : null,

        prev_keywords = ( prev && prev.___$$keywords$$ )
            ? prev.___$$keywords$$
            : {}
    ;

    if ( prev )
    {
        // To speed up the system we'll simply check for a getter/setter, rather
        // than checking separately for methods/properties. This is at the
        // expense of more detailed error messages. They'll live.
        if ( !( prev_data.get || prev_data.set ) )
        {
            throw TypeError(
                "Cannot override method or property '" + name +
                    "' with getter/setter"
            );
        }
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

