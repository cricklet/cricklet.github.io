/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;
/******/
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var _keys = __webpack_require__(1);
	
	var _keys2 = _interopRequireDefault(_keys);
	
	var _extends2 = __webpack_require__(36);
	
	var _extends3 = _interopRequireDefault(_extends2);
	
	var _slicedToArray2 = __webpack_require__(43);
	
	var _slicedToArray3 = _interopRequireDefault(_slicedToArray2);
	
	var _regenerator = __webpack_require__(69);
	
	var _regenerator2 = _interopRequireDefault(_regenerator);
	
	var _getIterator2 = __webpack_require__(65);
	
	var _getIterator3 = _interopRequireDefault(_getIterator2);
	
	var _from = __webpack_require__(73);
	
	var _from2 = _interopRequireDefault(_from);
	
	var _values = __webpack_require__(80);
	
	var _values2 = _interopRequireDefault(_values);
	
	var _defineProperty2 = __webpack_require__(84);
	
	var _defineProperty3 = _interopRequireDefault(_defineProperty2);
	
	var _set = __webpack_require__(88);
	
	var _set2 = _interopRequireDefault(_set);
	
	var _assign = __webpack_require__(37);
	
	var _assign2 = _interopRequireDefault(_assign);
	
	var _RIGHT_PLAYER_IMAGES2, _PLAYER_IMAGES, _RIGHT_ALIEN_IMAGES2, _ALIEN_IMAGES, _ALTERNATE_BODY_COLOR;
	
	var _canvas = __webpack_require__(106);
	
	var Canvas = _interopRequireWildcard(_canvas);
	
	var _utils = __webpack_require__(107);
	
	var Utils = _interopRequireWildcard(_utils);
	
	var _observeJs = __webpack_require__(113);
	
	var _lazy = __webpack_require__(115);
	
	var Lazy = _interopRequireWildcard(_lazy);
	
	var _types = __webpack_require__(116);
	
	function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	var _marked = [allCharacters, characterCarriers, inDepthOrder].map(_regenerator2.default.mark);
	
	var FPS = 60.0;
	var DT = 1.0 / FPS;
	
	var ANIM_FPS = 8.0;
	
	var PLAYER_HEIGHT = 1;
	var PLAYER_WIDTH = 0.875;
	var ROOM_WIDTH = 8;
	var ROOM_HEIGHT = 2.5;
	
	var FLOOR_HEIGHT = 0.3;
	var FURNITURE_HEIGHT = 0.6;
	var WALL_START_HEIGHT = 0.65;
	
	var BUTTON_COOLOFF = 0.5;
	var TELEPORT_COOLOFF = 0.5;
	
	function transformToPixels(units) {
	  return units * 75;
	}
	function transformToUnits(pixels) {
	  return pixels / 75.0;
	}
	
	var CANVAS_WIDTH = transformToPixels(ROOM_WIDTH);
	var CANVAS_HEIGHT = transformToPixels(ROOM_HEIGHT);
	var CANVAS_PLAYER_HEIGHT = transformToPixels(PLAYER_HEIGHT);
	
	function genId() {
	  return Math.random().toString().substring(2, 6);
	}
	
	function stringToHash(s) {
	  // from http://stackoverflow.com/questions/7616461/generate-a-hash-from-string-in-javascript-jquery
	  var hash = 0,
	      i = 0,
	      len = s.length,
	      chr = void 0;
	  while (i < len) {
	    hash = (hash << 5) - hash + s.charCodeAt(i++) << 0;
	  }
	  return hash;
	};
	
	function defaultAnimation() {
	  return {
	    kind: 'animation',
	    direction: _types.DirectionEnum.LEFT,
	    animation: _types.CharacterAnimationEnum.STAND,
	    time: 0
	  };
	}
	
	function defaultCarrier() {
	  return {
	    kind: 'carrier',
	    carrying: undefined
	  };
	}
	
	function defaultCarriable() {
	  return {
	    kind: 'carriable'
	  };
	}
	
	function defaultInteractor() {
	  return {
	    kind: 'interactor'
	  };
	}
	
	function defaultAI() {
	  return {
	    kind: 'ai',
	    actions: [],
	    nextThink: Math.random() + 0.5
	  };
	}
	
	function generateCrewMember(x, roomIndex, type) {
	  return {
	    kind: 'crew',
	    id: genId(),
	    x: x, y: 0, vx: 0, vy: 0, ax: 0, ay: 0,
	    width: PLAYER_WIDTH,
	    height: PLAYER_HEIGHT,
	    roomIndex: roomIndex,
	    type: type,
	
	    // components
	    carriable: defaultCarriable(),
	    animation: defaultAnimation(),
	    ai: defaultAI(),
	    actor: defaultActor()
	  };
	}
	
	function generateSpawner(x, roomIndex) {
	  return function (ev) {
	    var character = void 0;
	
	    if (ev == _types.SpawnEventEnum.SEC_TELEPORT) character = generateCrewMember(x, roomIndex, _types.CrewEnum.SEC);
	    if (ev == _types.SpawnEventEnum.ENG_TELEPORT) character = generateCrewMember(x, roomIndex, _types.CrewEnum.ENG);
	
	    if (character === undefined) throw "Unknown spawn event";
	
	    return (0, _assign2.default)(character, { y: ROOM_HEIGHT });
	  };
	}
	
	function defaultActor() {
	  return {
	    kind: 'actor',
	    actions: new _set2.default()
	  };
	}
	
	function initialGameState() {
	  return {
	    player: {
	      kind: 'player',
	      id: genId(),
	      x: 3, y: 0, vx: 0, vy: 0, ax: 0, ay: 0,
	      width: PLAYER_WIDTH,
	      height: PLAYER_HEIGHT,
	      roomIndex: 0,
	
	      // components
	      animation: defaultAnimation(),
	      carrier: defaultCarrier(),
	      imager: defaultImager(PLAYER_IMAGES),
	      interactor: defaultInteractor(),
	      actor: defaultActor()
	    },
	    crew: [generateCrewMember(5, 1, _types.CrewEnum.ENG), generateCrewMember(2, 2, _types.CrewEnum.SEC)],
	    furnitures: [{
	      kind: 'furniture',
	      type: 'console_green',
	      id: genId(),
	      x: 6.4,
	      width: 8 * 0.12,
	      height: 6 * 0.12,
	      roomIndex: 0
	    }, {
	      kind: 'furniture',
	      type: 'console_red',
	      id: genId(),
	      x: 4.9,
	      width: 8 * 0.12,
	      height: 6 * 0.12,
	      roomIndex: 0
	    }, {
	      kind: 'furniture',
	      type: 'screen',
	      id: genId(),
	      x: 2.5,
	      width: 20 * 0.12,
	      height: 16 * 0.12,
	      roomIndex: 0
	    }, {
	      kind: 'furniture',
	      type: 'core',
	      id: genId(),
	      x: 2,
	      width: 24 * 0.12,
	      height: 16 * 0.12,
	      roomIndex: 1
	    }, {
	      kind: 'furniture',
	      type: 'console_engine',
	      id: genId(),
	      x: 4.52,
	      width: 20 * 0.12,
	      height: 11 * 0.12,
	      roomIndex: 1
	    }, {
	      kind: 'furniture',
	      type: 'console_tall',
	      id: genId(),
	      x: 1.5,
	      width: 6 * 0.12,
	      height: 16 * 0.12,
	      roomIndex: 2
	    }, {
	      kind: 'furniture',
	      type: 'med_table',
	      id: genId(),
	      x: 3.1,
	      width: 12 * 0.12,
	      height: 6 * 0.12,
	      roomIndex: 2
	    }, {
	      kind: 'furniture',
	      type: 'chair_left',
	      id: genId(),
	      x: 4.6,
	      width: 6 * 0.12,
	      height: 8 * 0.12,
	      roomIndex: 2
	    }, {
	      kind: 'furniture',
	      type: 'med_cab',
	      id: genId(),
	      x: 5.5,
	      width: 6 * 0.12,
	      height: 12 * 0.12,
	      roomIndex: 2
	    }, {
	      kind: 'furniture',
	      type: 'chair',
	      id: genId(),
	      x: 6.6,
	      width: 6 * 0.12,
	      height: 8 * 0.12,
	      roomIndex: 2
	    }, {
	      kind: 'furniture',
	      type: 'teleporter',
	      id: 'teleporter0',
	      foreground: true,
	      x: 2.5,
	      width: 17 * 0.12,
	      height: 16 * 0.12,
	      roomIndex: 3,
	      spawner: {
	        kind: 'spawner',
	        events: [],
	        spawn: generateSpawner(2.5, 3),
	        time: -1
	      }
	    }, {
	      kind: 'furniture',
	      type: 'sec_button',
	      id: genId(),
	      x: 4,
	      width: 6 * 0.12,
	      height: 6 * 0.12,
	      roomIndex: 3,
	      button: {
	        kind: 'button',
	        eventToFire: _types.SpawnEventEnum.SEC_TELEPORT,
	        time: -1,
	        notify: 'teleporter0'
	      }
	    }, {
	      kind: 'furniture',
	      type: 'eng_button',
	      id: genId(),
	      x: 4.8,
	      width: 6 * 0.12,
	      height: 6 * 0.12,
	      roomIndex: 3,
	      button: {
	        kind: 'button',
	        eventToFire: _types.SpawnEventEnum.ENG_TELEPORT,
	        time: -1,
	        notify: 'teleporter0'
	      }
	    }, {
	      kind: 'furniture',
	      type: 'console_blue',
	      id: genId(),
	      x: 6,
	      width: 8 * 0.12,
	      height: 6 * 0.12,
	      roomIndex: 3
	    }],
	    rooms: [{
	      type: _types.RoomEnum.BRIDGE
	    }, {
	      type: _types.RoomEnum.ENGINE
	    }, {
	      type: _types.RoomEnum.MEDBAY
	    }, {
	      type: _types.RoomEnum.STORE
	    }]
	  };
	}
	
	var DAMAGE_IMAGES = ['damage0.png', 'damage1.png', 'damage2.png', 'damage3.png', 'damage4.png'];
	
	var FURNITURE_IMAGES = {
	  'console_red': ['img/console_red.png'],
	  'console_green': ['img/console_green.png'],
	  'screen': ['img/screen.png'],
	  'core': ['img/core.png', 'img/core2.png', 'img/core3.png'],
	  'console_engine': ['img/console_engine.png'],
	  'console_tall': ['img/console_tall.png'],
	  'med_table': ['img/med_table.png'],
	  'console_weird': ['img/console_weird.png'],
	  'chair': ['img/chair.png'],
	  'chair_left': ['img/chair_left.png'],
	  'med_cab': ['img/med_cab.png'],
	  'teleporter': ['img/teleporter.png'],
	  'sec_button': ['img/sec_button.png'],
	  'eng_button': ['img/eng_button.png'],
	  'console_blue': ['img/console_blue.png']
	};
	
	var ACTIVE_IMAGES = {
	  'teleporter': ['img/teleporter_alt.png', 'img/teleporter_alt2.png'],
	  'sec_button': ['img/sec_button_alt.png'],
	  'eng_button': ['img/eng_button_alt.png']
	};
	
	var FURNITURE_ANIMATION_DT = {
	  'teleporter': 0.2
	};
	
	function generateFurnitureImage(furniture, time) {
	  var images = FURNITURE_IMAGES[furniture.type];
	  var dt = FURNITURE_ANIMATION_DT[furniture.type] || 1.0;
	
	  var button = furniture.button;
	  if (button && isButtonPressed(button)) {
	    images = ACTIVE_IMAGES[furniture.type];
	  }
	
	  var spawner = furniture.spawner;
	  if (spawner && isSpawnerActive(spawner)) {
	    images = ACTIVE_IMAGES[furniture.type];
	  }
	
	  return images[Math.floor(time / dt % images.length)];
	}
	
	function generateFurnitureRect(furniture) {
	  return {
	    x0: furniture.x - furniture.width * 0.5,
	    x1: furniture.x + furniture.width * 0.5,
	    y0: FURNITURE_HEIGHT,
	    y1: FURNITURE_HEIGHT + furniture.height
	  };
	}
	
	function _generateAnimationMap(imagesMap, oldStr, newStr) {
	  return Utils.mapObject(imagesMap, function (images) {
	    return images.map(function (image) {
	      return image.replace(oldStr, newStr);
	    });
	  });
	}
	
	function _generateOrientedAnimationMap(dirImagesMap, oldStr, newStr) {
	  return Utils.mapObject(dirImagesMap, function (imagesMap) {
	    return _generateAnimationMap(imagesMap, oldStr, newStr);
	  });
	}
	
	var _RIGHT_PLAYER_IMAGES = (_RIGHT_PLAYER_IMAGES2 = {}, (0, _defineProperty3.default)(_RIGHT_PLAYER_IMAGES2, _types.CharacterAnimationEnum.RUN, ['img/right_cap.png', 'img/right_cap_run_0.png']), (0, _defineProperty3.default)(_RIGHT_PLAYER_IMAGES2, _types.CharacterAnimationEnum.STAND, ['img/right_cap.png']), (0, _defineProperty3.default)(_RIGHT_PLAYER_IMAGES2, _types.CharacterAnimationEnum.JUMP, ['img/right_cap_run_0.png']), (0, _defineProperty3.default)(_RIGHT_PLAYER_IMAGES2, _types.CharacterAnimationEnum.SKID, ['img/right_cap.png']), _RIGHT_PLAYER_IMAGES2);
	
	var PLAYER_IMAGES = (_PLAYER_IMAGES = {}, (0, _defineProperty3.default)(_PLAYER_IMAGES, _types.DirectionEnum.LEFT, _generateAnimationMap(_RIGHT_PLAYER_IMAGES, 'right', 'left')), (0, _defineProperty3.default)(_PLAYER_IMAGES, _types.DirectionEnum.RIGHT, _RIGHT_PLAYER_IMAGES), _PLAYER_IMAGES);
	
	var _RIGHT_ALIEN_IMAGES = (_RIGHT_ALIEN_IMAGES2 = {}, (0, _defineProperty3.default)(_RIGHT_ALIEN_IMAGES2, _types.CharacterAnimationEnum.RUN, ['img/right_alien.png', 'img/right_alien_run_0.png']), (0, _defineProperty3.default)(_RIGHT_ALIEN_IMAGES2, _types.CharacterAnimationEnum.STAND, ['img/right_alien.png']), (0, _defineProperty3.default)(_RIGHT_ALIEN_IMAGES2, _types.CharacterAnimationEnum.JUMP, ['img/right_alien_run_0.png']), (0, _defineProperty3.default)(_RIGHT_ALIEN_IMAGES2, _types.CharacterAnimationEnum.SKID, ['img/right_alien.png']), _RIGHT_ALIEN_IMAGES2);
	
	var ALIEN_IMAGES = (_ALIEN_IMAGES = {}, (0, _defineProperty3.default)(_ALIEN_IMAGES, _types.DirectionEnum.LEFT, _generateAnimationMap(_RIGHT_ALIEN_IMAGES, 'right', 'left')), (0, _defineProperty3.default)(_ALIEN_IMAGES, _types.DirectionEnum.RIGHT, _RIGHT_ALIEN_IMAGES), _ALIEN_IMAGES);
	
	function defaultImager(map) {
	  var computeImage = function computeImage(dir, anim, time) {
	    var i = Math.floor(time * ANIM_FPS + 0.25);
	    var images = map[dir][anim];
	    var image = images[i % images.length];
	    return image;
	  };
	  return {
	    kind: 'imager',
	    computeImage: computeImage
	  };
	}
	
	function transformRectToPixels(rect) {
	  return {
	    x0: transformToPixels(rect.x0),
	    y0: transformToPixels(rect.y0),
	    x1: transformToPixels(rect.x1),
	    y1: transformToPixels(rect.y1)
	  };
	}
	
	function crewMemberColor(crew) {
	  if (crew.type === _types.CrewEnum.ENG) return 'rgb(223, 208, 0)';
	  // if (crew.type === CrewEnum.SCI) return 'rgb(49, 61, 172)'
	  if (crew.type === _types.CrewEnum.SEC) return 'rgb(223, 0, 0)';
	  throw "Unknown crew type";
	}
	
	function sameSign(x, y) {
	  return x * y >= 0;
	}
	
	function characterAnimation(oldAnimation, character, isGrounded, isCarried, dt) {
	  var isMoving = 0 < Math.abs(character.vx);
	  var isAccelerating = 0 < Math.abs(character.ax);
	  var isSpeedIncreasing = sameSign(character.vx, character.ax);
	
	  var slowingDown = isMoving && isAccelerating && !isSpeedIncreasing;
	
	  var movingLeft = character.vx < -0;
	  var movingRight = character.vx > 0;
	
	  // Setup default Direction & CharacterAnimation
	  var direction = _types.DirectionEnum.RIGHT;
	  var animation = _types.CharacterAnimationEnum.STAND;
	
	  if (oldAnimation) {
	    animation = oldAnimation.animation;
	    direction = oldAnimation.direction;
	  }
	
	  if (movingLeft) direction = _types.DirectionEnum.LEFT;
	  if (movingRight) direction = _types.DirectionEnum.RIGHT;
	
	  if (isCarried) {
	    animation = _types.CharacterAnimationEnum.STAND;
	  } else if (!isGrounded) {
	    animation = _types.CharacterAnimationEnum.JUMP;
	  } else {
	    if (slowingDown) animation = _types.CharacterAnimationEnum.SKID;else if (isMoving) animation = _types.CharacterAnimationEnum.RUN;else animation = _types.CharacterAnimationEnum.STAND;
	  }
	
	  var time = 0;
	  if (oldAnimation) {
	    if (oldAnimation.animation !== animation) time = 0;else time = oldAnimation.time + dt;
	  }
	
	  return {
	    kind: 'animation',
	    direction: direction,
	    animation: animation,
	    time: time
	  };
	}
	
	function generateShadowOpacity(character) {
	  return (2.0 - Math.min(character.y, 1.5)) / 2.0;
	}
	
	function generateShadowRect(character) {
	  var scale = (16.0 - character.y) / 16.0;
	
	  return {
	    x0: character.x - scale * character.width * 0.5,
	    x1: character.x + scale * character.width * 0.5,
	    y0: -0.2 * character.width,
	    y1: character.height - 0.2 * character.width
	  };
	}
	
	function generateShadowSprite(id, opacity, rect) {
	  return {
	    sourceId: id,
	    color: 'rgb(50, 50, 50)',
	    image: 'img/shadow.png',
	    opacity: 0.5 * opacity * opacity,
	    x0: rect.x0,
	    x1: rect.x1,
	    y0: rect.y0,
	    y1: rect.y1
	  };
	}
	
	function computeAnimationImage(animationState, directionalImagesMap) {
	  var animation = animationState.animation;
	  var direction = animationState.direction;
	  var time = animationState.time;
	
	  var i = Math.floor(time * ANIM_FPS + 0.25);
	  var images = directionalImagesMap[animationState.direction][animation];
	  var image = images[i % images.length];
	
	  return image;
	}
	
	function adjustXForRoom(x, dRoom, roomWidth) {
	  return x - roomWidth * dRoom;
	}
	
	function adjustRectForRoom(rect, dRoom, roomWidth) {
	  return {
	    x0: adjustXForRoom(rect.x0, dRoom, roomWidth),
	    x1: adjustXForRoom(rect.x1, dRoom, roomWidth),
	    y0: rect.y0,
	    y1: rect.y1
	  };
	}
	
	function adjustRectForScale(rect, scale) {
	  var x = (rect.x0 + rect.x1) * 0.5;
	  var w = (rect.x1 - rect.x0) * scale;
	  var h = (rect.y1 - rect.y0) * scale;
	  return {
	    x0: x - w * 0.5,
	    x1: x + w * 0.5,
	    y0: rect.y0,
	    y1: rect.y0 + h
	  };
	}
	
	function shouldDrawCharacter(character, dRoom, roomWidth) {
	  var x = adjustXForRoom(character.x, dRoom, roomWidth);
	  return x > -character.width && x < roomWidth + character.width;
	}
	
	function generateCharacterRect(character) {
	  return {
	    x0: character.x - character.width * 0.5,
	    x1: character.x + character.width * 0.5,
	    y0: character.y,
	    y1: character.y + character.height
	  };
	}
	
	function generateCharacterSprite(id, image, color, rect, recolor) {
	  var sprite = {
	    sourceId: id,
	    color: color,
	    image: image,
	    x0: rect.x0,
	    y0: rect.y0,
	    x1: rect.x1,
	    y1: rect.y1
	  };
	  if (recolor) sprite.imageRecolor = recolor;
	
	  return sprite;
	}
	
	function getOrientedAnimationMap(character) {
	  if (character.kind === 'player') return PLAYER_IMAGES;
	  if (character.kind === 'crew') return PLAYER_IMAGES;
	  throw "Failed to get CharacterAnimation map";
	}
	
	var PERSON_COLORS = [{ r: 123, g: 52, b: 0 }, // shaded hair
	{ r: 156, g: 77, b: 0 }, // hair
	{ r: 255, g: 197, b: 145 }, // shaded skin
	{ r: 255, g: 212, b: 165 } // bright skin
	];
	
	var ALT_PERSON_SCALES = [1, 0.95];
	
	var ALT_PERSON_COLORS = [PERSON_COLORS, [// woman
	{ r: 123, g: 52, b: 0, a: 0 }, // shaded hair
	{ r: 156, g: 77, b: 0 }, // hair
	{ r: 123, g: 52, b: 0 }, // shaded skin
	{ r: 255, g: 212, b: 165 } // bright skin
	]];
	
	var BODY_COLORS = [{ r: 99, g: 181, b: 26 }, // darkest
	{ r: 124, g: 199, b: 38 }, // medium
	{ r: 152, g: 220, b: 56 } // lightest
	];
	
	var ALTERNATE_BODY_COLORS = (_ALTERNATE_BODY_COLOR = {}, (0, _defineProperty3.default)(_ALTERNATE_BODY_COLOR, _types.CrewEnum.SEC, [{ r: 179, g: 20, b: 38 }, // darkest
	{ r: 207, g: 18, b: 45 }, // medium
	{ r: 240, g: 19, b: 52 } // lightest
	]), (0, _defineProperty3.default)(_ALTERNATE_BODY_COLOR, _types.CrewEnum.ENG, [{ r: 186, g: 179, b: 0 }, { r: 205, g: 199, b: 0 }, { r: 228, g: 220, b: 0 }]), _ALTERNATE_BODY_COLOR);
	
	// [CrewEnum.SCI]: [
	//   {r:52,g:88,b:183},
	//   {r:62,g:104,b:216},
	//   {r:73,g:133,b:229}
	// ]
	function generateRecolors(oldRGBs, newRGBs) {
	  return {
	    oldRGBs: oldRGBs,
	    newRGBs: newRGBs,
	    hash: '' + stringToHash(oldRGBs.map(function (rgb) {
	      return (0, _values2.default)(rgb);
	    }).join('') + newRGBs.map(function (rgb) {
	      return (0, _values2.default)(rgb);
	    }).join(''))
	  };
	}
	
	function combineRecolors(recolor1, recolor2) {
	  return {
	    oldRGBs: (0, _from2.default)(Utils.combine(recolor1.oldRGBs, recolor2.oldRGBs)),
	    newRGBs: (0, _from2.default)(Utils.combine(recolor1.newRGBs, recolor2.newRGBs)),
	    hash: recolor1.hash + recolor2.hash
	  };
	}
	
	function computeImageScale(character) {
	  return ALT_PERSON_SCALES[stringToHash(character.id) % ALT_PERSON_SCALES.length];
	}
	
	function computeImageRecolor(character) {
	  var recolors = [];
	
	  if (character.kind === 'crew') {
	    var crew = character;
	    recolors.push(generateRecolors(BODY_COLORS, ALTERNATE_BODY_COLORS[crew.type]));
	  }
	
	  recolors.push(generateRecolors(PERSON_COLORS, ALT_PERSON_COLORS[stringToHash(character.id) % ALT_PERSON_COLORS.length]));
	
	  if (recolors.length === 0) return undefined;
	
	  return recolors.reduce(function (prev, curr) {
	    if (prev === undefined) return curr;
	    return combineRecolors(prev, curr);
	  });
	}
	
	function getCharacterColor(character) {
	  if (character.kind === 'player') return 'rgb(154, 205, 50)';
	  if (character.kind === 'crew') {
	    var crew = character;
	    if (crew.type === _types.CrewEnum.ENG) return 'rgb(223, 208, 0)';
	    // if (crew.type === CrewEnum.SCI) return 'rgb(49, 61, 172)'
	    if (crew.type === _types.CrewEnum.SEC) return 'rgb(223, 0, 0)';
	    throw "Unknown crew type";
	  }
	  throw "Failed to get CharacterAnimation map";
	}
	
	function adjustFloorHeight(sprite, floorHeight) {
	  return { y0: sprite.y0 + floorHeight, y1: sprite.y1 + floorHeight };
	}
	
	function computeRoomColor(room) {
	  if (room.type == _types.RoomEnum.BRIDGE) return '#f8f8f8';
	  if (room.type == _types.RoomEnum.ENGINE) return '#fee';
	  if (room.type == _types.RoomEnum.MEDBAY) return '#eef';
	  if (room.type == _types.RoomEnum.STORE) return '#eff';
	  throw "Unknown room";
	}
	
	function computeFloorColor(room) {
	  if (room.type == _types.RoomEnum.BRIDGE) return '#eee';
	  if (room.type == _types.RoomEnum.ENGINE) return '#eee';
	  if (room.type == _types.RoomEnum.MEDBAY) return '#eee';
	  if (room.type == _types.RoomEnum.STORE) return '#eee';
	  throw "Unknown room";
	}
	
	var WALK_SPEED = 2;
	var WALK_ACCEL = 15;
	
	var PLAYER_SPEED = 8;
	var PLAYER_ACCEL = 30;
	var PLAYER_JUMP_SPEED = 7;
	var PLAYER_THROW_XSPEED = 4;
	var PLAYER_THROW_YSPEED = 3;
	var GRAVITY_ACCEL = 40;
	
	function thinkPlayerLocomotion(keysDown, canJump) {
	  var actions = new _set2.default();
	
	  if (keysDown.a) actions.add(_types.ActionEnum.LEFT);
	  if (keysDown.d) actions.add(_types.ActionEnum.RIGHT);
	  if (keysDown.w) actions.add(_types.ActionEnum.UP);
	  if (canJump && keysDown.w) actions.add(_types.ActionEnum.JUMP);
	
	  return actions;
	}
	
	function isGrounded(character) {
	  return character.y <= 0.001 && character.vy <= 0.001;
	}
	
	function canJump(character) {
	  return isGrounded(character);
	}
	
	function horizontalCharacterPhysics(character, actions, isGrounded) {
	  var isSlow = actions.has(_types.ActionEnum.SLOW_LEFT) || actions.has(_types.ActionEnum.SLOW_RIGHT);
	  var isFast = actions.has(_types.ActionEnum.LEFT) || actions.has(_types.ActionEnum.RIGHT);
	
	  if (isSlow && isFast) throw "Can't be fast and slow at same time...";
	
	  var SPEED = isSlow ? WALK_SPEED : PLAYER_SPEED;
	  var ACCEL = isSlow ? WALK_ACCEL : PLAYER_ACCEL;
	
	  var dplayer = {};
	  dplayer.ax = 0;
	
	  var left = actions.has(_types.ActionEnum.LEFT) || actions.has(_types.ActionEnum.SLOW_LEFT);
	  var right = actions.has(_types.ActionEnum.RIGHT) || actions.has(_types.ActionEnum.SLOW_RIGHT);
	
	  var maxVelocity = Math.abs(character.vx) > SPEED;
	  var movingRight = character.vx > 0;
	  var movingLeft = character.vx < -0;
	  var maxRight = movingRight && maxVelocity;
	  var maxLeft = movingLeft && maxVelocity;
	
	  if (left && !right && !maxLeft) dplayer.ax = -ACCEL; // move left
	  if (right && !left && !maxRight) dplayer.ax = ACCEL; // move right
	
	  if (left === right && isGrounded) {
	    // skid to a stop
	    if (movingRight) dplayer.ax = -ACCEL;
	    if (movingLeft) dplayer.ax = ACCEL;
	  }
	
	  if (isGrounded && maxVelocity) {
	    // terminal velocity on ground
	    if (movingRight) dplayer.vx = SPEED;
	    if (movingLeft) dplayer.vx = -SPEED;
	  }
	
	  return dplayer;
	}
	
	function verticalCharacterPhysics(isGrounded, actions) {
	  var dplayer = {};
	  dplayer.ay = 0;
	
	  if (actions.has(_types.ActionEnum.JUMP)) dplayer.vy = PLAYER_JUMP_SPEED;
	  if (!isGrounded) dplayer.ay = -GRAVITY_ACCEL;
	
	  return dplayer;
	}
	
	function performAccel(character, dt) {
	  var dvx = character.ax * dt;
	  var dvy = character.ay * dt;
	  var vx = character.vx + dvx;
	  var vy = character.vy + dvy;
	
	  if (Math.abs(vx) < Math.abs(dvx)) vx = 0;
	  if (Math.abs(vy) < Math.abs(dvy)) vy = 0;
	
	  return { vx: vx, vy: vy };
	}
	
	function performVelocity(character, dt) {
	  return {
	    x: character.x + character.vx * dt,
	    y: character.y + character.vy * dt
	  };
	}
	
	function adjustRoom(character) {
	  if (character.x < 0) return { x: character.x + ROOM_WIDTH, roomIndex: character.roomIndex - 1 };
	
	  if (character.x > ROOM_WIDTH) return { x: character.x - ROOM_WIDTH, roomIndex: character.roomIndex + 1 };
	
	  return {};
	}
	
	function clampRoom(character, numRooms) {
	  var modRoom = character.roomIndex % numRooms;
	  return {
	    roomIndex: modRoom >= 0 ? modRoom : modRoom + numRooms
	  };
	}
	
	function clampFloor(character) {
	  if (character.y < 0.001 && character.vy < 0) return { y: 0, vy: 0 };
	
	  return {};
	}
	
	function computeRoomDistance(srcRoom, destRoom, numRooms) {
	  var dRoom = destRoom - srcRoom;
	  while (dRoom < -numRooms * 0.5) {
	    dRoom += numRooms;
	  }while (dRoom > numRooms * 0.5) {
	    dRoom -= numRooms;
	  }return dRoom;
	}
	
	function rectsOverlap(rect1, rect2) {
	  var dx = rect2.x - rect1.x;
	  var dy = rect2.y - rect1.y;
	
	  var maxDx = rect1.width * 0.5 + rect2.width * 0.5;
	  var maxDy = rect1.height * 0.5 + rect2.height * 0.5;
	
	  if (Math.abs(dx) > maxDx || Math.abs(dy) > maxDy) return;
	
	  return { dx: dx, dy: dy };
	}
	
	function carryPhysics(carrier, carried, direction) {
	  var x = carrier.x;
	  var y = carrier.y + PLAYER_HEIGHT * 0.2;
	
	  if (direction === _types.DirectionEnum.LEFT) x -= PLAYER_WIDTH * 0.5;else x += PLAYER_WIDTH * 0.5;
	
	  return { x: x, y: y, vx: carrier.vx, vy: carrier.vy, roomIndex: carrier.roomIndex };
	}
	
	function throwPhysics(carrier, direction, actions) {
	  var vx = carrier.vx;
	  var vy = carrier.vy + PLAYER_THROW_YSPEED;
	
	  if (actions.has(_types.ActionEnum.LEFT)) vx -= PLAYER_THROW_XSPEED;
	  if (actions.has(_types.ActionEnum.RIGHT)) vx += PLAYER_THROW_XSPEED;
	  if (actions.has(_types.ActionEnum.UP)) vy += PLAYER_THROW_XSPEED * 0.5;
	
	  if (!actions.a && !actions.d && !actions.w) {
	    if (direction === _types.DirectionEnum.LEFT) vx -= PLAYER_THROW_XSPEED * 0.5;
	    if (direction === _types.DirectionEnum.RIGHT) vx += PLAYER_THROW_XSPEED * 0.5;
	  }
	
	  return { vx: vx, vy: vy };
	}
	
	function isButtonPressed(button) {
	  return button.time < BUTTON_COOLOFF && button.time > 0;
	}
	
	function isButtonPressable(button) {
	  return !isButtonPressed(button);
	}
	
	function isSpawnerActive(spawner) {
	  return spawner.time < TELEPORT_COOLOFF && spawner.time > 0;
	}
	
	function canInteract(player, playerDirection, object) {
	  var overlap = rectsOverlap(player, object);
	  if (!overlap) return false;
	
	  var dx = overlap.dx;
	  var dy = overlap.dy;
	
	  if (playerDirection === _types.DirectionEnum.LEFT) return dx < 0.2;
	
	  if (playerDirection === _types.DirectionEnum.RIGHT) return dx > -0.2;
	
	  return false;
	}
	
	function canPickup(character, playerDirection, playerGrounded, crewMember, crewGrounded) {
	  if (!playerGrounded || !crewGrounded) return false;
	
	  if (character.roomIndex !== crewMember.roomIndex) return false;
	
	  return canInteract(character, playerDirection, crewMember);
	}
	
	var KEYS_DOWN_MAP = {
	  '37': 'a',
	  '38': 'w',
	  '39': 'd',
	  '40': 's'
	};
	var KEYS_PRESSED_MAP = {
	  '189': '-',
	  '187': '=',
	  '32': ' ',
	  '13': 'x'
	};
	function getChar(e, keysMap) {
	  if (e.keyCode >= 48 && e.keyCode <= 90) return String.fromCharCode(e.keyCode).toLowerCase();
	
	  if (e.keyCode in keysMap) return keysMap[e.keyCode];
	
	  return null;
	}
	
	function bindInputs(keysDown, keysPressed) {
	  $(document).keydown(function (e) {
	    var key = getChar(e, KEYS_DOWN_MAP);
	    if (key) keysDown[key] = true;
	  });
	  $(document).keyup(function (e) {
	    var key = getChar(e, KEYS_DOWN_MAP);
	    if (key) keysDown[key] = false;
	  });
	  $(document).keypress(function (e) {
	    var key = getChar(e, KEYS_PRESSED_MAP);
	    if (key && !keysPressed.has(key)) keysPressed.add(key);
	  });
	}
	
	function runLoop(step) {
	  var lastTime = Date.now();
	  var frameCount = 0;
	  var frameStart = Date.now();
	
	  var dt = 0.01;
	
	  function loop() {
	    // calculate FPS
	    frameCount += 1;
	    if (Date.now() > frameStart + 1000) {
	      console.log(frameCount + " fps");
	      frameCount = 0;
	      frameStart = Date.now();
	    }
	
	    dt = step(dt);
	    setTimeout(loop, 1000 * dt);
	  };
	
	  loop();
	}
	
	function allCharacters(gameState) {
	  var _iteratorNormalCompletion, _didIteratorError, _iteratorError, _iterator, _step, crewMember;
	
	  return _regenerator2.default.wrap(function allCharacters$(_context) {
	    while (1) {
	      switch (_context.prev = _context.next) {
	        case 0:
	          _iteratorNormalCompletion = true;
	          _didIteratorError = false;
	          _iteratorError = undefined;
	          _context.prev = 3;
	          _iterator = (0, _getIterator3.default)(gameState.crew);
	
	        case 5:
	          if (_iteratorNormalCompletion = (_step = _iterator.next()).done) {
	            _context.next = 12;
	            break;
	          }
	
	          crewMember = _step.value;
	          _context.next = 9;
	          return crewMember;
	
	        case 9:
	          _iteratorNormalCompletion = true;
	          _context.next = 5;
	          break;
	
	        case 12:
	          _context.next = 18;
	          break;
	
	        case 14:
	          _context.prev = 14;
	          _context.t0 = _context['catch'](3);
	          _didIteratorError = true;
	          _iteratorError = _context.t0;
	
	        case 18:
	          _context.prev = 18;
	          _context.prev = 19;
	
	          if (!_iteratorNormalCompletion && _iterator.return) {
	            _iterator.return();
	          }
	
	        case 21:
	          _context.prev = 21;
	
	          if (!_didIteratorError) {
	            _context.next = 24;
	            break;
	          }
	
	          throw _iteratorError;
	
	        case 24:
	          return _context.finish(21);
	
	        case 25:
	          return _context.finish(18);
	
	        case 26:
	          _context.next = 28;
	          return gameState.player;
	
	        case 28:
	        case 'end':
	          return _context.stop();
	      }
	    }
	  }, _marked[0], this, [[3, 14, 18, 26], [19,, 21, 25]]);
	}
	
	// function * charactersWithComponent(gameState: GameState, kind: string): Iterable<[Character, Component]> {
	//   for (let character of allCharacters(gameState)) {
	//     if (kind in character.components) {
	//       let component = character.components[kind]
	//       if (kind != component.kind)
	//         throw "Wat, component has wrong type: " + component.kind + " != " + kind
	//
	//       yield [character, character.components[kind]]
	//     }
	//   }
	// }
	
	function characterCarriers(gameState) {
	  var character, carrier;
	  return _regenerator2.default.wrap(function characterCarriers$(_context2) {
	    while (1) {
	      switch (_context2.prev = _context2.next) {
	        case 0:
	          character = gameState.player;
	          carrier = character.carrier;
	          _context2.next = 4;
	          return [character, carrier];
	
	        case 4:
	        case 'end':
	          return _context2.stop();
	      }
	    }
	  }, _marked[1], this);
	}
	
	function inDepthOrder(entityMap, depths) {
	  var _iteratorNormalCompletion2, _didIteratorError2, _iteratorError2, _iterator2, _step2, _id;
	
	  return _regenerator2.default.wrap(function inDepthOrder$(_context3) {
	    while (1) {
	      switch (_context3.prev = _context3.next) {
	        case 0:
	          _iteratorNormalCompletion2 = true;
	          _didIteratorError2 = false;
	          _iteratorError2 = undefined;
	          _context3.prev = 3;
	          _iterator2 = (0, _getIterator3.default)(depths.inOrder());
	
	        case 5:
	          if (_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done) {
	            _context3.next = 13;
	            break;
	          }
	
	          _id = _step2.value;
	
	          if (!entityMap.hasKey(_id)) {
	            _context3.next = 10;
	            break;
	          }
	
	          _context3.next = 10;
	          return entityMap.get(_id);
	
	        case 10:
	          _iteratorNormalCompletion2 = true;
	          _context3.next = 5;
	          break;
	
	        case 13:
	          _context3.next = 19;
	          break;
	
	        case 15:
	          _context3.prev = 15;
	          _context3.t0 = _context3['catch'](3);
	          _didIteratorError2 = true;
	          _iteratorError2 = _context3.t0;
	
	        case 19:
	          _context3.prev = 19;
	          _context3.prev = 20;
	
	          if (!_iteratorNormalCompletion2 && _iterator2.return) {
	            _iterator2.return();
	          }
	
	        case 22:
	          _context3.prev = 22;
	
	          if (!_didIteratorError2) {
	            _context3.next = 25;
	            break;
	          }
	
	          throw _iteratorError2;
	
	        case 25:
	          return _context3.finish(22);
	
	        case 26:
	          return _context3.finish(19);
	
	        case 27:
	        case 'end':
	          return _context3.stop();
	      }
	    }
	  }, _marked[2], this, [[3, 15, 19, 27], [20,, 22, 26]]);
	}
	
	$(document).ready(function () {
	  var keysDown = {};
	  var keysPressed = new _set2.default();
	  bindInputs(keysDown, keysPressed);
	
	  var screenEl = $('#world-canvas')[0];
	  var screen = Canvas.setupBuffer(screenEl, CANVAS_WIDTH, CANVAS_HEIGHT);
	  var buffer = Canvas.createBuffer(CANVAS_WIDTH, CANVAS_HEIGHT);
	
	  var gameState = initialGameState();
	
	  var crewMap = new Utils.AutoMap(function (o) {
	    return o.id;
	  }, gameState.crew);
	
	  var characterMap = new Utils.AutoMap(function (o) {
	    return o.id;
	  });
	  characterMap.add(gameState.player);
	  characterMap.observe(gameState.crew);
	
	  var furnitureMap = new Utils.AutoMap(function (o) {
	    return o.id;
	  });
	  furnitureMap.observe(gameState.furnitures);
	
	  // This gives us automatic randomized depths (i.e. z-distance) for each entity
	  var depths = new Utils.DepthArray();
	  depths.add(gameState.player.id, 0);
	  depths.observe(gameState.crew, function (o) {
	    return o.id;
	  });
	
	  // characters who can carry other characters
	  var carrierArray = new Utils.AutoArray(function (o) {
	    return o.id;
	  }, function (o) {
	    return Utils.Get(o, 'carrier');
	  });
	  carrierArray.watch(gameState.player);
	  carrierArray.observe(gameState.crew);
	
	  // engineers
	  var engineerArray = new Utils.AutoArray(function (o) {
	    return o.id;
	  }, function (o) {
	    return o.type === _types.CrewEnum.ENG;
	  });
	  engineerArray.observe(gameState.crew);
	
	  // security
	  var securityArray = new Utils.AutoArray(function (o) {
	    return o.id;
	  }, function (o) {
	    return o.type === _types.CrewEnum.SEC;
	  });
	  securityArray.observe(gameState.crew);
	
	  // furnitures that can be interacted with
	  var interactorArray = new Utils.AutoArray(function (o) {
	    return o.id;
	  }, function (o) {
	    return Utils.Get(o, 'interactor');
	  });
	  interactorArray.watch(gameState.player);
	  interactorArray.observe(gameState.crew);
	
	  var buttonArray = new Utils.AutoArray(function (o) {
	    return o.id;
	  }, function (o) {
	    return o.button;
	  });
	  buttonArray.observe(gameState.furnitures);
	
	  var spawnerArray = new Utils.AutoArray(function (o) {
	    return o.id;
	  }, function (o) {
	    return o.spawner;
	  });
	  spawnerArray.observe(gameState.furnitures);
	
	  var time = 0;
	  var step = function step(dt) {
	    time += dt;
	
	    var rooms = gameState.rooms;
	
	    var _iteratorNormalCompletion3 = true;
	    var _didIteratorError3 = false;
	    var _iteratorError3 = undefined;
	
	    try {
	      for (var _iterator3 = (0, _getIterator3.default)(allCharacters(gameState)), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
	        var character = _step3.value;
	
	        var _actor = character.actor;
	        _actor.actions.clear();
	      }
	    } catch (err) {
	      _didIteratorError3 = true;
	      _iteratorError3 = err;
	    } finally {
	      try {
	        if (!_iteratorNormalCompletion3 && _iterator3.return) {
	          _iterator3.return();
	        }
	      } finally {
	        if (_didIteratorError3) {
	          throw _iteratorError3;
	        }
	      }
	    }
	
	    {
	      // player actions
	      var player = gameState.player;
	      var actor = player.actor;
	
	      // actions: wasd
	      actor.actions = thinkPlayerLocomotion(keysDown, canJump(player));
	
	      // actions: carry or throw
	      if (keysPressed.has(' ')) {
	        actor.actions.add(_types.ActionEnum.ACT);
	        keysPressed.delete(' ');
	      }
	    }
	
	    // engineer actions
	    var _iteratorNormalCompletion4 = true;
	    var _didIteratorError4 = false;
	    var _iteratorError4 = undefined;
	
	    try {
	      for (var _iterator4 = (0, _getIterator3.default)(gameState.crew), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
	        var _character = _step4.value;
	
	        var ai = _character.ai;
	        var _actor2 = _character.actor;
	
	        ai.nextThink -= dt;
	
	        // not time to think yet
	        if (ai.nextThink > 0) {
	          var _iteratorNormalCompletion20 = true;
	          var _didIteratorError20 = false;
	          var _iteratorError20 = undefined;
	
	          try {
	            for (var _iterator20 = (0, _getIterator3.default)(ai.actions), _step20; !(_iteratorNormalCompletion20 = (_step20 = _iterator20.next()).done); _iteratorNormalCompletion20 = true) {
	              var action = _step20.value;
	
	              _actor2.actions.add(action);
	            }
	          } catch (err) {
	            _didIteratorError20 = true;
	            _iteratorError20 = err;
	          } finally {
	            try {
	              if (!_iteratorNormalCompletion20 && _iterator20.return) {
	                _iterator20.return();
	              }
	            } finally {
	              if (_didIteratorError20) {
	                throw _iteratorError20;
	              }
	            }
	          }
	        } else {
	          var choice = Math.random();
	          if (choice < 0.2) {
	            ai.actions = [_types.ActionEnum.SLOW_LEFT];
	            ai.nextThink = Math.random() + 0.5;
	          } else if (choice < 0.4) {
	            ai.actions = [_types.ActionEnum.SLOW_RIGHT];
	            ai.nextThink = Math.random() + 0.5;
	          } else {
	            ai.actions = [];
	            ai.nextThink = Math.random() + 0.75;
	          }
	        }
	      }
	
	      // figure out if character can pick up any crew members
	    } catch (err) {
	      _didIteratorError4 = true;
	      _iteratorError4 = err;
	    } finally {
	      try {
	        if (!_iteratorNormalCompletion4 && _iterator4.return) {
	          _iterator4.return();
	        }
	      } finally {
	        if (_didIteratorError4) {
	          throw _iteratorError4;
	        }
	      }
	    }
	
	    var _iteratorNormalCompletion5 = true;
	    var _didIteratorError5 = false;
	    var _iteratorError5 = undefined;
	
	    try {
	      for (var _iterator5 = (0, _getIterator3.default)(carrierArray.all()), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
	        var _step5$value = (0, _slicedToArray3.default)(_step5.value, 2);
	
	        var _character2 = _step5$value[0];
	        var carrier = _step5$value[1];
	
	        var animation = _character2.animation;
	        var _actor3 = _character2.actor;
	
	        // skip if there's no carrying action
	        if (!_actor3.actions.has(_types.ActionEnum.ACT)) continue;
	
	        // shouldn't be already carrying something
	        if (carrier.carrying) continue;
	
	        // shouldn't be in the air
	        if (!isGrounded(_character2)) continue;
	
	        var _iteratorNormalCompletion21 = true;
	        var _didIteratorError21 = false;
	        var _iteratorError21 = undefined;
	
	        try {
	          for (var _iterator21 = (0, _getIterator3.default)(inDepthOrder(crewMap, depths)), _step21; !(_iteratorNormalCompletion21 = (_step21 = _iterator21.next()).done); _iteratorNormalCompletion21 = true) {
	            var crewMember = _step21.value;
	
	            var pickup = canPickup(_character2, animation.direction, isGrounded(_character2), crewMember, isGrounded(crewMember));
	
	            // pickup the crew member!
	            if (pickup) {
	              (0, _assign2.default)(carrier, { carrying: crewMember.id });
	              depths.update(crewMember.id, -0.05);
	              _actor3.actions.delete(_types.ActionEnum.ACT);
	              break;
	            }
	          }
	        } catch (err) {
	          _didIteratorError21 = true;
	          _iteratorError21 = err;
	        } finally {
	          try {
	            if (!_iteratorNormalCompletion21 && _iterator21.return) {
	              _iterator21.return();
	            }
	          } finally {
	            if (_didIteratorError21) {
	              throw _iteratorError21;
	            }
	          }
	        }
	      }
	
	      // handle carrying & throwing
	    } catch (err) {
	      _didIteratorError5 = true;
	      _iteratorError5 = err;
	    } finally {
	      try {
	        if (!_iteratorNormalCompletion5 && _iterator5.return) {
	          _iterator5.return();
	        }
	      } finally {
	        if (_didIteratorError5) {
	          throw _iteratorError5;
	        }
	      }
	    }
	
	    var _iteratorNormalCompletion6 = true;
	    var _didIteratorError6 = false;
	    var _iteratorError6 = undefined;
	
	    try {
	      for (var _iterator6 = (0, _getIterator3.default)(carrierArray.all()), _step6; !(_iteratorNormalCompletion6 = (_step6 = _iterator6.next()).done); _iteratorNormalCompletion6 = true) {
	        var _step6$value = (0, _slicedToArray3.default)(_step6.value, 2);
	
	        var _character3 = _step6$value[0];
	        var carrier = _step6$value[1];
	
	        var _animation = _character3.animation;
	        var _actor4 = _character3.actor;
	
	        // move carried object
	        if (carrier.carrying) {
	          var characterDir = _animation.direction;
	          var carriedEntity = characterMap.get(carrier.carrying);
	          (0, _assign2.default)(carriedEntity, carryPhysics(_character3, carriedEntity, characterDir));
	        }
	
	        // throw object
	        if (carrier.carrying && _actor4.actions.has(_types.ActionEnum.ACT)) {
	          var _characterDir = _animation.direction;
	          var otherCharacter = characterMap.get(carrier.carrying);
	          (0, _assign2.default)(otherCharacter, throwPhysics(_character3, _characterDir, _actor4.actions));
	          (0, _assign2.default)(carrier, { carrying: undefined });
	          depths.update(otherCharacter.id);
	          _actor4.actions.delete(_types.ActionEnum.ACT);
	        }
	      }
	
	      // figure out if there are buttons to be pressed
	    } catch (err) {
	      _didIteratorError6 = true;
	      _iteratorError6 = err;
	    } finally {
	      try {
	        if (!_iteratorNormalCompletion6 && _iterator6.return) {
	          _iterator6.return();
	        }
	      } finally {
	        if (_didIteratorError6) {
	          throw _iteratorError6;
	        }
	      }
	    }
	
	    var _iteratorNormalCompletion7 = true;
	    var _didIteratorError7 = false;
	    var _iteratorError7 = undefined;
	
	    try {
	      for (var _iterator7 = (0, _getIterator3.default)(interactorArray.all()), _step7; !(_iteratorNormalCompletion7 = (_step7 = _iterator7.next()).done); _iteratorNormalCompletion7 = true) {
	        var _step7$value = (0, _slicedToArray3.default)(_step7.value, 2);
	
	        var _character4 = _step7$value[0];
	        var interactor = _step7$value[1];
	
	        var _animation2 = _character4.animation;
	        var _actor5 = _character4.actor;
	        var _characterDir2 = _animation2.direction;
	
	        // skip if there's no carrying action
	        if (!_actor5.actions.has(_types.ActionEnum.ACT)) continue;
	
	        // loop through buttons
	        var _iteratorNormalCompletion22 = true;
	        var _didIteratorError22 = false;
	        var _iteratorError22 = undefined;
	
	        try {
	          for (var _iterator22 = (0, _getIterator3.default)(buttonArray.all()), _step22; !(_iteratorNormalCompletion22 = (_step22 = _iterator22.next()).done); _iteratorNormalCompletion22 = true) {
	            var _step22$value = (0, _slicedToArray3.default)(_step22.value, 2);
	
	            var furniture = _step22$value[0];
	            var button = _step22$value[1];
	
	            console.log(button);
	            if (isButtonPressable(button) && canInteract(_character4, _characterDir2, (0, _extends3.default)({ y: FURNITURE_HEIGHT }, furniture))) {
	              button.time = 0;
	              var buttonEvent = button.eventToFire;
	              var buttonAffects = button.notify;
	
	              // it's a spawn event!
	              if (Utils.hasValue(_types.SpawnEventEnum, buttonEvent)) {
	                // notify other furniture
	                var affectedFurniture = furnitureMap.get(buttonAffects);
	                var spawner = affectedFurniture.spawner;
	                if (spawner == null) throw 'Wat, bad spawner';
	
	                spawner.events.push(buttonEvent);
	                spawner.time = 0;
	                _actor5.actions.delete(_types.ActionEnum.ACT);
	                break;
	              }
	            }
	          }
	        } catch (err) {
	          _didIteratorError22 = true;
	          _iteratorError22 = err;
	        } finally {
	          try {
	            if (!_iteratorNormalCompletion22 && _iterator22.return) {
	              _iterator22.return();
	            }
	          } finally {
	            if (_didIteratorError22) {
	              throw _iteratorError22;
	            }
	          }
	        }
	      }
	
	      // spawn characters
	    } catch (err) {
	      _didIteratorError7 = true;
	      _iteratorError7 = err;
	    } finally {
	      try {
	        if (!_iteratorNormalCompletion7 && _iterator7.return) {
	          _iterator7.return();
	        }
	      } finally {
	        if (_didIteratorError7) {
	          throw _iteratorError7;
	        }
	      }
	    }
	
	    var _iteratorNormalCompletion8 = true;
	    var _didIteratorError8 = false;
	    var _iteratorError8 = undefined;
	
	    try {
	      for (var _iterator8 = (0, _getIterator3.default)(spawnerArray.all()), _step8; !(_iteratorNormalCompletion8 = (_step8 = _iterator8.next()).done); _iteratorNormalCompletion8 = true) {
	        var _step8$value = (0, _slicedToArray3.default)(_step8.value, 2);
	
	        var furniture = _step8$value[0];
	        var _spawner = _step8$value[1];
	
	        while (_spawner.events.length > 0) {
	          var event = _spawner.events.pop();
	          var obj = _spawner.spawn(event);
	          if (obj.kind === 'crew') gameState.crew.push(obj);
	        }
	      }
	
	      // increment furniture times
	    } catch (err) {
	      _didIteratorError8 = true;
	      _iteratorError8 = err;
	    } finally {
	      try {
	        if (!_iteratorNormalCompletion8 && _iterator8.return) {
	          _iterator8.return();
	        }
	      } finally {
	        if (_didIteratorError8) {
	          throw _iteratorError8;
	        }
	      }
	    }
	
	    var _iteratorNormalCompletion9 = true;
	    var _didIteratorError9 = false;
	    var _iteratorError9 = undefined;
	
	    try {
	      for (var _iterator9 = (0, _getIterator3.default)(buttonArray.all()), _step9; !(_iteratorNormalCompletion9 = (_step9 = _iterator9.next()).done); _iteratorNormalCompletion9 = true) {
	        var _step9$value = (0, _slicedToArray3.default)(_step9.value, 2);
	
	        var furniture = _step9$value[0];
	        var button = _step9$value[1];
	
	        if (button.time >= 0) button.time += dt;
	      }
	    } catch (err) {
	      _didIteratorError9 = true;
	      _iteratorError9 = err;
	    } finally {
	      try {
	        if (!_iteratorNormalCompletion9 && _iterator9.return) {
	          _iterator9.return();
	        }
	      } finally {
	        if (_didIteratorError9) {
	          throw _iteratorError9;
	        }
	      }
	    }
	
	    var _iteratorNormalCompletion10 = true;
	    var _didIteratorError10 = false;
	    var _iteratorError10 = undefined;
	
	    try {
	      for (var _iterator10 = (0, _getIterator3.default)(spawnerArray.all()), _step10; !(_iteratorNormalCompletion10 = (_step10 = _iterator10.next()).done); _iteratorNormalCompletion10 = true) {
	        var _step10$value = (0, _slicedToArray3.default)(_step10.value, 2);
	
	        var furniture = _step10$value[0];
	        var _spawner2 = _step10$value[1];
	
	        if (_spawner2.time >= 0) _spawner2.time += dt;
	      }
	
	      // handle character physics
	    } catch (err) {
	      _didIteratorError10 = true;
	      _iteratorError10 = err;
	    } finally {
	      try {
	        if (!_iteratorNormalCompletion10 && _iterator10.return) {
	          _iterator10.return();
	        }
	      } finally {
	        if (_didIteratorError10) {
	          throw _iteratorError10;
	        }
	      }
	    }
	
	    var _iteratorNormalCompletion11 = true;
	    var _didIteratorError11 = false;
	    var _iteratorError11 = undefined;
	
	    try {
	      for (var _iterator11 = (0, _getIterator3.default)(allCharacters(gameState)), _step11; !(_iteratorNormalCompletion11 = (_step11 = _iterator11.next()).done); _iteratorNormalCompletion11 = true) {
	        var _character5 = _step11.value;
	
	        var _actor6 = _character5.actor;
	
	        (0, _assign2.default)(_character5, horizontalCharacterPhysics(_character5, _actor6.actions, isGrounded(_character5)));
	        (0, _assign2.default)(_character5, verticalCharacterPhysics(isGrounded(_character5), _actor6.actions));
	      }
	
	      // generate list of carried characters
	    } catch (err) {
	      _didIteratorError11 = true;
	      _iteratorError11 = err;
	    } finally {
	      try {
	        if (!_iteratorNormalCompletion11 && _iterator11.return) {
	          _iterator11.return();
	        }
	      } finally {
	        if (_didIteratorError11) {
	          throw _iteratorError11;
	        }
	      }
	    }
	
	    var carried = new _set2.default();
	    var _iteratorNormalCompletion12 = true;
	    var _didIteratorError12 = false;
	    var _iteratorError12 = undefined;
	
	    try {
	      for (var _iterator12 = (0, _getIterator3.default)(carrierArray.all()), _step12; !(_iteratorNormalCompletion12 = (_step12 = _iterator12.next()).done); _iteratorNormalCompletion12 = true) {
	        var _step12$value = (0, _slicedToArray3.default)(_step12.value, 2);
	
	        var _character6 = _step12$value[0];
	        var carrier = _step12$value[1];
	
	        if (carrier.carrying) {
	          carried.add(carrier.carrying);
	        }
	      }
	    } catch (err) {
	      _didIteratorError12 = true;
	      _iteratorError12 = err;
	    } finally {
	      try {
	        if (!_iteratorNormalCompletion12 && _iterator12.return) {
	          _iterator12.return();
	        }
	      } finally {
	        if (_didIteratorError12) {
	          throw _iteratorError12;
	        }
	      }
	    }
	
	    var isCarried = function isCarried(id) {
	      return carried.has(id);
	    };
	
	    // handle animation
	    var _iteratorNormalCompletion13 = true;
	    var _didIteratorError13 = false;
	    var _iteratorError13 = undefined;
	
	    try {
	      for (var _iterator13 = (0, _getIterator3.default)(allCharacters(gameState)), _step13; !(_iteratorNormalCompletion13 = (_step13 = _iterator13.next()).done); _iteratorNormalCompletion13 = true) {
	        var _character7 = _step13.value;
	
	        var _animation3 = _character7.animation;
	
	        (0, _assign2.default)(_animation3, characterAnimation(_animation3, _character7, isGrounded(_character7), isCarried(_character7.id), dt));
	      }
	
	      // handle world physics
	    } catch (err) {
	      _didIteratorError13 = true;
	      _iteratorError13 = err;
	    } finally {
	      try {
	        if (!_iteratorNormalCompletion13 && _iterator13.return) {
	          _iterator13.return();
	        }
	      } finally {
	        if (_didIteratorError13) {
	          throw _iteratorError13;
	        }
	      }
	    }
	
	    var _iteratorNormalCompletion14 = true;
	    var _didIteratorError14 = false;
	    var _iteratorError14 = undefined;
	
	    try {
	      for (var _iterator14 = (0, _getIterator3.default)(allCharacters(gameState)), _step14; !(_iteratorNormalCompletion14 = (_step14 = _iterator14.next()).done); _iteratorNormalCompletion14 = true) {
	        var _character8 = _step14.value;
	
	        (0, _assign2.default)(_character8, performAccel(_character8, DT));
	        (0, _assign2.default)(_character8, performVelocity(_character8, DT));
	        (0, _assign2.default)(_character8, adjustRoom(_character8));
	        (0, _assign2.default)(_character8, clampRoom(_character8, rooms.length));
	        (0, _assign2.default)(_character8, clampFloor(_character8));
	      }
	
	      // active area
	    } catch (err) {
	      _didIteratorError14 = true;
	      _iteratorError14 = err;
	    } finally {
	      try {
	        if (!_iteratorNormalCompletion14 && _iterator14.return) {
	          _iterator14.return();
	        }
	      } finally {
	        if (_didIteratorError14) {
	          throw _iteratorError14;
	        }
	      }
	    }
	
	    var activeRoom = gameState.player.roomIndex;
	
	    // generate sprites
	    var sprites = {};
	    var _iteratorNormalCompletion15 = true;
	    var _didIteratorError15 = false;
	    var _iteratorError15 = undefined;
	
	    try {
	      for (var _iterator15 = (0, _getIterator3.default)(allCharacters(gameState)), _step15; !(_iteratorNormalCompletion15 = (_step15 = _iterator15.next()).done); _iteratorNormalCompletion15 = true) {
	        var _character9 = _step15.value;
	
	        var _animation4 = _character9.animation;
	
	        var dRoom = computeRoomDistance(_character9.roomIndex, activeRoom, rooms.length);
	
	        if (!shouldDrawCharacter(_character9, dRoom, ROOM_WIDTH)) continue;
	
	        var _image = computeAnimationImage(_animation4, getOrientedAnimationMap(_character9));
	        var _color = getCharacterColor(_character9);
	        var recolor = computeImageRecolor(_character9);
	        var scale = computeImageScale(_character9);
	
	        var characterRect = generateCharacterRect(_character9);
	        characterRect = adjustRectForRoom(characterRect, dRoom, ROOM_WIDTH);
	        characterRect = adjustRectForScale(characterRect, scale);
	
	        var shadowOpacity = generateShadowOpacity(_character9);
	        var shadowRect = adjustRectForRoom(generateShadowRect(_character9), dRoom, ROOM_WIDTH);
	
	        sprites[_character9.id] = [generateShadowSprite(_character9.id, shadowOpacity, shadowRect), generateCharacterSprite(_character9.id, _image, _color, characterRect, recolor)];
	      }
	
	      // adjust the depth of the sprites
	    } catch (err) {
	      _didIteratorError15 = true;
	      _iteratorError15 = err;
	    } finally {
	      try {
	        if (!_iteratorNormalCompletion15 && _iterator15.return) {
	          _iterator15.return();
	        }
	      } finally {
	        if (_didIteratorError15) {
	          throw _iteratorError15;
	        }
	      }
	    }
	
	    var _iteratorNormalCompletion16 = true;
	    var _didIteratorError16 = false;
	    var _iteratorError16 = undefined;
	
	    try {
	      for (var _iterator16 = (0, _getIterator3.default)((0, _keys2.default)(sprites)), _step16; !(_iteratorNormalCompletion16 = (_step16 = _iterator16.next()).done); _iteratorNormalCompletion16 = true) {
	        var _id2 = _step16.value;
	        var _iteratorNormalCompletion23 = true;
	        var _didIteratorError23 = false;
	        var _iteratorError23 = undefined;
	
	        try {
	          for (var _iterator23 = (0, _getIterator3.default)(sprites[_id2] || []), _step23; !(_iteratorNormalCompletion23 = (_step23 = _iterator23.next()).done); _iteratorNormalCompletion23 = true) {
	            var sprite = _step23.value;
	
	            var _height = FLOOR_HEIGHT + depths.depth(_id2) * 0.14;
	            (0, _assign2.default)(sprite, adjustFloorHeight(sprite, _height));
	          }
	        } catch (err) {
	          _didIteratorError23 = true;
	          _iteratorError23 = err;
	        } finally {
	          try {
	            if (!_iteratorNormalCompletion23 && _iterator23.return) {
	              _iterator23.return();
	            }
	          } finally {
	            if (_didIteratorError23) {
	              throw _iteratorError23;
	            }
	          }
	        }
	      }
	
	      // draw the background
	    } catch (err) {
	      _didIteratorError16 = true;
	      _iteratorError16 = err;
	    } finally {
	      try {
	        if (!_iteratorNormalCompletion16 && _iterator16.return) {
	          _iterator16.return();
	        }
	      } finally {
	        if (_didIteratorError16) {
	          throw _iteratorError16;
	        }
	      }
	    }
	
	    Canvas.drawBackground(buffer, computeRoomColor(gameState.rooms[activeRoom]));
	
	    // draw the floor
	    Canvas.drawRect(buffer, '#ccc', transformRectToPixels({ x0: 0, y0: 0, x1: ROOM_WIDTH, y1: WALL_START_HEIGHT + 0.05 }));
	    Canvas.drawRect(buffer, computeFloorColor(gameState.rooms[activeRoom]), transformRectToPixels({ x0: 0, y0: 0, x1: ROOM_WIDTH, y1: WALL_START_HEIGHT }));
	
	    var drawFurniture = function drawFurniture(furniture) {
	      if (furniture.roomIndex != activeRoom) return;
	      var image = generateFurnitureImage(furniture, time);
	      var rect = transformRectToPixels(generateFurnitureRect(furniture));
	      Canvas.drawImage(buffer, image, rect, {});
	    };
	
	    // draw the background furnitures
	    var _iteratorNormalCompletion17 = true;
	    var _didIteratorError17 = false;
	    var _iteratorError17 = undefined;
	
	    try {
	      for (var _iterator17 = (0, _getIterator3.default)(gameState.furnitures), _step17; !(_iteratorNormalCompletion17 = (_step17 = _iterator17.next()).done); _iteratorNormalCompletion17 = true) {
	        var furniture = _step17.value;
	
	        if (furniture.foreground !== true) drawFurniture(furniture);
	      }
	
	      // draw the sprites in reverse depth order
	    } catch (err) {
	      _didIteratorError17 = true;
	      _iteratorError17 = err;
	    } finally {
	      try {
	        if (!_iteratorNormalCompletion17 && _iterator17.return) {
	          _iterator17.return();
	        }
	      } finally {
	        if (_didIteratorError17) {
	          throw _iteratorError17;
	        }
	      }
	    }
	
	    var _iteratorNormalCompletion18 = true;
	    var _didIteratorError18 = false;
	    var _iteratorError18 = undefined;
	
	    try {
	      for (var _iterator18 = (0, _getIterator3.default)(depths.inReverseOrder()), _step18; !(_iteratorNormalCompletion18 = (_step18 = _iterator18.next()).done); _iteratorNormalCompletion18 = true) {
	        var _id3 = _step18.value;
	        var _iteratorNormalCompletion24 = true;
	        var _didIteratorError24 = false;
	        var _iteratorError24 = undefined;
	
	        try {
	          for (var _iterator24 = (0, _getIterator3.default)(sprites[_id3] || []), _step24; !(_iteratorNormalCompletion24 = (_step24 = _iterator24.next()).done); _iteratorNormalCompletion24 = true) {
	            var _sprite = _step24.value;
	
	            if (_sprite.image === undefined) Canvas.drawRect(buffer, _sprite.color, transformRectToPixels(_sprite));else Canvas.drawImage(buffer, _sprite.image, transformRectToPixels(_sprite), _sprite);
	          }
	        } catch (err) {
	          _didIteratorError24 = true;
	          _iteratorError24 = err;
	        } finally {
	          try {
	            if (!_iteratorNormalCompletion24 && _iterator24.return) {
	              _iterator24.return();
	            }
	          } finally {
	            if (_didIteratorError24) {
	              throw _iteratorError24;
	            }
	          }
	        }
	      }
	
	      // draw the foreground furnitures
	    } catch (err) {
	      _didIteratorError18 = true;
	      _iteratorError18 = err;
	    } finally {
	      try {
	        if (!_iteratorNormalCompletion18 && _iterator18.return) {
	          _iterator18.return();
	        }
	      } finally {
	        if (_didIteratorError18) {
	          throw _iteratorError18;
	        }
	      }
	    }
	
	    var _iteratorNormalCompletion19 = true;
	    var _didIteratorError19 = false;
	    var _iteratorError19 = undefined;
	
	    try {
	      for (var _iterator19 = (0, _getIterator3.default)(gameState.furnitures), _step19; !(_iteratorNormalCompletion19 = (_step19 = _iterator19.next()).done); _iteratorNormalCompletion19 = true) {
	        var _furniture = _step19.value;
	
	        if (_furniture.foreground === true) drawFurniture(_furniture);
	      }
	    } catch (err) {
	      _didIteratorError19 = true;
	      _iteratorError19 = err;
	    } finally {
	      try {
	        if (!_iteratorNormalCompletion19 && _iterator19.return) {
	          _iterator19.return();
	        }
	      } finally {
	        if (_didIteratorError19) {
	          throw _iteratorError19;
	        }
	      }
	    }
	
	    Canvas.drawBuffer(screen, buffer);
	    return DT;
	  };
	
	  runLoop(step);
	});

