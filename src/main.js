var Vue = require('vue');
var milkcocoa = new MilkCocoa("https://io-qi68yo3tp.mlkcca.com:443");
var ds = milkcocoa.dataStore('chat');
var messageDs = ds.child('messages');


new Vue({
    el: "#main",
    data: {
        messages:[],
        user: "",
        text: "",
        title: "",
        isEditingTitle: false
    },
    methods:{
        send: function(){
            if(this.user.length === 0 || this.text.length === 0){
                return;
            }
            //pushすると、自分にもpushイベントが飛んでくる
            //すでにpushイベントに反応してviewが更新される（render）設定をしてあるので、
            //ここでviewの更新を行う必要はない。
            messageDs.push({user: this.user, text: this.text});
            this.text = "";
        },
        render: function(){
            var self = this;
            messageDs.query().sort('desc').limit(100).done(function(data){
                self.messages = data;
            });
        },
        changeTitle: function(title){
            this.isEditingTitle = false;
            ds.set("setting", {title: title});
        }
    },
    ready: function(){
        this.user = "user" + parseInt(Math.random() * 1000, 10);
        this.render();

        var self = this;
        messageDs.on("push", function(){
            self.render();
        });

        ds.query().done(function(data){
            data.forEach(function(i){
                self.title = i.title;
                self.titleEdit = i.title;
            });
        });

        ds.on("set", function(event){
            self.title = event.value.title;
            self.titleEdit = event.value.title;
        });

    }
});