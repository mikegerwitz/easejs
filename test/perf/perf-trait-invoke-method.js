/**
 * Tests amount of time taken to apply trait (mixin) methods
 *
 *  Copyright (C) 2014 Free Software Foundation, Inc.
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
 *
 * Contrast with respective class tests.
 *
 * Note that there is a lot of code duplication; this is to reduce
 * unnecessary lookups for function invocation to gain a more accurate
 * estimate of invocation time (e.g., no foo[ bar ]()).
 *
 * Traits are expected to be considerably slower than conventional classes
 * due to their very nature---dynamically bound methods. This should not be
 * alarming under most circumstances, as the method invocation is still
 * likely much faster than any serious logic contained within the method;
 * however, performance issues could manifest when recursing heavily, so be
 * cognisant of such.
 *
 * There is, at least at the time of writing this message, much room for
 * optimization in the trait implementation.
 */

var common    = require( __dirname + '/common.js' ),
    Trait     = common.require( 'Trait' ),
    Class     = common.require( 'class' ),
    Interface = common.require( 'interface' ),

    // misc. var used to ensure that v8 does not optimize away empty
    // functions
    x = 0,

    // method invocation is pretty speedy, so we need a lot of iterations
    count = 500000
;

// objects should be pre-created; we don't care about the time taken to
// instantiate them
var T = Trait(
{
    'public pub':     function() { x++ },
    'protected prot': function() { x++ },

    'virtual public vpub':  function() { x++ },
    'virtual public vprot': function() { x++ },

    'virtual public vopub':  function() { x++ },
    'virtual public voprot': function() { x++ },
} );

var I = Interface(
{
    'public aopub': [],
    'public vaopub': [],
} );

var Ta = Trait.implement( I ).extend(
{
    // TODO: protected once we support extending classes
    'abstract public override aopub': function() { x++ },
    'virtual abstract public override vaopub': function() { x++ },
} );

var o = Class.use( T ).extend(
{
    // overrides T mixin
    'override public vopub':  function() { x++ },
    'override public voprot': function() { x++ },

    // overridden by Ta mixin
    'virtual public aopub':  function() { x++ },
    'virtual public vaopub': function() { x++ },


    'public internalTest': function()
    {
        var _self = this;

        common.test( function()
        {
            var i = count;
            while ( i-- ) _self.pub();
        }, count, "Invoke public mixin method internally" );


        common.test( function()
        {
            var i = count;
            while ( i-- ) _self.prot();
        }, count, "Invoke protected mixin method internally" );

        vtest( this, "internally" );
    },
} ).use( Ta )();


common.test( function()
{
    var i = count;
    while ( i-- )
    {
        o.pub();
    }
}, count, "Invoke public mixin method externally" );


// run applicable external virtual tests
vtest( o, "externally" );


function vtest( context, s )
{
    common.test( function()
    {
        var i = count;
        while ( i-- ) context.vpub();
    }, count, "Invoke public virtual mixin method " + s );

    common.test( function()
    {
        var i = count;
        while ( i-- ) context.vopub();
    }, count, "Invoke public overridden virtual mixin method " + s );

    common.test( function()
    {
        var i = count;
        while ( i-- ) context.aopub();
    }, count, "Invoke public abstract override mixin method " + s );

    common.test( function()
    {
        var i = count;
        while ( i-- ) context.vaopub();
    }, count, "Invoke public virtual abstract override mixin method " + s );


    if ( !( context.vprot ) ) return;


    common.test( function()
    {
        var i = count;
        while ( i-- ) context.vprot();
    }, count, "Invoke protected virtual mixin method " + s );

    common.test( function()
    {
        var i = count;
        while ( i-- ) context.voprot();
    }, count, "Invoke protected overridden virtual mixin method " + s );
}


// run tests internally
o.internalTest();
