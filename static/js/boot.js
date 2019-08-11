PG = {
    music: null,
    playerInfo: {},
    orientated: false
};

PG.getCookie = function (name) {
    var r = document.cookie.match("\\b" + name + "=([^;]*)\\b");
    return r ? r[1] : undefined;
};

PG.PW = 90;
PG.PH = 120;

GLOBAL_W = 1920;
GLOBAL_H = 1080;

FAPAI_SPEED = 400;
INIT_CARD_SPEED = 500;

var game_bg = 1;
var origin_innerh,origin_innerw;

var card_num_style = {font: "66px Arial", fill: "#ffffff", align: "center"};
var landlord_style = {font: "30px Arial", fill: "#ffffff", align: "center"};
var speak_style = {font: "22px Arial", fill: "#ffffff", align: "center"};
var btn_scale_ratio = 0.8;

var landlord1, landlord2;

// 游戏模式，0代表只允许一名玩家，1代表允许多名玩家
var game_mode = 0;

//是否是手机设备
var is_mobile = false;

var fight_ai_str = "对战两个斗地主AI";
var fight_human_str="优先匹配真人玩家\n在线人数不足时可添加斗地主AI";

let direction = '1'
function getDirection() {
    switch (window.orientation) {
        case 0:
        case 180:
            direction = '1'
            break;
        case -90:
        case 90:
            direction = '一'
            break;
    }
}

PG.Boot = {
    preload: function () {
        this.load.image('preloaderBar', 'static/i/preload.png');
        this.load.image('logo','static/i/logo.png');
    },
    create: function () {
        var device = this.game.device;
        //判断是否是手机并且竖屏
        if (device.android || device.iOS) {
            is_mobile = true;
        } 
        getDirection();
        if(is_mobile && direction == 1){
            alert("请将手机横屏并刷新");
            return;
        }

        this.input.maxPointers = 1;
        this.stage.disableVisibilityChange = true;
        this.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
        this.scale.enterIncorrectOrientation.add(this.enterIncorrectOrientation, this);
        this.scale.leaveIncorrectOrientation.add(this.leaveIncorrectOrientation, this);
        
        // this.game.scale.onSizeChange.add(function(){
        //     var h = window.innerHeight * GLOBAL_W/window.innerWidth;
        //     //if (h > 1000) h = 1000;
        //     this.game.scale.setGameSize(GLOBAL_W,h);
        //     // alert(window.innerHeight);
        //     // alert(window.innerWidth);
        // }, this);
        //this.onSizeChange();
        // this.scale.pageAlignHorizontally = true;
        // this.scale.pageAlignVertically = true;
        // this.scale.forceOrientation(true);
        // this.game.scale.onOrientationChange.add(function() {
        //     if(this.game.scale.isLandscape) {
        //         this.game.scale.setGameSize(GLOBAL_W, GLOBAL_H);
        //     } else {
        //         this.game.scale.setGameSize(GLOBAL_H, GLOBAL_W);
        //     }
        //   }, this)
        this.state.start('Preloader');
    },
    onSizeChange: function () {
        this.scale.minWidth = 480;
        this.scale.minHeight = 270;
        var device = this.game.device;
        if (device.android || device.iOS) {
            this.scale.maxWidth = 1920;
            this.scale.maxHeight = 950;
        } else {
            this.scale.maxWidth = 1920;
            this.scale.maxHeight = 950;
        }
        var h = window.innerHeight * GLOBAL_W/window.innerWidth;
        if (h > 950) h = 950;
        this.game.height = h;
        this.scale.pageAlignHorizontally = true;
        this.scale.pageAlignVertically = true;
        this.scale.forceOrientation(true);
    },
    enterIncorrectOrientation: function () {
        // var device = this.game.device;
        // if (device.android || device.iOS) {
        //     alert('请在横屏状态下打开此页面');
        // }
        PG.orientated = false;
        document.getElementById('orientation').style.display = 'block';
    },
    leaveIncorrectOrientation: function () {
      
        PG.orientated = true;
        document.getElementById('orientation').style.display = 'none';
    }
};

