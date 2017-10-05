
"use strict";
/* 
author: yarakanigara
lao shi: nckprsn
*/

function offset(elt) {
  var rect = elt.getBoundingClientRect();
  var bodyElt = document.body;
  return {
    top: rect.top + bodyElt.scrollTop,
    left: rect.left + bodyElt.scrollLeft
  };
}

function scrollmeJs() {
  // ----------------------------------------------------------------------------------------------------
  // ScrollMe object
  var _this = {};
  // ----------------------------------------------------------------------------------------------------
  // Properties
  var $document = document;
  var $window = window;
  _this.body_height = 0;
  _this.viewport_height = 0;
  _this.viewport_top = 0;
  _this.viewport_bottom = 0;
  _this.viewport_top_previous = -1;
  _this.elements = [];
  _this.elements_in_view = [];
  _this.property_defaults = {
    opacity: 1,
    translatex: 0,
    translatey: 0,
    translatez: 0,
    rotatex: 0,
    rotatey: 0,
    rotatez: 0,
    scale: 1,
    scalex: 1,
    scaley: 1,
    scalez: 1
  };
  _this.scrollme_selector = 'scrollme';
  _this.animateme_selector = '.animateme';
  _this.animateme_name = 'animateme';
  _this.update_interval = 10;
  // Easing functions
  _this.easing_functions = {
    linear: function (x) {
      return x;
    },
    easeout: function (x) {
      return x * x * x;
    },
    easein: function (x) {
      x = 1 - x;
      return 1 - x * x * x;
    },
    easeinout: function (x) {
      if (x < 0.5) {
        return 4 * x * x * x;
      }
      else {
        x = 1 - x;
        return 1 - 4 * x * x * x;
      }
    }
  };
  // Document events to bind initialisation to
  _this.init_events = [
    'ready',
    'page:load',
    'page:change' // Turbolinks
  ];
  // ----------------------------------------------------------------------------------------------------
  // Initialisation conditions
  _this.init_if = function () {
    return true;
  };
  // ----------------------------------------------------------------------------------------------------
  // Initialisation
  _this.init = function () {
    // Cancel if initialisation conditions not met
    if (!_this.init_if())
      return false;
    // Load all elements to animate
    _this.init_elements();
    // Get element & viewport sizes
    _this.on_resize();
    // Recalculate heights & positions on resize and rotate
    $window.onresize = _this.on_resize;
    // Recalculate heights & positions when page is fully loaded + a bit just in case
    $window.onload = function () {
      setTimeout(function () {
        _this.on_resize();
      }, 100);
    };
    // Start animating
    setInterval(_this.update, _this.update_interval);
    return true;
  };
  // ----------------------------------------------------------------------------------------------------
  // Get list and pre-load animated elements
  _this.init_elements = function () {
    // For each reference element
    var scrollmeList = $document.getElementsByClassName(_this.scrollme_selector);
    Array.prototype.forEach.call(scrollmeList, function (scrollme) {
      var element = {};
      element.element = scrollme;
      var effects = [];
      // For each animated element
      var childAnimates = scrollme.getElementsByClassName(_this.animateme_name);
      var animateList = [];
      [].forEach.call(childAnimates, function (child) {
        animateList.push(child);
      });
      if (scrollme.classList.contains(_this.animateme_name)) {
        animateList.unshift(scrollme);
      }
      [].forEach.call(animateList, function (animate) {

        // Get effect details
        var effect = {};
        effect.element = animate;
        effect.when = effect.element.dataset.when;
        effect.from = effect.element.dataset.from;
        effect.to = effect.element.dataset.to;
        if (effect.element.dataset.dataCrop) {
          effect.crop = effect.element.dataset.crop;
        }
        else {
          effect.crop = true;
        }
        if (effect.element.dataset.dataEasing) {
          effect.easing = _this.easing_functions[effect.element.dataset.easing];
        }
        else {
          effect.easing = _this.easing_functions['easeout'];
        }
        // Get animated properties
        var properties = {};
        if (effect.element.dataset.opacity)
          properties.opacity = Number(effect.element.dataset.opacity);
        if (effect.element.dataset.translatex)
          properties.translatex = effect.element.dataset.translatex;
        if (effect.element.dataset.translatey)
          properties.translatey = effect.element.dataset.translatey;
        if (effect.element.dataset.translatez)
          properties.translatez = effect.element.dataset.translatez;
        if (effect.element.dataset.rotatex)
          properties.rotatex = effect.element.dataset.rotatex;
        if (effect.element.dataset.rotatey)
          properties.rotatey = effect.element.dataset.rotatey;
        if (effect.element.dataset.rotatez)
          properties.rotatez = effect.element.dataset.rotatez;
        if (effect.element.dataset.scale)
          properties.scale = effect.element.dataset.scale;
        if (effect.element.dataset.scalex)
          properties.scalex = effect.element.dataset.scalex;
        if (effect.element.dataset.scaley)
          properties.scaley = effect.element.dataset.scaley;
        if (effect.element.dataset.scalez)
          properties.scalez = effect.element.dataset.scalez;
        effect.properties = properties;
        effects.push(effect);
      });
      element.effects = effects;
      _this.elements.push(element);
    });
  };
  // ----------------------------------------------------------------------------------------------------
  // Update elements
  _this.update = function () {
    $window.requestAnimationFrame(function () {
      _this.update_viewport_position();
      if (_this.viewport_top_previous !== _this.viewport_top) {
        _this.update_elements_in_view();
        _this.animate();
      }
      _this.viewport_top_previous = _this.viewport_top;
    });
  };
  // ----------------------------------------------------------------------------------------------------
  // Animate stuff
  _this.animate = function () {
    // For each element in viewport
    var elements_in_view_length = _this.elements_in_view.length;
    for (var i = 0; i < elements_in_view_length; i++) {
      var element = _this.elements_in_view[i];
      // For each effect
      var effects_length = element.effects.length;
      for (var e = 0; e < effects_length; e++) {
        var effect = element.effects[e];
        // Get effect animation boundaries
        var start = 0;
        var end = 0;
        switch (effect.when) {
          case 'view': // Maintained for backwards compatibility
          case 'span': {
            start = element.top - _this.viewport_height;
            end = element.bottom;
            break;
          }
          case 'exit': {
            start = element.bottom - _this.viewport_height;
            end = element.bottom;
            break;
          }
          default: {
            start = element.top - _this.viewport_height;
            end = element.top;
            break;
          }
        }
        // Crop boundaries
        if (effect.crop) {
          if (start < 0)
            start = 0;
          if (end > (_this.body_height - _this.viewport_height))
            end = _this.body_height - _this.viewport_height;
        }
        // Get scroll position of reference selector
        var scroll_1 = (_this.viewport_top - start) / (end - start);
        // Get relative scroll position for effect
        var from = effect['from'];
        var to = effect['to'];
        var length_1 = to - from;
        var scroll_relative = (scroll_1 - from) / length_1;
        // Apply easing
        var scroll_eased = effect.easing(scroll_relative);
        // Get new value for each property
        var opacity = _this.animate_value(scroll_1, scroll_eased, from, to, effect, 'opacity');
        var translatey = _this.animate_value(scroll_1, scroll_eased, from, to, effect, 'translatey');
        var translatex = _this.animate_value(scroll_1, scroll_eased, from, to, effect, 'translatex');
        var translatez = _this.animate_value(scroll_1, scroll_eased, from, to, effect, 'translatez');
        var rotatex = _this.animate_value(scroll_1, scroll_eased, from, to, effect, 'rotatex');
        var rotatey = _this.animate_value(scroll_1, scroll_eased, from, to, effect, 'rotatey');
        var rotatez = _this.animate_value(scroll_1, scroll_eased, from, to, effect, 'rotatez');
        var scale = _this.animate_value(scroll_1, scroll_eased, from, to, effect, 'scale');
        var scalex = _this.animate_value(scroll_1, scroll_eased, from, to, effect, 'scalex');
        var scaley = _this.animate_value(scroll_1, scroll_eased, from, to, effect, 'scaley');
        var scalez = _this.animate_value(scroll_1, scroll_eased, from, to, effect, 'scalez');
        // Override scale values
        if ('scale' in effect.properties) {
          scalex = scale;
          scaley = scale;
          scalez = scale;
        }
        // Update properties
        effect.element.style.opacity = opacity;
        effect.element.style.transform = 'translate3d( ' + translatex + 'px , ' + translatey + 'px , ' + translatez + 'px ) rotateX( ' + rotatex + 'deg ) rotateY( ' + rotatey + 'deg ) rotateZ( ' + rotatez + 'deg ) scale3d( ' + scalex + ' , ' + scaley + ' , ' + scalez + ' )';
      }
    }
  };
  // ----------------------------------------------------------------------------------------------------
  // Calculate property values
  _this.animate_value = function (scroll, scroll_eased, from, to, effect, property) {
    var value_default = _this.property_defaults[property];
    // Return default value if property is not animated
    if (!(property in effect.properties))
      return value_default;
    var value_target = effect.properties[property];
    var forwards = (to > from) ? true : false;
    // Return boundary value if outside effect boundaries
    if (scroll < from && forwards) {
      return value_default;
    }
    if (scroll > to && forwards) {
      return value_target;
    }
    if (scroll > from && !forwards) {
      return value_default;
    }
    if (scroll < to && !forwards) {
      return value_target;
    }
    // Calculate new property value
    var new_value = value_default + (scroll_eased * (value_target - value_default));
    // Round as required
    switch (property) {
      case 'opacity':
        new_value = new_value.toFixed(2);
        break;
      case 'translatex':
        new_value = new_value.toFixed(0);
        break;
      case 'translatey':
        new_value = new_value.toFixed(0);
        break;
      case 'translatez':
        new_value = new_value.toFixed(0);
        break;
      case 'rotatex':
        new_value = new_value.toFixed(1);
        break;
      case 'rotatey':
        new_value = new_value.toFixed(1);
        break;
      case 'rotatez':
        new_value = new_value.toFixed(1);
        break;
      case 'scale':
        new_value = new_value.toFixed(3);
        break;
      default: break;
    }
    // Done
    return new_value;
  };
  // ----------------------------------------------------------------------------------------------------
  // Update viewport position
  _this.update_viewport_position = function () {
    _this.viewport_top = $window.pageYOffset !== undefined ? $window.pageYOffset : $document.body.scrollTop;
    _this.viewport_bottom = _this.viewport_top + _this.viewport_height;
  };
  // ----------------------------------------------------------------------------------------------------
  // Update list of elements in view
  _this.update_elements_in_view = function () {
    _this.elements_in_view = [];
    var elements_length = _this.elements.length;
    for (var i = 0; i < elements_length; i++) {
      if ((_this.elements[i].top < _this.viewport_bottom) && (_this.elements[i].bottom > _this.viewport_top)) {
        _this.elements_in_view.push(_this.elements[i]);
      }
    }
  };
  // ----------------------------------------------------------------------------------------------------
  // Stuff to do on resize
  _this.on_resize = function () {
    // Update viewport/element data
    _this.update_viewport();
    _this.update_element_heights();
    // Update display
    _this.update_viewport_position();
    _this.update_elements_in_view();
    _this.animate();
  };
  // ----------------------------------------------------------------------------------------------------
  // Update viewport parameters
  _this.update_viewport = function () {
    _this.body_height = $document.body.clientHeight;
    _this.viewport_height = $window.innerHeight;
  };
  // ----------------------------------------------------------------------------------------------------
  // Update height of animated elements
  _this.update_element_heights = function () {
    var elements_length = _this.elements.length;
    for (var i = 0; i < elements_length; i++) {
      var element_height = _this.elements[i].element.offsetHeight;
      var position = offset(_this.elements[i].element);
      _this.elements[i].height = element_height;
      _this.elements[i].top = position.top;
      _this.elements[i].bottom = position.top + element_height;
    }
  };
  // ----------------------------------------------------------------------------------------------------
  // Bind initialisation
  (_this.init_events.join(' ').split(' ')).forEach(function (e) {
    $document.addEventListener(e, _this.init(), false);
  });
  // ----------------------------------------------------------------------------------------------------
  return _this;

}
exports.scrollme = scrollme;
;
