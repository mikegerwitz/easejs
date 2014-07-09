
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

( function( ns_exports, __cwd )
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
        // anything that is not an absolute require path will be prefixed
        // with __cwd, which is set by the combined module; this allows
        // including relative paths (but note that this also means that
        // modules that perform ad-hoc conditional requires after another
        // module has been processed may not work properly; we don't do
        // this, though)
        var id_norm = ( module_id.substr( 0, 1 ) === '/' )
            ? module_id
            : __cwd + '/' + module_id;

        // strip `../`, poorly strip `./` (for example, it would also strip
        // `foo./`, but we know that this won't ever be the case with our
        // files), and strip leading `/`
        var id_clean = id_norm.replace( /([^\/]+\/\.\.\/|\.\/|^\/)/g, '' );

        // attempt to retrieve the module
        var mod = module[ id_clean ];
        if ( mod === undefined )
        {
            throw "[ease.js] Undefined module: " + id_clean;
        }

        return mod.exports;
    };

/**{CONTENT}**/

    // the following should match the exports of /index.js
    ns_exports.Class         = module['class'].exports;
    ns_exports.AbstractClass = module['class_abstract'].exports;
    ns_exports.FinalClass    = module['class_final'].exports;
    ns_exports.Interface     = module['interface'].exports;
    ns_exports.Trait         = module['Trait'].exports;
    ns_exports.version       = module['version'].exports;
} )( easejs, '.' );

