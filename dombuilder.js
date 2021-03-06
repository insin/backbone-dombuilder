//////////////////////////////////////
//                                  //
// JS domBuilder Library            //
//                                  //
// Tim Caswell <tim@creationix.com> //
//                                  //
//////////////////////////////////////

( // Module boilerplate to support browser globals and AMD.
  (typeof define === "function" && function (m) { define("dombuilder", m); }) ||
  (function (m) { window.domBuilder = m(); })
)(function () {
"use strict";

function domBuilder(json, refs) {

  // Render strings as text nodes
  if (typeof json === 'string') return document.createTextNode(json);

  // Pass through html elements as-is
  if (_.isElement(json)) return json;

  // Stringify any other value types
  if (!_.isArray(json)) return document.createTextNode(json + "");

  // Empty arrays are just empty fragments.
  if (!json.length) return document.createDocumentFragment();

  var node, first;
  for (var i = 0, l = json.length; i < l; i++) {
    var part = json[i];

    if (!node) {
      if (typeof part === 'string') {
        // Create a new dom node by parsing the tagline
        var tag = part.match(TAG_MATCH);
        tag = tag ? tag[0] : "div";
        node = document.createElement(tag);
        first = true;
        var classes = part.match(CLASS_MATCH);
        if (classes) node.setAttribute('class', _.map(classes, stripFirst).join(' '));
        var id = part.match(ID_MATCH);
        if (id) node.setAttribute('id', id[0].substr(1));
        var ref = part.match(REF_MATCH);
        if (refs && ref) refs[ref[0].substr(1)] = node;
        continue;
      } else {
        node = document.createDocumentFragment();
      }
    }

    // Except the first item if it's an attribute object
    if (first && typeof part === 'object' && (part.__proto__
                                              ? part.__proto__ === Object.prototype
                                              : jQuery.isPlainObject(part))) {
      setAttrs(node, part);
    } else {
      node.appendChild(domBuilder(part, refs));
    }
    first = false;
  }
  return node;
};

function setAttrs(node, attrs) {
  var keys = _.keys(attrs);
  for (var i = 0, l = keys.length; i < l; i++) {
    var key = keys[i];
    var value = attrs[key];
    if (key === "$") {
      value(node);
    } else if (key === "css") {
      setStyle(node.style, value);
    } else if (key.substr(0, 2) === "on") {
      if (node.addEventListener) {
        node.addEventListener(key.substr(2), value, false)
      }
      else {
        node[key] = value;
      }
    } else {
      node.setAttribute(key, value);
    }
  }
}

function setStyle(style, attrs) {
  var keys = _.keys(attrs);
  for (var i = 0, l = keys.length; i < l; i++) {
    var key = keys[i];
    style[key] = attrs[key];
  }
}

var CLASS_MATCH = /\.[^.#$]+/g,
    ID_MATCH = /#[^.#$]+/,
    REF_MATCH = /\$[^.#$]+/,
    TAG_MATCH = /^[^.#$]+/;

function stripFirst(part) {
  return part.substr(1);
}

return domBuilder;

});