/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = { "default": __webpack_require__(2), __esModule: true };

/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

	__webpack_require__(3);
	module.exports = __webpack_require__(23).Object.keys;

/***/ },
/* 3 */
/***/ function(module, exports, __webpack_require__) {

	// 19.1.2.14 Object.keys(O)
	var toObject = __webpack_require__(4)
	  , $keys    = __webpack_require__(6);
	
	__webpack_require__(21)('keys', function(){
	  return function keys(it){
	    return $keys(toObject(it));
	  };
	});

/***/ },
/* 4 */
/***/ function(module, exports, __webpack_require__) {

	// 7.1.13 ToObject(argument)
	var defined = __webpack_require__(5);
	module.exports = function(it){
	  return Object(defined(it));
	};

/***/ },
/* 5 */
/***/ function(module, exports) {

	// 7.2.1 RequireObjectCoercible(argument)
	module.exports = function(it){
	  if(it == undefined)throw TypeError("Can't call method on  " + it);
	  return it;
	};

/***/ },
/* 6 */
/***/ function(module, exports, __webpack_require__) {

	// 19.1.2.14 / 15.2.3.14 Object.keys(O)
	var $keys       = __webpack_require__(7)
	  , enumBugKeys = __webpack_require__(20);
	
	module.exports = Object.keys || function keys(O){
	  return $keys(O, enumBugKeys);
	};

/***/ },
/* 7 */
/***/ function(module, exports, __webpack_require__) {

	var has          = __webpack_require__(8)
	  , toIObject    = __webpack_require__(9)
	  , arrayIndexOf = __webpack_require__(12)(false)
	  , IE_PROTO     = __webpack_require__(16)('IE_PROTO');
	
	module.exports = function(object, names){
	  var O      = toIObject(object)
	    , i      = 0
	    , result = []
	    , key;
	  for(key in O)if(key != IE_PROTO)has(O, key) && result.push(key);
	  // Don't enum bug & hidden keys
	  while(names.length > i)if(has(O, key = names[i++])){
	    ~arrayIndexOf(result, key) || result.push(key);
	  }
	  return result;
	};

/***/ },
/* 8 */
/***/ function(module, exports) {

	var hasOwnProperty = {}.hasOwnProperty;
	module.exports = function(it, key){
	  return hasOwnProperty.call(it, key);
	};

/***/ },
/* 9 */
/***/ function(module, exports, __webpack_require__) {

	// to indexed object, toObject with fallback for non-array-like ES3 strings
	var IObject = __webpack_require__(10)
	  , defined = __webpack_require__(5);
	module.exports = function(it){
	  return IObject(defined(it));
	};

/***/ },
/* 10 */
/***/ function(module, exports, __webpack_require__) {

	// fallback for non-array-like ES3 and non-enumerable old V8 strings
	var cof = __webpack_require__(11);
	module.exports = Object('z').propertyIsEnumerable(0) ? Object : function(it){
	  return cof(it) == 'String' ? it.split('') : Object(it);
	};

/***/ },
/* 11 */
/***/ function(module, exports) {

	var toString = {}.toString;
	
	module.exports = function(it){
	  return toString.call(it).slice(8, -1);
	};

/***/ },
/* 12 */
/***/ function(module, exports, __webpack_require__) {

	// false -> Array#indexOf
	// true  -> Array#includes
	var toIObject = __webpack_require__(9)
	  , toLength  = __webpack_require__(13)
	  , toIndex   = __webpack_require__(15);
	module.exports = function(IS_INCLUDES){
	  return function($this, el, fromIndex){
	    var O      = toIObject($this)
	      , length = toLength(O.length)
	      , index  = toIndex(fromIndex, length)
	      , value;
	    // Array#includes uses SameValueZero equality algorithm
	    if(IS_INCLUDES && el != el)while(length > index){
	      value = O[index++];
	      if(value != value)return true;
	    // Array#toIndex ignores holes, Array#includes - not
	    } else for(;length > index; index++)if(IS_INCLUDES || index in O){
	      if(O[index] === el)return IS_INCLUDES || index || 0;
	    } return !IS_INCLUDES && -1;
	  };
	};

/***/ },
/* 13 */
/***/ function(module, exports, __webpack_require__) {

	// 7.1.15 ToLength
	var toInteger = __webpack_require__(14)
	  , min       = Math.min;
	module.exports = function(it){
	  return it > 0 ? min(toInteger(it), 0x1fffffffffffff) : 0; // pow(2, 53) - 1 == 9007199254740991
	};

/***/ },
/* 14 */
/***/ function(module, exports) {

	// 7.1.4 ToInteger
	var ceil  = Math.ceil
	  , floor = Math.floor;
	module.exports = function(it){
	  return isNaN(it = +it) ? 0 : (it > 0 ? floor : ceil)(it);
	};

/***/ },
/* 15 */
/***/ function(module, exports, __webpack_require__) {

	var toInteger = __webpack_require__(14)
	  , max       = Math.max
	  , min       = Math.min;
	module.exports = function(index, length){
	  index = toInteger(index);
	  return index < 0 ? max(index + length, 0) : min(index, length);
	};

/***/ },
/* 16 */
/***/ function(module, exports, __webpack_require__) {

	var shared = __webpack_require__(17)('keys')
	  , uid    = __webpack_require__(19);
	module.exports = function(key){
	  return shared[key] || (shared[key] = uid(key));
	};

/***/ },
/* 17 */
/***/ function(module, exports, __webpack_require__) {

	var global = __webpack_require__(18)
	  , SHARED = '__core-js_shared__'
	  , store  = global[SHARED] || (global[SHARED] = {});
	module.exports = function(key){
	  return store[key] || (store[key] = {});
	};

/***/ },
/* 18 */
/***/ function(module, exports) {

	// https://github.com/zloirock/core-js/issues/86#issuecomment-115759028
	var global = module.exports = typeof window != 'undefined' && window.Math == Math
	  ? window : typeof self != 'undefined' && self.Math == Math ? self : Function('return this')();
	if(typeof __g == 'number')__g = global; // eslint-disable-line no-undef

/***/ },
/* 19 */
/***/ function(module, exports) {

	var id = 0
	  , px = Math.random();
	module.exports = function(key){
	  return 'Symbol('.concat(key === undefined ? '' : key, ')_', (++id + px).toString(36));
	};

/***/ },
/* 20 */
/***/ function(module, exports) {

	// IE 8- don't enum bug keys
	module.exports = (
	  'constructor,hasOwnProperty,isPrototypeOf,propertyIsEnumerable,toLocaleString,toString,valueOf'
	).split(',');

/***/ },
/* 21 */
/***/ function(module, exports, __webpack_require__) {

	// most Object methods by ES6 should accept primitives
	var $export = __webpack_require__(22)
	  , core    = __webpack_require__(23)
	  , fails   = __webpack_require__(32);
	module.exports = function(KEY, exec){
	  var fn  = (core.Object || {})[KEY] || Object[KEY]
	    , exp = {};
	  exp[KEY] = exec(fn);
	  $export($export.S + $export.F * fails(function(){ fn(1); }), 'Object', exp);
	};

/***/ },
/* 22 */
/***/ function(module, exports, __webpack_require__) {

	var global    = __webpack_require__(18)
	  , core      = __webpack_require__(23)
	  , ctx       = __webpack_require__(24)
	  , hide      = __webpack_require__(26)
	  , PROTOTYPE = 'prototype';
	
	var $export = function(type, name, source){
	  var IS_FORCED = type & $export.F
	    , IS_GLOBAL = type & $export.G
	    , IS_STATIC = type & $export.S
	    , IS_PROTO  = type & $export.P
	    , IS_BIND   = type & $export.B
	    , IS_WRAP   = type & $export.W
	    , exports   = IS_GLOBAL ? core : core[name] || (core[name] = {})
	    , expProto  = exports[PROTOTYPE]
	    , target    = IS_GLOBAL ? global : IS_STATIC ? global[name] : (global[name] || {})[PROTOTYPE]
	    , key, own, out;
	  if(IS_GLOBAL)source = name;
	  for(key in source){
	    // contains in native
	    own = !IS_FORCED && target && target[key] !== undefined;
	    if(own && key in exports)continue;
	    // export native or passed
	    out = own ? target[key] : source[key];
	    // prevent global pollution for namespaces
	    exports[key] = IS_GLOBAL && typeof target[key] != 'function' ? source[key]
	    // bind timers to global for call from export context
	    : IS_BIND && own ? ctx(out, global)
	    // wrap global constructors for prevent change them in library
	    : IS_WRAP && target[key] == out ? (function(C){
	      var F = function(a, b, c){
	        if(this instanceof C){
	          switch(arguments.length){
	            case 0: return new C;
	            case 1: return new C(a);
	            case 2: return new C(a, b);
	          } return new C(a, b, c);
	        } return C.apply(this, arguments);
	      };
	      F[PROTOTYPE] = C[PROTOTYPE];
	      return F;
	    // make static versions for prototype methods
	    })(out) : IS_PROTO && typeof out == 'function' ? ctx(Function.call, out) : out;
	    // export proto methods to core.%CONSTRUCTOR%.methods.%NAME%
	    if(IS_PROTO){
	      (exports.virtual || (exports.virtual = {}))[key] = out;
	      // export proto methods to core.%CONSTRUCTOR%.prototype.%NAME%
	      if(type & $export.R && expProto && !expProto[key])hide(expProto, key, out);
	    }
	  }
	};
	// type bitmap
	$export.F = 1;   // forced
	$export.G = 2;   // global
	$export.S = 4;   // static
	$export.P = 8;   // proto
	$export.B = 16;  // bind
	$export.W = 32;  // wrap
	$export.U = 64;  // safe
	$export.R = 128; // real proto method for `library` 
	module.exports = $export;

/***/ },
/* 23 */
/***/ function(module, exports) {

	var core = module.exports = {version: '2.4.0'};
	if(typeof __e == 'number')__e = core; // eslint-disable-line no-undef

/***/ },
/* 24 */
/***/ function(module, exports, __webpack_require__) {

	// optional / simple context binding
	var aFunction = __webpack_require__(25);
	module.exports = function(fn, that, length){
	  aFunction(fn);
	  if(that === undefined)return fn;
	  switch(length){
	    case 1: return function(a){
	      return fn.call(that, a);
	    };
	    case 2: return function(a, b){
	      return fn.call(that, a, b);
	    };
	    case 3: return function(a, b, c){
	      return fn.call(that, a, b, c);
	    };
	  }
	  return function(/* ...args */){
	    return fn.apply(that, arguments);
	  };
	};

/***/ },
/* 25 */
/***/ function(module, exports) {

	module.exports = function(it){
	  if(typeof it != 'function')throw TypeError(it + ' is not a function!');
	  return it;
	};

/***/ },
/* 26 */
/***/ function(module, exports, __webpack_require__) {

	var dP         = __webpack_require__(27)
	  , createDesc = __webpack_require__(35);
	module.exports = __webpack_require__(31) ? function(object, key, value){
	  return dP.f(object, key, createDesc(1, value));
	} : function(object, key, value){
	  object[key] = value;
	  return object;
	};

/***/ },
/* 27 */
/***/ function(module, exports, __webpack_require__) {

	var anObject       = __webpack_require__(28)
	  , IE8_DOM_DEFINE = __webpack_require__(30)
	  , toPrimitive    = __webpack_require__(34)
	  , dP             = Object.defineProperty;
	
	exports.f = __webpack_require__(31) ? Object.defineProperty : function defineProperty(O, P, Attributes){
	  anObject(O);
	  P = toPrimitive(P, true);
	  anObject(Attributes);
	  if(IE8_DOM_DEFINE)try {
	    return dP(O, P, Attributes);
	  } catch(e){ /* empty */ }
	  if('get' in Attributes || 'set' in Attributes)throw TypeError('Accessors not supported!');
	  if('value' in Attributes)O[P] = Attributes.value;
	  return O;
	};

/***/ },
/* 28 */
/***/ function(module, exports, __webpack_require__) {

	var isObject = __webpack_require__(29);
	module.exports = function(it){
	  if(!isObject(it))throw TypeError(it + ' is not an object!');
	  return it;
	};

/***/ },
/* 29 */
/***/ function(module, exports) {

	module.exports = function(it){
	  return typeof it === 'object' ? it !== null : typeof it === 'function';
	};

/***/ },
/* 30 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = !__webpack_require__(31) && !__webpack_require__(32)(function(){
	  return Object.defineProperty(__webpack_require__(33)('div'), 'a', {get: function(){ return 7; }}).a != 7;
	});

/***/ },
/* 31 */
/***/ function(module, exports, __webpack_require__) {

	// Thank's IE8 for his funny defineProperty
	module.exports = !__webpack_require__(32)(function(){
	  return Object.defineProperty({}, 'a', {get: function(){ return 7; }}).a != 7;
	});

/***/ },
/* 32 */
/***/ function(module, exports) {

	module.exports = function(exec){
	  try {
	    return !!exec();
	  } catch(e){
	    return true;
	  }
	};

/***/ },
/* 33 */
/***/ function(module, exports, __webpack_require__) {

	var isObject = __webpack_require__(29)
	  , document = __webpack_require__(18).document
	  // in old IE typeof document.createElement is 'object'
	  , is = isObject(document) && isObject(document.createElement);
	module.exports = function(it){
	  return is ? document.createElement(it) : {};
	};

/***/ },
/* 34 */
/***/ function(module, exports, __webpack_require__) {

	// 7.1.1 ToPrimitive(input [, PreferredType])
	var isObject = __webpack_require__(29);
	// instead of the ES6 spec version, we didn't implement @@toPrimitive case
	// and the second argument - flag - preferred type is a string
	module.exports = function(it, S){
	  if(!isObject(it))return it;
	  var fn, val;
	  if(S && typeof (fn = it.toString) == 'function' && !isObject(val = fn.call(it)))return val;
	  if(typeof (fn = it.valueOf) == 'function' && !isObject(val = fn.call(it)))return val;
	  if(!S && typeof (fn = it.toString) == 'function' && !isObject(val = fn.call(it)))return val;
	  throw TypeError("Can't convert object to primitive value");
	};

/***/ },
/* 35 */
/***/ function(module, exports) {

	module.exports = function(bitmap, value){
	  return {
	    enumerable  : !(bitmap & 1),
	    configurable: !(bitmap & 2),
	    writable    : !(bitmap & 4),
	    value       : value
	  };
	};

/***/ },
/* 36 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	
	exports.__esModule = true;
	
	var _assign = __webpack_require__(37);
	
	var _assign2 = _interopRequireDefault(_assign);
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	exports.default = _assign2.default || function (target) {
	  for (var i = 1; i < arguments.length; i++) {
	    var source = arguments[i];
	
	    for (var key in source) {
	      if (Object.prototype.hasOwnProperty.call(source, key)) {
	        target[key] = source[key];
	      }
	    }
	  }
	
	  return target;
	};

/***/ },
/* 37 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = { "default": __webpack_require__(38), __esModule: true };

/***/ },
/* 38 */
/***/ function(module, exports, __webpack_require__) {

	__webpack_require__(39);
	module.exports = __webpack_require__(23).Object.assign;

/***/ },
/* 39 */
/***/ function(module, exports, __webpack_require__) {

	// 19.1.3.1 Object.assign(target, source)
	var $export = __webpack_require__(22);
	
	$export($export.S + $export.F, 'Object', {assign: __webpack_require__(40)});

/***/ },
/* 40 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	// 19.1.2.1 Object.assign(target, source, ...)
	var getKeys  = __webpack_require__(6)
	  , gOPS     = __webpack_require__(41)
	  , pIE      = __webpack_require__(42)
	  , toObject = __webpack_require__(4)
	  , IObject  = __webpack_require__(10)
	  , $assign  = Object.assign;
	
	// should work with symbols and should have deterministic property order (V8 bug)
	module.exports = !$assign || __webpack_require__(32)(function(){
	  var A = {}
	    , B = {}
	    , S = Symbol()
	    , K = 'abcdefghijklmnopqrst';
	  A[S] = 7;
	  K.split('').forEach(function(k){ B[k] = k; });
	  return $assign({}, A)[S] != 7 || Object.keys($assign({}, B)).join('') != K;
	}) ? function assign(target, source){ // eslint-disable-line no-unused-vars
	  var T     = toObject(target)
	    , aLen  = arguments.length
	    , index = 1
	    , getSymbols = gOPS.f
	    , isEnum     = pIE.f;
	  while(aLen > index){
	    var S      = IObject(arguments[index++])
	      , keys   = getSymbols ? getKeys(S).concat(getSymbols(S)) : getKeys(S)
	      , length = keys.length
	      , j      = 0
	      , key;
	    while(length > j)if(isEnum.call(S, key = keys[j++]))T[key] = S[key];
	  } return T;
	} : $assign;

/***/ },
/* 41 */
/***/ function(module, exports) {

	exports.f = Object.getOwnPropertySymbols;

/***/ },
/* 42 */
/***/ function(module, exports) {

	exports.f = {}.propertyIsEnumerable;

/***/ },
/* 43 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	
	exports.__esModule = true;
	
	var _isIterable2 = __webpack_require__(44);
	
	var _isIterable3 = _interopRequireDefault(_isIterable2);
	
	var _getIterator2 = __webpack_require__(65);
	
	var _getIterator3 = _interopRequireDefault(_getIterator2);
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	exports.default = function () {
	  function sliceIterator(arr, i) {
	    var _arr = [];
	    var _n = true;
	    var _d = false;
	    var _e = undefined;
	
	    try {
	      for (var _i = (0, _getIterator3.default)(arr), _s; !(_n = (_s = _i.next()).done); _n = true) {
	        _arr.push(_s.value);
	
	        if (i && _arr.length === i) break;
	      }
	    } catch (err) {
	      _d = true;
	      _e = err;
	    } finally {
	      try {
	        if (!_n && _i["return"]) _i["return"]();
	      } finally {
	        if (_d) throw _e;
	      }
	    }
	
	    return _arr;
	  }
	
	  return function (arr, i) {
	    if (Array.isArray(arr)) {
	      return arr;
	    } else if ((0, _isIterable3.default)(Object(arr))) {
	      return sliceIterator(arr, i);
	    } else {
	      throw new TypeError("Invalid attempt to destructure non-iterable instance");
	    }
	  };
	}();

/***/ },
/* 44 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = { "default": __webpack_require__(45), __esModule: true };

/***/ },
/* 45 */
/***/ function(module, exports, __webpack_require__) {

	__webpack_require__(46);
	__webpack_require__(61);
	module.exports = __webpack_require__(63);

/***/ },
/* 46 */
/***/ function(module, exports, __webpack_require__) {

	__webpack_require__(47);
	var global        = __webpack_require__(18)
	  , hide          = __webpack_require__(26)
	  , Iterators     = __webpack_require__(50)
	  , TO_STRING_TAG = __webpack_require__(59)('toStringTag');
	
	for(var collections = ['NodeList', 'DOMTokenList', 'MediaList', 'StyleSheetList', 'CSSRuleList'], i = 0; i < 5; i++){
	  var NAME       = collections[i]
	    , Collection = global[NAME]
	    , proto      = Collection && Collection.prototype;
	  if(proto && !proto[TO_STRING_TAG])hide(proto, TO_STRING_TAG, NAME);
	  Iterators[NAME] = Iterators.Array;
	}

/***/ },
/* 47 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	var addToUnscopables = __webpack_require__(48)
	  , step             = __webpack_require__(49)
	  , Iterators        = __webpack_require__(50)
	  , toIObject        = __webpack_require__(9);
	
	// 22.1.3.4 Array.prototype.entries()
	// 22.1.3.13 Array.prototype.keys()
	// 22.1.3.29 Array.prototype.values()
	// 22.1.3.30 Array.prototype[@@iterator]()
	module.exports = __webpack_require__(51)(Array, 'Array', function(iterated, kind){
	  this._t = toIObject(iterated); // target
	  this._i = 0;                   // next index
	  this._k = kind;                // kind
	// 22.1.5.2.1 %ArrayIteratorPrototype%.next()
	}, function(){
	  var O     = this._t
	    , kind  = this._k
	    , index = this._i++;
	  if(!O || index >= O.length){
	    this._t = undefined;
	    return step(1);
	  }
	  if(kind == 'keys'  )return step(0, index);
	  if(kind == 'values')return step(0, O[index]);
	  return step(0, [index, O[index]]);
	}, 'values');
	
	// argumentsList[@@iterator] is %ArrayProto_values% (9.4.4.6, 9.4.4.7)
	Iterators.Arguments = Iterators.Array;
	
	addToUnscopables('keys');
	addToUnscopables('values');
	addToUnscopables('entries');

/***/ },
/* 48 */
/***/ function(module, exports) {

	module.exports = function(){ /* empty */ };

/***/ },
/* 49 */
/***/ function(module, exports) {

	module.exports = function(done, value){
	  return {value: value, done: !!done};
	};

/***/ },
/* 50 */
/***/ function(module, exports) {

	module.exports = {};

/***/ },
/* 51 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	var LIBRARY        = __webpack_require__(52)
	  , $export        = __webpack_require__(22)
	  , redefine       = __webpack_require__(53)
	  , hide           = __webpack_require__(26)
	  , has            = __webpack_require__(8)
	  , Iterators      = __webpack_require__(50)
	  , $iterCreate    = __webpack_require__(54)
	  , setToStringTag = __webpack_require__(58)
	  , getPrototypeOf = __webpack_require__(60)
	  , ITERATOR       = __webpack_require__(59)('iterator')
	  , BUGGY          = !([].keys && 'next' in [].keys()) // Safari has buggy iterators w/o `next`
	  , FF_ITERATOR    = '@@iterator'
	  , KEYS           = 'keys'
	  , VALUES         = 'values';
	
	var returnThis = function(){ return this; };
	
	module.exports = function(Base, NAME, Constructor, next, DEFAULT, IS_SET, FORCED){
	  $iterCreate(Constructor, NAME, next);
	  var getMethod = function(kind){
	    if(!BUGGY && kind in proto)return proto[kind];
	    switch(kind){
	      case KEYS: return function keys(){ return new Constructor(this, kind); };
	      case VALUES: return function values(){ return new Constructor(this, kind); };
	    } return function entries(){ return new Constructor(this, kind); };
	  };
	  var TAG        = NAME + ' Iterator'
	    , DEF_VALUES = DEFAULT == VALUES
	    , VALUES_BUG = false
	    , proto      = Base.prototype
	    , $native    = proto[ITERATOR] || proto[FF_ITERATOR] || DEFAULT && proto[DEFAULT]
	    , $default   = $native || getMethod(DEFAULT)
	    , $entries   = DEFAULT ? !DEF_VALUES ? $default : getMethod('entries') : undefined
	    , $anyNative = NAME == 'Array' ? proto.entries || $native : $native
	    , methods, key, IteratorPrototype;
	  // Fix native
	  if($anyNative){
	    IteratorPrototype = getPrototypeOf($anyNative.call(new Base));
	    if(IteratorPrototype !== Object.prototype){
	      // Set @@toStringTag to native iterators
	      setToStringTag(IteratorPrototype, TAG, true);
	      // fix for some old engines
	      if(!LIBRARY && !has(IteratorPrototype, ITERATOR))hide(IteratorPrototype, ITERATOR, returnThis);
	    }
	  }
	  // fix Array#{values, @@iterator}.name in V8 / FF
	  if(DEF_VALUES && $native && $native.name !== VALUES){
	    VALUES_BUG = true;
	    $default = function values(){ return $native.call(this); };
	  }
	  // Define iterator
	  if((!LIBRARY || FORCED) && (BUGGY || VALUES_BUG || !proto[ITERATOR])){
	    hide(proto, ITERATOR, $default);
	  }
	  // Plug for library
	  Iterators[NAME] = $default;
	  Iterators[TAG]  = returnThis;
	  if(DEFAULT){
	    methods = {
	      values:  DEF_VALUES ? $default : getMethod(VALUES),
	      keys:    IS_SET     ? $default : getMethod(KEYS),
	      entries: $entries
	    };
	    if(FORCED)for(key in methods){
	      if(!(key in proto))redefine(proto, key, methods[key]);
	    } else $export($export.P + $export.F * (BUGGY || VALUES_BUG), NAME, methods);
	  }
	  return methods;
	};

/***/ },
/* 52 */
/***/ function(module, exports) {

	module.exports = true;

/***/ },
/* 53 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = __webpack_require__(26);

/***/ },
/* 54 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	var create         = __webpack_require__(55)
	  , descriptor     = __webpack_require__(35)
	  , setToStringTag = __webpack_require__(58)
	  , IteratorPrototype = {};
	
	// 25.1.2.1.1 %IteratorPrototype%[@@iterator]()
	__webpack_require__(26)(IteratorPrototype, __webpack_require__(59)('iterator'), function(){ return this; });
	
	module.exports = function(Constructor, NAME, next){
	  Constructor.prototype = create(IteratorPrototype, {next: descriptor(1, next)});
	  setToStringTag(Constructor, NAME + ' Iterator');
	};

/***/ },
/* 55 */
/***/ function(module, exports, __webpack_require__) {

	// 19.1.2.2 / 15.2.3.5 Object.create(O [, Properties])
	var anObject    = __webpack_require__(28)
	  , dPs         = __webpack_require__(56)
	  , enumBugKeys = __webpack_require__(20)
	  , IE_PROTO    = __webpack_require__(16)('IE_PROTO')
	  , Empty       = function(){ /* empty */ }
	  , PROTOTYPE   = 'prototype';
	
	// Create object with fake `null` prototype: use iframe Object with cleared prototype
	var createDict = function(){
	  // Thrash, waste and sodomy: IE GC bug
	  var iframe = __webpack_require__(33)('iframe')
	    , i      = enumBugKeys.length
	    , gt     = '>'
	    , iframeDocument;
	  iframe.style.display = 'none';
	  __webpack_require__(57).appendChild(iframe);
	  iframe.src = 'javascript:'; // eslint-disable-line no-script-url
	  // createDict = iframe.contentWindow.Object;
	  // html.removeChild(iframe);
	  iframeDocument = iframe.contentWindow.document;
	  iframeDocument.open();
	  iframeDocument.write('<script>document.F=Object</script' + gt);
	  iframeDocument.close();
	  createDict = iframeDocument.F;
	  while(i--)delete createDict[PROTOTYPE][enumBugKeys[i]];
	  return createDict();
	};
	
	module.exports = Object.create || function create(O, Properties){
	  var result;
	  if(O !== null){
	    Empty[PROTOTYPE] = anObject(O);
	    result = new Empty;
	    Empty[PROTOTYPE] = null;
	    // add "__proto__" for Object.getPrototypeOf polyfill
	    result[IE_PROTO] = O;
	  } else result = createDict();
	  return Properties === undefined ? result : dPs(result, Properties);
	};

/***/ },
/* 56 */
/***/ function(module, exports, __webpack_require__) {

	var dP       = __webpack_require__(27)
	  , anObject = __webpack_require__(28)
	  , getKeys  = __webpack_require__(6);
	
	module.exports = __webpack_require__(31) ? Object.defineProperties : function defineProperties(O, Properties){
	  anObject(O);
	  var keys   = getKeys(Properties)
	    , length = keys.length
	    , i = 0
	    , P;
	  while(length > i)dP.f(O, P = keys[i++], Properties[P]);
	  return O;
	};

/***/ },
/* 57 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = __webpack_require__(18).document && document.documentElement;

/***/ },
/* 58 */
/***/ function(module, exports, __webpack_require__) {

	var def = __webpack_require__(27).f
	  , has = __webpack_require__(8)
	  , TAG = __webpack_require__(59)('toStringTag');
	
	module.exports = function(it, tag, stat){
	  if(it && !has(it = stat ? it : it.prototype, TAG))def(it, TAG, {configurable: true, value: tag});
	};

/***/ },
/* 59 */
/***/ function(module, exports, __webpack_require__) {

	var store      = __webpack_require__(17)('wks')
	  , uid        = __webpack_require__(19)
	  , Symbol     = __webpack_require__(18).Symbol
	  , USE_SYMBOL = typeof Symbol == 'function';
	
	var $exports = module.exports = function(name){
	  return store[name] || (store[name] =
	    USE_SYMBOL && Symbol[name] || (USE_SYMBOL ? Symbol : uid)('Symbol.' + name));
	};
	
	$exports.store = store;

/***/ },
/* 60 */
/***/ function(module, exports, __webpack_require__) {

	// 19.1.2.9 / 15.2.3.2 Object.getPrototypeOf(O)
	var has         = __webpack_require__(8)
	  , toObject    = __webpack_require__(4)
	  , IE_PROTO    = __webpack_require__(16)('IE_PROTO')
	  , ObjectProto = Object.prototype;
	
	module.exports = Object.getPrototypeOf || function(O){
	  O = toObject(O);
	  if(has(O, IE_PROTO))return O[IE_PROTO];
	  if(typeof O.constructor == 'function' && O instanceof O.constructor){
	    return O.constructor.prototype;
	  } return O instanceof Object ? ObjectProto : null;
	};

/***/ },
/* 61 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	var $at  = __webpack_require__(62)(true);
	
	// 21.1.3.27 String.prototype[@@iterator]()
	__webpack_require__(51)(String, 'String', function(iterated){
	  this._t = String(iterated); // target
	  this._i = 0;                // next index
	// 21.1.5.2.1 %StringIteratorPrototype%.next()
	}, function(){
	  var O     = this._t
	    , index = this._i
	    , point;
	  if(index >= O.length)return {value: undefined, done: true};
	  point = $at(O, index);
	  this._i += point.length;
	  return {value: point, done: false};
	});

/***/ },
/* 62 */
/***/ function(module, exports, __webpack_require__) {

	var toInteger = __webpack_require__(14)
	  , defined   = __webpack_require__(5);
	// true  -> String#at
	// false -> String#codePointAt
	module.exports = function(TO_STRING){
	  return function(that, pos){
	    var s = String(defined(that))
	      , i = toInteger(pos)
	      , l = s.length
	      , a, b;
	    if(i < 0 || i >= l)return TO_STRING ? '' : undefined;
	    a = s.charCodeAt(i);
	    return a < 0xd800 || a > 0xdbff || i + 1 === l || (b = s.charCodeAt(i + 1)) < 0xdc00 || b > 0xdfff
	      ? TO_STRING ? s.charAt(i) : a
	      : TO_STRING ? s.slice(i, i + 2) : (a - 0xd800 << 10) + (b - 0xdc00) + 0x10000;
	  };
	};

/***/ },
/* 63 */
/***/ function(module, exports, __webpack_require__) {

	var classof   = __webpack_require__(64)
	  , ITERATOR  = __webpack_require__(59)('iterator')
	  , Iterators = __webpack_require__(50);
	module.exports = __webpack_require__(23).isIterable = function(it){
	  var O = Object(it);
	  return O[ITERATOR] !== undefined
	    || '@@iterator' in O
	    || Iterators.hasOwnProperty(classof(O));
	};

/***/ },
/* 64 */
/***/ function(module, exports, __webpack_require__) {

	// getting tag from 19.1.3.6 Object.prototype.toString()
	var cof = __webpack_require__(11)
	  , TAG = __webpack_require__(59)('toStringTag')
	  // ES3 wrong here
	  , ARG = cof(function(){ return arguments; }()) == 'Arguments';
	
	// fallback for IE11 Script Access Denied error
	var tryGet = function(it, key){
	  try {
	    return it[key];
	  } catch(e){ /* empty */ }
	};
	
	module.exports = function(it){
	  var O, T, B;
	  return it === undefined ? 'Undefined' : it === null ? 'Null'
	    // @@toStringTag case
	    : typeof (T = tryGet(O = Object(it), TAG)) == 'string' ? T
	    // builtinTag case
	    : ARG ? cof(O)
	    // ES3 arguments fallback
	    : (B = cof(O)) == 'Object' && typeof O.callee == 'function' ? 'Arguments' : B;
	};

/***/ },
/* 65 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = { "default": __webpack_require__(66), __esModule: true };

/***/ },
/* 66 */
/***/ function(module, exports, __webpack_require__) {

	__webpack_require__(46);
	__webpack_require__(61);
	module.exports = __webpack_require__(67);

/***/ },
/* 67 */
/***/ function(module, exports, __webpack_require__) {

	var anObject = __webpack_require__(28)
	  , get      = __webpack_require__(68);
	module.exports = __webpack_require__(23).getIterator = function(it){
	  var iterFn = get(it);
	  if(typeof iterFn != 'function')throw TypeError(it + ' is not iterable!');
	  return anObject(iterFn.call(it));
	};

/***/ },
/* 68 */
/***/ function(module, exports, __webpack_require__) {

	var classof   = __webpack_require__(64)
	  , ITERATOR  = __webpack_require__(59)('iterator')
	  , Iterators = __webpack_require__(50);
	module.exports = __webpack_require__(23).getIteratorMethod = function(it){
	  if(it != undefined)return it[ITERATOR]
	    || it['@@iterator']
	    || Iterators[classof(it)];
	};

/***/ },
/* 69 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = __webpack_require__(70);


/***/ },
/* 70 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(global) {// This method of obtaining a reference to the global object needs to be
	// kept identical to the way it is obtained in runtime.js
	var g =
	  typeof global === "object" ? global :
	  typeof window === "object" ? window :
	  typeof self === "object" ? self : this;
	
	// Use `getOwnPropertyNames` because not all browsers support calling
	// `hasOwnProperty` on the global `self` object in a worker. See #183.
	var hadRuntime = g.regeneratorRuntime &&
	  Object.getOwnPropertyNames(g).indexOf("regeneratorRuntime") >= 0;
	
	// Save the old regeneratorRuntime in case it needs to be restored later.
	var oldRuntime = hadRuntime && g.regeneratorRuntime;
	
	// Force reevalutation of runtime.js.
	g.regeneratorRuntime = undefined;
	
	module.exports = __webpack_require__(71);
	
	if (hadRuntime) {
	  // Restore the original runtime.
	  g.regeneratorRuntime = oldRuntime;
	} else {
	  // Remove the global property added by runtime.js.
	  try {
	    delete g.regeneratorRuntime;
	  } catch(e) {
	    g.regeneratorRuntime = undefined;
	  }
	}
	
	/* WEBPACK VAR INJECTION */}.call(exports, (function() { return this; }())))

