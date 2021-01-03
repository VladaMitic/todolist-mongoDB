const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb+srv://admin-vlada:Promeni01@cluster0.i2jzc.mongodb.net/todolistDB", {useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false});

const itemsSchema = new mongoose.Schema ({
  name: String
});

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "Welcome to your todo list"
});

const item2 = new Item({
  name: "Click + to add new task"
});

const item3 = new Item({
  name: "<- press to delete item"
});

const defaultItems = [item1, item2, item3];

const listSchema = new mongoose.Schema ({
  name: String,
  items: [itemsSchema]
});

const List = mongoose.model("List", listSchema);

app.get("/", function(req, res) {
  Item.find({}, function(err, readedItems){
    if(readedItems.length === 0) {
      Item.insertMany(defaultItems, function(err) {
        if(err) {
          console.log(err);
        } else {
          console.log("Items has been added to collection");
        }
      });
      res.redirect("/");
    } else {
      res.render("list", {listTitle: "Today", newListItems: readedItems});
    }
  });
});

app.get("/:costumListName", function(req, res) {
  const costumListName = _.capitalize(req.params.costumListName);
  List.findOne({name: costumListName}, function(err, result) {
    if(!err) {
      if(!result) {
        //create new list
        const list = new List({
          name: costumListName,
          items: defaultItems
        });
        list.save();
        res.redirect("/" + costumListName);
      } else {
        //show existing list
        res.render("list", {listTitle: result.name, newListItems: result.items})
      }
    }
  });
});

app.post("/", function(req, res){
  const itemName = req.body.newItem;
  const listName = req.body.list;
  const item = new Item({
    name: itemName
  });
  if(listName === "Today") {
    item.save();
    res.redirect("/");
  } else {
    List.findOne({name: listName}, function(err, result) {
      result.items.push(item);
      result.save();
      res.redirect("/" + listName);
    })
  }
});

app.post("/delete", function(req,res){
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;
  if(listName === "Today") {
    Item.findByIdAndRemove(checkedItemId, function(err) {
      if(!err) {
        console.log("Item has been deleted!");
        res.redirect("/");
      }
    });
  } else {
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, function(err, result) {
      if(!err) {
        res.redirect("/" + listName);
      }
    });
  }
});

app.get("/about", function(req, res){
  res.render("about");
});

app.listen(process.env.PORT || 3000, function() {
  console.log("Server has started");
});
