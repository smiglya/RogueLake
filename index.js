var GAME_CONFIG = {
    WIDTH: 40,
    HEIGHT: 24,
    TILE_SIZE: 30,
    ROOMS_COUNT: { min: 5, max: 10 },
    ROOM_SIZE: { min: 3, max: 8 },
    ENEMIES_COUNT: 10,
    SWORDS_COUNT: 2,
    POTIONS_COUNT: 10,
    MIN_DOOR_DISTANCE: 5,
    MIN_ENEMY_DISTANCE: 3,
    ENEMY_VISION_RANGE: 10
};

var TILE_TYPES = {
    WALL: 'W',
    EMPTY: '',
    PLAYER: 'P',
    ENEMY: 'E',
    SWORD: 'SW',
    POTION: 'HP',
    DOOR: 'D',
    LOCKED_DOOR: 'DL',
    KEY: 'K'
};

var Utils = {
    random: function(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; },
    distance: function(pos1, pos2) { return Math.abs(pos1.x - pos2.x) + Math.abs(pos1.y - pos2.y); },
    getNeighbors: function(x, y) {
        return [{ x: x - 1, y: y - 1 }, { x: x, y: y - 1 }, { x: x + 1, y: y - 1 },
            { x: x - 1, y: y }, { x: x + 1, y: y },
            { x: x - 1, y: y + 1 }, { x: x, y: y + 1 }, { x: x + 1, y: y + 1 }
        ];
    },
    isValid: function(x, y) { return x >= 0 && x < GAME_CONFIG.WIDTH && y >= 0 && y < GAME_CONFIG.HEIGHT; }
};

var GameMap = function() {
    this.tiles = [];
    this.rooms = [];
    this.init();
};