/***/ },
/* 71 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(global, process) {/**
	 * Copyright (c) 2014, Facebook, Inc.
	 * All rights reserved.
	 *
	 * This source code is licensed under the BSD-style license found in the
	 * https://raw.github.com/facebook/regenerator/master/LICENSE file. An
	 * additional grant of patent rights can be found in the PATENTS file in
	 * the same directory.
	 */
	
	!(function(global) {
	  "use strict";
	
	  var hasOwn = Object.prototype.hasOwnProperty;
	  var undefined; // More compressible than void 0.
	  var $Symbol = typeof Symbol === "function" ? Symbol : {};
	  var iteratorSymbol = $Symbol.iterator || "@@iterator";
	  var toStringTagSymbol = $Symbol.toStringTag || "@@toStringTag";
	
	  var inModule = typeof module === "object";
	  var runtime = global.regeneratorRuntime;
	  if (runtime) {
	    if (inModule) {
	      // If regeneratorRuntime is defined globally and we're in a module,
	      // make the exports object identical to regeneratorRuntime.
	      module.exports = runtime;
	    }
	    // Don't bother evaluating the rest of this file if the runtime was
	    // already defined globally.
	    return;
	  }
	
	  // Define the runtime globally (as expected by generated code) as either
	  // module.exports (if we're in a module) or a new, empty object.
	  runtime = global.regeneratorRuntime = inModule ? module.exports : {};
	
	  function wrap(innerFn, outerFn, self, tryLocsList) {
	    // If outerFn provided, then outerFn.prototype instanceof Generator.
	    var generator = Object.create((outerFn || Generator).prototype);
	    var context = new Context(tryLocsList || []);
	
	    // The ._invoke method unifies the implementations of the .next,
	    // .throw, and .return methods.
	    generator._invoke = makeInvokeMethod(innerFn, self, context);
	
	    return generator;
	  }
	  runtime.wrap = wrap;
	
	  // Try/catch helper to minimize deoptimizations. Returns a completion
	  // record like context.tryEntries[i].completion. This interface could
	  // have been (and was previously) designed to take a closure to be
	  // invoked without arguments, but in all the cases we care about we
	  // already have an existing method we want to call, so there's no need
	  // to create a new function object. We can even get away with assuming
	  // the method takes exactly one argument, since that happens to be true
	  // in every case, so we don't have to touch the arguments object. The
	  // only additional allocation required is the completion record, which
	  // has a stable shape and so hopefully should be cheap to allocate.
	  function tryCatch(fn, obj, arg) {
	    try {
	      return { type: "normal", arg: fn.call(obj, arg) };
	    } catch (err) {
	      return { type: "throw", arg: err };
	    }
	  }
	
	  var GenStateSuspendedStart = "suspendedStart";
	  var GenStateSuspendedYield = "suspendedYield";
	  var GenStateExecuting = "executing";
	  var GenStateCompleted = "completed";
	
	  // Returning this object from the innerFn has the same effect as
	  // breaking out of the dispatch switch statement.
	  var ContinueSentinel = {};
	
	  // Dummy constructor functions that we use as the .constructor and
	  // .constructor.prototype properties for functions that return Generator
	  // objects. For full spec compliance, you may wish to configure your
	  // minifier not to mangle the names of these two functions.
	  function Generator() {}
	  function GeneratorFunction() {}
	  function GeneratorFunctionPrototype() {}
	
	  var Gp = GeneratorFunctionPrototype.prototype = Generator.prototype;
	  GeneratorFunction.prototype = Gp.constructor = GeneratorFunctionPrototype;
	  GeneratorFunctionPrototype.constructor = GeneratorFunction;
	  GeneratorFunctionPrototype[toStringTagSymbol] = GeneratorFunction.displayName = "GeneratorFunction";
	
	  // Helper for defining the .next, .throw, and .return methods of the
	  // Iterator interface in terms of a single ._invoke method.
	  function defineIteratorMethods(prototype) {
	    ["next", "throw", "return"].forEach(function(method) {
	      prototype[method] = function(arg) {
	        return this._invoke(method, arg);
	      };
	    });
	  }
	
	  runtime.isGeneratorFunction = function(genFun) {
	    var ctor = typeof genFun === "function" && genFun.constructor;
	    return ctor
	      ? ctor === GeneratorFunction ||
	        // For the native GeneratorFunction constructor, the best we can
	        // do is to check its .name property.
	        (ctor.displayName || ctor.name) === "GeneratorFunction"
	      : false;
	  };
	
	  runtime.mark = function(genFun) {
	    if (Object.setPrototypeOf) {
	      Object.setPrototypeOf(genFun, GeneratorFunctionPrototype);
	    } else {
	      genFun.__proto__ = GeneratorFunctionPrototype;
	      if (!(toStringTagSymbol in genFun)) {
	        genFun[toStringTagSymbol] = "GeneratorFunction";
	      }
	    }
	    genFun.prototype = Object.create(Gp);
	    return genFun;
	  };
	
	  // Within the body of any async function, `await x` is transformed to
	  // `yield regeneratorRuntime.awrap(x)`, so that the runtime can test
	  // `value instanceof AwaitArgument` to determine if the yielded value is
	  // meant to be awaited. Some may consider the name of this method too
	  // cutesy, but they are curmudgeons.
	  runtime.awrap = function(arg) {
	    return new AwaitArgument(arg);
	  };
	
	  function AwaitArgument(arg) {
	    this.arg = arg;
	  }
	
	  function AsyncIterator(generator) {
	    function invoke(method, arg, resolve, reject) {
	      var record = tryCatch(generator[method], generator, arg);
	      if (record.type === "throw") {
	        reject(record.arg);
	      } else {
	        var result = record.arg;
	        var value = result.value;
	        if (value instanceof AwaitArgument) {
	          return Promise.resolve(value.arg).then(function(value) {
	            invoke("next", value, resolve, reject);
	          }, function(err) {
	            invoke("throw", err, resolve, reject);
	          });
	        }
	
	        return Promise.resolve(value).then(function(unwrapped) {
	          // When a yielded Promise is resolved, its final value becomes
	          // the .value of the Promise<{value,done}> result for the
	          // current iteration. If the Promise is rejected, however, the
	          // result for this iteration will be rejected with the same
	          // reason. Note that rejections of yielded Promises are not
	          // thrown back into the generator function, as is the case
	          // when an awaited Promise is rejected. This difference in
	          // behavior between yield and await is important, because it
	          // allows the consumer to decide what to do with the yielded
	          // rejection (swallow it and continue, manually .throw it back
	          // into the generator, abandon iteration, whatever). With
	          // await, by contrast, there is no opportunity to examine the
	          // rejection reason outside the generator function, so the
	          // only option is to throw it from the await expression, and
	          // let the generator function handle the exception.
	          result.value = unwrapped;
	          resolve(result);
	        }, reject);
	      }
	    }
	
	    if (typeof process === "object" && process.domain) {
	      invoke = process.domain.bind(invoke);
	    }
	
	    var previousPromise;
	
	    function enqueue(method, arg) {
	      function callInvokeWithMethodAndArg() {
	        return new Promise(function(resolve, reject) {
	          invoke(method, arg, resolve, reject);
	        });
	      }
	
	      return previousPromise =
	        // If enqueue has been called before, then we want to wait until
	        // all previous Promises have been resolved before calling invoke,
	        // so that results are always delivered in the correct order. If
	        // enqueue has not been called before, then it is important to
	        // call invoke immediately, without waiting on a callback to fire,
	        // so that the async generator function has the opportunity to do
	        // any necessary setup in a predictable way. This predictability
	        // is why the Promise constructor synchronously invokes its
	        // executor callback, and why async functions synchronously
	        // execute code before the first await. Since we implement simple
	        // async functions in terms of async generators, it is especially
	        // important to get this right, even though it requires care.
	        previousPromise ? previousPromise.then(
	          callInvokeWithMethodAndArg,
	          // Avoid propagating failures to Promises returned by later
	          // invocations of the iterator.
	          callInvokeWithMethodAndArg
	        ) : callInvokeWithMethodAndArg();
	    }
	
	    // Define the unified helper method that is used to implement .next,
	    // .throw, and .return (see defineIteratorMethods).
	    this._invoke = enqueue;
	  }
	
	  defineIteratorMethods(AsyncIterator.prototype);
	
	  // Note that simple async functions are implemented on top of
	  // AsyncIterator objects; they just return a Promise for the value of
	  // the final result produced by the iterator.
	  runtime.async = function(innerFn, outerFn, self, tryLocsList) {
	    var iter = new AsyncIterator(
	      wrap(innerFn, outerFn, self, tryLocsList)
	    );
	
	    return runtime.isGeneratorFunction(outerFn)
	      ? iter // If outerFn is a generator, return the full iterator.
	      : iter.next().then(function(result) {
	          return result.done ? result.value : iter.next();
	        });
	  };
	
	  function makeInvokeMethod(innerFn, self, context) {
	    var state = GenStateSuspendedStart;
	
	    return function invoke(method, arg) {
	      if (state === GenStateExecuting) {
	        throw new Error("Generator is already running");
	      }
	
	      if (state === GenStateCompleted) {
	        if (method === "throw") {
	          throw arg;
	        }
	
	        // Be forgiving, per 25.3.3.3.3 of the spec:
	        // https://people.mozilla.org/~jorendorff/es6-draft.html#sec-generatorresume
	        return doneResult();
	      }
	
	      while (true) {
	        var delegate = context.delegate;
	        if (delegate) {
	          if (method === "return" ||
	              (method === "throw" && delegate.iterator[method] === undefined)) {
	            // A return or throw (when the delegate iterator has no throw
	            // method) always terminates the yield* loop.
	            context.delegate = null;
	
	            // If the delegate iterator has a return method, give it a
	            // chance to clean up.
	            var returnMethod = delegate.iterator["return"];
	            if (returnMethod) {
	              var record = tryCatch(returnMethod, delegate.iterator, arg);
	              if (record.type === "throw") {
	                // If the return method threw an exception, let that
	                // exception prevail over the original return or throw.
	                method = "throw";
	                arg = record.arg;
	                continue;
	              }
	            }
	
	            if (method === "return") {
	              // Continue with the outer return, now that the delegate
	              // iterator has been terminated.
	              continue;
	            }
	          }
	
	          var record = tryCatch(
	            delegate.iterator[method],
	            delegate.iterator,
	            arg
	          );
	
	          if (record.type === "throw") {
	            context.delegate = null;
	
	            // Like returning generator.throw(uncaught), but without the
	            // overhead of an extra function call.
	            method = "throw";
	            arg = record.arg;
	            continue;
	          }
	
	          // Delegate generator ran and handled its own exceptions so
	          // regardless of what the method was, we continue as if it is
	          // "next" with an undefined arg.
	          method = "next";
	          arg = undefined;
	
	          var info = record.arg;
	          if (info.done) {
	            context[delegate.resultName] = info.value;
	            context.next = delegate.nextLoc;
	          } else {
	            state = GenStateSuspendedYield;
	            return info;
	          }
	
	          context.delegate = null;
	        }
	
	        if (method === "next") {
	          // Setting context._sent for legacy support of Babel's
	          // function.sent implementation.
	          context.sent = context._sent = arg;
	
	        } else if (method === "throw") {
	          if (state === GenStateSuspendedStart) {
	            state = GenStateCompleted;
	            throw arg;
	          }
	
	          if (context.dispatchException(arg)) {
	            // If the dispatched exception was caught by a catch block,
	            // then let that catch block handle the exception normally.
	            method = "next";
	            arg = undefined;
	          }
	
	        } else if (method === "return") {
	          context.abrupt("return", arg);
	        }
	
	        state = GenStateExecuting;
	
	        var record = tryCatch(innerFn, self, context);
	        if (record.type === "normal") {
	          // If an exception is thrown from innerFn, we leave state ===
	          // GenStateExecuting and loop back for another invocation.
	          state = context.done
	            ? GenStateCompleted
	            : GenStateSuspendedYield;
	
	          var info = {
	            value: record.arg,
	            done: context.done
	          };
	
	          if (record.arg === ContinueSentinel) {
	            if (context.delegate && method === "next") {
	              // Deliberately forget the last sent value so that we don't
	              // accidentally pass it on to the delegate.
	              arg = undefined;
	            }
	          } else {
	            return info;
	          }
	
	        } else if (record.type === "throw") {
	          state = GenStateCompleted;
	          // Dispatch the exception by looping back around to the
	          // context.dispatchException(arg) call above.
	          method = "throw";
	          arg = record.arg;
	        }
	      }
	    };
	  }
	
	  // Define Generator.prototype.{next,throw,return} in terms of the
	  // unified ._invoke helper method.
	  defineIteratorMethods(Gp);
	
	  Gp[iteratorSymbol] = function() {
	    return this;
	  };
	
	  Gp[toStringTagSymbol] = "Generator";
	
	  Gp.toString = function() {
	    return "[object Generator]";
	  };
	
	  function pushTryEntry(locs) {
	    var entry = { tryLoc: locs[0] };
	
	    if (1 in locs) {
	      entry.catchLoc = locs[1];
	    }
	
	    if (2 in locs) {
	      entry.finallyLoc = locs[2];
	      entry.afterLoc = locs[3];
	    }
	
	    this.tryEntries.push(entry);
	  }
	
	  function resetTryEntry(entry) {
	    var record = entry.completion || {};
	    record.type = "normal";
	    delete record.arg;
	    entry.completion = record;
	  }
	
	  function Context(tryLocsList) {
	    // The root entry object (effectively a try statement without a catch
	    // or a finally block) gives us a place to store values thrown from
	    // locations where there is no enclosing try statement.
	    this.tryEntries = [{ tryLoc: "root" }];
	    tryLocsList.forEach(pushTryEntry, this);
	    this.reset(true);
	  }
	
	  runtime.keys = function(object) {
	    var keys = [];
	    for (var key in object) {
	      keys.push(key);
	    }
	    keys.reverse();
	
	    // Rather than returning an object with a next method, we keep
	    // things simple and return the next function itself.
	    return function next() {
	      while (keys.length) {
	        var key = keys.pop();
	        if (key in object) {
	          next.value = key;
	          next.done = false;
	          return next;
	        }
	      }
	
	      // To avoid creating an additional object, we just hang the .value
	      // and .done properties off the next function object itself. This
	      // also ensures that the minifier will not anonymize the function.
	      next.done = true;
	      return next;
	    };
	  };
	
	  function values(iterable) {
	    if (iterable) {
	      var iteratorMethod = iterable[iteratorSymbol];
	      if (iteratorMethod) {
	        return iteratorMethod.call(iterable);
	      }
	
	      if (typeof iterable.next === "function") {
	        return iterable;
	      }
	
	      if (!isNaN(iterable.length)) {
	        var i = -1, next = function next() {
	          while (++i < iterable.length) {
	            if (hasOwn.call(iterable, i)) {
	              next.value = iterable[i];
	              next.done = false;
	              return next;
	            }
	          }
	
	          next.value = undefined;
	          next.done = true;
	
	          return next;
	        };
	
	        return next.next = next;
	      }
	    }
	
	    // Return an iterator with no values.
	    return { next: doneResult };
	  }
	  runtime.values = values;
	
	  function doneResult() {
	    return { value: undefined, done: true };
	  }
	
	  Context.prototype = {
	    constructor: Context,
	
	    reset: function(skipTempReset) {
	      this.prev = 0;
	      this.next = 0;
	      // Resetting context._sent for legacy support of Babel's
	      // function.sent implementation.
	      this.sent = this._sent = undefined;
	      this.done = false;
	      this.delegate = null;
	
	      this.tryEntries.forEach(resetTryEntry);
	
	      if (!skipTempReset) {
	        for (var name in this) {
	          // Not sure about the optimal order of these conditions:
	          if (name.charAt(0) === "t" &&
	              hasOwn.call(this, name) &&
	              !isNaN(+name.slice(1))) {
	            this[name] = undefined;
	          }
	        }
	      }
	    },
	
	    stop: function() {
	      this.done = true;
	
	      var rootEntry = this.tryEntries[0];
	      var rootRecord = rootEntry.completion;
	      if (rootRecord.type === "throw") {
	        throw rootRecord.arg;
	      }
	
	      return this.rval;
	    },
	
	    dispatchException: function(exception) {
	      if (this.done) {
	        throw exception;
	      }
	
	      var context = this;
	      function handle(loc, caught) {
	        record.type = "throw";
	        record.arg = exception;
	        context.next = loc;
	        return !!caught;
	      }
	
	      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
	        var entry = this.tryEntries[i];
	        var record = entry.completion;
	
	        if (entry.tryLoc === "root") {
	          // Exception thrown outside of any try block that could handle
	          // it, so set the completion value of the entire function to
	          // throw the exception.
	          return handle("end");
	        }
	
	        if (entry.tryLoc <= this.prev) {
	          var hasCatch = hasOwn.call(entry, "catchLoc");
	          var hasFinally = hasOwn.call(entry, "finallyLoc");
	
	          if (hasCatch && hasFinally) {
	            if (this.prev < entry.catchLoc) {
	              return handle(entry.catchLoc, true);
	            } else if (this.prev < entry.finallyLoc) {
	              return handle(entry.finallyLoc);
	            }
	
	          } else if (hasCatch) {
	            if (this.prev < entry.catchLoc) {
	              return handle(entry.catchLoc, true);
	            }
	
	          } else if (hasFinally) {
	            if (this.prev < entry.finallyLoc) {
	              return handle(entry.finallyLoc);
	            }
	
	          } else {
	            throw new Error("try statement without catch or finally");
	          }
	        }
	      }
	    },
	
	    abrupt: function(type, arg) {
	      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
	        var entry = this.tryEntries[i];
	        if (entry.tryLoc <= this.prev &&
	            hasOwn.call(entry, "finallyLoc") &&
	            this.prev < entry.finallyLoc) {
	          var finallyEntry = entry;
	          break;
	        }
	      }
	
	      if (finallyEntry &&
	          (type === "break" ||
	           type === "continue") &&
	          finallyEntry.tryLoc <= arg &&
	          arg <= finallyEntry.finallyLoc) {
	        // Ignore the finally entry if control is not jumping to a
	        // location outside the try/catch block.
	        finallyEntry = null;
	      }
	
	      var record = finallyEntry ? finallyEntry.completion : {};
	      record.type = type;
	      record.arg = arg;
	
	      if (finallyEntry) {
	        this.next = finallyEntry.finallyLoc;
	      } else {
	        this.complete(record);
	      }
	
	      return ContinueSentinel;
	    },
	
	    complete: function(record, afterLoc) {
	      if (record.type === "throw") {
	        throw record.arg;
	      }
	
	      if (record.type === "break" ||
	          record.type === "continue") {
	        this.next = record.arg;
	      } else if (record.type === "return") {
	        this.rval = record.arg;
	        this.next = "end";
	      } else if (record.type === "normal" && afterLoc) {
	        this.next = afterLoc;
	      }
	    },
	
	    finish: function(finallyLoc) {
	      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
	        var entry = this.tryEntries[i];
	        if (entry.finallyLoc === finallyLoc) {
	          this.complete(entry.completion, entry.afterLoc);
	          resetTryEntry(entry);
	          return ContinueSentinel;
	        }
	      }
	    },
	
	    "catch": function(tryLoc) {
	      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
	        var entry = this.tryEntries[i];
	        if (entry.tryLoc === tryLoc) {
	          var record = entry.completion;
	          if (record.type === "throw") {
	            var thrown = record.arg;
	            resetTryEntry(entry);
	          }
	          return thrown;
	        }
	      }
	
	      // The context.catch method must only be called with a location
	      // argument that corresponds to a known catch block.
	      throw new Error("illegal catch attempt");
	    },
	
	    delegateYield: function(iterable, resultName, nextLoc) {
	      this.delegate = {
	        iterator: values(iterable),
	        resultName: resultName,
	        nextLoc: nextLoc
	      };
	
	      return ContinueSentinel;
	    }
	  };
	})(
	  // Among the various tricks for obtaining a reference to the global
	  // object, this seems to be the most reliable technique that does not
	  // use indirect eval (which violates Content Security Policy).
	  typeof global === "object" ? global :
	  typeof window === "object" ? window :
	  typeof self === "object" ? self : this
	);
	
	/* WEBPACK VAR INJECTION */}.call(exports, (function() { return this; }()), __webpack_require__(72)))

