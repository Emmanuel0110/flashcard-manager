import dotenv from "dotenv";
import express from "express";
import path from "path";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { Schema, model } from "mongoose";
import auth from "./middleware/auth.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = 4001;

dotenv.config();

app.use(
  express.urlencoded({
    extended: false,
  })
);
app.use(express.json());
app.use("/", express.static(path.join(__dirname, "./public")));
app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Cookie, Origin, X-Requested-With, Content-Type, Accept, x-auth-token");
  res.header("Access-Control-Allow-Methods", "PUT, POST, GET, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Credentials", true);
  next();
});

app.get("/api/flashcards", auth, (req, res) => {
  const { filter, searchString, tagId } = req.query;
  if (filter === "Draft" || filter === "To be validated" || filter === "Published") {
    UserFlashcardInfoModel.find({ user: req.user._id }).then((userFlashcardInfos) => {
      const stringSearch = searchString ? { $text: { $search: searchString } } : {};
      const tagSearch = tagId ? { tags: { "$in" : [tagId]} } : {};
      const otherFilter = filter === "Draft" ? { author: req.user._id } : {};
      FlashcardModel.find({ status: filter, ...stringSearch, ...tagSearch, ...otherFilter })
        .sort("-creationDate")
        .skip(parseInt(req.query.skip) || 0)
        .limit(parseInt(req.query.limit) || 30)
        .populate("author", "username")
        .populate({
          path: "tags",
          populate: { path: "label" },
        })
        .lean()
        .then((flashcards) => {
          res.send(
            flashcards.map((flashcard) => {
              const info =
                userFlashcardInfos.find((info) => {
                  return info.flashcard.equals(flashcard._id);
                }) || {};
              return { ...flashcard, hasBeenRead: info.hasBeenRead || false, nextReviewDate: info.nextReviewDate };
            })
          );
        });
    });
  } else if (filter === "My favorites" || filter === "To be reviewed") {
    UserFlashcardInfoModel.find({
      user: req.user._id,
      nextReviewDate: filter === "To be reviewed" ? { $lt: new Date() } : { $exists: true, $ne: null },
    }).then((userFlashcardInfos) => {
      FlashcardModel.find({ _id: userFlashcardInfos.map((el) => el.flashcard) })
        .populate("author", "username")
        .populate("tags", "label")
        .lean()
        .then((flashcards) => {
          res.send(
            flashcards.map((flashcard) => {
              const info =
                userFlashcardInfos.find((info) => {
                  return info.flashcard.equals(flashcard._id);
                }) || {};
              return { ...flashcard, hasBeenRead: info.hasBeenRead || false, nextReviewDate: info.nextReviewDate };
            })
          );
        });
    });
  }
});

app.post("/api/flashcards", auth, function (req, res) {
  const newFlashcard = new FlashcardModel({
    _id: new mongoose.Types.ObjectId(),
    creationDate: new Date(),
    status: "Draft",
    author: req.user._id,
    ...req.body,
  });
  newFlashcard
    .save()
    .populate("author", "username")
    .populate("tags", "label")
    .then((newElement) => {
      res.send({ data: newElement });
    })
    .catch(function (err) {
      console.log("save error ", err);
      if (err.name === "MongoError" && err.code === 11000) {
        res.json({ success: false, message: "already exists" });
        return;
      }
      res.json({ success: false, message: "some error happened" });
      return;
    });
});

app.put("/api/flashcards/:id", auth, function (req, res) {
  const { id: _id } = req.params;

  const newFlashcard = {
    _id,
    ...req.body,
  };

  FlashcardModel.findByIdAndUpdate(_id, newFlashcard, { returnDocument: "after" })
    .populate("author", "username")
    .populate("tags", "label")
    .then((updatedFlashcard) => {
      res.send({ data: updatedFlashcard });
    })
    .catch((err) => {
      res.json({
        updatedFlashcard,
        success: false,
        msg: "Failed to update flashcard",
      });
    });
});

app.delete("/api/flashcards/:id", auth, function (req, res) {
  FlashcardModel.findOneAndDelete({ _id: req.params.id })
    .then((flashcard) => {
      res.json({ success: true });
    })
    .catch((err) => {
      console.log(err);
      res.json({ success: false, message: "Failed to delete flashcard" });
    });
});

app.put("/api/userflashcardinfo/:id", auth, function (req, res) {
  const { id: _id } = req.params;
  const filter = { user: req.user._id, flashcard: _id };
  const update = [
    {
      $set: {
        hasBeenRead: req.body.hasBeenRead || false,
        nextReviewDate: req.body.nextReviewDate ? new Date(req.body.nextReviewDate) : undefined,
      },
    },
  ];
  if (req.body.nextReviewDate === null) {
    update.push({ $unset: "nextReviewDate" });
  }

  UserFlashcardInfoModel.updateOne(filter, update, { upsert: true }).then((data) => res.json({ success: true }));
});

