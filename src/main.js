'use strict';

import AppController from './appController.js'

var Vue = require('vue');
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

var appModel = {
    messages: [],
    memos: []
};

var appController = new AppController(appModel);


new Vue({
    el: "#main",
    filters: {
        marked: marked
    },
    data: {
        model: appModel,
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
            appController.sendMessage(this.user, this.text);
            this.text = "";
        },
        render: function(){
            appController.fetchMessage();
            appController.fetchMemo();
        },
        onEndEditing: function(){
            this.memo.text = "";
            this.memo.id = "";
            this.isEditing = false;
        },
        updateMemo: function(memo){
            appController.updateMemo(memo,()=>{
                this.onEndEditing();
            });
        },
        removeMemo: function(id){
            appController.removeMemo(id, ()=>{
                this.render();
            });
        },
        editMemo: function(id){
            appController.editMemo(id, (data)=>{
                this.isEditing = true;
                this.memo.text = data.text;
                this.memo.id = id;
            });
        }
    },
    ready: function(){
        //ユーザ名生成
        this.user = "user" + parseInt(Math.random() * 1000, 10);
        this.render();

    }
});