GameMap.prototype = {
    init: function() {
        this.generateEmptyMap();
        this.generateRooms();
        this.connectRooms();
        this.generateCorridors();
    },
    generateEmptyMap: function() {
        for (var y = 0; y < GAME_CONFIG.HEIGHT; y++) {
            this.tiles[y] = [];
            for (var x = 0; x < GAME_CONFIG.WIDTH; x++) this.tiles[y][x] = TILE_TYPES.WALL;
        }
    },
    generateRooms: function() {
        this.rooms = [];
        for (var attempts = 0, target = Utils.random(GAME_CONFIG.ROOMS_COUNT.min, GAME_CONFIG.ROOMS_COUNT.max); this.rooms.length < target && attempts < 100; attempts++) {
            var room = {
                x: Utils.random(1, GAME_CONFIG.WIDTH - 10),
                y: Utils.random(1, GAME_CONFIG.HEIGHT - 10),
                width: Utils.random(GAME_CONFIG.ROOM_SIZE.min, GAME_CONFIG.ROOM_SIZE.max),
                height: Utils.random(GAME_CONFIG.ROOM_SIZE.min, GAME_CONFIG.ROOM_SIZE.max)
            };
            if (this.canPlaceRoom(room)) {
                this.placeRoom(room);
                this.rooms.push(room);
            }
        }
    },
    canPlaceRoom: function(room) {
        for (var i = 0; i < this.rooms.length; i++) {
            var r = this.rooms[i];
            if (room.x < r.x + r.width + 1 && room.x + room.width + 1 > r.x &&
                room.y < r.y + r.height + 1 && room.y + room.height + 1 > r.y) return false;
        }
        return true;
    },
    placeRoom: function(room) {
        for (var y = room.y; y < room.y + room.height; y++)
            for (var x = room.x; x < room.x + room.width; x++)
                this.tiles[y][x] = TILE_TYPES.EMPTY;
    },
    connectRooms: function() {
        for (var i = 1; i < this.rooms.length; i++) this.createCorridor(this.rooms[i], this.findNearest(this.rooms[i], i));
    },
    findNearest: function(room, index) {
        var min = Infinity,
            nearest = null,
            center = this.getCenter(room);
        for (var i = 0; i < index; i++) {
            var dist = Utils.distance(center, this.getCenter(this.rooms[i]));
            if (dist < min) {
                min = dist;
                nearest = this.rooms[i];
            }
        }
        return nearest;
    },
    getCenter: function(room) { return { x: Math.floor(room.x + room.width / 2), y: Math.floor(room.y + room.height / 2) }; },
    createCorridor: function(r1, r2) {
        var c1 = this.getCenter(r1),
            c2 = this.getCenter(r2),
            x = c1.x,
            y = c1.y;
        while (x !== c2.x) {
            this.tiles[y][x] = TILE_TYPES.EMPTY;
            x += (c2.x > x) ? 1 : -1;
        }
        while (y !== c2.y) {
            this.tiles[y][x] = TILE_TYPES.EMPTY;
            y += (c2.y > y) ? 1 : -1;
        }
        this.tiles[y][x] = TILE_TYPES.EMPTY;
    },
    generateCorridors: function() {
        for (var i = 0; i < 2; i++) this.makeCorridor(true);
        for (var j = 0; j < 2; j++) this.makeCorridor(false);
    },
    makeCorridor: function(horizontal) {
        if (horizontal) {
            var y = Utils.random(1, GAME_CONFIG.HEIGHT - 2);
            for (var x = Utils.random(1, 15); x <= Utils.random(25, GAME_CONFIG.WIDTH - 2); x++)
                this.tiles[y][x] = TILE_TYPES.EMPTY;
        } else {
            var x = Utils.random(1, GAME_CONFIG.WIDTH - 2);
            for (var y = Utils.random(1, 10); y <= Utils.random(14, GAME_CONFIG.HEIGHT - 2); y++)
                this.tiles[y][x] = TILE_TYPES.EMPTY;
        }
    },
    getTile: function(x, y) { return Utils.isValid(x, y) ? this.tiles[y][x] : TILE_TYPES.WALL; },
    setTile: function(x, y, type) { if (Utils.isValid(x, y)) this.tiles[y][x] = type; },
    findPosition: function(type, validator) {
        var positions = [];
        if (type === 'room' && this.rooms.length > 0) {
            for (var i = 0; i < this.rooms.length; i++) {
                var room = this.rooms[i];
                for (var y = room.y; y < room.y + room.height; y++)
                    for (var x = room.x; x < room.x + room.width; x++)
                        if (this.getTile(x, y) === TILE_TYPES.EMPTY) positions.push({ x: x, y: y });
            }
        } else {
            for (var y = 0; y < GAME_CONFIG.HEIGHT; y++)
                for (var x = 0; x < GAME_CONFIG.WIDTH; x++)
                    if (this.tiles[y][x] === TILE_TYPES.EMPTY) positions.push({ x: x, y: y });
        }
        if (validator) positions = positions.filter(validator);
        return positions.length > 0 ? positions[Utils.random(0, positions.length - 1)] : null;
    }
};

var Entity = function(x, y, type, health) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.maxHealth = health || 100;
    this.health = this.maxHealth;
    this.attack = 10;
    this.alive = true;
};

Entity.prototype = {
    damage: function(amount) {
        this.health = Math.max(0, this.health - amount);
        this.alive = this.health > 0;
    },
    heal: function(amount) { this.health = Math.min(this.health + amount, this.maxHealth); },
    getHealthPercent: function() { return (this.health / this.maxHealth) * 100; },
    canMove: function(x, y, gameMap, entities) {
        return Utils.isValid(x, y) && gameMap.getTile(x, y) !== TILE_TYPES.WALL &&
            !entities.some(function(e) { return e !== this && e.alive && e.x === x && e.y === y; }, this);
    },
    moveTo: function(x, y) {
        this.x = x;
        this.y = y;
    }
};

var Player = function(x, y) {
    Entity.call(this, x, y, TILE_TYPES.PLAYER, 100);
    this.swords = 0;
    this.hasKey = false;
};
Player.prototype = Object.create(Entity.prototype);
Player.prototype.addSword = function() {
    this.swords++;
    this.attack += 15;
};
Player.prototype.getAttack = function() { return this.attack + (this.swords * 15); };