PG.Preloader = {

    preload: function () {
        
        // var logo = this.game.add.sprite(this.game.width/2, this.game.height/3, 'logo');
        // logo.anchor.set(0.5,0.5);
        // logo.scale.set(3,3);
       
        this.preloadBar = this.game.add.sprite(this.game.width/2, this.game.height/2, 'preloaderBar');
        this.preloadBar.x -= this.preloadBar.width / 2;
        this.preloadBar.y -= this.preloadBar.height / 2;
        this.load.setPreloadSprite(this.preloadBar);

        this.load.audio('music_room', 'static/audio/bg_room.mp3');
        this.load.audio('music_game', 'static/audio/bg_game.ogg');
        this.load.audio('music_deal', 'static/audio/deal.mp3');
        this.load.audio('music_win', 'static/audio/end_win.mp3');
        this.load.audio('music_lose', 'static/audio/end_lose.mp3');
        this.load.audio('score_0', 'static/audio/m_score_0.mp3');
        this.load.audio('score_1', 'static/audio/m_score_1.mp3');
        this.load.audio('score_2', 'static/audio/m_score_2.mp3');
        this.load.audio('score_3', 'static/audio/m_score_3.mp3');

        this.load.audio('yaobuqi', 'static/audio/yaobuqi.ogg');
        this.load.audio('dan3', 'static/audio/dan3.ogg');
        this.load.audio('dan4', 'static/audio/dan4.ogg');
        this.load.audio('dan5', 'static/audio/dan5.ogg');
        this.load.audio('dan6', 'static/audio/dan6.ogg');
        this.load.audio('dan7', 'static/audio/dan7.ogg');
        this.load.audio('dan8', 'static/audio/dan8.ogg');
        this.load.audio('dan9', 'static/audio/dan9.ogg');
        this.load.audio('dan0', 'static/audio/dan0.ogg');
        this.load.audio('danJ', 'static/audio/danJ.ogg');
        this.load.audio('danQ', 'static/audio/danQ.ogg');
        this.load.audio('danK', 'static/audio/danK.ogg');
        this.load.audio('danA', 'static/audio/danA.ogg');
        this.load.audio('dan2', 'static/audio/dan2.ogg');
        this.load.audio('danw', 'static/audio/danw.ogg');
        this.load.audio('danww', 'static/audio/danww.ogg');

        this.load.audio('dui3', 'static/audio/dui3.ogg');
        this.load.audio('dui4', 'static/audio/dui4.ogg');
        this.load.audio('dui5', 'static/audio/dui5.ogg');
        this.load.audio('dui6', 'static/audio/dui6.ogg');
        this.load.audio('dui7', 'static/audio/dui7.ogg');
        this.load.audio('dui8', 'static/audio/dui8.ogg');
        this.load.audio('dui9', 'static/audio/dui9.ogg');
        this.load.audio('dui0', 'static/audio/dui0.ogg');
        this.load.audio('duiJ', 'static/audio/duiJ.ogg');
        this.load.audio('duiQ', 'static/audio/duiQ.ogg');
        this.load.audio('duiK', 'static/audio/duiK.ogg');
        this.load.audio('duiA', 'static/audio/duiA.ogg');
        this.load.audio('dui2', 'static/audio/dui2.ogg');

        this.load.audio('san3', 'static/audio/san3.ogg');
        this.load.audio('san4', 'static/audio/san4.ogg');
        this.load.audio('san5', 'static/audio/san5.ogg');
        this.load.audio('san6', 'static/audio/san6.ogg');
        this.load.audio('san7', 'static/audio/san7.ogg');
        this.load.audio('san8', 'static/audio/san8.ogg');
        this.load.audio('san9', 'static/audio/san9.ogg');
        this.load.audio('san0', 'static/audio/san0.ogg');
        this.load.audio('sanJ', 'static/audio/sanJ.ogg');
        this.load.audio('sanQ', 'static/audio/sanQ.ogg');
        this.load.audio('sanK', 'static/audio/sanK.ogg');
        this.load.audio('sanA', 'static/audio/sanA.ogg');
        this.load.audio('san2', 'static/audio/san2.ogg');

        this.load.audio('shunzi', 'static/audio/shunzi.ogg');
        this.load.audio('liandui', 'static/audio/liandui.ogg');
        this.load.audio('feiji', 'static/audio/feiji.ogg');
        this.load.audio('wangzha', 'static/audio/wangzha.ogg');
        this.load.audio('zhadan', 'static/audio/zhadan.ogg');
        this.load.audio('sidaier', 'static/audio/sidaier.ogg');
        this.load.audio('sidaidui', 'static/audio/sidaidui.ogg');
        this.load.audio('fapai', 'static/audio/fapai.mp3');

        this.load.atlas('btn2', 'static/i/btn2.png', 'static/i/btn2.json');
        this.load.image('bg', 'static/i/bg1.png');
        this.load.image('black_bg', 'static/i/black_bg.png');
        this.load.image('bg1_right_top', 'static/i/bg1_right_top.png');
        this.load.image('bg1_left_bottom', 'static/i/bg1_left_bottom.png');
        this.load.image('playing_bg','static/i/bg2.png');
        this.load.image('start','static/i/start.png');
        this.load.image('fight_ai','static/i/fight_ai.png');
        this.load.image('human_play','static/i/human_play.png');
        this.load.spritesheet('poker', 'static/i/pokers.png', 118, 161.5);
        this.load.json('rule', 'static/rule.json');
        this.load.atlas('robot_and_btn', 'static/i/robot_and_btn.png', 'static/i/robot_and_btn.json');
        this.load.atlas('mode_btn', 'static/i/mode_btn.png', 'static/i/mode_btn.json');
    },

    create: function () {
        PG.RuleList = this.cache.getJSON('rule');
        var jsonVal = document.getElementById("user").value;
        console.log(jsonVal)
        if (jsonVal) {
            //alert(jsonVal)
            PG.playerInfo = JSON.parse(jsonVal);
            if (PG.playerInfo['uid']) {
                this.state.start('MainMenu');
            } else {
                this.state.start('Login');
            }
        } else {
            this.state.start('Login');
        }
        PG.music = this.game.add.audio('music_room');
        PG.music.loop = true;
        PG.music.loopFull();
        PG.music.play();

    }
};

