PG.createPlay = function (seat, game) {
    var player = seat == 0 ? new PG.Player(seat, game) : new PG.NetPlayer(seat, game);
    var xy = [
        400, game.world.height - 60,
        game.world.width-175, 320,
        180, 320
    ];
    player.initUI(xy[seat * 2], xy[seat * 2 + 1]);
    if (seat == 0) {
        player.initShotLayer();
    } 
    if(seat == 1 && game_mode == 0){
        player.uiHead.scale.set(-1, 1);
    }
    return player;
};

PG.Player = function (seat, game) {
    this.uid = -1;
    this.seat = seat;
    this.game = game;

    this.pokerInHand = [];
    this._pokerPic = {};
    this.isLandlord = false;

    this.hintPoker = [];
    this.isDraging = false;
};

PG.Player.prototype.initUI = function (sx, sy) {
    if(this.seat != 0){
        
        if(game_mode == 0){
            this.uiHead = this.game.add.sprite(sx, sy, 'robot_and_btn', "robot.png");
        }else{
            this.uiHead = this.game.add.sprite(sx, sy, 'robot_and_btn', "add_ai.png");
        }
        
    }else{
        this.uiHead = this.game.add.text(sx, sy, '', landlord_style);
    }

    //点击添加按钮添加AI玩家
    if(game_mode == 1 && this.seat != 0){
        this.uiHead.inputEnabled = true;
        this.uiHead.events.onInputDown.add(addAnAI, this);
    }

    this.uiHead.anchor.set(0.5, 1);

    this.sx = sx;
    this.sy = sy;
};

addAnAI = function(){
    if(this.uid != -1){
        return;
    }
    this.game.addAi(this.seat);
};

PG.Player.prototype.updateInfo = function (uid, name) {
    if(uid != -1){
        this.uid = uid;
        if (this.seat != 0) {
            this.uiHead.frame = 1;
            if (this.seat == 1) {
                this.uiHead.scale.set(-1, 1);
            }
        }
        // if(this.seat != 0){
        //     this.uiHead.destroy();
        //     this.uiHead = this.game.add.sprite(this.sx, this.sy, 'add_ai');
        //     this.uiHead.anchor.set(0.5, 1);
        // }
    }
};

PG.Player.prototype.cleanPokers = function () {

    var length = this.pokerInHand.length;
    for (var i = 0; i < length; i++) {
        var pid = this.pokerInHand[i];
        var p = this.findAPoker(pid);
        p.kill();
        }
    this.pokerInHand = [];
}

PG.Player.prototype.initShotLayer = function () {
    this.shotLayer = this.game.add.group();
    var group = this.shotLayer;

    var sy = this.game.world.height * 0.6;
    var pass = this.game.make.button(0, sy, "btn2", this.onPass, this, 'pass.png', 'pass.png', 'pass.png');
    pass.anchor.set(0.5, 0);
    pass.scale.set(btn_scale_ratio,btn_scale_ratio);
    group.add(pass);
    var hint = this.game.make.button(0, sy, "btn2", this.onHint, this, 'hint.png', 'hint.png', 'hint.png');
    hint.anchor.set(0.5, 0);
    hint.scale.set(btn_scale_ratio,btn_scale_ratio);
    group.add(hint);
    var shot = this.game.make.button(0, sy, "btn2", this.onShot, this, 'shot.png', 'shot.png', 'shot.png');
    shot.anchor.set(0.5, 0);
    shot.scale.set(btn_scale_ratio,btn_scale_ratio);
    group.add(shot);

    group.forEach(function (child) {
        child.kill();
    });
};

PG.Player.prototype.setLandlord = function () {
    this.isLandlord = true;
    if(this.seat == 0){
        this.uiHead.text = "地主";
    }else if(this.seat == 1){
        landlord1 = this.game.add.text(this.uiHead.x - 250,this.uiHead.y-20,"地主",landlord_style);
    }else{
        landlord2 = this.game.add.text(this.uiHead.x + 210, this.uiHead.y-20,"地主",landlord_style);
    }
};

