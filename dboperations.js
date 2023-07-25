var config = require('./dbconfig');
const sql = require('mssql');
const bcrypt = require('bcryptjs');
const jwt = require("jsonwebtoken");
const secretKey = "my_secure_secret_key_123!@#"; // Replace this with a secure secret key

// async function getOrders() {
//     try {
//         let pool = await sql.connect(config);
//         let products = await pool.request().query("SELECT * from Customers");
//         return products.recordsets;
//     }
//     catch (error) {
//         console.log(error);
//     }
// }
async function loginUser(email, password) {
  try {
    let pool = await sql.connect(config);
    let user = await pool
      .request()
      .input("email", sql.VarChar(255), email)
      .query("SELECT * FROM Operator WHERE email = @email");

    if (user.recordset.length === 0) {
      throw new Error('User not found.');
    }

    const storedPassword = user.recordset[0].password;
    const isPasswordMatch = await bcrypt.compare(password, storedPassword);
    console.log("Stored hashed password:", storedPassword);
    console.log("Is password match:", isPasswordMatch);

    if (!isPasswordMatch) {
      throw new Error('Invalid credentials.');
    }

   // Generate a JWT token with user information as claims
   const token = jwt.sign(
    {
      id: user.recordset[0].id,
      operatorname: user.recordset[0].operatorname,
      email: user.recordset[0].email,
      is_active: user.recordset[0].is_active,
    },
    secretKey,
    { expiresIn: "1h" } // Token will expire in 1 hour
  );

  // Return the token along with other user data
  return {
    message: "Login successful!",
    token,
    user: {
      id: user.recordset[0].id,
      operatorname: user.recordset[0].operatorname,
      email: user.recordset[0].email,
      is_active: user.recordset[0].is_active,
    },
  };
} catch (error) {
  throw error;
}
}
async function getUsers() {
    try {
      let pool = await sql.connect(config);
      let users = await pool.request().query("SELECT * FROM Operator");
      return users.recordsets;
    } catch (error) {
      console.log(error);
    }
  }
  async function getUserById(id) {
    try {
      let pool = await sql.connect(config);
      let user = await pool
        .request()
        .input("id", sql.Int, id)
        .query("SELECT * FROM Operator WHERE id = @id");
      return user.recordsets;
    } catch (error) {
      console.log(error);
    }
  }
  async function addUser(user) {
    console.log("user");
    try {
      // Generate a random salt
      const saltRounds = 10;
      const salt = await bcrypt.genSalt(saltRounds);
      console.log("salt",salt);
  
      // Hash the password using bcrypt and the generated salt
      const hashedPassword = await bcrypt.hash(user.password, salt);
      console.log("hashedpassword",hashedPassword);
      // Use the hashed password in the INSERT query
      let pool = await sql.connect(config);
      let insertUser = await pool
        .request()
        .input("operatorname", sql.VarChar(255), user.operatorname)
        .input("operatorcode", sql.VarChar(255), user.operatorcode)
        .input("email", sql.VarChar(255), user.email)
        .input("password", sql.VarChar(255), hashedPassword) // Use the hashed password here
        .input("is_active", sql.TinyInt, user.is_active)
        .query(
          "INSERT INTO Operator (operatorname, operatorcode, email, password, is_active) VALUES (@operatorname, @operatorcode, @email, @password, @is_active)"
        );
      return insertUser.rowsAffected;
    } catch (error) {
      console.log(error);
    }
  }
  
  async function updateUser(id, user) {
  try {
    let pool = await sql.connect(config);

    // If the password is provided, hash it before updating
    if (user.password) {
      const saltRounds = 10;
      const salt = await bcrypt.genSalt(saltRounds);
      user.password = await bcrypt.hash(user.password, salt);
    }

    let updateUser = await pool
      .request()
      .input("id", sql.Int, id)
      .input("operatorname", sql.VarChar(255), user.operatorname)
      .input("operatorcode", sql.VarChar(255), user.operatorcode)
      .input("email", sql.VarChar(255), user.email)
      .input("password", sql.VarChar(255), user.password)
      .input("is_active", sql.TinyInt, user.is_active)
      .query(
        "UPDATE Operator SET operatorname = @operatorname, operatorcode = @operatorcode, email = @email, password = @password, is_active = @is_active WHERE id = @id"
      );

    return updateUser.rowsAffected;
  } catch (error) {
    console.log(error);
    throw error;
  }
}

  async function deleteUserById(id) {
    try {
      let pool = await sql.connect(config);
      let result = await pool
        .request()
        .input("id", sql.Int, id)
        .query("DELETE FROM Operator WHERE id = @id");
      return result.rowsAffected;
    } catch (error) {
      console.log(error);
    }
  }
  
module.exports={
   // getOrders:getOrders,
    getUsers: getUsers,
    getUserById:getUserById,
    addUser:addUser,
    updateUser:updateUser,
    deleteUserById:deleteUserById,
    loginUser:loginUser
}