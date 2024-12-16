const axios = require("axios");

const validateToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Missing or invalid token" });
  }

  const token = authHeader.split(" ")[1];

  try {
    // Call the Authentication Microservice to validate the token
    const response = await axios.post(
      "http://localhost:5000/api/users/validate-token",  // Adjust this URL as needed
      {},
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    // Attach user info to the request object for use in controllers
    req.user = response.data.user;
    next();
  } catch (error) {
    console.error("Error validating token:", error.response?.data || error.message);
    res.status(401).json({ message: "Unauthorized" });
  }
};

module.exports = validateToken;