PG.Player.prototype.say = function (str) {
    if(this.seat == 0){
        var sx = this.uiHead.x + this.uiHead.width / 2 + 30;
        var sy = this.uiHead.y - 150;
    }else{
        var sx = this.uiHead.x + this.uiHead.width / 2 - 20;
        var sy = this.uiHead.y  + 40;
    }
    var text = this.game.add.text(sx, sy, str, speak_style);
    if (this.uiHead.scale.x == -1) {
        text.x = text.x - 10;
    }
    this.game.time.events.add(2000, text.destroy, text);
};

PG.Player.prototype.onInputDown = function (poker, pointer) {
    this.isDraging = true;
    this.onSelectPoker(poker, pointer);
};

PG.Player.prototype.onInputUp = function (poker, pointer) {
    this.isDraging = false;
    //this.onSelectPoker(poker, pointer);
};

PG.Player.prototype.onInputOver = function (poker, pointer) {
    if (this.isDraging) {
        this.onSelectPoker(poker, pointer);
    }
};

PG.Player.prototype.onSelectPoker = function (poker, pointer) {
    if(this.game.whoseTurn != this.seat){
        return;
    }
    var index = this.hintPoker.indexOf(poker.id);
    if (index == -1) {
        poker.y = this.game.world.height - 170;
        this.hintPoker.push(poker.id);
    } else {
        poker.y = this.game.world.height - 140;
        this.hintPoker.splice(index, 1);
    }
};

PG.Player.prototype.onPass = function (btn) {
    this.game.finishPlay([]);
    this.pokerUnSelected(this.hintPoker);
    this.hintPoker = [];
    btn.parent.forEach(function (child) {
        child.kill();
    });
};

PG.Player.prototype.onHint = function (btn) {

    // bug here 
    // if (this.hintPoker.length == 0) {
    //     this.hintPoker = this.lastTurnPoker;
    // } else {
    //     this.pokerUnSelected(this.hintPoker);
    //     if (this.lastTurnPoker.length > 0 && !PG.Poker.canCompare(this.hintPoker, this.lastTurnPoker)) {
    //         this.hintPoker = [];
    //     }
    // }

    if(this.hintPoker.length > 0){
        this.pokerUnSelected(this.hintPoker);
        this.hintPoker = [];
    }

    var bigger = this.hint(this.lastTurnPoker);
    if (bigger.length == 0) {

        // bug here
        //this.say("没有能大过上家的牌");
        // if (this.hintPoker == this.lastTurnPoker) {
        //     this.say("没有能大过的牌");
        // } else {
        //     this.pokerUnSelected(this.hintPoker);
        // }
    } else {
        this.pokerSelected(bigger);
    }
    this.hintPoker = bigger;
};

PG.Player.prototype.onShot = function (btn) {
    if (this.hintPoker.length == 0) {
        return;
    }
    var code = this.canPlay(this.game.isLastShotPlayer() ? [] : this.game.tablePoker, this.hintPoker);
    if (code) {
        this.say(code);
        return;
    }
    this.game.finishPlay(this.hintPoker);
    this.hintPoker = [];
    btn.parent.forEach(function (child) {
        child.kill();
    });
};


PG.Player.prototype.hint = function (lastTurnPoker) {
    var cards;
    
    var handCards = PG.Poker.toCards(this.pokerInHand);

    console.log(handCards);

    if (lastTurnPoker.length === 0) {
        cards = PG.Rule.bestShot(handCards);
    } else {
        cards = PG.Rule.cardsAbove(handCards, PG.Poker.toCards(lastTurnPoker));
    }

    return PG.Poker.toPokers(this.pokerInHand, cards);
};

PG.Player.prototype.canPlay = function (lastTurnPoker, shotPoker) {
    var cardsA = PG.Poker.toCards(shotPoker);
    var valueA = PG.Rule.cardsValue(cardsA);
    if (!valueA[0]){
        return '出牌不合法';
    }
    var cardsB = PG.Poker.toCards(lastTurnPoker);
    if (cardsB.length == 0) {
        return '';
    }
    var valueB = PG.Rule.cardsValue(cardsB);
    if (valueA[0] != valueB[0] && valueA[1] < 1000) {
        return '出牌类型跟上家不一致';
    }

    if (valueA[1] > valueB[1]) {
        return '';
    }
    return '出牌需要大于上家';
};

