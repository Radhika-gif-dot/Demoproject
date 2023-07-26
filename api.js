const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const dboperations = require("./dboperations");

const app = express();
const router = express.Router();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors());
app.use("/demoapp/api/v1", router);

const secretKey = "my_secure_secret_key_123!@#"; // Replace this with your secure secret key

// Middleware to verify token
function verifyToken(req, res, next) {
  const token = req.headers.authorization;

  if (!token) {
    return res.status(403).json({ message: "Authorization token not provided." });
  }

  jwt.verify(token, secretKey, (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: "Invalid token." });
    }

    req.user = decoded; // Attach the decoded user data to the request object
    next();
  });
}

router.route("/login").post(async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await dboperations.loginUser(email, password);

    // Generate a JWT token with user information as claims
    res.status(200).json(user);
  } catch (error) {
    console.log(error);
    res.status(401).json({ message: error });
  }
});

router.route("/users").get(verifyToken, (req, res) => {
  dboperations.getUsers().then((result) => {
    res.json(result[0]);
  });
});

router.route("/users/:id").get(verifyToken, (req, res) => {
  const userId = req.params.id;
  dboperations.getUserById(userId).then((result) => {
    res.json(result[0]);
  });
});

router.route("/users").post((req, res) => {
  const user = req.body;
  dboperations.addUser(user)
    .then((rowsAffected) => {
      if (rowsAffected > 0) {
        res.status(201).json({ message: "User added successfully!" });
      } else {
        res.status(500).json({ message: "Failed to add user." });
      }
    })
    .catch((error) => {
      console.log(error);
      res.status(500).json({ message: "Failed to add user." });
    });
});

router.route("/users/:id").put(verifyToken, (req, res) => {
  const userId = req.params.id;
  const user = req.body;
  dboperations
    .updateUser(userId, user)
    .then((rowsAffected) => {
      if (rowsAffected > 0) {
        res.status(200).json({ message: "User updated successfully!" });
      } else {
        res.status(500).json({ message: "Failed to update user." });
      }
    })
    .catch((error) => {
      console.log(error);
      res.status(500).json({ message: "Failed to update user." });
    });
});


router.route("/users/:id").delete(verifyToken,(req, res) => {
  const userId = req.params.id;
  dboperations.deleteUserById(userId)
    .then((rowsAffected) => {
      if (rowsAffected > 0) {
        res.status(200).json({ message: "User deleted successfully!" });
      } else {
        res.status(404).json({ message: "User not found." });
      }
    })
    .catch((error) => {
      console.log(error);
      res.status(500).json({ message: "Failed to delete user." });
    });
});

// ... other routes ...

// Start the server
const port = process.env.PORT || 8090;
app.listen(port);
console.log("Order API is running at " + port);