app.patch("/api/userflashcardinfo/:id", auth, function (req, res) {
  const { id: _id } = req.params;
  const filter = { user: req.user._id, flashcard: _id };
  UserFlashcardInfoModel.updateOne(filter, req.body).then((data) => res.json({ success: true }));
});

app.get("/api/tags", auth, (req, res) => {
  TagModel.find()
    .limit(1000)
    .then((tags) => res.send(tags));
});

app.post("/api/tags", auth, (req, res) => {
  const newTag = new TagModel({
    _id: new mongoose.Types.ObjectId(),
    ...req.body,
  });
  newTag
    .save()
    .then((newElement) => {
      res.send({ data: newElement });
    })
    .catch(function (err) {
      console.log("save error ", err);
      if (err.name === "MongoError" && err.code === 11000) {
        res.json({ success: false, message: "already exists" });
        return;
      }
      res.json({ success: false, message: "some error happened" });
      return;
    });
});

const tagSchema = new Schema({
  _id: Schema.Types.ObjectId,
  label: { type: String, required: true },
});
export const TagModel = model("Tag", tagSchema);

const userSchema = new Schema({
  _id: Schema.Types.ObjectId,
  username: { type: String, required: true },
  password: { type: String, required: true },
});
export const UserModel = model("User", userSchema);

const flashcardSchema = new Schema({
  _id: Schema.Types.ObjectId,
  author: { type: Schema.Types.ObjectId, ref: "User", required: true },
  title: String,
  question: String,
  answer: String,
  tags: [{ type: Schema.Types.ObjectId, ref: "Tag", required: true }],
  creationDate: Date,
  status: String,
});
flashcardSchema.index({ title: "text" });
export const FlashcardModel = model("Flashcard", flashcardSchema);

const userFlashcardInfoSchema = new Schema({
  _id: Schema.Types.ObjectId,
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  flashcard: { type: Schema.Types.ObjectId, ref: "Flashcard", required: true },
  hasBeenRead: Boolean,
  nextReviewDate: Date,
});
export const UserFlashcardInfoModel = model("UserFlashcardInfo", userFlashcardInfoSchema);

import mongoose from "mongoose";
mongoose.set("debug", true);
mongoose.set("strictQuery", true);
mongoose.connect(
  `mongodb+srv://${process.env.MONGO_USERNAME}:${process.env.MONGO_PASSWORD}@${process.env.MONGO_CLUSTER}.mongodb.net/${process.env.MONGO_DBNAME}?retryWrites=true&w=majority`
);
mongoose.Promise = Promise;

const db = mongoose.connection;
db.on("error", function (e) {
  console.error("connection error:", e);
});
db.once("open", function (callback) {
  // the connection to the DB is okay, let's start the application
  const httpServer = app.listen(process.env.PORT || port, () => {
    console.log(`Example app listening on port ${process.env.PORT || port}!`);
  });
});

//register
app.post("/api/users", function (req, res) {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ msg: "Please enter all fields" });
  }
  UserModel.findOne({ username }).then((user) => {
    if (user) return res.status(400).json({ msg: "User alreasy exists" });
  });
  const newUser = new UserModel({
    _id: new mongoose.Types.ObjectId(),
    username,
    password,
    watchedList: [],
    myDeck: [],
  });
  // Create salt & hash
  bcrypt.genSalt(10, (err, salt) => {
    bcrypt.hash(newUser.password, salt, (err, hash) => {
      if (err) throw err;
      newUser.password = hash;
      newUser.save().then((newUser) => {
        let user = newUser.toObject();
        if (err) {
          console.log("save error ", err);
          if (err.name === "MongoError" && err.code === 11000) {
            // Duplicate error happened. You can handle it separately.
            res.json({ success: false, message: "already exists" });
            return;
          }
          // Some other error happened, you might also want to handle it.
          res.json({ success: false, message: "some error happened" });
          return;
        }

        jwt.sign({ _id: user._id }, process.env.JWT_SECRET, { expiresIn: 3600 }, (err, token) => {
          if (err) throw err;
          delete user.password;
          res.json({ token, user });
        });
      });
    });
  });
});

//login
app.post("/api/auth", function (req, res) {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ msg: "Please enter all fields" });
  }
  UserModel.findOne({ username }).then((user) => {
    if (!user) return res.status(400).json({ msg: "User does not exist" });

    //Validate password
    bcrypt.compare(password, user.password).then((isMatch) => {
      if (!isMatch) return res.status(400).json({ msg: "Invalid credentials" });

      jwt.sign({ _id: user._id }, process.env.JWT_SECRET, { expiresIn: 3600 }, (err, token) => {
        if (err) throw err;
        delete user.password;
        res.json({ token, user });
      });
    });
  });
});

app.get("/api/auth/user", auth, function (req, res) {
  UserModel.findById(req.user._id)
    .select("-password")
    .then((user) => res.json({ user }));
});
