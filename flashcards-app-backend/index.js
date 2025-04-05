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

const completeFlashcard = async (flashcard, userFlashcardInfos) => {
  const info =
    userFlashcardInfos.find((info) => {
      return info.flashcard.equals(flashcard._id);
    }) || {};
  return {
    ...flashcard,
    hasBeenRead: info.hasBeenRead || false,
    nextReviewDate: info.nextReviewDate,
    subscriptionDate: info.subscriptionDate,
    learntDate: info.learntDate,
  };
};

const getFilterSearch = (filter) => ({
  $and: filter.map((el) => ({
    $or: el.map((filterString) => {
      if (filterString.toLowerCase().startsWith("not ")) {
        if (filterString.toLowerCase().slice(4).trim().startsWith("#")) {
          const tagId = filterString.toLowerCase().trim().slice(5);
          return { tags: { $nin: [tagId] } };
        } else {
          return {
            $and: [
              { question: { $regex: "^((?!" + filterString.replace(/^\"/, "").replace(/\"$/, "") + ").)*$" } }, // regex for "does not contain bla" : ^((?!bla).)*$
              { answer: { $regex: "^((?!" + filterString.replace(/^\"/, "").replace(/\"$/, "") + ").)*$" } },
            ],
          };
        }
      } else {
        if (filterString.toLowerCase().trim().startsWith("#")) {
          const tagId = filterString.toLowerCase().trim().slice(1);
          return { tags: { $in: [tagId] } };
        } else {
          return {
            $or: [
              { question: { $regex: filterString.replace(/^\"/, "").replace(/\"$/, "") } },
              { answer: { $regex: filterString.replace(/^\"/, "").replace(/\"$/, "") } },
            ],
          };
        }
      }
    }),
  })),
});

app.post("/api/search", auth, (req, res) => {
  const { status, filter, prerequisitesAndUsedIn, skip, limit } = req.body;
  if (
    status === "Draft" ||
    status === "To be validated" ||
    status === "Published" ||
    prerequisitesAndUsedIn !== undefined
  ) {
    UserFlashcardInfoModel.find({ user: req.user._id })
      .then((userFlashcardInfos) => {
        const filterSearch = filter?.length ? getFilterSearch(filter) : {};
        const statusSearch = status ? { status } : {};
        const prerequisitesAndUsedInSearch = prerequisitesAndUsedIn ? { _id: { $in: prerequisitesAndUsedIn } } : {};
        const otherFilter = status === "Draft" ? { author: req.user._id } : {};
        FlashcardModel.find({
          ...filterSearch,
          ...statusSearch,
          ...prerequisitesAndUsedInSearch,
          ...otherFilter,
        })
          .sort("-lastModificationDate")
          .skip(parseInt(skip) || 0)
          .limit(parseInt(limit) || 30)
          .populate("author", "username")
          .populate("publishAuthor", "username")
          .populate({
            path: "tags",
            populate: { path: "label" },
          })
          .lean()
          .then(async (flashcards) => {
            var results = await Promise.all(
              flashcards.map(async (flashcard) => {
                return completeFlashcard(flashcard, userFlashcardInfos);
              })
            );
            res.send(results);
          })
          .catch((err) => console.log(err));
      })
      .catch((err) => console.log(err));
  } else if (status === "My favorites" || status === "To be reviewed") {
    UserFlashcardInfoModel.find({
      user: req.user._id,
      nextReviewDate: status === "To be reviewed" ? { $lt: new Date() } : { $exists: true, $ne: null },
    })
      .then((userFlashcardInfos) => {
        FlashcardModel.find({ _id: userFlashcardInfos.map((el) => el.flashcard) })
          .populate("author", "username")
          .populate("publishAuthor", "username")
          .populate("tags", "label")
          .lean()
          .then(async (flashcards) => {
            var results = await Promise.all(
              flashcards.map(async (flashcard) => {
                return completeFlashcard(flashcard, userFlashcardInfos);
              })
            );
            res.send(results);
          })
          .catch((err) => console.log(err));
      })
      .catch((err) => console.log(err));
  }
});

app.get("/api/flashcards/:id", auth, (req, res) => {
  const { id } = req.params;
  if (id.match(/^[0-9a-fA-F]{24}$/)) {
    try {
      UserFlashcardInfoModel.find({ user: req.user._id }).then((userFlashcardInfos) => {
        FlashcardModel.findById(id)
          .populate("author", "username")
          .populate("publishAuthor", "username")
          .populate({
            path: "tags",
            populate: { path: "label" },
          })
          .lean()
          .then(async (flashcard) => {
            const result = await completeFlashcard(flashcard, userFlashcardInfos);
            res.send(result);
          })
          .catch((err) => console.log(err));
      });
    } catch (err) {
      console.log(err);
    }
  }
});

app.post("/api/flashcards", auth, function (req, res) {
  const newFlashcard = new FlashcardModel({
    _id: new mongoose.Types.ObjectId(),
    creationDate: new Date(),
    lastModificationDate: new Date(),
    status: "Draft",
    author: req.user._id,
    ...req.body,
  });
  newFlashcard
    .save()
    .then(async (newElement) => {
      const prerequisites = newElement.prerequisites;
      if (Array.isArray(prerequisites) && prerequisites.length) {
        await FlashcardModel.updateMany({ _id: { $in: prerequisites } }, { $addToSet: { usedIn: newElement._id } });
      }
      return newElement;
    })
    .then((newElement) => newElement.populate("author", "username"))
    .then((newElement) => newElement.populate("publishAuthor", "username"))
    .then((newElement) => newElement.populate("tags", "label"))
    .then((newElement) => res.send({ data: newElement }))
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

app.patch("/api/flashcards/:id", auth, function (req, res) {
  const { id: _id } = req.params;

  const newFlashcard = {
    _id,
    ...req.body,
  };

  FlashcardModel.findByIdAndUpdate(_id, newFlashcard)
    .populate("author", "username")
    .populate("publishAuthor", "username")
    .populate({
      path: "tags",
      populate: { path: "label" },
    })
    .then(async (originalFlashcard) => {
      const prerequisites = newFlashcard.prerequisites;
      if (Array.isArray(prerequisites) && prerequisites.length) {
        const newPrerequisites = prerequisites.filter((el) => !(el in originalFlashcard.prerequisites));
        if (newPrerequisites.length)
          await FlashcardModel.updateMany(
            { _id: { $in: newPrerequisites } },
            { $addToSet: { usedIn: newFlashcard._id } }
          );

        const removedPrerequisites = originalFlashcard.filter((el) => !(el in prerequisites));
        if (removedPrerequisites.length)
          await FlashcardModel.updateMany(
            { _id: { $in: removedPrerequisites } },
            { $pull: { usedIn: newFlashcard._id } }
          );
      }

      res.json({ success: true });
    })
    .catch((err) => {
      res.json({
        success: false,
        msg: err.message,
      });
    });
});

app.delete("/api/flashcards/:id", auth, async function (req, res) {
  try {
    const deletedFlashcard = await FlashcardModel.findOneAndDelete({ _id: req.params.id });
    await FlashcardModel.updateMany(
      { prerequisites: { $in: [deletedFlashcard._id] } },
      { $pull: { prerequisites: deletedFlashcard._id } }
    );
    await FlashcardModel.updateMany(
      { usedIn: { $in: [deletedFlashcard._id] } },
      { $pull: { usedIn: deletedFlashcard._id } }
    );
    res.json({ success: true });
  } catch (err) {
    console.log(err);
    res.json({ success: false, message: "Failed to delete flashcard" });
  }
});

app.put("/api/userflashcardinfo/:id", auth, function (req, res) {
  const { id: _id } = req.params;
  const filter = { user: req.user._id, flashcard: _id };
  const update = [
    {
      $set: {
        hasBeenRead: req.body.hasBeenRead || false,
        nextReviewDate: req.body.nextReviewDate ? new Date(req.body.nextReviewDate) : undefined,
        subscriptionDate: req.body.subscriptionDate ? new Date(req.body.subscriptionDate) : undefined,
      },
    },
  ];
  if (req.body.nextReviewDate === null) {
    update.push({ $unset: "nextReviewDate" });
  }
  if (req.body.subscriptionDate === null) {
    update.push({ $unset: "subscriptionDate" });
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
  TagModel.findOne({ label: req.body?.label || "" }).then((tag) => {
    if (tag) {
      res.send({ data: tag });
    } else {
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
    }
  });
});

const tagSchema = new Schema({
  _id: Schema.Types.ObjectId,
  label: { type: String, required: true, unique: true },
});
export const TagModel = model("Tag", tagSchema);

const userSchema = new Schema({
  _id: Schema.Types.ObjectId,
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});
export const UserModel = model("User", userSchema);

const flashcardSchema = new Schema({
  _id: Schema.Types.ObjectId,
  author: { type: Schema.Types.ObjectId, ref: "User", required: true },
  title: String,
  question: { type: String },
  answer: { type: String },
  tags: [{ type: Schema.Types.ObjectId, ref: "Tag", required: true }],
  creationDate: Date,
  submitDate: Date,
  publishDate: Date,
  publishAuthor: { type: Schema.Types.ObjectId, ref: "User" },
  lastModificationDate: Date,
  status: String,
  prerequisites: [{ type: Schema.Types.ObjectId, ref: "Flashcard", required: true }],
  usedIn: [{ type: Schema.Types.ObjectId, ref: "Flashcard" }],
});

// flashcardSchema.index({ question: "text", answer: "text" }); //for full text search
//Only one text index by collection in mongoDB. Can be solved by adding a merged attribute question+answer
//Does not allow regex search
//A query can specify, at most, one $text expression.
//To use a $text query in an $or expression, all clauses in the $or array must be indexed.
export const FlashcardModel = model("Flashcard", flashcardSchema);

const userFlashcardInfoSchema = new Schema({
  _id: Schema.Types.ObjectId,
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  flashcard: { type: Schema.Types.ObjectId, ref: "Flashcard", required: true },
  hasBeenRead: Boolean,
  nextReviewDate: Date,
  subscriptionDate: Date,
  learntDate: Date,
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

        jwt.sign({ _id: user._id }, process.env.JWT_SECRET, { expiresIn: 3600 * 8 }, (err, token) => {
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
  UserModel.findOne({ username })
    .lean()
    .then((user) => {
      if (!user) return res.status(400).json({ msg: "User does not exist" });

      //Validate password
      bcrypt.compare(password, user.password).then((isMatch) => {
        if (!isMatch) return res.status(400).json({ msg: "Invalid credentials" });

        jwt.sign({ _id: user._id }, process.env.JWT_SECRET, { expiresIn: 3600 * 8 }, (err, token) => {
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