/***/ },
/* 72 */
/***/ function(module, exports) {

	// shim for using process in browser
	
	var process = module.exports = {};
	var queue = [];
	var draining = false;
	var currentQueue;
	var queueIndex = -1;
	
	function cleanUpNextTick() {
	    if (!draining || !currentQueue) {
	        return;
	    }
	    draining = false;
	    if (currentQueue.length) {
	        queue = currentQueue.concat(queue);
	    } else {
	        queueIndex = -1;
	    }
	    if (queue.length) {
	        drainQueue();
	    }
	}
	
	function drainQueue() {
	    if (draining) {
	        return;
	    }
	    var timeout = setTimeout(cleanUpNextTick);
	    draining = true;
	
	    var len = queue.length;
	    while(len) {
	        currentQueue = queue;
	        queue = [];
	        while (++queueIndex < len) {
	            if (currentQueue) {
	                currentQueue[queueIndex].run();
	            }
	        }
	        queueIndex = -1;
	        len = queue.length;
	    }
	    currentQueue = null;
	    draining = false;
	    clearTimeout(timeout);
	}
	
	process.nextTick = function (fun) {
	    var args = new Array(arguments.length - 1);
	    if (arguments.length > 1) {
	        for (var i = 1; i < arguments.length; i++) {
	            args[i - 1] = arguments[i];
	        }
	    }
	    queue.push(new Item(fun, args));
	    if (queue.length === 1 && !draining) {
	        setTimeout(drainQueue, 0);
	    }
	};
	
	// v8 likes predictible objects
	function Item(fun, array) {
	    this.fun = fun;
	    this.array = array;
	}
	Item.prototype.run = function () {
	    this.fun.apply(null, this.array);
	};
	process.title = 'browser';
	process.browser = true;
	process.env = {};
	process.argv = [];
	process.version = ''; // empty string to avoid regexp issues
	process.versions = {};
	
	function noop() {}
	
	process.on = noop;
	process.addListener = noop;
	process.once = noop;
	process.off = noop;
	process.removeListener = noop;
	process.removeAllListeners = noop;
	process.emit = noop;
	
	process.binding = function (name) {
	    throw new Error('process.binding is not supported');
	};
	
	process.cwd = function () { return '/' };
	process.chdir = function (dir) {
	    throw new Error('process.chdir is not supported');
	};
	process.umask = function() { return 0; };


/***/ },
/* 73 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = { "default": __webpack_require__(74), __esModule: true };

/***/ },
/* 74 */
/***/ function(module, exports, __webpack_require__) {

	__webpack_require__(61);
	__webpack_require__(75);
	module.exports = __webpack_require__(23).Array.from;

/***/ },
/* 75 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	var ctx            = __webpack_require__(24)
	  , $export        = __webpack_require__(22)
	  , toObject       = __webpack_require__(4)
	  , call           = __webpack_require__(76)
	  , isArrayIter    = __webpack_require__(77)
	  , toLength       = __webpack_require__(13)
	  , createProperty = __webpack_require__(78)
	  , getIterFn      = __webpack_require__(68);
	
	$export($export.S + $export.F * !__webpack_require__(79)(function(iter){ Array.from(iter); }), 'Array', {
	  // 22.1.2.1 Array.from(arrayLike, mapfn = undefined, thisArg = undefined)
	  from: function from(arrayLike/*, mapfn = undefined, thisArg = undefined*/){
	    var O       = toObject(arrayLike)
	      , C       = typeof this == 'function' ? this : Array
	      , aLen    = arguments.length
	      , mapfn   = aLen > 1 ? arguments[1] : undefined
	      , mapping = mapfn !== undefined
	      , index   = 0
	      , iterFn  = getIterFn(O)
	      , length, result, step, iterator;
	    if(mapping)mapfn = ctx(mapfn, aLen > 2 ? arguments[2] : undefined, 2);
	    // if object isn't iterable or it's array with default iterator - use simple case
	    if(iterFn != undefined && !(C == Array && isArrayIter(iterFn))){
	      for(iterator = iterFn.call(O), result = new C; !(step = iterator.next()).done; index++){
	        createProperty(result, index, mapping ? call(iterator, mapfn, [step.value, index], true) : step.value);
	      }
	    } else {
	      length = toLength(O.length);
	      for(result = new C(length); length > index; index++){
	        createProperty(result, index, mapping ? mapfn(O[index], index) : O[index]);
	      }
	    }
	    result.length = index;
	    return result;
	  }
	});


