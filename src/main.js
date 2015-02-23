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

//スラッシュ区切りの文字列をツリーに変換する
function createCategoryTree(data){
    var titleList = data.map(function(item){
        var lines = item.text.split(/\r\n|\r|\n/);
        if(lines.length > 0){
            return lines[0];
        }else{
            return null;
        }
    });
    var root = {};
    titleList.forEach(function(item){
        if(item.match("/")){
            var parent = root;
            item.split("/").forEach(function(tag){
                if(parent && !parent[tag]){
                    parent[tag] = {};
                }
                parent = parent[tag];
            });
        }
    });
    return root;
}

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
        isEditingTitle: false,
        category: ""
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
                //カテゴリ生成
                var categoryTree = createCategoryTree(data);
                //TODO カテゴリ表示
                //TODO 現在選択中カテゴリを元に絞込

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
        //ユーザ名生成
        this.user = "user" + parseInt(Math.random() * 1000, 10);
        this.render();

        //サーバイベントによる再レンダリング
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