export default class AppController {
    constructor(model) {
        this.appModel = model;

        //DB
        this.milkcocoa = new MilkCocoa("https://io-qi68yo3tp.mlkcca.com:443");
        this.ds = this.milkcocoa.dataStore('chat');
        this.memoDs = this.ds.child('memos');
        this.messageDs = this.ds.child('messages');

        this.messageDs.on("push", ()=>{
            this.fetchMessage();
        });
        this.memoDs.on("push", ()=>{
            this.fetchMemo();
        });
        this.memoDs.on("set", ()=>{
            this.fetchMemo();
        });

    }
    sendMessage(user, text) {
        this.messageDs.push({user: user, text: text});
    }
    fetchMessage() {
        this.messageDs.query().sort('desc').limit(100).done((data)=>{
            this.appModel.messages = data;
        })
    }
    fetchMemo(){
        this.memoDs.query().sort('desc').limit(1000).done((data)=>{
            //カテゴリ生成
            //var categoryTree = createCategoryTree(data);
            //TODO カテゴリ表示
            //TODO 現在選択中カテゴリを元に絞込

            this.appModel.memos = data;
        });
    }
    updateMemo(memo, callback){
        if(memo.id === undefined || memo.id === null || memo.id === ""){
            this.memoDs.push(
                {
                    title: memo.title,
                    text: memo.text
                },callback);
        }else{
            this.memoDs.set(memo.id,
                {
                    title: memo.title,
                    text: memo.text
                },callback);
        }
    }
    removeMemo(id, callback){
        this.memoDs.remove(id, function(){
            callback();
        });
    }
    editMemo(id, callback){
        this.memoDs.get(id, function(data){
            callback({
                text: data.text,
                id: id
            })
        });
    }
}