/***/ },
/* 76 */
/***/ function(module, exports, __webpack_require__) {

	// call something on iterator step with safe closing on error
	var anObject = __webpack_require__(28);
	module.exports = function(iterator, fn, value, entries){
	  try {
	    return entries ? fn(anObject(value)[0], value[1]) : fn(value);
	  // 7.4.6 IteratorClose(iterator, completion)
	  } catch(e){
	    var ret = iterator['return'];
	    if(ret !== undefined)anObject(ret.call(iterator));
	    throw e;
	  }
	};

/***/ },
/* 77 */
/***/ function(module, exports, __webpack_require__) {

	// check on default Array iterator
	var Iterators  = __webpack_require__(50)
	  , ITERATOR   = __webpack_require__(59)('iterator')
	  , ArrayProto = Array.prototype;
	
	module.exports = function(it){
	  return it !== undefined && (Iterators.Array === it || ArrayProto[ITERATOR] === it);
	};

/***/ },
/* 78 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	var $defineProperty = __webpack_require__(27)
	  , createDesc      = __webpack_require__(35);
	
	module.exports = function(object, index, value){
	  if(index in object)$defineProperty.f(object, index, createDesc(0, value));
	  else object[index] = value;
	};

/***/ },
/* 79 */
/***/ function(module, exports, __webpack_require__) {

	var ITERATOR     = __webpack_require__(59)('iterator')
	  , SAFE_CLOSING = false;
	
	try {
	  var riter = [7][ITERATOR]();
	  riter['return'] = function(){ SAFE_CLOSING = true; };
	  Array.from(riter, function(){ throw 2; });
	} catch(e){ /* empty */ }
	
	module.exports = function(exec, skipClosing){
	  if(!skipClosing && !SAFE_CLOSING)return false;
	  var safe = false;
	  try {
	    var arr  = [7]
	      , iter = arr[ITERATOR]();
	    iter.next = function(){ return {done: safe = true}; };
	    arr[ITERATOR] = function(){ return iter; };
	    exec(arr);
	  } catch(e){ /* empty */ }
	  return safe;
	};

/***/ },
/* 80 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = { "default": __webpack_require__(81), __esModule: true };

/***/ },
/* 81 */
/***/ function(module, exports, __webpack_require__) {

	__webpack_require__(82);
	module.exports = __webpack_require__(23).Object.values;

/***/ },
/* 82 */
/***/ function(module, exports, __webpack_require__) {

	// https://github.com/tc39/proposal-object-values-entries
	var $export = __webpack_require__(22)
	  , $values = __webpack_require__(83)(false);
	
	$export($export.S, 'Object', {
	  values: function values(it){
	    return $values(it);
	  }
	});

/***/ },
/* 83 */
/***/ function(module, exports, __webpack_require__) {

	var getKeys   = __webpack_require__(6)
	  , toIObject = __webpack_require__(9)
	  , isEnum    = __webpack_require__(42).f;
	module.exports = function(isEntries){
	  return function(it){
	    var O      = toIObject(it)
	      , keys   = getKeys(O)
	      , length = keys.length
	      , i      = 0
	      , result = []
	      , key;
	    while(length > i)if(isEnum.call(O, key = keys[i++])){
	      result.push(isEntries ? [key, O[key]] : O[key]);
	    } return result;
	  };
	};

/***/ },
/* 84 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	
	exports.__esModule = true;
	
	var _defineProperty = __webpack_require__(85);
	
	var _defineProperty2 = _interopRequireDefault(_defineProperty);
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	exports.default = function (obj, key, value) {
	  if (key in obj) {
	    (0, _defineProperty2.default)(obj, key, {
	      value: value,
	      enumerable: true,
	      configurable: true,
	      writable: true
	    });
	  } else {
	    obj[key] = value;
	  }
	
	  return obj;
	};

/***/ },
/* 85 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = { "default": __webpack_require__(86), __esModule: true };

/***/ },
/* 86 */
/***/ function(module, exports, __webpack_require__) {

	__webpack_require__(87);
	var $Object = __webpack_require__(23).Object;
	module.exports = function defineProperty(it, key, desc){
	  return $Object.defineProperty(it, key, desc);
	};

/***/ },
/* 87 */
/***/ function(module, exports, __webpack_require__) {

	var $export = __webpack_require__(22);
	// 19.1.2.4 / 15.2.3.6 Object.defineProperty(O, P, Attributes)
	$export($export.S + $export.F * !__webpack_require__(31), 'Object', {defineProperty: __webpack_require__(27).f});

/***/ },
/* 88 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = { "default": __webpack_require__(89), __esModule: true };

/***/ },
/* 89 */
/***/ function(module, exports, __webpack_require__) {

	__webpack_require__(90);
	__webpack_require__(61);
	__webpack_require__(46);
	__webpack_require__(91);
	__webpack_require__(103);
	module.exports = __webpack_require__(23).Set;

/***/ },
/* 90 */
/***/ function(module, exports) {



/***/ },
/* 91 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	var strong = __webpack_require__(92);
	
	// 23.2 Set Objects
	module.exports = __webpack_require__(98)('Set', function(get){
	  return function Set(){ return get(this, arguments.length > 0 ? arguments[0] : undefined); };
	}, {
	  // 23.2.3.1 Set.prototype.add(value)
	  add: function add(value){
	    return strong.def(this, value = value === 0 ? 0 : value, value);
	  }
	}, strong);

/***/ },
/* 92 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	var dP          = __webpack_require__(27).f
	  , create      = __webpack_require__(55)
	  , hide        = __webpack_require__(26)
	  , redefineAll = __webpack_require__(93)
	  , ctx         = __webpack_require__(24)
	  , anInstance  = __webpack_require__(94)
	  , defined     = __webpack_require__(5)
	  , forOf       = __webpack_require__(95)
	  , $iterDefine = __webpack_require__(51)
	  , step        = __webpack_require__(49)
	  , setSpecies  = __webpack_require__(96)
	  , DESCRIPTORS = __webpack_require__(31)
	  , fastKey     = __webpack_require__(97).fastKey
	  , SIZE        = DESCRIPTORS ? '_s' : 'size';
	
	var getEntry = function(that, key){
	  // fast case
	  var index = fastKey(key), entry;
	  if(index !== 'F')return that._i[index];
	  // frozen object case
	  for(entry = that._f; entry; entry = entry.n){
	    if(entry.k == key)return entry;
	  }
	};
	
	module.exports = {
	  getConstructor: function(wrapper, NAME, IS_MAP, ADDER){
	    var C = wrapper(function(that, iterable){
	      anInstance(that, C, NAME, '_i');
	      that._i = create(null); // index
	      that._f = undefined;    // first entry
	      that._l = undefined;    // last entry
	      that[SIZE] = 0;         // size
	      if(iterable != undefined)forOf(iterable, IS_MAP, that[ADDER], that);
	    });
	    redefineAll(C.prototype, {
	      // 23.1.3.1 Map.prototype.clear()
	      // 23.2.3.2 Set.prototype.clear()
	      clear: function clear(){
	        for(var that = this, data = that._i, entry = that._f; entry; entry = entry.n){
	          entry.r = true;
	          if(entry.p)entry.p = entry.p.n = undefined;
	          delete data[entry.i];
	        }
	        that._f = that._l = undefined;
	        that[SIZE] = 0;
	      },
	      // 23.1.3.3 Map.prototype.delete(key)
	      // 23.2.3.4 Set.prototype.delete(value)
	      'delete': function(key){
	        var that  = this
	          , entry = getEntry(that, key);
	        if(entry){
	          var next = entry.n
	            , prev = entry.p;
	          delete that._i[entry.i];
	          entry.r = true;
	          if(prev)prev.n = next;
	          if(next)next.p = prev;
	          if(that._f == entry)that._f = next;
	          if(that._l == entry)that._l = prev;
	          that[SIZE]--;
	        } return !!entry;
	      },
	      // 23.2.3.6 Set.prototype.forEach(callbackfn, thisArg = undefined)
	      // 23.1.3.5 Map.prototype.forEach(callbackfn, thisArg = undefined)
	      forEach: function forEach(callbackfn /*, that = undefined */){
	        anInstance(this, C, 'forEach');
	        var f = ctx(callbackfn, arguments.length > 1 ? arguments[1] : undefined, 3)
	          , entry;
	        while(entry = entry ? entry.n : this._f){
	          f(entry.v, entry.k, this);
	          // revert to the last existing entry
	          while(entry && entry.r)entry = entry.p;
	        }
	      },
	      // 23.1.3.7 Map.prototype.has(key)
	      // 23.2.3.7 Set.prototype.has(value)
	      has: function has(key){
	        return !!getEntry(this, key);
	      }
	    });
	    if(DESCRIPTORS)dP(C.prototype, 'size', {
	      get: function(){
	        return defined(this[SIZE]);
	      }
	    });
	    return C;
	  },
	  def: function(that, key, value){
	    var entry = getEntry(that, key)
	      , prev, index;
	    // change existing entry
	    if(entry){
	      entry.v = value;
	    // create new entry
	    } else {
	      that._l = entry = {
	        i: index = fastKey(key, true), // <- index
	        k: key,                        // <- key
	        v: value,                      // <- value
	        p: prev = that._l,             // <- previous entry
	        n: undefined,                  // <- next entry
	        r: false                       // <- removed
	      };
	      if(!that._f)that._f = entry;
	      if(prev)prev.n = entry;
	      that[SIZE]++;
	      // add to index
	      if(index !== 'F')that._i[index] = entry;
	    } return that;
	  },
	  getEntry: getEntry,
	  setStrong: function(C, NAME, IS_MAP){
	    // add .keys, .values, .entries, [@@iterator]
	    // 23.1.3.4, 23.1.3.8, 23.1.3.11, 23.1.3.12, 23.2.3.5, 23.2.3.8, 23.2.3.10, 23.2.3.11
	    $iterDefine(C, NAME, function(iterated, kind){
	      this._t = iterated;  // target
	      this._k = kind;      // kind
	      this._l = undefined; // previous
	    }, function(){
	      var that  = this
	        , kind  = that._k
	        , entry = that._l;
	      // revert to the last existing entry
	      while(entry && entry.r)entry = entry.p;
	      // get next entry
	      if(!that._t || !(that._l = entry = entry ? entry.n : that._t._f)){
	        // or finish the iteration
	        that._t = undefined;
	        return step(1);
	      }
	      // return step by kind
	      if(kind == 'keys'  )return step(0, entry.k);
	      if(kind == 'values')return step(0, entry.v);
	      return step(0, [entry.k, entry.v]);
	    }, IS_MAP ? 'entries' : 'values' , !IS_MAP, true);
	
	    // add [@@species], 23.1.2.2, 23.2.2.2
	    setSpecies(NAME);
	  }
	};

/***/ },
/* 93 */
/***/ function(module, exports, __webpack_require__) {

	var hide = __webpack_require__(26);
	module.exports = function(target, src, safe){
	  for(var key in src){
	    if(safe && target[key])target[key] = src[key];
	    else hide(target, key, src[key]);
	  } return target;
	};

/***/ },
/* 94 */
/***/ function(module, exports) {

	module.exports = function(it, Constructor, name, forbiddenField){
	  if(!(it instanceof Constructor) || (forbiddenField !== undefined && forbiddenField in it)){
	    throw TypeError(name + ': incorrect invocation!');
	  } return it;
	};

/***/ },
/* 95 */
/***/ function(module, exports, __webpack_require__) {

	var ctx         = __webpack_require__(24)
	  , call        = __webpack_require__(76)
	  , isArrayIter = __webpack_require__(77)
	  , anObject    = __webpack_require__(28)
	  , toLength    = __webpack_require__(13)
	  , getIterFn   = __webpack_require__(68)
	  , BREAK       = {}
	  , RETURN      = {};
	var exports = module.exports = function(iterable, entries, fn, that, ITERATOR){
	  var iterFn = ITERATOR ? function(){ return iterable; } : getIterFn(iterable)
	    , f      = ctx(fn, that, entries ? 2 : 1)
	    , index  = 0
	    , length, step, iterator, result;
	  if(typeof iterFn != 'function')throw TypeError(iterable + ' is not iterable!');
	  // fast case for arrays with default iterator
	  if(isArrayIter(iterFn))for(length = toLength(iterable.length); length > index; index++){
	    result = entries ? f(anObject(step = iterable[index])[0], step[1]) : f(iterable[index]);
	    if(result === BREAK || result === RETURN)return result;
	  } else for(iterator = iterFn.call(iterable); !(step = iterator.next()).done; ){
	    result = call(iterator, f, step.value, entries);
	    if(result === BREAK || result === RETURN)return result;
	  }
	};
	exports.BREAK  = BREAK;
	exports.RETURN = RETURN;

/***/ },
/* 96 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	var global      = __webpack_require__(18)
	  , core        = __webpack_require__(23)
	  , dP          = __webpack_require__(27)
	  , DESCRIPTORS = __webpack_require__(31)
	  , SPECIES     = __webpack_require__(59)('species');
	
	module.exports = function(KEY){
	  var C = typeof core[KEY] == 'function' ? core[KEY] : global[KEY];
	  if(DESCRIPTORS && C && !C[SPECIES])dP.f(C, SPECIES, {
	    configurable: true,
	    get: function(){ return this; }
	  });
	};

/***/ },
/* 97 */
/***/ function(module, exports, __webpack_require__) {

	var META     = __webpack_require__(19)('meta')
	  , isObject = __webpack_require__(29)
	  , has      = __webpack_require__(8)
	  , setDesc  = __webpack_require__(27).f
	  , id       = 0;
	var isExtensible = Object.isExtensible || function(){
	  return true;
	};
	var FREEZE = !__webpack_require__(32)(function(){
	  return isExtensible(Object.preventExtensions({}));
	});
	var setMeta = function(it){
	  setDesc(it, META, {value: {
	    i: 'O' + ++id, // object ID
	    w: {}          // weak collections IDs
	  }});
	};
	var fastKey = function(it, create){
	  // return primitive with prefix
	  if(!isObject(it))return typeof it == 'symbol' ? it : (typeof it == 'string' ? 'S' : 'P') + it;
	  if(!has(it, META)){
	    // can't set metadata to uncaught frozen object
	    if(!isExtensible(it))return 'F';
	    // not necessary to add metadata
	    if(!create)return 'E';
	    // add missing metadata
	    setMeta(it);
	  // return object ID
	  } return it[META].i;
	};
	var getWeak = function(it, create){
	  if(!has(it, META)){
	    // can't set metadata to uncaught frozen object
	    if(!isExtensible(it))return true;
	    // not necessary to add metadata
	    if(!create)return false;
	    // add missing metadata
	    setMeta(it);
	  // return hash weak collections IDs
	  } return it[META].w;
	};
	// add metadata on freeze-family methods calling
	var onFreeze = function(it){
	  if(FREEZE && meta.NEED && isExtensible(it) && !has(it, META))setMeta(it);
	  return it;
	};
	var meta = module.exports = {
	  KEY:      META,
	  NEED:     false,
	  fastKey:  fastKey,
	  getWeak:  getWeak,
	  onFreeze: onFreeze
	};

/***/ },
/* 98 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	var global         = __webpack_require__(18)
	  , $export        = __webpack_require__(22)
	  , meta           = __webpack_require__(97)
	  , fails          = __webpack_require__(32)
	  , hide           = __webpack_require__(26)
	  , redefineAll    = __webpack_require__(93)
	  , forOf          = __webpack_require__(95)
	  , anInstance     = __webpack_require__(94)
	  , isObject       = __webpack_require__(29)
	  , setToStringTag = __webpack_require__(58)
	  , dP             = __webpack_require__(27).f
	  , each           = __webpack_require__(99)(0)
	  , DESCRIPTORS    = __webpack_require__(31);
	
	module.exports = function(NAME, wrapper, methods, common, IS_MAP, IS_WEAK){
	  var Base  = global[NAME]
	    , C     = Base
	    , ADDER = IS_MAP ? 'set' : 'add'
	    , proto = C && C.prototype
	    , O     = {};
	  if(!DESCRIPTORS || typeof C != 'function' || !(IS_WEAK || proto.forEach && !fails(function(){
	    new C().entries().next();
	  }))){
	    // create collection constructor
	    C = common.getConstructor(wrapper, NAME, IS_MAP, ADDER);
	    redefineAll(C.prototype, methods);
	    meta.NEED = true;
	  } else {
	    C = wrapper(function(target, iterable){
	      anInstance(target, C, NAME, '_c');
	      target._c = new Base;
	      if(iterable != undefined)forOf(iterable, IS_MAP, target[ADDER], target);
	    });
	    each('add,clear,delete,forEach,get,has,set,keys,values,entries,toJSON'.split(','),function(KEY){
	      var IS_ADDER = KEY == 'add' || KEY == 'set';
	      if(KEY in proto && !(IS_WEAK && KEY == 'clear'))hide(C.prototype, KEY, function(a, b){
	        anInstance(this, C, KEY);
	        if(!IS_ADDER && IS_WEAK && !isObject(a))return KEY == 'get' ? undefined : false;
	        var result = this._c[KEY](a === 0 ? 0 : a, b);
	        return IS_ADDER ? this : result;
	      });
	    });
	    if('size' in proto)dP(C.prototype, 'size', {
	      get: function(){
	        return this._c.size;
	      }
	    });
	  }
	
	  setToStringTag(C, NAME);
	
	  O[NAME] = C;
	  $export($export.G + $export.W + $export.F, O);
	
	  if(!IS_WEAK)common.setStrong(C, NAME, IS_MAP);
	
	  return C;
	};

/***/ },
/* 99 */
/***/ function(module, exports, __webpack_require__) {

	// 0 -> Array#forEach
	// 1 -> Array#map
	// 2 -> Array#filter
	// 3 -> Array#some
	// 4 -> Array#every
	// 5 -> Array#find
	// 6 -> Array#findIndex
	var ctx      = __webpack_require__(24)
	  , IObject  = __webpack_require__(10)
	  , toObject = __webpack_require__(4)
	  , toLength = __webpack_require__(13)
	  , asc      = __webpack_require__(100);
	module.exports = function(TYPE, $create){
	  var IS_MAP        = TYPE == 1
	    , IS_FILTER     = TYPE == 2
	    , IS_SOME       = TYPE == 3
	    , IS_EVERY      = TYPE == 4
	    , IS_FIND_INDEX = TYPE == 6
	    , NO_HOLES      = TYPE == 5 || IS_FIND_INDEX
	    , create        = $create || asc;
	  return function($this, callbackfn, that){
	    var O      = toObject($this)
	      , self   = IObject(O)
	      , f      = ctx(callbackfn, that, 3)
	      , length = toLength(self.length)
	      , index  = 0
	      , result = IS_MAP ? create($this, length) : IS_FILTER ? create($this, 0) : undefined
	      , val, res;
	    for(;length > index; index++)if(NO_HOLES || index in self){
	      val = self[index];
	      res = f(val, index, O);
	      if(TYPE){
	        if(IS_MAP)result[index] = res;            // map
	        else if(res)switch(TYPE){
	          case 3: return true;                    // some
	          case 5: return val;                     // find
	          case 6: return index;                   // findIndex
	          case 2: result.push(val);               // filter
	        } else if(IS_EVERY)return false;          // every
	      }
	    }
	    return IS_FIND_INDEX ? -1 : IS_SOME || IS_EVERY ? IS_EVERY : result;
	  };
	};

/***/ },
/* 100 */
/***/ function(module, exports, __webpack_require__) {

	// 9.4.2.3 ArraySpeciesCreate(originalArray, length)
	var speciesConstructor = __webpack_require__(101);
	
	module.exports = function(original, length){
	  return new (speciesConstructor(original))(length);
	};

/***/ },
/* 101 */
/***/ function(module, exports, __webpack_require__) {

	var isObject = __webpack_require__(29)
	  , isArray  = __webpack_require__(102)
	  , SPECIES  = __webpack_require__(59)('species');
	
	module.exports = function(original){
	  var C;
	  if(isArray(original)){
	    C = original.constructor;
	    // cross-realm fallback
	    if(typeof C == 'function' && (C === Array || isArray(C.prototype)))C = undefined;
	    if(isObject(C)){
	      C = C[SPECIES];
	      if(C === null)C = undefined;
	    }
	  } return C === undefined ? Array : C;
	};

/***/ },
/* 102 */
/***/ function(module, exports, __webpack_require__) {

	// 7.2.2 IsArray(argument)
	var cof = __webpack_require__(11);
	module.exports = Array.isArray || function isArray(arg){
	  return cof(arg) == 'Array';
	};

/***/ },
/* 103 */
/***/ function(module, exports, __webpack_require__) {

	// https://github.com/DavidBruant/Map-Set.prototype.toJSON
	var $export  = __webpack_require__(22);
	
	$export($export.P + $export.R, 'Set', {toJSON: __webpack_require__(104)('Set')});

/***/ },
/* 104 */
/***/ function(module, exports, __webpack_require__) {

	// https://github.com/DavidBruant/Map-Set.prototype.toJSON
	var classof = __webpack_require__(64)
	  , from    = __webpack_require__(105);
	module.exports = function(NAME){
	  return function toJSON(){
	    if(classof(this) != NAME)throw TypeError(NAME + "#toJSON isn't generic");
	    return from(this);
	  };
	};

/***/ },
/* 105 */
/***/ function(module, exports, __webpack_require__) {

	var forOf = __webpack_require__(95);
	
	module.exports = function(iter, ITERATOR){
	  var result = [];
	  forOf(iter, false, result.push, result, ITERATOR);
	  return result;
	};


/***/ },
/* 106 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	
	var _slicedToArray2 = __webpack_require__(43);
	
	var _slicedToArray3 = _interopRequireDefault(_slicedToArray2);
	
	var _getIterator2 = __webpack_require__(65);
	
	var _getIterator3 = _interopRequireDefault(_getIterator2);
	
	exports.setupBuffer = setupBuffer;
	exports.createBuffer = createBuffer;
	exports.drawBuffer = drawBuffer;
	exports.drawBackground = drawBackground;
	exports.drawRect = drawRect;
	exports.drawImage = drawImage;
	
	var _utils = __webpack_require__(107);
	
	var Utils = _interopRequireWildcard(_utils);
	
	function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	function bufferWidth(buffer) {
	  return buffer.el.width;
	}
	
	function bufferHeight(buffer) {
	  return buffer.el.height;
	}
	
	function setupBuffer(el, width, height) {
	  el.width = width;
	  el.height = height;
	
	  var context = el.getContext('2d');
	  if (!(context instanceof CanvasRenderingContext2D)) {
	    throw "Unable to get canvas context.";
	  }
	  context.imageSmoothingEnabled = false;
	
	  return {
	    el: el,
	    context: context
	  };
	}
	
	function createBuffer(width, height) {
	  var el = document.createElement('canvas');
	  if (!(el instanceof HTMLCanvasElement)) {
	    throw "Unable to create buffer.";
	  }
	  el.width = width;
	  el.height = height;
	
	  var context = el.getContext('2d');
	  context.imageSmoothingEnabled = false;
	
	  return {
	    el: el,
	    context: context
	  };
	}
	
	function drawBuffer(sourceBuffer, destBuffer) {
	  sourceBuffer.context.drawImage(destBuffer.el, 0, 0);
	}
	
	function drawBackground(buffer, color) {
	  buffer.context.fillStyle = color;
	  buffer.context.fillRect(0, 0, bufferWidth(buffer), bufferHeight(buffer));
	}
	
	function drawRect(buffer, color, rect) {
	  var w = rect.x1 - rect.x0;
	  var h = rect.y1 - rect.y0;
	
	  buffer.context.fillStyle = color;
	  buffer.context.fillRect(rect.x0, bufferHeight(buffer) - rect.y0 - h, w, h);
	}
	
	var _imageCache = {};
	function loadImage(source) {
	  if (source in _imageCache) {
	    return _imageCache[source];
	  } else {
	    var drawing = new Image();
	    drawing.src = source;
	    _imageCache[source] = drawing;
	    return drawing;
	  }
	}
	
	function recolorImage(image, recolor) {
	  if (!image.complete) throw "Wat image needs to be complete";
	
	  var w = image.width,
	      h = image.height;
	
	  var newBuffer = createBuffer(w, h);
	  newBuffer.context.drawImage(image, 0, 0, w, h);
	
	  var imageData = newBuffer.context.getImageData(0, 0, w, h);
	  var _iteratorNormalCompletion = true;
	  var _didIteratorError = false;
	  var _iteratorError = undefined;
	
	  try {
	    for (var _iterator = (0, _getIterator3.default)(Utils.zip(recolor.oldRGBs, recolor.newRGBs)), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
	      var _step$value = (0, _slicedToArray3.default)(_step.value, 2);
	
	      var oldRGB = _step$value[0];
	      var newRGB = _step$value[1];
	
	      for (var i = 0; i < imageData.data.length; i += 4) {
	        // is this pixel the old rgb?
	        if (imageData.data[i] == oldRGB.r && imageData.data[i + 1] == oldRGB.g && imageData.data[i + 2] == oldRGB.b) {
	          // change to your new rgb
	          imageData.data[i] = newRGB.r;
	          imageData.data[i + 1] = newRGB.g;
	          imageData.data[i + 2] = newRGB.b;
	          if (newRGB.a !== undefined) imageData.data[i + 3] = newRGB.a;
	        }
	      }
	    }
	  } catch (err) {
	    _didIteratorError = true;
	    _iteratorError = err;
	  } finally {
	    try {
	      if (!_iteratorNormalCompletion && _iterator.return) {
	        _iterator.return();
	      }
	    } finally {
	      if (_didIteratorError) {
	        throw _iteratorError;
	      }
	    }
	  }
	
	  newBuffer.context.putImageData(imageData, 0, 0);
	  return newBuffer.el;
	}
	
	function loadImageWithRecolor(source, recolor) {
	  var hash = source + recolor.hash;
	  if (hash in _imageCache) {
	    return _imageCache[hash];
	  } else {
	    var image = loadImage(source);
	    if (!image.complete) return image;
	
	    var newImage = recolorImage(image, recolor);
	    _imageCache[hash] = newImage;
	    return newImage;
	  }
	}
	
	function cacheAllImages(sources) {
	  return sources.map(loadImage);
	}
	
	function drawImage(buffer, imageSource, rect, opts) {
	  var w = rect.x1 - rect.x0;
	  var h = rect.y1 - rect.y0;
	  var x = rect.x0 + w * 0.5;
	  var y = bufferHeight(buffer) - rect.y0 - h * 0.5;
	
	  buffer.context.save();
	  buffer.context.translate(x, y);
	
	  if (opts.flip) buffer.context.scale(-1, 1);
	  if (opts.opacity) buffer.context.globalAlpha = opts.opacity;
	
	  var image = void 0;
	  if (opts.imageRecolor) image = loadImageWithRecolor(imageSource, opts.imageRecolor);else image = loadImage(imageSource);
	
	  buffer.context.drawImage(image, -w / 2, -h / 2, w, h);
	  // buffer.context.drawImage(shadow, -w / 2, -h / 2, w, h);
	
	  buffer.context.restore();
	}

/***/ },
/* 107 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	exports.DepthArray = exports.AutoArray = exports.AutoMap = undefined;
	
	var _regenerator = __webpack_require__(69);
	
	var _regenerator2 = _interopRequireDefault(_regenerator);
	
	var _getIterator2 = __webpack_require__(65);
	
	var _getIterator3 = _interopRequireDefault(_getIterator2);
	
	var _classCallCheck2 = __webpack_require__(108);
	
	var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);
	
	var _createClass2 = __webpack_require__(109);
	
	var _createClass3 = _interopRequireDefault(_createClass2);
	
	var _set = __webpack_require__(88);
	
	var _set2 = _interopRequireDefault(_set);
	
	var _keys = __webpack_require__(1);
	
	var _keys2 = _interopRequireDefault(_keys);
	
	exports.mapObject = mapObject;
	exports.valuesArray = valuesArray;
	exports.valuesSet = valuesSet;
	exports.hasValue = hasValue;
	exports.zip = zip;
	exports.combine = combine;
	exports.Get = Get;
	
	var _observe = __webpack_require__(110);
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	var _marked = [zip, combine].map(_regenerator2.default.mark);
	
	// borrowed from: http://stackoverflow.com/questions/14810506/map-function-for-objects-instead-of-arrays
	function mapObject(obj, mapFunc) {
	  return (0, _keys2.default)(obj).reduce(function (newObj, value) {
	    newObj[value] = mapFunc(obj[value]);
	    return newObj;
	  }, {});
	}
	
	function valuesArray(obj) {
	  return (0, _keys2.default)(obj).map(function (key) {
	    return obj[key];
	  });
	}
	
	function valuesSet(obj) {
	  var set = new _set2.default();
	  for (var k in obj) {
	    set.add(obj[k]);
	  }
	  return set;
	}
	
	function hasValue(obj, v) {
	  return valuesSet(obj).has(v);
	}
	
	var AutoMap = exports.AutoMap = function () {
	  // I REALLY REALLY want to test this code... but I don't want to deal with
	  // setting up a testing framework right now...
	
	  /*:: map: {[key: string]: O}; */
	  /*:: hash: (o: O) => string; */
	
	  function AutoMap(hash, objects) {
	    (0, _classCallCheck3.default)(this, AutoMap);
	
	    this.map = {};
	    this.hash = hash;
	    if (objects) this.observe(objects);
	  }
	
	  (0, _createClass3.default)(AutoMap, [{
	    key: "observe",
	    value: function observe(objects) {
	      var _this = this;
	
	      var _iteratorNormalCompletion = true;
	      var _didIteratorError = false;
	      var _iteratorError = undefined;
	
	      try {
	        for (var _iterator = (0, _getIterator3.default)(objects), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
	          var obj = _step.value;
	
	          this.add(obj);
	        }
	      } catch (err) {
	        _didIteratorError = true;
	        _iteratorError = err;
	      } finally {
	        try {
	          if (!_iteratorNormalCompletion && _iterator.return) {
	            _iterator.return();
	          }
	        } finally {
	          if (_didIteratorError) {
	            throw _iteratorError;
	          }
	        }
	      }
	
	      (0, _observe.observeArray)(objects, function (o) {
	        return _this.add(o);
	      }, function (o) {
	        return _this._remove(o);
	      });
	    }
	  }, {
	    key: "hasKey",
	    value: function hasKey(key) {
	      return key in this.map;
	    }
	  }, {
	    key: "add",
	    value: function add(obj) {
	      this.map[this.hash(obj)] = obj;
	    }
	  }, {
	    key: "_remove",
	    value: function _remove(obj) {
	      delete this.map[this.hash(obj)];
	    }
	  }, {
	    key: "get",
	    value: function get(id) {
	      return this.map[id];
	    }
	  }]);
	  return AutoMap;
	}();
	
	var AutoArray = exports.AutoArray = function () {
	  /*:: observers: {[key: string]: Observer }; */
	  /*:: objects: {[key: string]: O }; */
	  /*:: results: {[key: string]: R }; */
	  /*:: processor: (o: O) => ?R; */
	  /*:: hash: (o: O) => string; */
	
	  function AutoArray(hash, processor) {
	    (0, _classCallCheck3.default)(this, AutoArray);
	
	    this.observers = {};
	    this.objects = {};
	    this.results = {};
	    this.processor = processor;
	    this.hash = hash;
	  }
	
	  (0, _createClass3.default)(AutoArray, [{
	    key: "observe",
	    value: function observe(observables) {
	      var _this2 = this;
	
	      var _iteratorNormalCompletion2 = true;
	      var _didIteratorError2 = false;
	      var _iteratorError2 = undefined;
	
	      try {
	        for (var _iterator2 = (0, _getIterator3.default)(observables), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
	          var obj = _step2.value;
	
	          this.watch(obj);
	        }
	      } catch (err) {
	        _didIteratorError2 = true;
	        _iteratorError2 = err;
	      } finally {
	        try {
	          if (!_iteratorNormalCompletion2 && _iterator2.return) {
	            _iterator2.return();
	          }
	        } finally {
	          if (_didIteratorError2) {
	            throw _iteratorError2;
	          }
	        }
	      }
	
	      (0, _observe.observeArray)(observables, function (o) {
	        return _this2.watch(o);
	      }, function (o) {
	        return _this2.unwatch(o);
	      });
	    }
	  }, {
	    key: "watch",
	    value: function watch(object) {
	      var _this3 = this;
	
	      var observer = (0, _observe.observeObject)(object, function (o, addedKey) {
	        return _this3._update(o);
	      }, function (o, removedKey) {
	        return _this3._update(o);
	      }, function (o, changedKey) {});
	
	      var h = this.hash(object);
	
	      if (h in this.observers) throw "Wat, should not be observing yet";
	
	      this.observers[h] = observer;
	      this.objects[h] = object;
	      this._update(object);
	    }
	  }, {
	    key: "unwatch",
	    value: function unwatch(object) {
	      var h = this.hash(object);
	
	      if (!(h in this.observers)) throw "Wat, we should be observing";
	
	      (0, _observe.unobserveArray)(this.observers[h], object);
	
	      delete this.observers[h];
	      delete this.objects[h];
	      if (h in this.results) delete this.results[h];
	    }
	  }, {
	    key: "_update",
	    value: function _update(object) {
	      var result = this.processor(object);
	      var h = this.hash(object);
	
	      if (result) {
	        if (h in this.results) return;
	        this.results[h] = result;
	      } else {
	        if (h in this.results) delete this.results[h];
	      }
	    }
	  }, {
	    key: "all",
	    value: _regenerator2.default.mark(function all() {
	      var h, object, result;
	      return _regenerator2.default.wrap(function all$(_context) {
	        while (1) {
	          switch (_context.prev = _context.next) {
	            case 0:
	              _context.t0 = _regenerator2.default.keys(this.results);
	
	            case 1:
	              if ((_context.t1 = _context.t0()).done) {
	                _context.next = 9;
	                break;
	              }
	
	              h = _context.t1.value;
	              object = this.objects[h];
	              result = this.results[h];
	              _context.next = 7;
	              return [object, result];
	
	            case 7:
	              _context.next = 1;
	              break;
	
	            case 9:
	            case "end":
	              return _context.stop();
	          }
	        }
	      }, all, this);
	    })
	  }, {
	    key: "objects",
	    value: _regenerator2.default.mark(function objects() {
	      var h, object;
	      return _regenerator2.default.wrap(function objects$(_context2) {
	        while (1) {
	          switch (_context2.prev = _context2.next) {
	            case 0:
	              _context2.t0 = _regenerator2.default.keys(this.results);
	
	            case 1:
	              if ((_context2.t1 = _context2.t0()).done) {
	                _context2.next = 8;
	                break;
	              }
	
	              h = _context2.t1.value;
	              object = this.objects[h];
	              _context2.next = 6;
	              return object;
	
	            case 6:
	              _context2.next = 1;
	              break;
	
	            case 8:
	            case "end":
	              return _context2.stop();
	          }
	        }
	      }, objects, this);
	    })
	  }]);
	  return AutoArray;
	}();
	
	var DepthArray = exports.DepthArray = function () {
	  /*:: depths: {[x: string]: number}; */
	  /*:: ordered: Array<string>; */
	
	  function DepthArray() {
	    (0, _classCallCheck3.default)(this, DepthArray);
	
	    this.depths = {};
	    this.ordered = [];
	  }
	
	  (0, _createClass3.default)(DepthArray, [{
	    key: "observe",
	    value: function observe(objects, conversion) {
	      var _this4 = this;
	
	      var _iteratorNormalCompletion3 = true;
	      var _didIteratorError3 = false;
	      var _iteratorError3 = undefined;
	
	      try {
	        for (var _iterator3 = (0, _getIterator3.default)(objects), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
	          var obj = _step3.value;
	
	          this.add(conversion(obj));
	        }
	      } catch (err) {
	        _didIteratorError3 = true;
	        _iteratorError3 = err;
	      } finally {
	        try {
	          if (!_iteratorNormalCompletion3 && _iterator3.return) {
	            _iterator3.return();
	          }
	        } finally {
	          if (_didIteratorError3) {
	            throw _iteratorError3;
	          }
	        }
	      }
	
	      (0, _observe.observeArray)(objects, function (x) {
	        return _this4.add(conversion(x));
	      }, function (x) {
	        return _this4._remove(conversion(x));
	      });
	    }
	  }, {
	    key: "add",
	    value: function add(val, depth) {
	      if (depth === undefined) depth = Math.random();
	
	      // quit if we're already tracking this object
	      if (val in this.depths) return;
	
	      var i = 0;
	      for (; i < this.ordered.length; i++) {
	        var otherVal = this.ordered[i];
	        var otherDepth = this.depths[otherVal];
	
	        if (depth < otherDepth) break;
	      }
	
	      this.depths[val] = depth;
	      this.ordered.splice(i, 0, val);
	    }
	  }, {
	    key: "update",
	    value: function update(val, depth) {
	      this._remove(val);
	      this.add(val, depth);
	    }
	  }, {
	    key: "_remove",
	    value: function _remove(val) {
	      delete this.depths[val];
	      for (var i = 0; i < this.ordered.length; i++) {
	        if (val === this.ordered[i]) {
	          this.ordered.splice(i, 1);
	          break;
	        }
	      }
	    }
	  }, {
	    key: "depth",
	    value: function depth(val) {
	      return this.depths[val];
	    }
	  }, {
	    key: "inOrder",
	    value: _regenerator2.default.mark(function inOrder() {
	      var _iteratorNormalCompletion4, _didIteratorError4, _iteratorError4, _iterator4, _step4, str;
	
	      return _regenerator2.default.wrap(function inOrder$(_context3) {
	        while (1) {
	          switch (_context3.prev = _context3.next) {
	            case 0:
	              _iteratorNormalCompletion4 = true;
	              _didIteratorError4 = false;
	              _iteratorError4 = undefined;
	              _context3.prev = 3;
	              _iterator4 = (0, _getIterator3.default)(this.ordered);
	
	            case 5:
	              if (_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done) {
	                _context3.next = 12;
	                break;
	              }
	
	              str = _step4.value;
	              _context3.next = 9;
	              return str;
	
	            case 9:
	              _iteratorNormalCompletion4 = true;
	              _context3.next = 5;
	              break;
	
	            case 12:
	              _context3.next = 18;
	              break;
	
	            case 14:
	              _context3.prev = 14;
	              _context3.t0 = _context3["catch"](3);
	              _didIteratorError4 = true;
	              _iteratorError4 = _context3.t0;
	
	            case 18:
	              _context3.prev = 18;
	              _context3.prev = 19;
	
	              if (!_iteratorNormalCompletion4 && _iterator4.return) {
	                _iterator4.return();
	              }
	
	            case 21:
	              _context3.prev = 21;
	
	              if (!_didIteratorError4) {
	                _context3.next = 24;
	                break;
	              }
	
	              throw _iteratorError4;
	
	            case 24:
	              return _context3.finish(21);
	
	            case 25:
	              return _context3.finish(18);
	
	            case 26:
	            case "end":
	              return _context3.stop();
	          }
	        }
	      }, inOrder, this, [[3, 14, 18, 26], [19,, 21, 25]]);
	    })
	  }, {
	    key: "inReverseOrder",
	    value: _regenerator2.default.mark(function inReverseOrder() {
	      var i;
	      return _regenerator2.default.wrap(function inReverseOrder$(_context4) {
	        while (1) {
	          switch (_context4.prev = _context4.next) {
	            case 0:
	              i = this.ordered.length - 1;
	
	            case 1:
	              if (!(i >= 0)) {
	                _context4.next = 7;
	                break;
	              }
	
	              _context4.next = 4;
	              return this.ordered[i];
	
	            case 4:
	              i--;
	              _context4.next = 1;
	              break;
	
	            case 7:
	            case "end":
	              return _context4.stop();
	          }
	        }
	      }, inReverseOrder, this);
	    })
	  }]);
	  return DepthArray;
	}();
	
	function zip(as, bs) {
	  var i;
	  return _regenerator2.default.wrap(function zip$(_context5) {
	    while (1) {
	      switch (_context5.prev = _context5.next) {
	        case 0:
	          if (!(as.length != bs.length)) {
	            _context5.next = 2;
	            break;
	          }
	
	          throw "Wat, can't zip different length arrays";
	
	        case 2:
	          i = 0;
	
	        case 3:
	          if (!(i < as.length)) {
	            _context5.next = 9;
	            break;
	          }
	
	          _context5.next = 6;
	          return [as[i], bs[i]];
	
	        case 6:
	          i++;
	          _context5.next = 3;
	          break;
	
	        case 9:
	        case "end":
	          return _context5.stop();
	      }
	    }
	  }, _marked[0], this);
	}
	
	function combine(as, bs) {
	  var _iteratorNormalCompletion5, _didIteratorError5, _iteratorError5, _iterator5, _step5, a, _iteratorNormalCompletion6, _didIteratorError6, _iteratorError6, _iterator6, _step6, b;
	
	  return _regenerator2.default.wrap(function combine$(_context6) {
	    while (1) {
	      switch (_context6.prev = _context6.next) {
	        case 0:
	          _iteratorNormalCompletion5 = true;
	          _didIteratorError5 = false;
	          _iteratorError5 = undefined;
	          _context6.prev = 3;
	          _iterator5 = (0, _getIterator3.default)(as);
	
	        case 5:
	          if (_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done) {
	            _context6.next = 12;
	            break;
	          }
	
	          a = _step5.value;
	          _context6.next = 9;
	          return a;
	
	        case 9:
	          _iteratorNormalCompletion5 = true;
	          _context6.next = 5;
	          break;
	
	        case 12:
	          _context6.next = 18;
	          break;
	
	        case 14:
	          _context6.prev = 14;
	          _context6.t0 = _context6["catch"](3);
	          _didIteratorError5 = true;
	          _iteratorError5 = _context6.t0;
	
	        case 18:
	          _context6.prev = 18;
	          _context6.prev = 19;
	
	          if (!_iteratorNormalCompletion5 && _iterator5.return) {
	            _iterator5.return();
	          }
	
	        case 21:
	          _context6.prev = 21;
	
	          if (!_didIteratorError5) {
	            _context6.next = 24;
	            break;
	          }
	
	          throw _iteratorError5;
	
	        case 24:
	          return _context6.finish(21);
	
	        case 25:
	          return _context6.finish(18);
	
	        case 26:
	          _iteratorNormalCompletion6 = true;
	          _didIteratorError6 = false;
	          _iteratorError6 = undefined;
	          _context6.prev = 29;
	          _iterator6 = (0, _getIterator3.default)(bs);
	
	        case 31:
	          if (_iteratorNormalCompletion6 = (_step6 = _iterator6.next()).done) {
	            _context6.next = 38;
	            break;
	          }
	
	          b = _step6.value;
	          _context6.next = 35;
	          return b;
	
	        case 35:
	          _iteratorNormalCompletion6 = true;
	          _context6.next = 31;
	          break;
	
	        case 38:
	          _context6.next = 44;
	          break;
	
	        case 40:
	          _context6.prev = 40;
	          _context6.t1 = _context6["catch"](29);
	          _didIteratorError6 = true;
	          _iteratorError6 = _context6.t1;
	
	        case 44:
	          _context6.prev = 44;
	          _context6.prev = 45;
	
	          if (!_iteratorNormalCompletion6 && _iterator6.return) {
	            _iterator6.return();
	          }
	
	        case 47:
	          _context6.prev = 47;
	
	          if (!_didIteratorError6) {
	            _context6.next = 50;
	            break;
	          }
	
	          throw _iteratorError6;
	
	        case 50:
	          return _context6.finish(47);
	
	        case 51:
	          return _context6.finish(44);
	
	        case 52:
	        case "end":
	          return _context6.stop();
	      }
	    }
	  }, _marked[1], this, [[3, 14, 18, 26], [19,, 21, 25], [29, 40, 44, 52], [45,, 47, 51]]);
	}
	
	function Get(o, k) {
	  // necessary for weird flow reasons
	  if (k in o) return o[k];
	  return undefined;
	}

