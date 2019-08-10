
PG.Game = function(game) {

    this.roomId = 1;
    this.players = [];

    this.titleBar = null;
    this.tableId = 0;
    this.shotLayer = null;
    
    this.tablePoker = [];
    this.tablePokerPic = {};
    
    this.lastShotPlayer = null;

    this.whoseTurn = 0;

    this.saying = false;
    // 地主牌
    this.landlordCards = null;

    // 玩家的UID
    this.uids = [-1,-1,-1]
};

PG.Game.prototype = {

    init: function(roomId) {
        this.roomId = roomId;
    },

    debug_log: function(obj) {
        console.log('*******');
        console.log(obj);
        console.log('********');
    },

	create: function () {
        //this.stage.backgroundColor = '#182d3b';
        game_bg = this.game.add.sprite(this.game.width / 2, 0, 'playing_bg');
        game_bg.height = GLOBAL_H;
        game_bg.width = GLOBAL_W;
        game_bg.anchor.set(0.5, 0);

        game_music = this.add.audio('music_game');
        game_music.loop = true;
        game_music.loopFull();
        game_music.play();

        this.players.push(PG.createPlay(0, this));
        this.players.push(PG.createPlay(1, this));
        this.players.push(PG.createPlay(2, this));
        this.uids[0] = PG.playerInfo.uid;
        this.players[0].updateInfo(PG.playerInfo.uid, PG.playerInfo.username);
        PG.Socket.connect(this.onopen.bind(this), this.onmessage.bind(this), this.onerror.bind(this));

        //this.createTitleBar();
	},
	
	onopen: function() {
	    console.log('socket onopen');
        PG.Socket.send([PG.Protocol.REQ_JOIN_ROOM, this.roomId]);
	},

    onerror: function() {
        console.log('socket connect onerror');
    },

	send_message: function(request) {
        PG.Socket.send(request);
	},
	
	onmessage:async function(packet) {
	    var opcode = packet[0];
	    switch(opcode) {
            case PG.Protocol.RSP_JOIN_ROOM:
                if (this.roomId == 1) {
                    PG.Socket.send([PG.Protocol.REQ_JOIN_TABLE, -1]);
                } else {
                    PG.Socket.send([PG.Protocol.REQ_JOIN_TABLE, -1]);
                    //this.createTableLayer(packet[1]);
                }
                break;
            case PG.Protocol.RSP_TABLE_LIST:
                this.createTableLayer(packet[1]);
                break;
            case PG.Protocol.RSP_NEW_TABLE:
                //this.tableId = packet[1];
                //this.titleBar.text = '房间:' + this.tableId;
                break;
	        case PG.Protocol.RSP_JOIN_TABLE:
                // this.tableId = packet[1];
                // this.titleBar.text = '房间:' + this.tableId;
                var playerIds = packet[2];
                for (var i = 0; i < playerIds.length; i++) {
                    if (playerIds[i][0] == this.players[0].uid) {
                        var info_1 = playerIds[(i+1)%3];
                        var info_2 = playerIds[(i+2)%3];
                        this.uids[1] = info_1[0];
                        this.uids[2] = info_2[0];
                        this.players[1].updateInfo(info_1[0], info_1[1]);
                        this.players[2].updateInfo(info_2[0], info_2[1]);
                        break;
                    }
                }
                break;
            case PG.Protocol.RSP_DEAL_POKER:
                var playerId = packet[1];
                var pokers = packet[2];
                
                //发牌音乐
                var audio = this.game.add.audio('fapai');
                audio.play();

                this.dealPoker(pokers);
                this.whoseTurn = this.uidToSeat(playerId);
                if(this.whoseTurn == 0){
                    this.startCallScore(1);
                }
                
                break;
            case PG.Protocol.RSP_CALL_SCORE:
                var playerId = packet[1];
                var score = packet[2];
                var callend = packet[3];
                this.debug_log(callend);
                this.whoseTurn = this.uidToSeat(playerId);
                
                //this.debug_log(playerId);
                //检查上家是否完成叫分的所有渲染
                // console.log(this.saying)
                // if(this.saying){
                //     this.sleep(500); 
                // }

                var hanzi = ['不叫', "一分", "两分", "三分"];
                this.players[this.whoseTurn].say(hanzi[score]);
                var audio = this.game.add.audio('score_' + score);
                audio.play();
                this.saying = true;
                audio.onStop.add(function(){
                    this.saying = false;
                });
                if (!callend) {
                    this.whoseTurn = (this.whoseTurn + 1) % 3;
                    this.startCallScore(score+1);
                }
                break;
            case PG.Protocol.RSP_SHOW_POKER:
                this.whoseTurn = this.uidToSeat(packet[1]);
                this.tablePoker[0] = packet[2][0];
                this.tablePoker[1] = packet[2][1];
                this.tablePoker[2] = packet[2][2];
                this.players[this.whoseTurn].setLandlord();
                this.showLastThreePoker();
                break;
            case PG.Protocol.RSP_SHOT_POKER:
                this.handleShotPoker(packet);
                break;
            case PG.Protocol.RSP_GAME_OVER:
                var winner = packet[1];
                var coin = packet[2];

                var loserASeat = this.uidToSeat(packet[3][0]);
                this.players[loserASeat].replacePoker(packet[3], 1);
                this.players[loserASeat].reDealPoker();

                var loserBSeat = this.uidToSeat(packet[4][0]);
                this.players[loserBSeat].replacePoker(packet[4], 1);
                this.players[loserBSeat].reDealPoker();
//                 this.players[loserBSeat].removeAllPoker();
//               this.players[loserASeat].pokerInHand = [];

                this.whoseTurn = this.uidToSeat(winner);

                function gameOver() {
                    // if(this.whoseTurn == 0){
                    //     var audio = this.game.add.audio('music_win');
                    // }else{
                    //     var audio = this.game.add.audio('music_lose');
                    // }
                    // audio.play();


                    if(this.whoseTurn == 0){
                        alert('你赢了！');
                        
                    }else{
                        alert('你输了！');
                    }
                    this.cleanWorld();
                    PG.Socket.send([PG.Protocol.REQ_RESTART]);
                }
                this.game.time.events.add(3000, gameOver, this);
                break;
            case PG.Protocol.RSP_CHEAT:
                var seat = this.uidToSeat(packet[1]);
                this.players[seat].replacePoker(packet[2], 0);
                this.players[seat].reDealPoker();
                break;
            case PG.Protocol.RSP_RESTART:
                this.restart();
            default:
                console.log("UNKNOWN PACKET:", packet)
	    }
	},

    cleanWorld: function () {
        for (i =0; i < 3; i ++) {
            this.players[i].cleanPokers();
            this.landlordCards.getAt(i).kill();
            try {
                if(i!=0){
                    this.players[i].uiLeftPoker.revive();
                    this.players[i].uiLeftPoker.destroy();
                }
                
            }
            catch (err) {
            }
            if(i == 0){
                this.players[i].uiHead.text = "";
            }else{
                if(this.players[i].isLandlord){
                    if(i == 1){
                        landlord1.destroy();
                    }else{
                        landlord2.destroy();
                    }
                    this.players[i].isLandlord = false;
                }
            }
        }

        for (var i = 0; i < this.tablePoker.length; i++) {
                var p = this.tablePokerPic[this.tablePoker[i]];
                if(p != undefined){
                    p.destroy();
                }
                // p.destroy();
            }
    },

	restart: function () {
        this.players = [];
        this.shotLayer = null;

        this.tablePoker = [];
        this.tablePokerPic = {};

        this.lastShotPlayer = null;

        this.whoseTurn = 0;

        this.players.push(PG.createPlay(0, this));
        this.players.push(PG.createPlay(1, this));
        this.players.push(PG.createPlay(2, this));
        for (var i = 0; i < 3; i++) {
            this.players[i].updateInfo(this.uids[i], ' ');
        }
	},

	update: function () {
	},

	uidToSeat: function (uid) {
	    for (var i = 0; i < 3; i++) {
//	        this.debug_log(this.players[i].uid);
	        if (uid == this.players[i].uid)
	            return i;
	    }
	    console.log('ERROR uidToSeat:' + uid);
	    return -1;
	},
    
    dealPoker: function(pokers) {

        for (var i = 0; i < 3; i++) {
            var p = new PG.Poker(this, 54, 54);
            this.game.world.add(p);
            this.tablePoker[i] = p.id;
            this.tablePoker[i + 3] = p;
        }

        for (var i = 0; i < 17; i++) {
            this.players[2].pokerInHand.push(54);
            this.players[1].pokerInHand.push(54);
            this.players[0].pokerInHand.push(pokers.pop());
        }

        this.players[0].dealPoker();
        this.players[1].dealPoker();
        this.players[2].dealPoker();
        
        
        

        //this.game.time.events.add(1000, function() {
        //    this.send_message([PG.Protocol.REQ_CHEAT, this.players[1].uid]);
        //    this.send_message([PG.Protocol.REQ_CHEAT, this.players[2].uid]);
        //}, this);
    },
     
    showLastThreePoker: function() {
        var pokerIds = [0,0,0];
        for (var i = 0; i < 3; i++) {
            var pokerId = this.tablePoker[i];
            pokerIds[i] = pokerId;
            var p = this.tablePoker[i + 3];
            p.id = pokerId;
            p.frame = pokerId;
            //var p2 = this.game.add.sprite
            this.game.add.tween(p).to({ x: this.game.world.width/2 + (i - 1) * 60}, 600, Phaser.Easing.Default, true);
        }
        this.game.time.events.add(1500+INIT_CARD_SPEED, this.showLastThreePokerOnTop, this, pokerIds);
        this.game.time.events.add(1500, this.dealLastThreePoker, this);
    },

    showLastThreePokerOnTop: function(pokerIds){
        this.landlordCards = this.game.add.group();
        var worldWidth = this.game.world.width;
        var step = worldWidth / 40;
        var ratio = 0.7;
        var xs = [worldWidth/2-118*ratio*1.5-step,worldWidth/2-118*ratio*0.5,worldWidth/2+step+118*ratio*0.5]
        for(var i = 0; i < 3; i++){
            var pokerId = pokerIds[i];
            var card = this.game.add.sprite(xs[i], 30, 'poker', pokerId);
            card.scale.set(ratio,ratio);
            this.landlordCards.add(card);
        }
        
    },

    // 处理地主牌
    dealLastThreePoker: function() {
	    var turnPlayer = this.players[this.whoseTurn];

        for (var i = 0; i < 3; i++) {
            var pid = this.tablePoker[i];
            var poker = this.tablePoker[i + 3];
            turnPlayer.pokerInHand.push(pid);
            turnPlayer.pushAPoker(poker);
        }
        turnPlayer.sortPoker();
        if (this.whoseTurn == 0) {
            turnPlayer.arrangePoker();
            for (var i = 0; i < 3; i++) {
                var p = this.tablePoker[i + 3];
                var tween = this.game.add.tween(p).to({y: this.game.world.height - 140 }, INIT_CARD_SPEED, Phaser.Easing.Default, true);
                function adjust(p) {
                    this.game.add.tween(p).to({y: this.game.world.height - 140}, INIT_CARD_SPEED, Phaser.Easing.Default, true, INIT_CARD_SPEED);
                };
                tween.onComplete.add(adjust, this, p);
            }
        } else {
            var first = turnPlayer.findAPoker(54);
            for (var i = 0; i < 3; i++) {
                var p = this.tablePoker[i + 3];
                p.frame = 54;
                p.frame = 54;
                this.game.add.tween(p).to({ x: first.x, y: first.y}, INIT_CARD_SPEED, Phaser.Easing.Default, true);
            }
        }

        this.tablePoker = [];
        this.lastShotPlayer = turnPlayer;
        if (this.whoseTurn == 0) {
            this.startPlay();
        }
    },

    handleShotPoker: function(packet) {
        this.whoseTurn = this.uidToSeat(packet[1]);
        var turnPlayer = this.players[this.whoseTurn];
        var pokers = packet[2];
        var ended = packet[3];
        if (pokers.length == 0) {
            this.players[this.whoseTurn].say("不出");
            var audio = this.game.add.audio('yaobuqi');
            audio.play();
        } else {
            var audio = this.getAudio(pokers);
            audio.play();

            var pokersPic = {};
            pokers.sort(PG.Poker.comparePoker);
            var count= pokers.length;
            var gap = Math.min((this.game.world.width - PG.PW * 2) / count, PG.PW * 0.36);
            for (var i = 0; i < count; i++) {
                var p = turnPlayer.findAPoker(pokers[i]);
                p.id = pokers[i];
                p.frame = pokers[i];
                p.bringToTop();
                this.game.add.tween(p).to({ x: this.game.world.width/2 + (i - count/2) * gap, y: this.game.world.height * 0.4}, 500, Phaser.Easing.Default, true);

                turnPlayer.removeAPoker(pokers[i]);
                pokersPic[p.id] = p;
            }
        
            for (var i = 0; i < this.tablePoker.length; i++) {
                var p = this.tablePokerPic[this.tablePoker[i]];
                if(p != undefined){
                    p.destroy();
                }
                // p.kill();
            }
            this.tablePoker = pokers;
            this.tablePokerPic = pokersPic;
            this.lastShotPlayer = turnPlayer;
            turnPlayer.arrangePoker();
        }
        if (turnPlayer.pokerInHand.length > 0) {
            this.whoseTurn = (this.whoseTurn + 1) % 3;
            if (this.whoseTurn == 0 && !ended) {
                this.game.time.events.add(1000, this.startPlay, this);
            }
        }
    },

    startCallScore: function(minscore) {
        function btnTouch(btn) {
            this.send_message([PG.Protocol.REQ_CALL_SCORE, btn.score]);
            btn.parent.destroy();
            // var audio = this.game.add.audio('f_score_' + btn.score);
            // audio.play();
        };

        if (this.whoseTurn == 0) {
            var step = this.game.world.width/8;
            var ss = [1.5, 1, 0.5, 0];
            
            var sx = this.game.world.width/2 - step * ss[minscore] - 140;
            var sy = this.game.world.height * 0.6;
            var group = this.game.add.group();
            var pass = this.game.make.button(sx, sy, "btn2", btnTouch, this, 'score_0.png', 'score_0.png', 'score_0.png');
            pass.scale.set(btn_scale_ratio,btn_scale_ratio);
            pass.anchor.set(0.5, 0);
            pass.score = 0;
            group.add(pass);
            sx += step;

            for (var i = minscore; i <= 3; i++) {
                var tn = 'score_' + i + '.png';
                var call = this.game.make.button(sx, sy, "btn2", btnTouch, this, tn, tn, tn);
                call.scale.set(btn_scale_ratio,btn_scale_ratio);
                call.anchor.set(0.5, 0);
                call.score = i;
                group.add(call);
                sx += step;
            }
        } else {
            // TODO show clock on player
        
            
        }
        
    },

    startPlay: function() {
        if (this.isLastShotPlayer()) {
            this.players[0].playPoker([]);
        } else {
            this.players[0].playPoker(this.tablePoker);
        }
    },

    finishPlay: function(pokers) {
        this.send_message([PG.Protocol.REQ_SHOT_POKER, pokers]);
    },

    isLastShotPlayer: function() {
        return this.players[this.whoseTurn] == this.lastShotPlayer;
    },

    createTableLayer: function (tables) {
        tables.push([-1, 0]);

        var group = this.game.add.group();
        this.game.world.bringToTop(group);
        var gc = this.game.make.graphics(0, 0);
        gc.beginFill(0x00000080);
        gc.endFill();
        group.add(gc);
        var style = {font: "22px Arial", fill: "#fff", align: "center"};

        for (var i = 0; i < tables.length; i++) {
            var sx = this.game.world.width * (i%6 + 1)/(6 + 1);
            var sy = this.game.world.height * (Math.floor(i/6) + 1)/(4 + 1);

            var table = this.game.make.button(sx, sy, 'btn', this.onJoin, this, 'table.png', 'table.png', 'table.png');
            table.anchor.set(0.5, 1);
            table.tableId = tables[i][0];
            group.add(table);

            var text = this.game.make.text(sx, sy, '房间:' + tables[i][0] + '人数:' + tables[i][1], style);
            text.anchor.set(0.5, 0);
            group.add(text);

            if (i == tables.length - 1) {
                text.text = '新建房间';
            }
        }
    },

    quitGame: function () {
        this.state.start('MainMenu');
    },

    createTitleBar: function() {
        var style = {font: "22px Arial", fill: "#fff", align: "center"};
        this.titleBar = this.game.add.text(this.game.world.centerX, 0, '房间:', style);
    },

    onJoin: function (btn) {
        if (btn.tableId == -1) {
            this.send_message([PG.Protocol.REQ_NEW_TABLE]);
        } else {
            this.send_message([PG.Protocol.REQ_JOIN_TABLE, btn.tableId]);
        }
        btn.parent.destroy();
    },

    //添加一个AI
    addAi: function(seat){
        this.send_message([PG.Protocol.REQ_ADD_AI,seat]);
    },

    //根据出牌获取音效
    getAudio: function(pokers){
        var cards = PG.Poker.toCards(pokers);
        var value = PG.Rule.cardsValue(cards);
        if(value[0] == 'single'){
            if(cards == 'W'){
                cards = 'ww';
            }
            var audio = this.game.add.audio('dan'+cards);
        }else if(value[0] == 'pair'){
            cards = cards[0];
            var audio = this.game.add.audio('dui'+cards);
        }else if(value[0].indexOf('trio') == 0){
            cards = this.mainChar(cards);
            var audio = this.game.add.audio('san'+cards);
        }else if(value[0].indexOf('seq_single') == 0){
            var audio = this.game.add.audio('shunzi');
        }else if(value[0].indexOf('seq_pair') == 0){
            var audio = this.game.add.audio('liandui');
        }else if(value[0].indexOf('seq_trio') == 0){
            var audio = this.game.add.audio('feiji');
        }else if(value[0] == 'rocket'){
            var audio = this.game.add.audio('wangzha');
        }else if(value[0] == 'bomb'){
            var audio = this.game.add.audio('zhadan');
        }else if(value[0] == 'bomb_single'){
            var audio = this.game.add.audio('sidaier');
        }else{
            var audio = this.game.add.audio('sidaidui');
        }
        return audio;
    },

    //寻找一个字符串中出现次数最多的字符
    mainChar: function (str) {
       var obj={};
        for(var i=0;i<str.length;i++){
            var key=str[i];//key中存储的是每一个字符串
            if(obj[key]){//判断这个键值对中有没有这个键
                obj[key]++;
            }else{
                obj[key]=1;//obj[w]=1
            }
        }
        
        var maxCount=0;//假设是出现次数最多的次数
        var maxString="";//假设这个字符串是次数出现最多的字符串
        for(var key in obj){
            if(maxCount<obj[key]){
                maxCount=obj[key];//保存最大的次数
                maxString=key;
            }
        }
        return maxString;
    }
};