PG.MainMenu = {
    create: function () {
        this.stage.backgroundColor = '#ffffff';
        var bg = this.game.add.sprite(this.game.width / 2, 0, 'bg');
        bg.width = GLOBAL_W;
        bg.height = GLOBAL_H;
        bg.anchor.set(0.5, 0);
        var bg1_right_top = this.game.add.sprite(this.game.width-966, 0, 'bg1_right_top');
        var bg1_left_bottom = this.game.add.sprite(0, this.game.height-176, 'bg1_left_bottom');

        // 开始游戏按钮
        this.start_game = this.game.add.button(this.game.world.width / 2.5, this.game.world.height / 5 * 4, 'start', this.showMask, this);
        this.start_game.anchor.set(0.5);
        this.game.world.add(this.start_game);
        
        // var humanRoom = this.game.add.button(this.game.world.width / 2, this.game.world.height / 2, 'human_play', this.gotoRoom, this);
        // humanRoom.anchor.set(0.5);
        // this.game.world.add(humanRoom);

        // var setting = this.game.add.button(this.game.world.width / 2, this.game.world.height * 3 / 4, 'btn', this.gotoSetting, this, 'setting.png', 'setting.png', 'setting.png');
        // setting.anchor.set(0.5);
        // this.game.world.add(setting);

        // var style = {font: "28px Arial", fill: "#fff", align: "right"};
        // var text = this.game.add.text(this.game.world.width - 4, 4, "欢迎回来 " + PG.playerInfo.username, style);
        // text.addColor('#cc00cc', 4);
        // text.anchor.set(1, 0);
    },

    showMask: function(){
        this.start_game.inputEnabled = false;
        
        this.mask = this.game.add.sprite(this.game.width / 2, 0, 'black_bg');
        
        this.mask.width = GLOBAL_W;
        this.mask.height = GLOBAL_H;
        this.mask.anchor.set(0.5, 0);
        this.mask.alpha = 0.99;
        this.choose_mode = this.game.add.text(this.game.width / 2,this.game.height/10,"选择模式",{font:"65px myFont",fill:"#ffffff"});
        this.choose_mode.anchor.set(0.5,0);
        this.fight_ai = this.game.add.sprite(this.game.width / 10 * 3, this.game.height/3, 'mode_btn', "fight_ai1.png");
        this.fight_ai.anchor.set(0.5, 0);
        this.fight_ai.inputEnabled = true;
        this.fight_ai.events.onInputOver.add(function(){
            this.fight_ai.frame = 1;
        }, this);
        this.fight_ai.events.onInputOut.add(function(){
            this.fight_ai.frame = 0;
        }, this);
        this.fight_ai.events.onInputDown.add(function(){
            this.gotoAiRoom();
        }, this);

        this.fight_ai_desc = this.game.add.text(this.game.width / 10 * 3,this.game.height/10*5,fight_ai_str,{font:"35px myFont",fill:"#ffffff"});
        this.fight_ai_desc.anchor.set(0.5,0);

        this.fight_human_desc = this.game.add.text(this.game.width / 10 * 7,this.game.height/10*5,fight_human_str,{font:"35px myFont",fill:"#ffffff",align:"center"});
        this.fight_human_desc.anchor.set(0.5,0);

        this.fight_human = this.game.add.sprite(this.game.width / 10 * 7, this.game.height/3, 'mode_btn', "fight_human1.png");
        this.fight_human.anchor.set(0.5, 0);
        this.fight_human.inputEnabled = true;
        this.fight_human.events.onInputOver.add(function(){
            this.fight_human.frame = 3;
        }, this);
        this.fight_human.events.onInputOut.add(function(){
            this.fight_human.frame = 2;
        }, this);
        this.fight_human.events.onInputDown.add(function(){
            this.find_room_desc = this.game.add.text(this.game.width / 2,this.game.height/2,"",{font:"35px myFont",fill:"#ffffff",align:"center"});
            this.find_room_desc.anchor.set(0.5,0.5);
            this.choose_mode.kill();
            this.fight_ai.kill();
            this.fight_human.kill();
            this.return_homepage.kill();
            this.fight_ai_desc.kill();
            this.fight_human_desc.kill();
            var MAX_LODING_TIME = parseInt(Math.random()*(12-6+1)+6,10);
            for(var i = 0; i < MAX_LODING_TIME; i++){
                console.log(i);
                this.game.time.events.add(200*(i+1), function(i){
                    var str = "寻找房间中";
                    for(var j = 0; j <= i % 5; j++){
                        str += ".";
                    }
                    this.find_room_desc.text = str;
                    if(i == MAX_LODING_TIME-1){
                        this.find_room_desc.text = "正在进入房间！"
                        this.game.time.events.add(500,this.gotoRoom,this);
                    }
                }, this,i);
            };
            
        }, this);

        this.return_homepage = this.game.add.sprite(this.game.width / 2, this.game.height/10*8, 'mode_btn', "return1.png");
        this.return_homepage.anchor.set(0.5,0);
        this.return_homepage.inputEnabled = true;
        this.return_homepage.events.onInputOver.add(function(){
            this.return_homepage.frame = 5;
        }, this);
        this.return_homepage.events.onInputOut.add(function(){
            this.return_homepage.frame = 6;
        }, this);
        this.return_homepage.events.onInputDown.add(function(){
            this.mask.kill();
            this.choose_mode.kill();
            this.fight_ai.kill();
            this.fight_human.kill();
            this.return_homepage.kill();
            this.fight_ai_desc.kill();
            this.fight_human_desc.kill();
            this.start_game.inputEnabled = true;
        }, this);
    },

    gotoAiRoom: function () {
        game_mode = 0;
        // start(key, clearWorld, clearCache, parameter)
        this.state.start('Game', true, false, 1);
        //PG.music.sound = 'music_game'
        PG.music.stop();
        // this.music.stop();
    },

    gotoRoom: function () {
        game_mode = 1;
        this.state.start('Game', true, false, 2);
        PG.music.stop();
    },

    gotoSetting: function () {
        var style = {font: "22px Arial", fill: "#fff", align: "center"};
        var text = this.game.add.text(0, 0, "hei hei hei hei", style);
        var tween = this.game.add.tween(text).to({x: 600, y: 450}, 2000, "Linear", true);
        tween.onComplete.add(Phaser.Text.prototype.destroy, text);
    }
};

