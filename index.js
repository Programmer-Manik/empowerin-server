const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const { MongoClient, ObjectId } = require("mongodb");
require("dotenv").config();
const jwt = require("jsonwebtoken");

const app = express();
const port = process.env.PORT || 5000;

// Middleware

app.use(
  cors({
    origin: ["http://localhost:5173"],
    credentials: true,
  })
);

// app.use(
//   cors({
//     origin: [
//       "https://empowering-recovery-chain-client-site.netlify.app",
//       "http://localhost:5173",
//     ],
//     credentials: true,
//   })
// );

app.use(express.json());

// MongoDB Connection URL
const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function run() {
  try {
    // Connect to MongoDB
    await client.connect();
    console.log("Connected to MongoDB");

    const db = client.db("Empowering-Recovery-Chain-Final");
    const collection = db.collection("users");
    const volunteersCollection = db.collection("volunteers");
    const suppliesCollection = db.collection("supplies");
    const donorsCollection = db.collection("donors");
    const reviewsCollection = db.collection("reviews");
    const gratitudesCollection = db.collection("gratitudes");

    // User Registration
    app.post("/api/v1/register", async (req, res) => {
      const { name, image, email, password } = req.body;

      // Check if email already exists
      const existingUser = await collection.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "User already exists",
        });
      }

      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Insert user into the database
      await collection.insertOne({
        name,
        email,
        password: hashedPassword,
        image,
      });

      res.status(201).json({
        success: true,
        message: "User registered successfully",
      });
    });

    // User Login
    app.post("/api/v1/login", async (req, res) => {
      const { email, password } = req.body;

      // Find user by email
      const user = await collection.findOne({ email });
      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Compare hashed password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Generate JWT token
      const token = jwt.sign({ email: user.email }, process.env.JWT_SECRET, {
        expiresIn: process.env.EXPIRES_IN,
      });

      res.json({
        success: true,
        message: "Login successful",
        token,
      });
    });

    // ==============================================================
    // WRITE YOUR CODE HERE

    app.get("/api/v1/users", async (req, res) => {
      const result = await collection
        .find({}, { projection: { password: 0 } })
        .toArray();
      res.status(200).json({
        success: true,
        message: "users retrieved successful",
        data: result,
      });
    });

    app.get("/api/v1/supplies", async (req, res) => {
      const data = await suppliesCollection.find().toArray();
      if (data.length === 0) {
        return res
          .status(404)
          .json({ success: false, message: "No data found", data: [] });
      }
      res
        .status(200)
        .json({ success: true, message: "Data retrieved successfully", data });
    });

    app.post("/api/v1/create-supply", async (req, res) => {
      const body = req.body;

      const result = await suppliesCollection.insertOne(body);
      res.status(201).json({
        success: true,
        message: "supply create successfully",
        result,
      });
    });

    app.put("/api/v1/update-supply/:id", async (req, res) => {
      const id = req.params.id;
      const body = req.body;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          title: body.title,
          category: body.category,
          amount: body.amount,
          image: body.image,
          description: body.description,
        },
      };

      const result = await suppliesCollection.updateOne(filter, updateDoc, {
        new: true,
      });
      res.status(200).json({
        success: true,
        message: "supply create successfully",
        result,
      });
    });

    app.delete("/api/v1/delete-supply/:id", async (req, res) => {
      const id = req.params.id;
      if (!id && id === null) {
        return res.json({
          success: false,
          message: "id not found",
        });
      }
      const result = await suppliesCollection.deleteOne({
        _id: new ObjectId(id),
      });
      res.status(200).json({
        success: true,
        message: "your requested supply deleted successful",
        result,
      });
    });

    //for donors operation
    app.post("/api/v1/donor-collection", async (req, res) => {
      const body = req.body;
      const result = await donorsCollection.insertOne(body);
      res.status(201).json({
        success: true,
        message: "Client donation successful",
        data: result,
      });
    });

    app.get("/api/v1/allDonors", async (req, res) => {
      const result = donorsCollection.find();
      if (result.length <= 0) {
        return res
          .status(404)
          .json({ success: false, message: "Data not found" });
      }
      const sortedData = await result.sort({ amount: -1 }).toArray();

      res.status(200).json({
        success: true,
        message: "data retrieved successful",
        data: sortedData,
      });
    });

    // volunteer operations
    app.post("/api/v1/create-volunteer", async (req, res) => {
      const body = req.body;
      const result = await volunteersCollection.insertOne(body);
      res.status(201).json({
        success: true,
        message: "volunteer sign up successful",
        data: result,
      });
    });

    app.get("/api/v1/volunteers", async (req, res) => {
      const result = await volunteersCollection.find().toArray();
      if (result.length <= 0) {
        res.status(404).json({
          success: false,
          message: "Volunteers data not found",
          data: [],
        });
      }

      res.status(200).json({
        success: true,
        message: "Volunteer retrieved successful",
        data: result,
      });
    });

    //clients review collection
    app.get("/api/v1/reviews", async (req, res) => {
      const reviews = await reviewsCollection.find().toArray();
      if (reviews.length === 0) {
        return res
          .status(404)
          .json({ success: false, message: "No reviews found", reviews: [] });
      }
      res.status(200).json({
        success: true,
        message: "reviews retrieved successfully",
        data: reviews,
      });
    });

    app.post("/api/v1/create-reviews", async (req, res) => {
      const body = req.body;
      console.log(body);
      const result = await reviewsCollection.insertOne(body);
      res.status(201).json({
        success: true,
        message: "Reviews posted successfully",
        data: result,
      });
    });

    app.post("/api/v1/gratitude", async (req, res) => {
      const body = req.body;
      const result = await gratitudesCollection.insertOne(body);
      res.status(201).json({
        success: true,
        message: "gratitude posted successfully",
        data: result,
      });
    });

    app.get("/api/v1/gratitude", async (req, res) => {
      const result = await gratitudesCollection
        .find()
        .sort({
          createdAt: -1,
          createTime: -1,
        })
        .toArray();
      if (result.length <= 0) {
        return res
          .status(404)
          .json({ success: false, message: "no comments found" });
      }

      res.status(200).json({
        success: true,
        message: "comments retrieved successful",
        data: result,
      });
    });

    // ==============================================================

    // Start the server
    app.listen(port, () => {
      console.log(`Server is running on http://localhost:${port}`);
    });
  } finally {
  }
}

run().catch(console.dir);

// Test route
app.get("/", (req, res) => {
  const serverStatus = {
    message: "Server is running smoothly",
    timestamp: new Date(),
  };
  res.json(serverStatus);
});
