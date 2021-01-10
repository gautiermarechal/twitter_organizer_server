const express = require("express");
const app = express();
const cors = require("cors");
const pool = require("./db");
const axios = require("axios");
const needle = require("needle");
require("dotenv").config();

//middleware
app.use(cors());
app.use(express.json());

//Routes

//Home
app.get("/", (req, res) => {
  res
    .status(200)
    .json({ status: 200, message: "Server is running on port 5000" });
});

//Create a user
app.post("/user", async (req, res) => {
  try {
    const email = req.body.email;
    const password = req.body.password;
    const is_twitter_logged_in = req.body.is_twitter_logged_in;
    const newUser = await pool.query(
      "INSERT INTO person (email, password, is_twitter_logged_in) VALUES($1, $2, $3) RETURNING *;",
      [email, password, is_twitter_logged_in]
    );

    res.json(newUser);
  } catch (err) {
    console.log(err.message);
  }
});

//Get all users

app.get("/users", async (req, res) => {
  try {
    const allUsers = await pool.query("SELECT * FROM person");
    res.json(allUsers.rows);
  } catch (err) {
    console.log(err);
  }
});

//Get a user

app.get("/user/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const user = await pool.query("SELECT * FROM person WHERE id = $1", [id]);

    res.json(user.rows);
  } catch (err) {
    console.log(err);
  }
});

//Get a user by email

app.get("/user/email/:email", async (req, res) => {
  try {
    const { email } = req.params;
    const user = await pool.query("SELECT * FROM person WHERE email = $1", [
      email,
    ]);

    res.json(user.rows);
  } catch (err) {
    console.log(err);
  }
});

//Update a user

app.put("/user/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const password = req.body.password;
    const updateUser = pool.query(
      "UPDATE person SET password = $1 WHERE id = $2",
      [password, id]
    );

    res.json("Password was changed!");
  } catch (err) {
    console.log(err);
  }
});

//Delete a user

app.delete("/user/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const deleteUser = await pool.query("DELETE FROM person WHERE id = $1", [
      id,
    ]);

    res.json("User was deleted");
  } catch (err) {
    console.log(err.message);
  }
});

//Create an organized tweet
app.post("/tweet-organized", async (req, res) => {
  try {
    const content = req.body.content;
    const category = req.body.category;
    const date = req.body.date;
    const user_name = req.body.user_name;
    const user_screen_name = req.body.user_screen_name;
    const newTweetOrganized = await pool.query(
      "INSERT INTO tweet_organized (tweet_organized_content, tweet_organized_category, tweet_organized_date, user_name, user_screen_name) VALUES($1, $2, $3, $4, $5)",
      [content, category, date, user_name, user_screen_name]
    );

    res.json(newTweetOrganized);
  } catch (err) {
    console.log(err.message);
  }
});

//Get a tweet

app.get("/tweet-organized/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const tweet = await pool.query(
      "SELECT * FROM tweet_organized WHERE tweet_organized_id = $1",
      [id]
    );

    res.json(tweet.rows);
  } catch (err) {
    console.log(err.message);
  }
});

//Get all tweets

app.get("/tweets", async (req, res) => {
  try {
    const allTweets = await pool.query("SELECT * FROM tweet_organized");
    res.json(allTweets.rows);
  } catch (err) {
    console.log(err.message);
  }
});

//Get all tweets of a category
app.get("/tweets/:category", async (req, res) => {
  try {
    const { category } = req.params;
    console.log(category);
    const allCategoryTweets = await pool.query(
      "SELECT * FROM tweet_organized WHERE tweet_organized_category = $1;",
      [category]
    );
    res.json(allCategoryTweets.rows);
  } catch (err) {
    console.log(err);
  }
});

//Get all tweets of a user
app.get("/tweet-organized/user/:id", async (req, res) => {
  const { id } = req.params;
  const tweets = await pool.query(
    "SELECT * FROM tweet_organized WHERE user_id = $1",
    [id]
  );

  res.json(tweets.rows);
});

//Delete a tweet
app.delete("/tweet-organized/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const deleteTweet = await pool.query(
      "DELETE FROM tweet_organized WHERE tweet_organized_id = $1",
      [id]
    );

    res.json("Tweet was deleted");
  } catch (err) {
    console.log(err.message);
  }
});

//Add a bookmarked tweet to users' tweets
app.patch("/tweets/bookmark/:userid/:tweetid", async (req, res) => {
  try {
    const tweetid = req.params.tweetid;
    const userid = req.params.userid;
    const bookmarkedTweet = await pool.query(
      "UPDATE person SET tweets_bookmarked = array_append(tweets_bookmarked, $1) WHERE id = $2",
      [tweetid, userid]
    );
    res.status(200).json({
      status: 200,
      message: "Tweet bookmarked!",
      data: bookmarkedTweet,
    });
  } catch (error) {
    res.status(404).json({
      status: 404,
      message: error,
    });
  }
});

//Unbookmark a tweet
app.delete("/tweets/bookmark/:userid/:tweetid", async (req, res) => {
  try {
    const tweetid = req.params.tweetid;
    const userid = req.params.userid;
    const tweetToUnBookmark = await pool.query(
      "UPDATE person SET tweets_bookmarked = array_remove(tweets_bookmarked, $1) WHERE id = $2",
      [tweetid, userid]
    );
    res.status(200).json({
      status: 200,
      message: "Tweet Unbookmarked!",
      data: tweetToUnBookmark,
    });
  } catch (error) {
    res.status(404).json({
      status: 404,
      message: error,
    });
  }
});

//Get all tweets bookmarked from user
app.get("/tweets/bookmark/:userid", async (req, res) => {
  try {
    const userid = req.params.userid;
    const bookmarkedTweetsIds = await pool.query(
      "SELECT tweets_bookmarked FROM person WHERE id = $1",
      [userid]
    );
    const bookmarkedTweetsArray = await Promise.all(
      await bookmarkedTweetsIds.rows[0].tweets_bookmarked.map(
        async (id) =>
          await pool.query(
            "SELECT * FROM tweet_organized WHERE tweet_organized_id = $1",
            [id]
          )
      )
    );

    res.status(200).json({
      status: 200,
      data: bookmarkedTweetsArray.map((promise) => promise.rows[0]),
    });
  } catch (error) {
    res.status(500).json({
      status: 500,
      error: error.message,
    });
  }
});

//Get user data from twitter API
app.get("/twitter-api/user/:id", async (req, res) => {
  const endpointURL = "https://api.twitter.com/2/users/by?usernames=";
  const userid = req.params.id;
  const token = process.env.BEARER_TOKEN;
  const params = {
    usernames: userid,
    "user.fields": "created_at,description,profile_image_url",
  };
  try {
    const response = await needle("get", endpointURL, params, {
      headers: { authorization: `Bearer ${token}` },
    });

    if (response.body) {
      console.log(response.body);
      res.status(200).json({ status: 200, data: response.body.data[0] });
    } else {
      res.status(500).json({ status: 500, error: "Unsuccessfull request" });
    }
  } catch (err) {
    res.status(500).json({ status: 500, error: err.message });
  }
});

app.listen(5000, () => {
  console.log("server has started on port 5000");
});
