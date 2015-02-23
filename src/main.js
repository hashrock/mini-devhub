var Vue = require('vue');
var milkcocoa = new MilkCocoa("https://io-qi68yo3tp.mlkcca.com:443");
var ds = milkcocoa.dataStore('chat');
var messageDs = ds.child('messages');
var memoDs = ds.child('memos');
var marked = require("marked");
marked.setOptions({
    renderer: new marked.Renderer(),
    gfm: true,
    tables: true,
    breaks: true,
    pedantic: false,
    sanitize: true,
    smartLists: true,
    smartypants: false
});


new Vue({
    el: "#main",
    filters: {
        marked: marked
    },
    data: {
        messages:[],
        memos: [],
        user: "",
        text: "",
        title: "",
        memo: {
            text: "",
            id: ""
        },
        isEditing: false,
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
            memoDs.query().sort('desc').limit(1000).done(function(data){
                self.memos = data;
            });
        },
        onEndEditing: function(){
            this.memo.text = "";
            this.memo.id = "";
            this.isEditing = false;
        },
        updateMemo: function(memo){
            var self = this;
            if(memo.id === undefined || memo.id === null || memo.id === ""){
                memoDs.push(
                    {
                        title: memo.title,
                        text: memo.text
                    },function(){
                        self.onEndEditing();
                    });
            }else{
                memoDs.set(memo.id,
                    {
                        title: memo.title,
                        text: memo.text
                    }, function(){
                        self.onEndEditing();
                    });
            }
        },
        removeMemo: function(id){
            var self = this;
            memoDs.remove(id, function(){
                self.render();
            });
        },
        editMemo: function(id){
            var self = this;
            memoDs.get(id, function(data){
                self.isEditing = true;
                self.memo.text = data.text;
                self.memo.id = id;
            });
        }
    },
    ready: function(){
        this.user = "user" + parseInt(Math.random() * 1000, 10);
        this.render();

        var self = this;
        messageDs.on("push", function(){
            self.render();
        });
        memoDs.on("push", function(){
            self.render();
        });
        memoDs.on("set", function(){
            self.render();
        });
    }
});