var Enemy = function(x, y) {
    Entity.call(this, x, y, TILE_TYPES.ENEMY, 50);
    this.isChasing = false;
    this.target = null;
};
Enemy.prototype = Object.create(Entity.prototype);
Enemy.prototype.update = function(player, gameMap, entities) {
    if (!this.alive) return;
    var dist = Utils.distance(this, player);
    if (this.hasLineOfSight(player, gameMap) && dist <= GAME_CONFIG.ENEMY_VISION_RANGE) {
        this.isChasing = true;
        this.target = { x: player.x, y: player.y };
    }
    this.isChasing && this.target ? this.moveToTarget(gameMap, entities) : this.randomMove(gameMap, entities);
    if (dist === 1) player.damage(this.attack);
};
Enemy.prototype.hasLineOfSight = function(target, gameMap) {
    var dx = Math.abs(target.x - this.x),
        dy = Math.abs(target.y - this.y);
    var x = this.x,
        y = this.y,
        n = 1 + dx + dy;
    var xi = (target.x > this.x) ? 1 : -1,
        yi = (target.y > this.y) ? 1 : -1;
    var error = dx - dy;
    dx *= 2;
    dy *= 2;
    for (; n > 0; --n) {
        if (gameMap.getTile(x, y) === TILE_TYPES.WALL) return false;
        if (error > 0) {
            x += xi;
            error -= dy;
        } else {
            y += yi;
            error += dx;
        }
    }
    return true;
};
Enemy.prototype.moveToTarget = function(gameMap, entities) {
    if (!this.target) return;
    var dx = this.target.x - this.x,
        dy = this.target.y - this.y;
    var mx = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 1 : -1) : 0;
    var my = mx === 0 && dy !== 0 ? (dy > 0 ? 1 : -1) : 0;
    this.canMove(this.x + mx, this.y + my, gameMap, entities) ?
        this.moveTo(this.x + mx, this.y + my) : this.randomMove(gameMap, entities);
};
Enemy.prototype.randomMove = function(gameMap, entities) {
    var moves = [{ x: 0, y: 1 }, { x: 0, y: -1 }, { x: 1, y: 0 }, { x: -1, y: 0 }]
        .filter(function(m) { return this.canMove(this.x + m.x, this.y + m.y, gameMap, entities); }, this);
    if (moves.length > 0) {
        var move = moves[Utils.random(0, moves.length - 1)];
        this.moveTo(this.x + move.x, this.y + move.y);
    }
};

var Renderer = function($field) { this.$field = $field; };
Renderer.prototype = {
    /* Инициализация рендерера*/
     init: function() { this.$field.css({ width: GAME_CONFIG.WIDTH * GAME_CONFIG.TILE_SIZE, height: GAME_CONFIG.HEIGHT * GAME_CONFIG.TILE_SIZE }); },

    /* Основной метод рендеринга игрового поля*/
    render: function(gameMap, entities, items) {
        this.$field.empty();
        for (var y = 0; y < GAME_CONFIG.HEIGHT; y++)
            for (var x = 0; x < GAME_CONFIG.WIDTH; x++)
                this.createElement(x, y, gameMap.getTile(x, y));
        items.forEach(function(item) { this.createElement(item.x, item.y, item.type); }, this);
        entities.filter(function(e) { return e.alive; }).forEach(function(entity) { this.createEntity(entity); }, this);
    },
    /* Создание DOM-элемента тайла*/
    createElement: function(x, y, type) {
        var tileType = (!type || type === TILE_TYPES.EMPTY) ? '-' : type;
        this.$field.append($('<div>').addClass('tile tile' + tileType).css({
            left: x * GAME_CONFIG.TILE_SIZE,
            top: y * GAME_CONFIG.TILE_SIZE,
            width: GAME_CONFIG.TILE_SIZE,
            height: GAME_CONFIG.TILE_SIZE
        }));
    },
    /* Создание DOM-элемента сущности с индикатором здоровья*/
    createEntity: function(entity) {
        var $tile = $('<div>').addClass('tile tile' + entity.type).css({
            left: entity.x * GAME_CONFIG.TILE_SIZE,
            top: entity.y * GAME_CONFIG.TILE_SIZE,
            width: GAME_CONFIG.TILE_SIZE,
            height: GAME_CONFIG.TILE_SIZE
        });
        if (entity.health < entity.maxHealth) {
            $tile.append($('<div>').addClass('health').css({ width: entity.getHealthPercent() + '%', height: '4px' }));
        }
        this.$field.append($tile);
    }
};