PG.Login = {
    create: function () {
        this.stage.backgroundColor = '#ffffff';
        var bg = this.game.add.sprite(this.game.width / 2, 0, 'bg');
        bg.anchor.set(0.5, 0);

        var style = {
            font: '24px Arial', fill: '#000', width: 300, padding: 12,
            borderWidth: 1, borderColor: '#c8c8c8', borderRadius: 2,
            textAlign: 'center', placeHolder: '姓名'
            // type: PhaserInput.InputType.password
        };
        this.game.add.plugin(PhaserInput.Plugin);

        this.username = this.game.add.inputField((this.game.world.width - 300) / 2, this.game.world.centerY - 160, style);

        style.placeHolder = '密码';
        this.password = this.game.add.inputField((this.game.world.width - 300) / 2, this.game.world.centerY - 90, style);

        style.placeHolder = '再次输入密码';
        this.passwordAgain = this.game.add.inputField((this.game.world.width - 300) / 2, this.game.world.centerY - 15, style);

        var style = {font: "22px Arial", fill: "#f00", align: "center"};
        this.errorText = this.game.add.text(this.game.world.centerX, this.game.world.centerY + 45, '', style);
        this.errorText.anchor.set(0.5, 0);

        var login = this.game.add.button(this.game.world.centerX, this.game.world.centerY + 100, 'btn', this.onLogin, this, 'register.png', 'register.png', 'register.png');
        login.anchor.set(0.5);
    },

    onLogin: function () {
        if (!this.username.value) {
            this.username.startFocus();
            this.errorText.text = '请输入用户名';
            return;
        }
        if (!this.password.value) {
            this.password.startFocus();
            this.errorText.text = '请输入密码';
            return;
        }
        if (!this.passwordAgain.value) {
            this.passwordAgain.startFocus();
            this.errorText.text = '请再次输入密码';
            return;
        }
        if (this.password.value != this.passwordAgain.value) {
            this.errorText.text = "两次输入的密码不一致";
            return;
        }

        var that = this;
        var xhr = new XMLHttpRequest();
        xhr.open('POST', '/reg', true);
        xhr.setRequestHeader('Content-type', 'application/json;charset=UTF-8');
        xhr.setRequestHeader('X-Csrftoken', PG.getCookie("_xsrf"));
        xhr.onreadystatechange = function () {
            if (xhr.readyState === XMLHttpRequest.DONE) {
                if (xhr.status === 200) {
                    var response = JSON.parse(xhr.responseText);
                    if (response.errcode == 0) {
                        PG.playerInfo = response.userinfo
                        that.state.start('MainMenu');
                    } else {
                        that.errorText.text = response.errmsg;
                    }
                } else {
                    that.errorText.text = xhr.responseText;
                }
            }
        };
        xhr.send(JSON.stringify({"username": this.username.value, "password": this.password.value}));
    }
};
