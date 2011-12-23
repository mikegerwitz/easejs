
/**
 * ease.js namespace
 *
 * All modules will be available via this namespace. In CommonJS format, they
 * were accessed via the require() function. For example:
 *
 *   var util = require( 'easejs' ).Class;
 *
 * In this file, the above would be written as:
 *
 *   var util = easejs.Class;
 *
 * @type  {Object}
 */
var easejs = {};

( function( ns_exports )
{
    /**
     * CommonJS module exports
     *
     * Since this file contains all of the modules, this will be populated with
     * every module right off the bat.
     *
     * @type  {Object.<string,Object>}
     */
    var module = {};

    /**
     * Returns the requested module
     *
     * The require() function is likely unavailable client-side (within a web
     * browser). Therefore, we mock one. If it is available, this overwrites it.
     * Our modules are all preloaded in the exports object.
     *
     * @param  {string}  module_id  id of the module to load
     *
     * return tag intentionally omitted; too many potential return types and
     * setting return type of {*} will throw warnings for those attempting to
     * treat the return value as a function
     */
    var require = function( module_id )
    {
        // remove the './' directory prefix (every module is currently included
        // via a relative path), stupidly remove ../'s and remove .js extensions
        var id_clean = module_id.replace( /^\.?\/|[^/]*?\/\.\.\/|\.js$/, '' );

        // attempt to retrieve the module
        var mod = module[ id_clean ];
        if ( mod === undefined )
        {
            throw "[ease.js] Undefined module: " + module_id;
        }

        return mod.exports;
    };

/**{CONTENT}**/

    // the following should match the exports of /index.js
    ns_exports.Class         = module['class'].exports;
    ns_exports.AbstractClass = module['class_abstract'].exports;
    ns_exports.FinalClass    = module['class_final'].exports;
    ns_exports.Interface     = module['interface'].exports;
    ns_exports.version       = module['version'].exports;
} )( easejs );