/* Контроллер игровой логики*/
var GameLogic = function() {
    this.gameMap = null;
    this.player = null;
    this.enemies = [];
    this.items = [];
    this.renderer = null;
    this.gameState = 'playing';
    this.level = 1;
    this.keySpawned = false;
    this.baseEnemyHealth = 50; 
    this.baseEnemiesCount = 10; 
};

GameLogic.prototype = {
    /* Инициализация игрового контроллера*/
    init: function(field) {
        this.renderer = new Renderer($(field));
        this.renderer.init();
        this.generateLevel();
        this.setupEvents();
        this.render();
    },

    /* Генерация нового уровня*/
    generateLevel: function() {
        this.gameMap = new GameMap();
        this.enemies = [];
        this.items = [];
        this.keySpawned = false;
        this.placeObjects();
    },

    /* Размещение объектов на карте*/
    placeObjects: function() {
        var self = this;
        var pos = this.gameMap.findPosition('room');
        var oldSwords = this.player ? this.player.swords : 0; // Сохраняем мечи

        if (pos) {
            this.player = new Player(pos.x, pos.y);
            this.player.swords = oldSwords; // Восстанавливаем мечи
            this.player.attack = 10 + (oldSwords * 15); // Восстанавливаем атаку
            var doorPos = this.gameMap.findPosition('empty', function(p) {
                return Math.abs(p.x - pos.x) <= 1 && Math.abs(p.y - pos.y) <= 1;
            });
            if (doorPos) this.gameMap.setTile(doorPos.x, doorPos.y, TILE_TYPES.DOOR);
        }

        // Увеличиваем количество врагов с каждым уровнем
        var currentEnemiesCount = this.baseEnemiesCount + ((this.level - 1) * 2);
        
        this.placeByType(TILE_TYPES.ENEMY, currentEnemiesCount, function(p) {
            return Utils.distance(p, self.player) >= GAME_CONFIG.MIN_ENEMY_DISTANCE &&
                !self.enemies.some(function(e) { return e.x === p.x && e.y === p.y; });
        });

        this.placeByType(TILE_TYPES.SWORD, GAME_CONFIG.SWORDS_COUNT);
        this.placeByType(TILE_TYPES.POTION, GAME_CONFIG.POTIONS_COUNT);

        var exitPos = this.gameMap.findPosition('empty', function(p) {
            return Utils.distance(p, self.player) >= GAME_CONFIG.MIN_DOOR_DISTANCE;
        });
        if (exitPos) this.items.push({ x: exitPos.x, y: exitPos.y, type: TILE_TYPES.LOCKED_DOOR });
    },

    /* Размещение объектов определенного типа*/
    placeByType: function(type, count, validator) {
        for (var i = 0; i < count; i++) {
            var pos = this.gameMap.findPosition('room', validator);
            if (pos) {
                if (type === TILE_TYPES.ENEMY) {
                    // Увеличиваем здоровье врагов с каждым уровнем
                    var enemy = new Enemy(pos.x, pos.y);
                    enemy.maxHealth = Math.floor(this.baseEnemyHealth * (1 + (this.level - 1) * 0.5));
                    enemy.health = enemy.maxHealth;
                    this.enemies.push(enemy);
                } else {
                    this.items.push({ x: pos.x, y: pos.y, type: type });
                }
            }
        }
    },
    setupEvents: function() {
        var self = this;
        var keys = { 87: [0, -1], 83: [0, 1], 65: [-1, 0], 68: [1, 0], w: [0, -1], s: [0, 1], a: [-1, 0], d: [1, 0] };
        $(document).keydown(function(e) {
            if (self.gameState !== 'playing') return;
            var move = keys[e.keyCode] || keys[e.key];
            if (move) {
                self.movePlayer(move[0], move[1]);
                e.preventDefault();
            } else if (e.keyCode === 32 || e.key === ' ') {
                self.attack();
                e.preventDefault();
            }
        });
    },
    movePlayer: function(dx, dy) {
        if (!this.player || !this.player.alive) return;
        var entities = [this.player].concat(this.enemies.filter(function(e) { return e.alive; }));
        if (this.player.canMove(this.player.x + dx, this.player.y + dy, this.gameMap, entities)) {
            this.player.moveTo(this.player.x + dx, this.player.y + dy);
            this.checkPickups();
            this.processTurn();
        }
    },
    checkPickups: function() {
        for (var i = this.items.length - 1; i >= 0; i--) {
            var item = this.items[i];
            if (item.x === this.player.x && item.y === this.player.y) {
                var remove = true;
                if (item.type === TILE_TYPES.SWORD) this.player.addSword();
                else if (item.type === TILE_TYPES.POTION) this.player.heal(30);
                else if (item.type === TILE_TYPES.KEY) this.player.hasKey = true;
                else if (item.type === TILE_TYPES.LOCKED_DOOR) {
                    if (this.player.hasKey) this.completeLevel();
                    else remove = false;
                }
                if (remove) this.items.splice(i, 1);
            }
        }
    },
    attack: function() {
        if (!this.player || !this.player.alive) return;
        var attacked = false;
        Utils.getNeighbors(this.player.x, this.player.y).forEach(function(pos) {
            this.enemies.forEach(function(enemy) {
                if (enemy.alive && enemy.x === pos.x && enemy.y === pos.y) {
                    enemy.damage(this.player.getAttack());
                    attacked = true;
                    if (!enemy.alive) this.onEnemyDeath(enemy);
                }
            }, this);
        }, this);
        if (attacked) this.processTurn();
    },
    onEnemyDeath: function(enemy) {
        if (this.enemies.filter(function(e) { return e.alive; }).length === 0 && !this.keySpawned) {
            this.items.push({ x: enemy.x, y: enemy.y, type: TILE_TYPES.KEY });
            this.keySpawned = true;
        }
    },
    processTurn: function() {
        var entities = [this.player].concat(this.enemies.filter(function(e) { return e.alive; }));
        this.enemies.forEach(function(enemy) { if (enemy.alive) enemy.update(this.player, this.gameMap, entities); }, this);
        if (!this.player.alive) {
            this.gameState = 'gameOver';
            this.showModal('gameOver');
            return;
        }
        this.render();
    },
    completeLevel: function() {
        this.gameState = 'levelComplete';
        this.level++;
        this.showModal('levelComplete');
    },
    showModal: function(type) {
        var stats = '<p>Уровень: ' + (type === 'levelComplete' ? this.level - 1 : this.level) + '</p>' +
            '<p>Здоровье: ' + this.player.health + '/' + this.player.maxHealth + '</p>' +
            '<p>Мечи: ' + this.player.swords + '</p>';
        if (type === 'levelComplete') stats += '<p>Переход на уровень ' + this.level + '</p>';
        $('#' + (type === 'gameOver' ? 'game-over' : 'level-complete') + '-stats').html(stats);
        $('#' + (type === 'gameOver' ? 'game-over' : 'level-complete') + '-modal').show();
    },
    nextLevel: function() {
        $('#level-complete-modal').hide();
        this.generateLevel();
        this.gameState = 'playing';
        this.render();
    },
    restart: function() {
        $('#game-over-modal').hide();
        this.level = 1;
        this.gameState = 'playing';
        this.generateLevel();
        this.render();
    },
    render: function() {
        this.renderer.render(this.gameMap, [this.player].concat(this.enemies), this.items);
        this.updateUI();
    },
    updateUI: function() {
        if (!this.player) return;
        var ui = {
            'current-level': this.level,
            'player-health': 'HP: ' + this.player.health + '/' + this.player.maxHealth,
            'player-attack': 'Атака: ' + this.player.getAttack(),
            'player-swords': 'Мечи: ' + this.player.swords,
            'player-key': 'Ключ: ' + (this.player.hasKey ? 'Есть' : 'Нет')
        };
        Object.keys(ui).forEach(function(id) { $('#' + id).text(ui[id]); });
    }
};

var Game = function() { this.gameLogic = new GameLogic(); };
Game.prototype = {
    init: function() { var $field = $('.field'); if ($field.length) this.gameLogic.init($field[0]); },
    nextLevel: function() { this.gameLogic.nextLevel(); },
    restart: function() { this.gameLogic.restart(); }
};