/***/ },
/* 108 */
/***/ function(module, exports) {

	"use strict";
	
	exports.__esModule = true;
	
	exports.default = function (instance, Constructor) {
	  if (!(instance instanceof Constructor)) {
	    throw new TypeError("Cannot call a class as a function");
	  }
	};

/***/ },
/* 109 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	
	exports.__esModule = true;
	
	var _defineProperty = __webpack_require__(85);
	
	var _defineProperty2 = _interopRequireDefault(_defineProperty);
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	exports.default = function () {
	  function defineProperties(target, props) {
	    for (var i = 0; i < props.length; i++) {
	      var descriptor = props[i];
	      descriptor.enumerable = descriptor.enumerable || false;
	      descriptor.configurable = true;
	      if ("value" in descriptor) descriptor.writable = true;
	      (0, _defineProperty2.default)(target, descriptor.key, descriptor);
	    }
	  }
	
	  return function (Constructor, protoProps, staticProps) {
	    if (protoProps) defineProperties(Constructor.prototype, protoProps);
	    if (staticProps) defineProperties(Constructor, staticProps);
	    return Constructor;
	  };
	}();

/***/ },
/* 110 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	
	var _getIterator2 = __webpack_require__(65);
	
	var _getIterator3 = _interopRequireDefault(_getIterator2);
	
	exports.unobserveArray = unobserveArray;
	exports.observeArray = observeArray;
	exports.observeObject = observeObject;
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	__webpack_require__(111);
	__webpack_require__(112);
	
	function unobserveArray(array, observer) {
	  Object.unobserve(oo[0], oo[1]);
	}
	
	function observeArray(objects, onAdd, onRemove) {
	  var observer = function observer(changes) {
	    var _iteratorNormalCompletion = true;
	    var _didIteratorError = false;
	    var _iteratorError = undefined;
	
	    try {
	      for (var _iterator = (0, _getIterator3.default)(changes), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
	        var change = _step.value;
	
	        if (change.type === 'splice') {
	          var _iteratorNormalCompletion2 = true;
	          var _didIteratorError2 = false;
	          var _iteratorError2 = undefined;
	
	          try {
	            for (var _iterator2 = (0, _getIterator3.default)(change.removed), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
	              var removed = _step2.value;
	
	              onRemove(removed);
	            }
	          } catch (err) {
	            _didIteratorError2 = true;
	            _iteratorError2 = err;
	          } finally {
	            try {
	              if (!_iteratorNormalCompletion2 && _iterator2.return) {
	                _iterator2.return();
	              }
	            } finally {
	              if (_didIteratorError2) {
	                throw _iteratorError2;
	              }
	            }
	          }
	
	          for (var i = 0; i < change.addedCount; i++) {
	            onAdd(objects[change.index + i]);
	          }
	        }
	      }
	    } catch (err) {
	      _didIteratorError = true;
	      _iteratorError = err;
	    } finally {
	      try {
	        if (!_iteratorNormalCompletion && _iterator.return) {
	          _iterator.return();
	        }
	      } finally {
	        if (_didIteratorError) {
	          throw _iteratorError;
	        }
	      }
	    }
	  };
	  Array.observe(objects, observer);
	  return observer;
	}
	
	function observeObject(object, onKeyAdded, onKeyRemoved, onKeyChanged) {
	  var observer = function observer(changes) {
	    var _iteratorNormalCompletion3 = true;
	    var _didIteratorError3 = false;
	    var _iteratorError3 = undefined;
	
	    try {
	      for (var _iterator3 = (0, _getIterator3.default)(changes), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
	        var change = _step3.value;
	
	        if (change.type === 'add') {
	          onKeyAdded(object, change.name);
	        }
	        if (change.type === 'update') {
	          onKeyChanged(object, change.name);
	        }
	        if (change.type === 'delete') {
	          onKeyRemoved(object, change.name);
	        }
	      }
	    } catch (err) {
	      _didIteratorError3 = true;
	      _iteratorError3 = err;
	    } finally {
	      try {
	        if (!_iteratorNormalCompletion3 && _iterator3.return) {
	          _iterator3.return();
	        }
	      } finally {
	        if (_didIteratorError3) {
	          throw _iteratorError3;
	        }
	      }
	    }
	  };
	  Object.observe(object, observer);
	  return observer;
	}

/***/ },
/* 111 */
/***/ function(module, exports) {

	Object.observe && !Array.observe && (function(O, A) {
	"use strict";
	
	var notifier = O.getNotifier,
	    perform = "performChange",
	    original = "_original",
	    type = "splice";
	
	var wrappers = {
	    push: function push(item) {
	        var args = arguments,
	            ret = push[original].apply(this, args);
	
	        notifier(this)[perform](type, function() {
	            return {
	                index: ret - args.length,
	                addedCount: args.length,
	                removed: []
	            };
	        });
	
	        return ret;
	    },
	    unshift: function unshift(item) {
	        var args = arguments,
	            ret = unshift[original].apply(this, args);
	
	        notifier(this)[perform](type, function() {
	            return {
	                index: 0,
	                addedCount: args.length,
	                removed: []
	            };
	        });
	
	        return ret;
	    },
	    pop: function pop() {
	        var len = this.length,
	            item = pop[original].call(this);
	
	        if (this.length !== len)
	            notifier(this)[perform](type, function() {
	                return {
	                    index: this.length,
	                    addedCount: 0,
	                    removed: [ item ]
	                };
	            }, this);
	
	        return item;
	    },
	    shift: function shift() {
	        var len = this.length,
	            item = shift[original].call(this);
	
	        if (this.length !== len)
	            notifier(this)[perform](type, function() {
	                return {
	                    index: 0,
	                    addedCount: 0,
	                    removed: [ item ]
	                };
	            }, this);
	
	        return item;
	    },
	    splice: function splice(start, deleteCount) {
	        var args = arguments,
	            removed = splice[original].apply(this, args);
	
	        if (removed.length || args.length > 2)
	            notifier(this)[perform](type, function() {
	                return {
	                    index: start,
	                    addedCount: args.length - 2,
	                    removed: removed
	                };
	            }, this);
	
	        return removed;
	    }
	};
	
	for (var wrapper in wrappers) {
	    wrappers[wrapper][original] = A.prototype[wrapper];
	    A.prototype[wrapper] = wrappers[wrapper];
	}
	
	A.observe = function(object, handler) {
	    return O.observe(object, handler, [ "add", "update", "delete", type ]);
	};
	A.unobserve = O.unobserve;
	
	})(Object, Array);


/***/ },
/* 112 */
/***/ function(module, exports) {

	/*!
	 * Object.observe polyfill - v0.2.4
	 * by Massimo Artizzu (MaxArt2501)
	 *
	 * https://github.com/MaxArt2501/object-observe
	 *
	 * Licensed under the MIT License
	 * See LICENSE for details
	 */
	
	// Some type definitions
	/**
	 * This represents the data relative to an observed object
	 * @typedef  {Object}                     ObjectData
	 * @property {Map<Handler, HandlerData>}  handlers
	 * @property {String[]}                   properties
	 * @property {*[]}                        values
	 * @property {Descriptor[]}               descriptors
	 * @property {Notifier}                   notifier
	 * @property {Boolean}                    frozen
	 * @property {Boolean}                    extensible
	 * @property {Object}                     proto
	 */
	/**
	 * Function definition of a handler
	 * @callback Handler
	 * @param {ChangeRecord[]}                changes
	*/
	/**
	 * This represents the data relative to an observed object and one of its
	 * handlers
	 * @typedef  {Object}                     HandlerData
	 * @property {Map<Object, ObservedData>}  observed
	 * @property {ChangeRecord[]}             changeRecords
	 */
	/**
	 * @typedef  {Object}                     ObservedData
	 * @property {String[]}                   acceptList
	 * @property {ObjectData}                 data
	*/
	/**
	 * Type definition for a change. Any other property can be added using
	 * the notify() or performChange() methods of the notifier.
	 * @typedef  {Object}                     ChangeRecord
	 * @property {String}                     type
	 * @property {Object}                     object
	 * @property {String}                     [name]
	 * @property {*}                          [oldValue]
	 * @property {Number}                     [index]
	 */
	/**
	 * Type definition for a notifier (what Object.getNotifier returns)
	 * @typedef  {Object}                     Notifier
	 * @property {Function}                   notify
	 * @property {Function}                   performChange
	 */
	/**
	 * Function called with Notifier.performChange. It may optionally return a
	 * ChangeRecord that gets automatically notified, but `type` and `object`
	 * properties are overridden.
	 * @callback Performer
	 * @returns {ChangeRecord|undefined}
	 */
	
	Object.observe || (function(O, A, root, _undefined) {
	    "use strict";
	
	        /**
	         * Relates observed objects and their data
	         * @type {Map<Object, ObjectData}
	         */
	    var observed,
	        /**
	         * List of handlers and their data
	         * @type {Map<Handler, Map<Object, HandlerData>>}
	         */
	        handlers,
	
	        defaultAcceptList = [ "add", "update", "delete", "reconfigure", "setPrototype", "preventExtensions" ];
	
	    // Functions for internal usage
	
	        /**
	         * Checks if the argument is an Array object. Polyfills Array.isArray.
	         * @function isArray
	         * @param {?*} object
	         * @returns {Boolean}
	         */
	    var isArray = A.isArray || (function(toString) {
	            return function (object) { return toString.call(object) === "[object Array]"; };
	        })(O.prototype.toString),
	
	        /**
	         * Returns the index of an item in a collection, or -1 if not found.
	         * Uses the generic Array.indexOf or Array.prototype.indexOf if available.
	         * @function inArray
	         * @param {Array} array
	         * @param {*} pivot           Item to look for
	         * @param {Number} [start=0]  Index to start from
	         * @returns {Number}
	         */
	        inArray = A.prototype.indexOf ? A.indexOf || function(array, pivot, start) {
	            return A.prototype.indexOf.call(array, pivot, start);
	        } : function(array, pivot, start) {
	            for (var i = start || 0; i < array.length; i++)
	                if (array[i] === pivot)
	                    return i;
	            return -1;
	        },
	
	        /**
	         * Returns an instance of Map, or a Map-like object is Map is not
	         * supported or doesn't support forEach()
	         * @function createMap
	         * @returns {Map}
	         */
	        createMap = root.Map === _undefined || !Map.prototype.forEach ? function() {
	            // Lightweight shim of Map. Lacks clear(), entries(), keys() and
	            // values() (the last 3 not supported by IE11, so can't use them),
	            // it doesn't handle the constructor's argument (like IE11) and of
	            // course it doesn't support for...of.
	            // Chrome 31-35 and Firefox 13-24 have a basic support of Map, but
	            // they lack forEach(), so their native implementation is bad for
	            // this polyfill. (Chrome 36+ supports Object.observe.)
	            var keys = [], values = [];
	
	            return {
	                size: 0,
	                has: function(key) { return inArray(keys, key) > -1; },
	                get: function(key) { return values[inArray(keys, key)]; },
	                set: function(key, value) {
	                    var i = inArray(keys, key);
	                    if (i === -1) {
	                        keys.push(key);
	                        values.push(value);
	                        this.size++;
	                    } else values[i] = value;
	                },
	                "delete": function(key) {
	                    var i = inArray(keys, key);
	                    if (i > -1) {
	                        keys.splice(i, 1);
	                        values.splice(i, 1);
	                        this.size--;
	                    }
	                },
	                forEach: function(callback/*, thisObj*/) {
	                    for (var i = 0; i < keys.length; i++)
	                        callback.call(arguments[1], values[i], keys[i], this);
	                }
	            };
	        } : function() { return new Map(); },
	
	        /**
	         * Simple shim for Object.getOwnPropertyNames when is not available
	         * Misses checks on object, don't use as a replacement of Object.keys/getOwnPropertyNames
	         * @function getProps
	         * @param {Object} object
	         * @returns {String[]}
	         */
	        getProps = O.getOwnPropertyNames ? (function() {
	            var func = O.getOwnPropertyNames;
	            try {
	                arguments.callee;
	            } catch (e) {
	                // Strict mode is supported
	
	                // In strict mode, we can't access to "arguments", "caller" and
	                // "callee" properties of functions. Object.getOwnPropertyNames
	                // returns [ "prototype", "length", "name" ] in Firefox; it returns
	                // "caller" and "arguments" too in Chrome and in Internet
	                // Explorer, so those values must be filtered.
	                var avoid = (func(inArray).join(" ") + " ").replace(/prototype |length |name /g, "").slice(0, -1).split(" ");
	                if (avoid.length) func = function(object) {
	                    var props = O.getOwnPropertyNames(object);
	                    if (typeof object === "function")
	                        for (var i = 0, j; i < avoid.length;)
	                            if ((j = inArray(props, avoid[i++])) > -1)
	                                props.splice(j, 1);
	
	                    return props;
	                };
	            }
	            return func;
	        })() : function(object) {
	            // Poor-mouth version with for...in (IE8-)
	            var props = [], prop, hop;
	            if ("hasOwnProperty" in object) {
	                for (prop in object)
	                    if (object.hasOwnProperty(prop))
	                        props.push(prop);
	            } else {
	                hop = O.hasOwnProperty;
	                for (prop in object)
	                    if (hop.call(object, prop))
	                        props.push(prop);
	            }
	
	            // Inserting a common non-enumerable property of arrays
	            if (isArray(object))
	                props.push("length");
	
	            return props;
	        },
	
	        /**
	         * Return the prototype of the object... if defined.
	         * @function getPrototype
	         * @param {Object} object
	         * @returns {Object}
	         */
	        getPrototype = O.getPrototypeOf,
	
	        /**
	         * Return the descriptor of the object... if defined.
	         * IE8 supports a (useless) Object.getOwnPropertyDescriptor for DOM
	         * nodes only, so defineProperties is checked instead.
	         * @function getDescriptor
	         * @param {Object} object
	         * @param {String} property
	         * @returns {Descriptor}
	         */
	        getDescriptor = O.defineProperties && O.getOwnPropertyDescriptor,
	
	        /**
	         * Sets up the next check and delivering iteration, using
	         * requestAnimationFrame or a (close) polyfill.
	         * @function nextFrame
	         * @param {function} func
	         * @returns {number}
	         */
	        nextFrame = root.requestAnimationFrame || root.webkitRequestAnimationFrame || (function() {
	            var initial = +new Date,
	                last = initial;
	            return function(func) {
	                return setTimeout(function() {
	                    func((last = +new Date) - initial);
	                }, 17);
	            };
	        })(),
	
	        /**
	         * Sets up the observation of an object
	         * @function doObserve
	         * @param {Object} object
	         * @param {Handler} handler
	         * @param {String[]} [acceptList]
	         */
	        doObserve = function(object, handler, acceptList) {
	            var data = observed.get(object);
	
	            if (data) {
	                performPropertyChecks(data, object);
	                setHandler(object, data, handler, acceptList);
	            } else {
	                data = createObjectData(object);
	                setHandler(object, data, handler, acceptList);
	
	                if (observed.size === 1)
	                    // Let the observation begin!
	                    nextFrame(runGlobalLoop);
	            }
	        },
	
	        /**
	         * Creates the initial data for an observed object
	         * @function createObjectData
	         * @param {Object} object
	         */
	        createObjectData = function(object, data) {
	            var props = getProps(object),
	                values = [], descs, i = 0,
	                data = {
	                    handlers: createMap(),
	                    frozen: O.isFrozen ? O.isFrozen(object) : false,
	                    extensible: O.isExtensible ? O.isExtensible(object) : true,
	                    proto: getPrototype && getPrototype(object),
	                    properties: props,
	                    values: values,
	                    notifier: retrieveNotifier(object, data)
	                };
	
	            if (getDescriptor) {
	                descs = data.descriptors = [];
	                while (i < props.length) {
	                    descs[i] = getDescriptor(object, props[i]);
	                    values[i] = object[props[i++]];
	                }
	            } else while (i < props.length)
	                values[i] = object[props[i++]];
	
	            observed.set(object, data);
	
	            return data;
	        },
	
	        /**
	         * Performs basic property value change checks on an observed object
	         * @function performPropertyChecks
	         * @param {ObjectData} data
	         * @param {Object} object
	         * @param {String} [except]  Doesn't deliver the changes to the
	         *                           handlers that accept this type
	         */
	        performPropertyChecks = (function() {
	            var updateCheck = getDescriptor ? function(object, data, idx, except, descr) {
	                var key = data.properties[idx],
	                    value = object[key],
	                    ovalue = data.values[idx],
	                    odesc = data.descriptors[idx];
	
	                if ("value" in descr && (ovalue === value
	                        ? ovalue === 0 && 1/ovalue !== 1/value
	                        : ovalue === ovalue || value === value)) {
	                    addChangeRecord(object, data, {
	                        name: key,
	                        type: "update",
	                        object: object,
	                        oldValue: ovalue
	                    }, except);
	                    data.values[idx] = value;
	                }
	                if (odesc.configurable && (!descr.configurable
	                        || descr.writable !== odesc.writable
	                        || descr.enumerable !== odesc.enumerable
	                        || descr.get !== odesc.get
	                        || descr.set !== odesc.set)) {
	                    addChangeRecord(object, data, {
	                        name: key,
	                        type: "reconfigure",
	                        object: object,
	                        oldValue: ovalue
	                    }, except);
	                    data.descriptors[idx] = descr;
	                }
	            } : function(object, data, idx, except) {
	                var key = data.properties[idx],
	                    value = object[key],
	                    ovalue = data.values[idx];
	
	                if (ovalue === value ? ovalue === 0 && 1/ovalue !== 1/value
	                        : ovalue === ovalue || value === value) {
	                    addChangeRecord(object, data, {
	                        name: key,
	                        type: "update",
	                        object: object,
	                        oldValue: ovalue
	                    }, except);
	                    data.values[idx] = value;
	                }
	            };
	
	            // Checks if some property has been deleted
	            var deletionCheck = getDescriptor ? function(object, props, proplen, data, except) {
	                var i = props.length, descr;
	                while (proplen && i--) {
	                    if (props[i] !== null) {
	                        descr = getDescriptor(object, props[i]);
	                        proplen--;
	
	                        // If there's no descriptor, the property has really
	                        // been deleted; otherwise, it's been reconfigured so
	                        // that's not enumerable anymore
	                        if (descr) updateCheck(object, data, i, except, descr);
	                        else {
	                            addChangeRecord(object, data, {
	                                name: props[i],
	                                type: "delete",
	                                object: object,
	                                oldValue: data.values[i]
	                            }, except);
	                            data.properties.splice(i, 1);
	                            data.values.splice(i, 1);
	                            data.descriptors.splice(i, 1);
	                        }
	                    }
	                }
	            } : function(object, props, proplen, data, except) {
	                var i = props.length;
	                while (proplen && i--)
	                    if (props[i] !== null) {
	                        addChangeRecord(object, data, {
	                            name: props[i],
	                            type: "delete",
	                            object: object,
	                            oldValue: data.values[i]
	                        }, except);
	                        data.properties.splice(i, 1);
	                        data.values.splice(i, 1);
	                        proplen--;
	                    }
	            };
	
	            return function(data, object, except) {
	                if (!data.handlers.size || data.frozen) return;
	
	                var props, proplen, keys,
	                    values = data.values,
	                    descs = data.descriptors,
	                    i = 0, idx,
	                    key, value,
	                    proto, descr;
	
	                // If the object isn't extensible, we don't need to check for new
	                // or deleted properties
	                if (data.extensible) {
	
	                    props = data.properties.slice();
	                    proplen = props.length;
	                    keys = getProps(object);
	
	                    if (descs) {
	                        while (i < keys.length) {
	                            key = keys[i++];
	                            idx = inArray(props, key);
	                            descr = getDescriptor(object, key);
	
	                            if (idx === -1) {
	                                addChangeRecord(object, data, {
	                                    name: key,
	                                    type: "add",
	                                    object: object
	                                }, except);
	                                data.properties.push(key);
	                                values.push(object[key]);
	                                descs.push(descr);
	                            } else {
	                                props[idx] = null;
	                                proplen--;
	                                updateCheck(object, data, idx, except, descr);
	                            }
	                        }
	                        deletionCheck(object, props, proplen, data, except);
	
	                        if (!O.isExtensible(object)) {
	                            data.extensible = false;
	                            addChangeRecord(object, data, {
	                                type: "preventExtensions",
	                                object: object
	                            }, except);
	
	                            data.frozen = O.isFrozen(object);
	                        }
	                    } else {
	                        while (i < keys.length) {
	                            key = keys[i++];
	                            idx = inArray(props, key);
	                            value = object[key];
	
	                            if (idx === -1) {
	                                addChangeRecord(object, data, {
	                                    name: key,
	                                    type: "add",
	                                    object: object
	                                }, except);
	                                data.properties.push(key);
	                                values.push(value);
	                            } else {
	                                props[idx] = null;
	                                proplen--;
	                                updateCheck(object, data, idx, except);
	                            }
	                        }
	                        deletionCheck(object, props, proplen, data, except);
	                    }
	
	                } else if (!data.frozen) {
	
	                    // If the object is not extensible, but not frozen, we just have
	                    // to check for value changes
	                    for (; i < props.length; i++) {
	                        key = props[i];
	                        updateCheck(object, data, i, except, getDescriptor(object, key));
	                    }
	
	                    if (O.isFrozen(object))
	                        data.frozen = true;
	                }
	
	                if (getPrototype) {
	                    proto = getPrototype(object);
	                    if (proto !== data.proto) {
	                        addChangeRecord(object, data, {
	                            type: "setPrototype",
	                            name: "__proto__",
	                            object: object,
	                            oldValue: data.proto
	                        });
	                        data.proto = proto;
	                    }
	                }
	            };
	        })(),
	
	        /**
	         * Sets up the main loop for object observation and change notification
	         * It stops if no object is observed.
	         * @function runGlobalLoop
	         */
	        runGlobalLoop = function() {
	            if (observed.size) {
	                observed.forEach(performPropertyChecks);
	                handlers.forEach(deliverHandlerRecords);
	                nextFrame(runGlobalLoop);
	            }
	        },
	
	        /**
	         * Deliver the change records relative to a certain handler, and resets
	         * the record list.
	         * @param {HandlerData} hdata
	         * @param {Handler} handler
	         */
	        deliverHandlerRecords = function(hdata, handler) {
	            var records = hdata.changeRecords;
	            if (records.length) {
	                hdata.changeRecords = [];
	                handler(records);
	            }
	        },
	
	        /**
	         * Returns the notifier for an object - whether it's observed or not
	         * @function retrieveNotifier
	         * @param {Object} object
	         * @param {ObjectData} [data]
	         * @returns {Notifier}
	         */
	        retrieveNotifier = function(object, data) {
	            if (arguments.length < 2)
	                data = observed.get(object);
	
	            /** @type {Notifier} */
	            return data && data.notifier || {
	                /**
	                 * @method notify
	                 * @see http://arv.github.io/ecmascript-object-observe/#notifierprototype._notify
	                 * @memberof Notifier
	                 * @param {ChangeRecord} changeRecord
	                 */
	                notify: function(changeRecord) {
	                    changeRecord.type; // Just to check the property is there...
	
	                    // If there's no data, the object has been unobserved
	                    var data = observed.get(object);
	                    if (data) {
	                        var recordCopy = { object: object }, prop;
	                        for (prop in changeRecord)
	                            if (prop !== "object")
	                                recordCopy[prop] = changeRecord[prop];
	                        addChangeRecord(object, data, recordCopy);
	                    }
	                },
	
	                /**
	                 * @method performChange
	                 * @see http://arv.github.io/ecmascript-object-observe/#notifierprototype_.performchange
	                 * @memberof Notifier
	                 * @param {String} changeType
	                 * @param {Performer} func     The task performer
	                 * @param {*} [thisObj]        Used to set `this` when calling func
	                 */
	                performChange: function(changeType, func/*, thisObj*/) {
	                    if (typeof changeType !== "string")
	                        throw new TypeError("Invalid non-string changeType");
	
	                    if (typeof func !== "function")
	                        throw new TypeError("Cannot perform non-function");
	
	                    // If there's no data, the object has been unobserved
	                    var data = observed.get(object),
	                        prop, changeRecord,
	                        thisObj = arguments[2],
	                        result = thisObj === _undefined ? func() : func.call(thisObj);
	
	                    data && performPropertyChecks(data, object, changeType);
	
	                    // If there's no data, the object has been unobserved
	                    if (data && result && typeof result === "object") {
	                        changeRecord = { object: object, type: changeType };
	                        for (prop in result)
	                            if (prop !== "object" && prop !== "type")
	                                changeRecord[prop] = result[prop];
	                        addChangeRecord(object, data, changeRecord);
	                    }
	                }
	            };
	        },
	
	        /**
	         * Register (or redefines) an handler in the collection for a given
	         * object and a given type accept list.
	         * @function setHandler
	         * @param {Object} object
	         * @param {ObjectData} data
	         * @param {Handler} handler
	         * @param {String[]} acceptList
	         */
	        setHandler = function(object, data, handler, acceptList) {
	            var hdata = handlers.get(handler);
	            if (!hdata)
	                handlers.set(handler, hdata = {
	                    observed: createMap(),
	                    changeRecords: []
	                });
	            hdata.observed.set(object, {
	                acceptList: acceptList.slice(),
	                data: data
	            });
	            data.handlers.set(handler, hdata);
	        },
	
	        /**
	         * Adds a change record in a given ObjectData
	         * @function addChangeRecord
	         * @param {Object} object
	         * @param {ObjectData} data
	         * @param {ChangeRecord} changeRecord
	         * @param {String} [except]
	         */
	        addChangeRecord = function(object, data, changeRecord, except) {
	            data.handlers.forEach(function(hdata) {
	                var acceptList = hdata.observed.get(object).acceptList;
	                // If except is defined, Notifier.performChange has been
	                // called, with except as the type.
	                // All the handlers that accepts that type are skipped.
	                if ((typeof except !== "string"
	                        || inArray(acceptList, except) === -1)
	                        && inArray(acceptList, changeRecord.type) > -1)
	                    hdata.changeRecords.push(changeRecord);
	            });
	        };
	
	    observed = createMap();
	    handlers = createMap();
	
	    /**
	     * @function Object.observe
	     * @see http://arv.github.io/ecmascript-object-observe/#Object.observe
	     * @param {Object} object
	     * @param {Handler} handler
	     * @param {String[]} [acceptList]
	     * @throws {TypeError}
	     * @returns {Object}               The observed object
	     */
	    O.observe = function observe(object, handler, acceptList) {
	        if (!object || typeof object !== "object" && typeof object !== "function")
	            throw new TypeError("Object.observe cannot observe non-object");
	
	        if (typeof handler !== "function")
	            throw new TypeError("Object.observe cannot deliver to non-function");
	
	        if (O.isFrozen && O.isFrozen(handler))
	            throw new TypeError("Object.observe cannot deliver to a frozen function object");
	
	        if (acceptList === _undefined)
	            acceptList = defaultAcceptList;
	        else if (!acceptList || typeof acceptList !== "object")
	            throw new TypeError("Third argument to Object.observe must be an array of strings.");
	
	        doObserve(object, handler, acceptList);
	
	        return object;
	    };
	
	    /**
	     * @function Object.unobserve
	     * @see http://arv.github.io/ecmascript-object-observe/#Object.unobserve
	     * @param {Object} object
	     * @param {Handler} handler
	     * @throws {TypeError}
	     * @returns {Object}         The given object
	     */
	    O.unobserve = function unobserve(object, handler) {
	        if (object === null || typeof object !== "object" && typeof object !== "function")
	            throw new TypeError("Object.unobserve cannot unobserve non-object");
	
	        if (typeof handler !== "function")
	            throw new TypeError("Object.unobserve cannot deliver to non-function");
	
	        var hdata = handlers.get(handler), odata;
	
	        if (hdata && (odata = hdata.observed.get(object))) {
	            hdata.observed.forEach(function(odata, object) {
	                performPropertyChecks(odata.data, object);
	            });
	            nextFrame(function() {
	                deliverHandlerRecords(hdata, handler);
	            });
	
	            // In Firefox 13-18, size is a function, but createMap should fall
	            // back to the shim for those versions
	            if (hdata.observed.size === 1 && hdata.observed.has(object))
	                handlers["delete"](handler);
	            else hdata.observed["delete"](object);
	
	            if (odata.data.handlers.size === 1)
	                observed["delete"](object);
	            else odata.data.handlers["delete"](handler);
	        }
	
	        return object;
	    };
	
	    /**
	     * @function Object.getNotifier
	     * @see http://arv.github.io/ecmascript-object-observe/#GetNotifier
	     * @param {Object} object
	     * @throws {TypeError}
	     * @returns {Notifier}
	     */
	    O.getNotifier = function getNotifier(object) {
	        if (object === null || typeof object !== "object" && typeof object !== "function")
	            throw new TypeError("Object.getNotifier cannot getNotifier non-object");
	
	        if (O.isFrozen && O.isFrozen(object)) return null;
	
	        return retrieveNotifier(object);
	    };
	
	    /**
	     * @function Object.deliverChangeRecords
	     * @see http://arv.github.io/ecmascript-object-observe/#Object.deliverChangeRecords
	     * @see http://arv.github.io/ecmascript-object-observe/#DeliverChangeRecords
	     * @param {Handler} handler
	     * @throws {TypeError}
	     */
	    O.deliverChangeRecords = function deliverChangeRecords(handler) {
	        if (typeof handler !== "function")
	            throw new TypeError("Object.deliverChangeRecords cannot deliver to non-function");
	
	        var hdata = handlers.get(handler);
	        if (hdata) {
	            hdata.observed.forEach(function(odata, object) {
	                performPropertyChecks(odata.data, object);
	            });
	            deliverHandlerRecords(hdata, handler);
	        }
	    };
	
	})(Object, Array, this);


/***/ },
/* 113 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(global, module) {/*
	 * Copyright (c) 2014 The Polymer Project Authors. All rights reserved.
	 * This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
	 * The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
	 * The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
	 * Code distributed by Google as part of the polymer project is also
	 * subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
	 */
	
	(function(global) {
	  'use strict';
	
	  var testingExposeCycleCount = global.testingExposeCycleCount;
	
	  // Detect and do basic sanity checking on Object/Array.observe.
	  function detectObjectObserve() {
	    if (typeof Object.observe !== 'function' ||
	        typeof Array.observe !== 'function') {
	      return false;
	    }
	
	    var records = [];
	
	    function callback(recs) {
	      records = recs;
	    }
	
	    var test = {};
	    var arr = [];
	    Object.observe(test, callback);
	    Array.observe(arr, callback);
	    test.id = 1;
	    test.id = 2;
	    delete test.id;
	    arr.push(1, 2);
	    arr.length = 0;
	
	    Object.deliverChangeRecords(callback);
	    if (records.length !== 5)
	      return false;
	
	    if (records[0].type != 'add' ||
	        records[1].type != 'update' ||
	        records[2].type != 'delete' ||
	        records[3].type != 'splice' ||
	        records[4].type != 'splice') {
	      return false;
	    }
	
	    Object.unobserve(test, callback);
	    Array.unobserve(arr, callback);
	
	    return true;
	  }
	
	  var hasObserve = detectObjectObserve();
	
	  function detectEval() {
	    // Don't test for eval if we're running in a Chrome App environment.
	    // We check for APIs set that only exist in a Chrome App context.
	    if (typeof chrome !== 'undefined' && chrome.app && chrome.app.runtime) {
	      return false;
	    }
	
	    // Firefox OS Apps do not allow eval. This feature detection is very hacky
	    // but even if some other platform adds support for this function this code
	    // will continue to work.
	    if (typeof navigator != 'undefined' && navigator.getDeviceStorage) {
	      return false;
	    }
	
	    try {
	      var f = new Function('', 'return true;');
	      return f();
	    } catch (ex) {
	      return false;
	    }
	  }
	
	  var hasEval = detectEval();
	
	  function isIndex(s) {
	    return +s === s >>> 0 && s !== '';
	  }
	
	  function toNumber(s) {
	    return +s;
	  }
	
	  function isObject(obj) {
	    return obj === Object(obj);
	  }
	
	  var numberIsNaN = global.Number.isNaN || function(value) {
	    return typeof value === 'number' && global.isNaN(value);
	  };
	
	  function areSameValue(left, right) {
	    if (left === right)
	      return left !== 0 || 1 / left === 1 / right;
	    if (numberIsNaN(left) && numberIsNaN(right))
	      return true;
	
	    return left !== left && right !== right;
	  }
	
	  var createObject = ('__proto__' in {}) ?
	    function(obj) { return obj; } :
	    function(obj) {
	      var proto = obj.__proto__;
	      if (!proto)
	        return obj;
	      var newObject = Object.create(proto);
	      Object.getOwnPropertyNames(obj).forEach(function(name) {
	        Object.defineProperty(newObject, name,
	                             Object.getOwnPropertyDescriptor(obj, name));
	      });
	      return newObject;
	    };
	
	  var identStart = '[\$_a-zA-Z]';
	  var identPart = '[\$_a-zA-Z0-9]';
	  var identRegExp = new RegExp('^' + identStart + '+' + identPart + '*' + '$');
	
	  function getPathCharType(char) {
	    if (char === undefined)
	      return 'eof';
	
	    var code = char.charCodeAt(0);
	
	    switch(code) {
	      case 0x5B: // [
	      case 0x5D: // ]
	      case 0x2E: // .
	      case 0x22: // "
	      case 0x27: // '
	      case 0x30: // 0
	        return char;
	
	      case 0x5F: // _
	      case 0x24: // $
	        return 'ident';
	
	      case 0x20: // Space
	      case 0x09: // Tab
	      case 0x0A: // Newline
	      case 0x0D: // Return
	      case 0xA0:  // No-break space
	      case 0xFEFF:  // Byte Order Mark
	      case 0x2028:  // Line Separator
	      case 0x2029:  // Paragraph Separator
	        return 'ws';
	    }
	
	    // a-z, A-Z
	    if ((0x61 <= code && code <= 0x7A) || (0x41 <= code && code <= 0x5A))
	      return 'ident';
	
	    // 1-9
	    if (0x31 <= code && code <= 0x39)
	      return 'number';
	
	    return 'else';
	  }
	
	  var pathStateMachine = {
	    'beforePath': {
	      'ws': ['beforePath'],
	      'ident': ['inIdent', 'append'],
	      '[': ['beforeElement'],
	      'eof': ['afterPath']
	    },
	
	    'inPath': {
	      'ws': ['inPath'],
	      '.': ['beforeIdent'],
	      '[': ['beforeElement'],
	      'eof': ['afterPath']
	    },
	
	    'beforeIdent': {
	      'ws': ['beforeIdent'],
	      'ident': ['inIdent', 'append']
	    },
	
	    'inIdent': {
	      'ident': ['inIdent', 'append'],
	      '0': ['inIdent', 'append'],
	      'number': ['inIdent', 'append'],
	      'ws': ['inPath', 'push'],
	      '.': ['beforeIdent', 'push'],
	      '[': ['beforeElement', 'push'],
	      'eof': ['afterPath', 'push']
	    },
	
	    'beforeElement': {
	      'ws': ['beforeElement'],
	      '0': ['afterZero', 'append'],
	      'number': ['inIndex', 'append'],
	      "'": ['inSingleQuote', 'append', ''],
	      '"': ['inDoubleQuote', 'append', '']
	    },
	
	    'afterZero': {
	      'ws': ['afterElement', 'push'],
	      ']': ['inPath', 'push']
	    },
	
	    'inIndex': {
	      '0': ['inIndex', 'append'],
	      'number': ['inIndex', 'append'],
	      'ws': ['afterElement'],
	      ']': ['inPath', 'push']
	    },
	
	    'inSingleQuote': {
	      "'": ['afterElement'],
	      'eof': ['error'],
	      'else': ['inSingleQuote', 'append']
	    },
	
	    'inDoubleQuote': {
	      '"': ['afterElement'],
	      'eof': ['error'],
	      'else': ['inDoubleQuote', 'append']
	    },
	
	    'afterElement': {
	      'ws': ['afterElement'],
	      ']': ['inPath', 'push']
	    }
	  };
	
	  function noop() {}
	
	  function parsePath(path) {
	    var keys = [];
	    var index = -1;
	    var c, newChar, key, type, transition, action, typeMap, mode = 'beforePath';
	
	    var actions = {
	      push: function() {
	        if (key === undefined)
	          return;
	
	        keys.push(key);
	        key = undefined;
	      },
	
	      append: function() {
	        if (key === undefined)
	          key = newChar;
	        else
	          key += newChar;
	      }
	    };
	
	    function maybeUnescapeQuote() {
	      if (index >= path.length)
	        return;
	
	      var nextChar = path[index + 1];
	      if ((mode == 'inSingleQuote' && nextChar == "'") ||
	          (mode == 'inDoubleQuote' && nextChar == '"')) {
	        index++;
	        newChar = nextChar;
	        actions.append();
	        return true;
	      }
	    }
	
	    while (mode) {
	      index++;
	      c = path[index];
	
	      if (c == '\\' && maybeUnescapeQuote(mode))
	        continue;
	
	      type = getPathCharType(c);
	      typeMap = pathStateMachine[mode];
	      transition = typeMap[type] || typeMap['else'] || 'error';
	
	      if (transition == 'error')
	        return; // parse error;
	
	      mode = transition[0];
	      action = actions[transition[1]] || noop;
	      newChar = transition[2] === undefined ? c : transition[2];
	      action();
	
	      if (mode === 'afterPath') {
	        return keys;
	      }
	    }
	
	    return; // parse error
	  }
	
	  function isIdent(s) {
	    return identRegExp.test(s);
	  }
	
	  var constructorIsPrivate = {};
	
	  function Path(parts, privateToken) {
	    if (privateToken !== constructorIsPrivate)
	      throw Error('Use Path.get to retrieve path objects');
	
	    for (var i = 0; i < parts.length; i++) {
	      this.push(String(parts[i]));
	    }
	
	    if (hasEval && this.length) {
	      this.getValueFrom = this.compiledGetValueFromFn();
	    }
	  }
	
	  // TODO(rafaelw): Make simple LRU cache
	  var pathCache = {};
	
	  function getPath(pathString) {
	    if (pathString instanceof Path)
	      return pathString;
	
	    if (pathString == null || pathString.length == 0)
	      pathString = '';
	
	    if (typeof pathString != 'string') {
	      if (isIndex(pathString.length)) {
	        // Constructed with array-like (pre-parsed) keys
	        return new Path(pathString, constructorIsPrivate);
	      }
	
	      pathString = String(pathString);
	    }
	
	    var path = pathCache[pathString];
	    if (path)
	      return path;
	
	    var parts = parsePath(pathString);
	    if (!parts)
	      return invalidPath;
	
	    path = new Path(parts, constructorIsPrivate);
	    pathCache[pathString] = path;
	    return path;
	  }
	
	  Path.get = getPath;
	
	  function formatAccessor(key) {
	    if (isIndex(key)) {
	      return '[' + key + ']';
	    } else {
	      return '["' + key.replace(/"/g, '\\"') + '"]';
	    }
	  }
	
	  Path.prototype = createObject({
	    __proto__: [],
	    valid: true,
	
	    toString: function() {
	      var pathString = '';
	      for (var i = 0; i < this.length; i++) {
	        var key = this[i];
	        if (isIdent(key)) {
	          pathString += i ? '.' + key : key;
	        } else {
	          pathString += formatAccessor(key);
	        }
	      }
	
	      return pathString;
	    },
	
	    getValueFrom: function(obj, defaultValue) {
	      for (var i = 0; i < this.length; i++) {
	        var key = this[i];
	        if (obj == null || !(key in obj))
	          return defaultValue;
	        obj = obj[key];
	      }
	      return obj;
	    },
	
	    iterateObjects: function(obj, observe) {
	      for (var i = 0; i < this.length; i++) {
	        if (i)
	          obj = obj[this[i - 1]];
	        if (!isObject(obj))
	          return;
	        observe(obj, this[i]);
	      }
	    },
	
	    compiledGetValueFromFn: function() {
	      var str = '';
	      var pathString = 'obj';
	      str += 'if (obj != null';
	      var i = 0;
	      var key;
	      for (; i < (this.length - 1); i++) {
	        key = this[i];
	        pathString += isIdent(key) ? '.' + key : formatAccessor(key);
	        str += ' &&\n    ' + pathString + ' != null';
	      }
	
	      key = this[i];
	      var keyIsIdent = isIdent(key);
	      var keyForInOperator = keyIsIdent ? '"' + key.replace(/"/g, '\\"') + '"' : key;
	      str += ' &&\n    ' + keyForInOperator + ' in ' + pathString + ')\n';
	      pathString += keyIsIdent ? '.' + key : formatAccessor(key);
	
	      str += '  return ' + pathString + ';\nelse\n  return defaultValue;';
	      return new Function('obj', 'defaultValue', str);
	    },
	
	    setValueFrom: function(obj, value) {
	      if (!this.length)
	        return false;
	
	      for (var i = 0; i < this.length - 1; i++) {
	        if (!isObject(obj))
	          return false;
	        obj = obj[this[i]];
	      }
	
	      if (!isObject(obj))
	        return false;
	
	      obj[this[i]] = value;
	      return true;
	    }
	  });
	
	  var invalidPath = new Path('', constructorIsPrivate);
	  invalidPath.valid = false;
	  invalidPath.getValueFrom = invalidPath.setValueFrom = function() {};
	
	  var MAX_DIRTY_CHECK_CYCLES = 1000;
	
	  function dirtyCheck(observer) {
	    var cycles = 0;
	    while (cycles < MAX_DIRTY_CHECK_CYCLES && observer.check_()) {
	      cycles++;
	    }
	    if (testingExposeCycleCount)
	      global.dirtyCheckCycleCount = cycles;
	
	    return cycles > 0;
	  }
	
	  function objectIsEmpty(object) {
	    for (var prop in object)
	      return false;
	    return true;
	  }
	
	  function diffIsEmpty(diff) {
	    return objectIsEmpty(diff.added) &&
	           objectIsEmpty(diff.removed) &&
	           objectIsEmpty(diff.changed);
	  }
	
	  function diffObjectFromOldObject(object, oldObject) {
	    var added = {};
	    var removed = {};
	    var changed = {};
	    var prop;
	
	    for (prop in oldObject) {
	      var newValue = object[prop];
	
	      if (newValue !== undefined && newValue === oldObject[prop])
	        continue;
	
	      if (!(prop in object)) {
	        removed[prop] = undefined;
	        continue;
	      }
	
	      if (newValue !== oldObject[prop])
	        changed[prop] = newValue;
	    }
	
	    for (prop in object) {
	      if (prop in oldObject)
	        continue;
	
	      added[prop] = object[prop];
	    }
	
	    if (Array.isArray(object) && object.length !== oldObject.length)
	      changed.length = object.length;
	
	    return {
	      added: added,
	      removed: removed,
	      changed: changed
	    };
	  }
	
	  var eomTasks = [];
	  function runEOMTasks() {
	    if (!eomTasks.length)
	      return false;
	
	    for (var i = 0; i < eomTasks.length; i++) {
	      eomTasks[i]();
	    }
	    eomTasks.length = 0;
	    return true;
	  }
	
	  var runEOM = hasObserve ? (function(){
	    return function(fn) {
	      return Promise.resolve().then(fn);
	    };
	  })() :
	  (function() {
	    return function(fn) {
	      eomTasks.push(fn);
	    };
	  })();
	
	  var observedObjectCache = [];
	
	  function newObservedObject() {
	    var observer;
	    var object;
	    var discardRecords = false;
	    var first = true;
	
	    function callback(records) {
	      if (observer && observer.state_ === OPENED && !discardRecords)
	        observer.check_(records);
	    }
	
	    return {
	      open: function(obs) {
	        if (observer)
	          throw Error('ObservedObject in use');
	
	        if (!first)
	          Object.deliverChangeRecords(callback);
	
	        observer = obs;
	        first = false;
	      },
	      observe: function(obj, arrayObserve) {
	        object = obj;
	        if (arrayObserve)
	          Array.observe(object, callback);
	        else
	          Object.observe(object, callback);
	      },
	      deliver: function(discard) {
	        discardRecords = discard;
	        Object.deliverChangeRecords(callback);
	        discardRecords = false;
	      },
	      close: function() {
	        observer = undefined;
	        Object.unobserve(object, callback);
	        observedObjectCache.push(this);
	      }
	    };
	  }
	
	  /*
	   * The observedSet abstraction is a perf optimization which reduces the total
	   * number of Object.observe observations of a set of objects. The idea is that
	   * groups of Observers will have some object dependencies in common and this
	   * observed set ensures that each object in the transitive closure of
	   * dependencies is only observed once. The observedSet acts as a write barrier
	   * such that whenever any change comes through, all Observers are checked for
	   * changed values.
	   *
	   * Note that this optimization is explicitly moving work from setup-time to
	   * change-time.
	   *
	   * TODO(rafaelw): Implement "garbage collection". In order to move work off
	   * the critical path, when Observers are closed, their observed objects are
	   * not Object.unobserve(d). As a result, it's possible that if the observedSet
	   * is kept open, but some Observers have been closed, it could cause "leaks"
	   * (prevent otherwise collectable objects from being collected). At some
	   * point, we should implement incremental "gc" which keeps a list of
	   * observedSets which may need clean-up and does small amounts of cleanup on a
	   * timeout until all is clean.
	   */
	
	  function getObservedObject(observer, object, arrayObserve) {
	    var dir = observedObjectCache.pop() || newObservedObject();
	    dir.open(observer);
	    dir.observe(object, arrayObserve);
	    return dir;
	  }
	
	  var observedSetCache = [];
	
	  function newObservedSet() {
	    var observerCount = 0;
	    var observers = [];
	    var objects = [];
	    var rootObj;
	    var rootObjProps;
	
	    function observe(obj, prop) {
	      if (!obj)
	        return;
	
	      if (obj === rootObj)
	        rootObjProps[prop] = true;
	
	      if (objects.indexOf(obj) < 0) {
	        objects.push(obj);
	        Object.observe(obj, callback);
	      }
	
	      observe(Object.getPrototypeOf(obj), prop);
	    }
	
	    function allRootObjNonObservedProps(recs) {
	      for (var i = 0; i < recs.length; i++) {
	        var rec = recs[i];
	        if (rec.object !== rootObj ||
	            rootObjProps[rec.name] ||
	            rec.type === 'setPrototype') {
	          return false;
	        }
	      }
	      return true;
	    }
	
	    function callback(recs) {
	      if (allRootObjNonObservedProps(recs))
	        return;
	
	      var i, observer;
	      for (i = 0; i < observers.length; i++) {
	        observer = observers[i];
	        if (observer.state_ == OPENED) {
	          observer.iterateObjects_(observe);
	        }
	      }
	
	      for (i = 0; i < observers.length; i++) {
	        observer = observers[i];
	        if (observer.state_ == OPENED) {
	          observer.check_();
	        }
	      }
	    }
	
	    var record = {
	      objects: objects,
	      get rootObject() { return rootObj; },
	      set rootObject(value) {
	        rootObj = value;
	        rootObjProps = {};
	      },
	      open: function(obs, object) {
	        observers.push(obs);
	        observerCount++;
	        obs.iterateObjects_(observe);
	      },
	      close: function(obs) {
	        observerCount--;
	        if (observerCount > 0) {
	          return;
	        }
	
	        for (var i = 0; i < objects.length; i++) {
	          Object.unobserve(objects[i], callback);
	          Observer.unobservedCount++;
	        }
	
	        observers.length = 0;
	        objects.length = 0;
	        rootObj = undefined;
	        rootObjProps = undefined;
	        observedSetCache.push(this);
	        if (lastObservedSet === this)
	          lastObservedSet = null;
	      },
	    };
	
	    return record;
	  }
	
	  var lastObservedSet;
	
	  function getObservedSet(observer, obj) {
	    if (!lastObservedSet || lastObservedSet.rootObject !== obj) {
	      lastObservedSet = observedSetCache.pop() || newObservedSet();
	      lastObservedSet.rootObject = obj;
	    }
	    lastObservedSet.open(observer, obj);
	    return lastObservedSet;
	  }
	
	  var UNOPENED = 0;
	  var OPENED = 1;
	  var CLOSED = 2;
	  var RESETTING = 3;
	
	  var nextObserverId = 1;
	
	  function Observer() {
	    this.state_ = UNOPENED;
	    this.callback_ = undefined;
	    this.target_ = undefined; // TODO(rafaelw): Should be WeakRef
	    this.directObserver_ = undefined;
	    this.value_ = undefined;
	    this.id_ = nextObserverId++;
	  }
	
	  Observer.prototype = {
	    open: function(callback, target) {
	      if (this.state_ != UNOPENED)
	        throw Error('Observer has already been opened.');
	
	      addToAll(this);
	      this.callback_ = callback;
	      this.target_ = target;
	      this.connect_();
	      this.state_ = OPENED;
	      return this.value_;
	    },
	
	    close: function() {
	      if (this.state_ != OPENED)
	        return;
	
	      removeFromAll(this);
	      this.disconnect_();
	      this.value_ = undefined;
	      this.callback_ = undefined;
	      this.target_ = undefined;
	      this.state_ = CLOSED;
	    },
	
	    deliver: function() {
	      if (this.state_ != OPENED)
	        return;
	
	      dirtyCheck(this);
	    },
	
	    report_: function(changes) {
	      try {
	        this.callback_.apply(this.target_, changes);
	      } catch (ex) {
	        Observer._errorThrownDuringCallback = true;
	        console.error('Exception caught during observer callback: ' +
	                       (ex.stack || ex));
	      }
	    },
	
	    discardChanges: function() {
	      this.check_(undefined, true);
	      return this.value_;
	    }
	  };
	
	  var collectObservers = !hasObserve;
	  var allObservers;
	  Observer._allObserversCount = 0;
	
	  if (collectObservers) {
	    allObservers = [];
	  }
	
	  function addToAll(observer) {
	    Observer._allObserversCount++;
	    if (!collectObservers)
	      return;
	
	    allObservers.push(observer);
	  }
	
	  function removeFromAll(observer) {
	    Observer._allObserversCount--;
	  }
	
	  var runningMicrotaskCheckpoint = false;
	
	  global.Platform = global.Platform || {};
	
	  global.Platform.performMicrotaskCheckpoint = function() {
	    if (runningMicrotaskCheckpoint)
	      return;
	
	    if (!collectObservers)
	      return;
	
	    runningMicrotaskCheckpoint = true;
	
	    var cycles = 0;
	    var anyChanged, toCheck;
	
	    do {
	      cycles++;
	      toCheck = allObservers;
	      allObservers = [];
	      anyChanged = false;
	
	      for (var i = 0; i < toCheck.length; i++) {
	        var observer = toCheck[i];
	        if (observer.state_ != OPENED)
	          continue;
	
	        if (observer.check_())
	          anyChanged = true;
	
	        allObservers.push(observer);
	      }
	      if (runEOMTasks())
	        anyChanged = true;
	    } while (cycles < MAX_DIRTY_CHECK_CYCLES && anyChanged);
	
	    if (testingExposeCycleCount)
	      global.dirtyCheckCycleCount = cycles;
	
	    runningMicrotaskCheckpoint = false;
	  };
	
	  if (collectObservers) {
	    global.Platform.clearObservers = function() {
	      allObservers = [];
	    };
	  }
	
	  function ObjectObserver(object) {
	    Observer.call(this);
	    this.value_ = object;
	    this.oldObject_ = undefined;
	  }
	
	  ObjectObserver.prototype = createObject({
	    __proto__: Observer.prototype,
	
	    arrayObserve: false,
	
	    connect_: function(callback, target) {
	      if (hasObserve) {
	        this.directObserver_ = getObservedObject(this, this.value_,
	                                                 this.arrayObserve);
	      } else {
	        this.oldObject_ = this.copyObject(this.value_);
	      }
	
	    },
	
	    copyObject: function(object) {
	      var copy = Array.isArray(object) ? [] : {};
	      for (var prop in object) {
	        copy[prop] = object[prop];
	      }
	      if (Array.isArray(object))
	        copy.length = object.length;
	      return copy;
	    },
	
	    check_: function(changeRecords, skipChanges) {
	      var diff;
	      var oldValues;
	      if (hasObserve) {
	        if (!changeRecords)
	          return false;
	
	        oldValues = {};
	        diff = diffObjectFromChangeRecords(this.value_, changeRecords,
	                                           oldValues);
	      } else {
	        oldValues = this.oldObject_;
	        diff = diffObjectFromOldObject(this.value_, this.oldObject_);
	      }
	
	      if (diffIsEmpty(diff))
	        return false;
	
	      if (!hasObserve)
	        this.oldObject_ = this.copyObject(this.value_);
	
	      this.report_([
	        diff.added || {},
	        diff.removed || {},
	        diff.changed || {},
	        function(property) {
	          return oldValues[property];
	        }
	      ]);
	
	      return true;
	    },
	
	    disconnect_: function() {
	      if (hasObserve) {
	        this.directObserver_.close();
	        this.directObserver_ = undefined;
	      } else {
	        this.oldObject_ = undefined;
	      }
	    },
	
	    deliver: function() {
	      if (this.state_ != OPENED)
	        return;
	
	      if (hasObserve)
	        this.directObserver_.deliver(false);
	      else
	        dirtyCheck(this);
	    },
	
	    discardChanges: function() {
	      if (this.directObserver_)
	        this.directObserver_.deliver(true);
	      else
	        this.oldObject_ = this.copyObject(this.value_);
	
	      return this.value_;
	    }
	  });
	
	  function ArrayObserver(array) {
	    if (!Array.isArray(array))
	      throw Error('Provided object is not an Array');
	    ObjectObserver.call(this, array);
	  }
	
	  ArrayObserver.prototype = createObject({
	
	    __proto__: ObjectObserver.prototype,
	
	    arrayObserve: true,
	
	    copyObject: function(arr) {
	      return arr.slice();
	    },
	
	    check_: function(changeRecords) {
	      var splices;
	      if (hasObserve) {
	        if (!changeRecords)
	          return false;
	        splices = projectArraySplices(this.value_, changeRecords);
	      } else {
	        splices = calcSplices(this.value_, 0, this.value_.length,
	                              this.oldObject_, 0, this.oldObject_.length);
	      }
	
	      if (!splices || !splices.length)
	        return false;
	
	      if (!hasObserve)
	        this.oldObject_ = this.copyObject(this.value_);
	
	      this.report_([splices]);
	      return true;
	    }
	  });
	
	  ArrayObserver.applySplices = function(previous, current, splices) {
	    splices.forEach(function(splice) {
	      var spliceArgs = [splice.index, splice.removed.length];
	      var addIndex = splice.index;
	      while (addIndex < splice.index + splice.addedCount) {
	        spliceArgs.push(current[addIndex]);
	        addIndex++;
	      }
	
	      Array.prototype.splice.apply(previous, spliceArgs);
	    });
	  };
	
	  function PathObserver(object, path, defaultValue) {
	    Observer.call(this);
	
	    this.object_ = object;
	    this.path_ = getPath(path);
	    this.defaultValue_ = defaultValue;
	    this.directObserver_ = undefined;
	  }
	
	  PathObserver.prototype = createObject({
	    __proto__: Observer.prototype,
	
	    get path() {
	      return this.path_;
	    },
	
	    connect_: function() {
	      if (hasObserve)
	        this.directObserver_ = getObservedSet(this, this.object_);
	
	      this.check_(undefined, true);
	    },
	
	    disconnect_: function() {
	      this.value_ = undefined;
	
	      if (this.directObserver_) {
	        this.directObserver_.close(this);
	        this.directObserver_ = undefined;
	      }
	    },
	
	    iterateObjects_: function(observe) {
	      this.path_.iterateObjects(this.object_, observe);
	    },
	
	    check_: function(changeRecords, skipChanges) {
	      var oldValue = this.value_;
	      this.value_ = this.path_.getValueFrom(this.object_, this.defaultValue_);
	      if (skipChanges || areSameValue(this.value_, oldValue))
	        return false;
	
	      this.report_([this.value_, oldValue, this]);
	      return true;
	    },
	
	    setValue: function(newValue) {
	      if (this.path_)
	        this.path_.setValueFrom(this.object_, newValue);
	    }
	  });
	
	  function CompoundObserver(reportChangesOnOpen) {
	    Observer.call(this);
	
	    this.reportChangesOnOpen_ = reportChangesOnOpen;
	    this.value_ = [];
	    this.directObserver_ = undefined;
	    this.observed_ = [];
	  }
	
	  var observerSentinel = {};
	
	  CompoundObserver.prototype = createObject({
	    __proto__: Observer.prototype,
	
	    connect_: function() {
	      if (hasObserve) {
	        var object;
	        var needsDirectObserver = false;
	        for (var i = 0; i < this.observed_.length; i += 2) {
	          object = this.observed_[i];
	          if (object !== observerSentinel) {
	            needsDirectObserver = true;
	            break;
	          }
	        }
	
	        if (needsDirectObserver)
	          this.directObserver_ = getObservedSet(this, object);
	      }
	
	      this.check_(undefined, !this.reportChangesOnOpen_);
	    },
	
	    disconnect_: function() {
	      for (var i = 0; i < this.observed_.length; i += 2) {
	        if (this.observed_[i] === observerSentinel)
	          this.observed_[i + 1].close();
	      }
	      this.observed_.length = 0;
	      this.value_.length = 0;
	
	      if (this.directObserver_) {
	        this.directObserver_.close(this);
	        this.directObserver_ = undefined;
	      }
	    },
	
	    addPath: function(object, path) {
	      if (this.state_ != UNOPENED && this.state_ != RESETTING)
	        throw Error('Cannot add paths once started.');
	
	      path = getPath(path);
	      this.observed_.push(object, path);
	      if (!this.reportChangesOnOpen_)
	        return;
	      var index = this.observed_.length / 2 - 1;
	      this.value_[index] = path.getValueFrom(object);
	    },
	
	    addObserver: function(observer) {
	      if (this.state_ != UNOPENED && this.state_ != RESETTING)
	        throw Error('Cannot add observers once started.');
	
	      this.observed_.push(observerSentinel, observer);
	      if (!this.reportChangesOnOpen_)
	        return;
	      var index = this.observed_.length / 2 - 1;
	      this.value_[index] = observer.open(this.deliver, this);
	    },
	
	    startReset: function() {
	      if (this.state_ != OPENED)
	        throw Error('Can only reset while open');
	
	      this.state_ = RESETTING;
	      this.disconnect_();
	    },
	
	    finishReset: function() {
	      if (this.state_ != RESETTING)
	        throw Error('Can only finishReset after startReset');
	      this.state_ = OPENED;
	      this.connect_();
	
	      return this.value_;
	    },
	
	    iterateObjects_: function(observe) {
	      var object;
	      for (var i = 0; i < this.observed_.length; i += 2) {
	        object = this.observed_[i];
	        if (object !== observerSentinel)
	          this.observed_[i + 1].iterateObjects(object, observe);
	      }
	    },
	
	    check_: function(changeRecords, skipChanges) {
	      var oldValues;
	      for (var i = 0; i < this.observed_.length; i += 2) {
	        var object = this.observed_[i];
	        var path = this.observed_[i+1];
	        var value;
	        if (object === observerSentinel) {
	          var observable = path;
	          value = this.state_ === UNOPENED ?
	              observable.open(this.deliver, this) :
	              observable.discardChanges();
	        } else {
	          value = path.getValueFrom(object);
	        }
	
	        if (skipChanges) {
	          this.value_[i / 2] = value;
	          continue;
	        }
	
	        if (areSameValue(value, this.value_[i / 2]))
	          continue;
	
	        oldValues = oldValues || [];
	        oldValues[i / 2] = this.value_[i / 2];
	        this.value_[i / 2] = value;
	      }
	
	      if (!oldValues)
	        return false;
	
	      // TODO(rafaelw): Having observed_ as the third callback arg here is
	      // pretty lame API. Fix.
	      this.report_([this.value_, oldValues, this.observed_]);
	      return true;
	    }
	  });
	
	  function identFn(value) { return value; }
	
	  function ObserverTransform(observable, getValueFn, setValueFn,
	                             dontPassThroughSet) {
	    this.callback_ = undefined;
	    this.target_ = undefined;
	    this.value_ = undefined;
	    this.observable_ = observable;
	    this.getValueFn_ = getValueFn || identFn;
	    this.setValueFn_ = setValueFn || identFn;
	    // TODO(rafaelw): This is a temporary hack. PolymerExpressions needs this
	    // at the moment because of a bug in it's dependency tracking.
	    this.dontPassThroughSet_ = dontPassThroughSet;
	  }
	
	  ObserverTransform.prototype = {
	    open: function(callback, target) {
	      this.callback_ = callback;
	      this.target_ = target;
	      this.value_ =
	          this.getValueFn_(this.observable_.open(this.observedCallback_, this));
	      return this.value_;
	    },
	
	    observedCallback_: function(value) {
	      value = this.getValueFn_(value);
	      if (areSameValue(value, this.value_))
	        return;
	      var oldValue = this.value_;
	      this.value_ = value;
	      this.callback_.call(this.target_, this.value_, oldValue);
	    },
	
	    discardChanges: function() {
	      this.value_ = this.getValueFn_(this.observable_.discardChanges());
	      return this.value_;
	    },
	
	    deliver: function() {
	      return this.observable_.deliver();
	    },
	
	    setValue: function(value) {
	      value = this.setValueFn_(value);
	      if (!this.dontPassThroughSet_ && this.observable_.setValue)
	        return this.observable_.setValue(value);
	    },
	
	    close: function() {
	      if (this.observable_)
	        this.observable_.close();
	      this.callback_ = undefined;
	      this.target_ = undefined;
	      this.observable_ = undefined;
	      this.value_ = undefined;
	      this.getValueFn_ = undefined;
	      this.setValueFn_ = undefined;
	    }
	  };
	
	  var expectedRecordTypes = {
	    add: true,
	    update: true,
	    delete: true
	  };
	
	  function diffObjectFromChangeRecords(object, changeRecords, oldValues) {
	    var added = {};
	    var removed = {};
	
	    for (var i = 0; i < changeRecords.length; i++) {
	      var record = changeRecords[i];
	      if (!expectedRecordTypes[record.type]) {
	        console.error('Unknown changeRecord type: ' + record.type);
	        console.error(record);
	        continue;
	      }
	
	      if (!(record.name in oldValues))
	        oldValues[record.name] = record.oldValue;
	
	      if (record.type == 'update')
	        continue;
	
	      if (record.type == 'add') {
	        if (record.name in removed)
	          delete removed[record.name];
	        else
	          added[record.name] = true;
	
	        continue;
	      }
	
	      // type = 'delete'
	      if (record.name in added) {
	        delete added[record.name];
	        delete oldValues[record.name];
	      } else {
	        removed[record.name] = true;
	      }
	    }
	
	    var prop;
	    for (prop in added)
	      added[prop] = object[prop];
	
	    for (prop in removed)
	      removed[prop] = undefined;
	
	    var changed = {};
	    for (prop in oldValues) {
	      if (prop in added || prop in removed)
	        continue;
	
	      var newValue = object[prop];
	      if (oldValues[prop] !== newValue)
	        changed[prop] = newValue;
	    }
	
	    return {
	      added: added,
	      removed: removed,
	      changed: changed
	    };
	  }
	
	  function newSplice(index, removed, addedCount) {
	    return {
	      index: index,
	      removed: removed,
	      addedCount: addedCount
	    };
	  }
	
	  var EDIT_LEAVE = 0;
	  var EDIT_UPDATE = 1;
	  var EDIT_ADD = 2;
	  var EDIT_DELETE = 3;
	
	  function ArraySplice() {}
	
	  ArraySplice.prototype = {
	
	    // Note: This function is *based* on the computation of the Levenshtein
	    // "edit" distance. The one change is that "updates" are treated as two
	    // edits - not one. With Array splices, an update is really a delete
	    // followed by an add. By retaining this, we optimize for "keeping" the
	    // maximum array items in the original array. For example:
	    //
	    //   'xxxx123' -> '123yyyy'
	    //
	    // With 1-edit updates, the shortest path would be just to update all seven
	    // characters. With 2-edit updates, we delete 4, leave 3, and add 4. This
	    // leaves the substring '123' intact.
	    calcEditDistances: function(current, currentStart, currentEnd,
	                                old, oldStart, oldEnd) {
	      // "Deletion" columns
	      var rowCount = oldEnd - oldStart + 1;
	      var columnCount = currentEnd - currentStart + 1;
	      var distances = new Array(rowCount);
	
	      var i, j;
	
	      // "Addition" rows. Initialize null column.
	      for (i = 0; i < rowCount; i++) {
	        distances[i] = new Array(columnCount);
	        distances[i][0] = i;
	      }
	
	      // Initialize null row
	      for (j = 0; j < columnCount; j++)
	        distances[0][j] = j;
	
	      for (i = 1; i < rowCount; i++) {
	        for (j = 1; j < columnCount; j++) {
	          if (this.equals(current[currentStart + j - 1], old[oldStart + i - 1]))
	            distances[i][j] = distances[i - 1][j - 1];
	          else {
	            var north = distances[i - 1][j] + 1;
	            var west = distances[i][j - 1] + 1;
	            distances[i][j] = north < west ? north : west;
	          }
	        }
	      }
	
	      return distances;
	    },
	
	    // This starts at the final weight, and walks "backward" by finding
	    // the minimum previous weight recursively until the origin of the weight
	    // matrix.
	    spliceOperationsFromEditDistances: function(distances) {
	      var i = distances.length - 1;
	      var j = distances[0].length - 1;
	      var current = distances[i][j];
	      var edits = [];
	      while (i > 0 || j > 0) {
	        if (i == 0) {
	          edits.push(EDIT_ADD);
	          j--;
	          continue;
	        }
	        if (j == 0) {
	          edits.push(EDIT_DELETE);
	          i--;
	          continue;
	        }
	        var northWest = distances[i - 1][j - 1];
	        var west = distances[i - 1][j];
	        var north = distances[i][j - 1];
	
	        var min;
	        if (west < north)
	          min = west < northWest ? west : northWest;
	        else
	          min = north < northWest ? north : northWest;
	
	        if (min == northWest) {
	          if (northWest == current) {
	            edits.push(EDIT_LEAVE);
	          } else {
	            edits.push(EDIT_UPDATE);
	            current = northWest;
	          }
	          i--;
	          j--;
	        } else if (min == west) {
	          edits.push(EDIT_DELETE);
	          i--;
	          current = west;
	        } else {
	          edits.push(EDIT_ADD);
	          j--;
	          current = north;
	        }
	      }
	
	      edits.reverse();
	      return edits;
	    },
	
	    /**
	     * Splice Projection functions:
	     *
	     * A splice map is a representation of how a previous array of items
	     * was transformed into a new array of items. Conceptually it is a list of
	     * tuples of
	     *
	     *   <index, removed, addedCount>
	     *
	     * which are kept in ascending index order of. The tuple represents that at
	     * the |index|, |removed| sequence of items were removed, and counting forward
	     * from |index|, |addedCount| items were added.
	     */
	
	    /**
	     * Lacking individual splice mutation information, the minimal set of
	     * splices can be synthesized given the previous state and final state of an
	     * array. The basic approach is to calculate the edit distance matrix and
	     * choose the shortest path through it.
	     *
	     * Complexity: O(l * p)
	     *   l: The length of the current array
	     *   p: The length of the old array
	     */
	    calcSplices: function(current, currentStart, currentEnd,
	                          old, oldStart, oldEnd) {
	      var prefixCount = 0;
	      var suffixCount = 0;
	
	      var minLength = Math.min(currentEnd - currentStart, oldEnd - oldStart);
	      if (currentStart == 0 && oldStart == 0)
	        prefixCount = this.sharedPrefix(current, old, minLength);
	
	      if (currentEnd == current.length && oldEnd == old.length)
	        suffixCount = this.sharedSuffix(current, old, minLength - prefixCount);
	
	      currentStart += prefixCount;
	      oldStart += prefixCount;
	      currentEnd -= suffixCount;
	      oldEnd -= suffixCount;
	
	      if (currentEnd - currentStart == 0 && oldEnd - oldStart == 0)
	        return [];
	
	      var splice;
	      if (currentStart == currentEnd) {
	        splice = newSplice(currentStart, [], 0);
	        while (oldStart < oldEnd)
	          splice.removed.push(old[oldStart++]);
	
	        return [ splice ];
	      } else if (oldStart == oldEnd)
	        return [ newSplice(currentStart, [], currentEnd - currentStart) ];
	
	      var ops = this.spliceOperationsFromEditDistances(
	          this.calcEditDistances(current, currentStart, currentEnd,
	                                 old, oldStart, oldEnd));
	
	      var splices = [];
	      var index = currentStart;
	      var oldIndex = oldStart;
	      for (var i = 0; i < ops.length; i++) {
	        switch(ops[i]) {
	          case EDIT_LEAVE:
	            if (splice) {
	              splices.push(splice);
	              splice = undefined;
	            }
	
	            index++;
	            oldIndex++;
	            break;
	          case EDIT_UPDATE:
	            if (!splice)
	              splice = newSplice(index, [], 0);
	
	            splice.addedCount++;
	            index++;
	
	            splice.removed.push(old[oldIndex]);
	            oldIndex++;
	            break;
	          case EDIT_ADD:
	            if (!splice)
	              splice = newSplice(index, [], 0);
	
	            splice.addedCount++;
	            index++;
	            break;
	          case EDIT_DELETE:
	            if (!splice)
	              splice = newSplice(index, [], 0);
	
	            splice.removed.push(old[oldIndex]);
	            oldIndex++;
	            break;
	        }
	      }
	
	      if (splice) {
	        splices.push(splice);
	      }
	      return splices;
	    },
	
	    sharedPrefix: function(current, old, searchLength) {
	      for (var i = 0; i < searchLength; i++)
	        if (!this.equals(current[i], old[i]))
	          return i;
	      return searchLength;
	    },
	
	    sharedSuffix: function(current, old, searchLength) {
	      var index1 = current.length;
	      var index2 = old.length;
	      var count = 0;
	      while (count < searchLength && this.equals(current[--index1], old[--index2]))
	        count++;
	
	      return count;
	    },
	
	    calculateSplices: function(current, previous) {
	      return this.calcSplices(current, 0, current.length, previous, 0,
	                              previous.length);
	    },
	
	    equals: function(currentValue, previousValue) {
	      return currentValue === previousValue;
	    }
	  };
	
	  var arraySplice = new ArraySplice();
	
	  function calcSplices(current, currentStart, currentEnd,
	                       old, oldStart, oldEnd) {
	    return arraySplice.calcSplices(current, currentStart, currentEnd,
	                                   old, oldStart, oldEnd);
	  }
	
	  function intersect(start1, end1, start2, end2) {
	    // Disjoint
	    if (end1 < start2 || end2 < start1)
	      return -1;
	
	    // Adjacent
	    if (end1 == start2 || end2 == start1)
	      return 0;
	
	    // Non-zero intersect, span1 first
	    if (start1 < start2) {
	      if (end1 < end2)
	        return end1 - start2; // Overlap
	      else
	        return end2 - start2; // Contained
	    } else {
	      // Non-zero intersect, span2 first
	      if (end2 < end1)
	        return end2 - start1; // Overlap
	      else
	        return end1 - start1; // Contained
	    }
	  }
	
	  function mergeSplice(splices, index, removed, addedCount) {
	
	    var splice = newSplice(index, removed, addedCount);
	
	    var inserted = false;
	    var insertionOffset = 0;
	
	    for (var i = 0; i < splices.length; i++) {
	      var current = splices[i];
	      current.index += insertionOffset;
	
	      if (inserted)
	        continue;
	
	      var intersectCount = intersect(splice.index,
	                                     splice.index + splice.removed.length,
	                                     current.index,
	                                     current.index + current.addedCount);
	
	      if (intersectCount >= 0) {
	        // Merge the two splices
	
	        splices.splice(i, 1);
	        i--;
	
	        insertionOffset -= current.addedCount - current.removed.length;
	
	        splice.addedCount += current.addedCount - intersectCount;
	        var deleteCount = splice.removed.length +
	                          current.removed.length - intersectCount;
	
	        if (!splice.addedCount && !deleteCount) {
	          // merged splice is a noop. discard.
	          inserted = true;
	        } else {
	          removed = current.removed;
	
	          if (splice.index < current.index) {
	            // some prefix of splice.removed is prepended to current.removed.
	            var prepend = splice.removed.slice(0, current.index - splice.index);
	            Array.prototype.push.apply(prepend, removed);
	            removed = prepend;
	          }
	
	          if (splice.index + splice.removed.length > current.index + current.addedCount) {
	            // some suffix of splice.removed is appended to current.removed.
	            var append = splice.removed.slice(current.index + current.addedCount - splice.index);
	            Array.prototype.push.apply(removed, append);
	          }
	
	          splice.removed = removed;
	          if (current.index < splice.index) {
	            splice.index = current.index;
	          }
	        }
	      } else if (splice.index < current.index) {
	        // Insert splice here.
	
	        inserted = true;
	
	        splices.splice(i, 0, splice);
	        i++;
	
	        var offset = splice.addedCount - splice.removed.length;
	        current.index += offset;
	        insertionOffset += offset;
	      }
	    }
	
	    if (!inserted)
	      splices.push(splice);
	  }
	
	  function createInitialSplices(array, changeRecords) {
	    var splices = [];
	
	    for (var i = 0; i < changeRecords.length; i++) {
	      var record = changeRecords[i];
	      switch(record.type) {
	        case 'splice':
	          mergeSplice(splices, record.index, record.removed.slice(), record.addedCount);
	          break;
	        case 'add':
	        case 'update':
	        case 'delete':
	          if (!isIndex(record.name))
	            continue;
	          var index = toNumber(record.name);
	          if (index < 0)
	            continue;
	          mergeSplice(splices, index, [record.oldValue], 1);
	          break;
	        default:
	          console.error('Unexpected record type: ' + JSON.stringify(record));
	          break;
	      }
	    }
	
	    return splices;
	  }
	
	  function projectArraySplices(array, changeRecords) {
	    var splices = [];
	
	    createInitialSplices(array, changeRecords).forEach(function(splice) {
	      if (splice.addedCount == 1 && splice.removed.length == 1) {
	        if (splice.removed[0] !== array[splice.index])
	          splices.push(splice);
	
	        return;
	      }
	
	      splices = splices.concat(calcSplices(array, splice.index, splice.index + splice.addedCount,
	                                           splice.removed, 0, splice.removed.length));
	    });
	
	    return splices;
	  }
	
	  // Export the observe-js object for **Node.js**, with backwards-compatibility
	  // for the old `require()` API. Also ensure `exports` is not a DOM Element.
	  // If we're in the browser, export as a global object.
	
	  var expose = global;
	
	  if (typeof exports !== 'undefined' && !exports.nodeType) {
	    if (typeof module !== 'undefined' && module.exports) {
	      exports = module.exports;
	    }
	    expose = exports;
	  }
	
	  expose.Observer = Observer;
	  expose.Observer.runEOM_ = runEOM;
	  expose.Observer.observerSentinel_ = observerSentinel; // for testing.
	  expose.Observer.hasObjectObserve = hasObserve;
	  expose.ArrayObserver = ArrayObserver;
	  expose.ArrayObserver.calculateSplices = function(current, previous) {
	    return arraySplice.calculateSplices(current, previous);
	  };
	
	  expose.ArraySplice = ArraySplice;
	  expose.ObjectObserver = ObjectObserver;
	  expose.PathObserver = PathObserver;
	  expose.CompoundObserver = CompoundObserver;
	  expose.Path = Path;
	  expose.ObserverTransform = ObserverTransform;
	
	})(typeof global !== 'undefined' && global && typeof module !== 'undefined' && module ? global : this || window);
	
	/* WEBPACK VAR INJECTION */}.call(exports, (function() { return this; }()), __webpack_require__(114)(module)))