PG.Player.prototype.playPoker = function (lastTurnPoker) {
    this.lastTurnPoker = lastTurnPoker;

    var group = this.shotLayer;
    var step = this.game.world.width / 8;
    var sx = this.game.world.width / 2 - 0.5 * step;
    if (!this.game.isLastShotPlayer()) {
        sx -= 0.5 * step;
        var pass = group.getAt(0);
        pass.centerX = sx;
        sx += step;
        pass.revive();
    }
    var hint = group.getAt(1);
    hint.centerX = sx;
    hint.revive();
    var shot = group.getAt(2);
    shot.centerX = sx + step;
    shot.revive();

    this.enableInput();
};

PG.Player.prototype.sortPoker = function () {
    this.pokerInHand.sort(PG.Poker.comparePoker);
};

PG.Player.prototype.dealPoker = function () {
    this.sortPoker();
    var length = this.pokerInHand.length;
    for (var i = 0; i < length; i++) {
        var pid = this.pokerInHand[i];
        var p = new PG.Poker(this.game, pid, pid);
        this.game.world.add(p);
        this.pushAPoker(p,false);
        this.dealPokerAnim(p, i);
    }
    // 显示电脑玩家牌的数量
    this.iniCardNum();
};

PG.Player.prototype.dealPokerAnim = function (p, i) {
    console.log(i);
    //to(properties, duration, ease, autoStart, delay, repeat, yoyo)
    this.game.add.tween(p).to({
        x: this.game.world.width / 2 + PG.PW * 0.5 * (i - 8.5),
        y: this.game.world.height - 140
    }, FAPAI_SPEED, Phaser.Easing.Default, true, 50 * i);
};

PG.Player.prototype.arrangePoker = function () {
    var count = this.pokerInHand.length;
    var gap = Math.min(this.game.world.width / count, PG.PW * 0.44);
    for (var i = 0; i < count; i++) {
        var pid = this.pokerInHand[i];
        var p = this.findAPoker(pid);
        p.bringToTop();
        this.game.add.tween(p).to({x: this.game.world.width / 2 + (i - count / 2) * gap}, 600, Phaser.Easing.Default, true);
    }
};

PG.Player.prototype.pushAPoker = function (poker) {
    this._pokerPic[poker.id] = poker;

    poker.events.onInputDown.add(this.onInputDown, this);
    poker.events.onInputUp.add(this.onInputUp, this);
    poker.events.onInputOver.add(this.onInputOver, this);
};

PG.Player.prototype.removeAPoker = function (pid) {
    var length = this.pokerInHand.length;
    for (var i = 0; i < length; i++) {
        if (this.pokerInHand[i] === pid) {
            this.pokerInHand.splice(i, 1);
            delete this._pokerPic[pid];
            return;
        }
    }
    console.log('Error: REMOVE POKER ', pid);
};

PG.Player.prototype.removeAllPoker = function () {
    var length = this.pokerInHand.length;
    for (var i = 0; i < length; i++) {
            this.pokerInHand.splice(i, 1);
            delete this._pokerPic[pid];
        }
    console.log('Error: REMOVE POKER ', pid);
};


PG.Player.prototype.findAPoker = function (pid) {
    var poker = this._pokerPic[pid];
    if (poker === undefined) {
        console.log('Error: FIND POKER ', pid);
    }
    return poker;
};

PG.Player.prototype.enableInput = function () {
    var length = this.pokerInHand.length;
    for (var i = 0; i < length; i++) {
        var p = this.findAPoker(this.pokerInHand[i]);
        p.inputEnabled = true;
    }
};

PG.Player.prototype.pokerSelected = function (pokers) {
    for (var i = 0; i < pokers.length; i++) {
        var p = this.findAPoker(pokers[i]);
        p.y = this.game.world.height - 170;
    }
};

PG.Player.prototype.pokerUnSelected = function (pokers) {
    for (var i = 0; i < pokers.length; i++) {
        var p = this.findAPoker(pokers[i]);
        p.y = this.game.world.height - 140;
    }
};

PG.Player.prototype.iniCardNum = function(){
    if(this.seat != 0){
    
        if(this.seat == 1){
            this.uiLeftPoker = this.game.add.text(this.sx-180, this.sy-50, '17', card_num_style);
        }else{
            this.uiLeftPoker = this.game.add.text(this.sx+120, this.sy-50, '17', card_num_style);
        }
        this.uiLeftPoker.revive();
        
    }
}