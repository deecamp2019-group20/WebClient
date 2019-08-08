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

INIT_CARD_SPEED = 400;

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

// let direction = '1'
// function getDirection() {
//     switch (window.orientation) {
//         case 0:
//         case 180:
//             direction = '1'
//             break;
//         case -90:
//         case 90:
//             direction = '一'
//             break;
//     }
// }
// alert(direction)
PG.Boot = {
    preload: function () {
        this.load.image('preloaderBar', 'static/i/preload.png');
        this.load.image('logo','static/i/logo.png');
    },
    create: function () {
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
        var device = this.game.device;
        if (device.android || device.iOS) {
            alert('请在横屏状态下打开此页面');
        }
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
        this.load.audio('f_score_0', 'static/audio/f_score_0.mp3');
        this.load.audio('f_score_1', 'static/audio/f_score_1.mp3');
        this.load.audio('f_score_2', 'static/audio/f_score_2.mp3');
        this.load.audio('f_score_3', 'static/audio/f_score_3.mp3');
        this.load.atlas('btn2', 'static/i/btn2.png', 'static/i/btn2.json');
        this.load.image('bg', 'static/i/bg1.png');
        this.load.image('bg1_right_top', 'static/i/bg1_right_top.png');
        this.load.image('bg1_left_bottom', 'static/i/bg1_left_bottom.png');
        this.load.image('playing_bg','static/i/bg2.png');
        this.load.image('join_game','static/i/join_game.png');
        this.load.image('fight_ai','static/i/fight_ai.png');
        this.load.image('human_play','static/i/human_play.png');
        this.load.spritesheet('poker', 'static/i/pokers.png', 118, 161.5);
        this.load.json('rule', 'static/rule.json');
        this.load.atlas('robot_and_btn', 'static/i/robot_and_btn.png', 'static/i/robot_and_btn.json');
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
        
        // 首页按钮

        var aiRoom = this.game.add.button(this.game.world.width / 2, this.game.world.height / 4, 'join_game', this.gotoAiRoom, this);
        aiRoom.anchor.set(0.5);
        this.game.world.add(aiRoom);

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
        this.stage.backgroundColor = '#182d3b';
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