/***/ },
/* 114 */
/***/ function(module, exports) {

	module.exports = function(module) {
		if(!module.webpackPolyfill) {
			module.deprecate = function() {};
			module.paths = [];
			// module.parent = undefined by default
			module.children = [];
			module.webpackPolyfill = 1;
		}
		return module;
	}


/***/ },
/* 115 */
/***/ function(module, exports) {

	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	exports.thunk = thunk;
	exports.partial = partial;
	exports.value = value;
	exports.evaluate = evaluate;
	function thunk(fo) {
	  return { kind: 'unevaled', eval: fo };
	}
	function partial(fo) {
	  return { kind: 'unevaled', eval: fo };
	}
	function value(o) {
	  return { kind: 'evaled', value: o };
	}
	function evaluate(thunk) {
	  if (thunk.kind === 'unevaled') return thunk.eval();else return thunk.value;
	}

/***/ },
/* 116 */
/***/ function(module, exports) {

	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	
	
	////////////////////////////////////////////////////////////
	// Game state types
	
	var CrewEnum = exports.CrewEnum = {
	  ENG: 'eng',
	  // SCI: 'sci',
	  SEC: 'sec'
	};
	
	var RoomEnum = exports.RoomEnum = {
	  BRIDGE: 'bridge',
	  ENGINE: 'engine',
	  STORE: 'store',
	  MEDBAY: 'medbay'
	};
	
	//// Unfortunately, the current version of flow doesn't support disjoint
	//// unions that involve intersections.
	// type _Entity = {
	//   id: string,
	//   x: number,
	//   y: number,
	//   ax: number,
	//   ay: number,
	//   vx: number,
	//   vy: number,
	//   width: number,
	//   height: number,
	//   roomIndex: number
	// }
	
	////////////////////////////////////////////////////////////
	// Character components
	
	var CharacterAnimationEnum = exports.CharacterAnimationEnum = {
	  RUN: 'run',
	  STAND: 'stand',
	  SKID: 'skid',
	  JUMP: 'jump'
	};
	
	var DirectionEnum = exports.DirectionEnum = {
	  LEFT: 'left',
	  RIGHT: 'right'
	};
	
	var SpawnEventEnum = exports.SpawnEventEnum = {
	  SEC_TELEPORT: 'security teleporter',
	  ENG_TELEPORT: 'engineering teleporter'
	};
	
	// is -1 if no interactions
	
	
	////////////////////////////////////////////////////////////
	// Intermediate types
	
	var ActionEnum = exports.ActionEnum = {
	  LEFT: 'left',
	  RIGHT: 'right',
	  SLOW_LEFT: 'slow-left',
	  SLOW_RIGHT: 'slow-right',
	  UP: 'up',
	  JUMP: 'jump',
	  ACT: 'act'
	};
	
	////////////////////////////////////////////////////////////
	// Rendering types

/***/ }
/******/ ]);
//# sourceMappingURL=bundle.js.map