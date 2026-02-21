// import { requireAuth } from "@clerk/express";
// import User from "../models/User.js";

// export const protectRoute = [
//   requireAuth(),
//   async (req, res, next) => {
//     try {
//       const clerkId = req.auth().userId;

//       if (!clerkId) return res.status(401).json({ message: "Unauthorized - invalid token" });

//       // find user in db by clerk ID
//       const user = await User.findOne({ clerkId });

//       if (!user) return res.status(404).json({ message: "User not found" });

//       // attach user to req
//       req.user = user;

//       next();
//     } catch (error) {
//       console.error("Error in protectRoute middleware", error);
//       res.status(500).json({ message: "Internal Server Error" });
//     }
//   },
// ];


// import { requireAuth } from "@clerk/express";
// import { clerkClient } from "@clerk/clerk-sdk-node";
// import User from "../models/User.js";

// export const protectRoute = [
//   requireAuth(),
//   async (req, res, next) => {
//     try {
//       const clerkId = req.auth().userId;

//       if (!clerkId)
//         return res.status(401).json({ message: "Unauthorized - invalid token" });

//       let user = await User.findOne({ clerkId });

//       if (!user) {
//         const clerkUser = await clerkClient.users.getUser(clerkId);

//         user = await User.create({
//           clerkId,
//           name: clerkUser.firstName + " " + clerkUser.lastName,
//           email: clerkUser.emailAddresses[0].emailAddress,
//           imageUrl: clerkUser.imageUrl,
//         });
//       }

//       req.user = user;
//       next();
//     } catch (error) {
//       console.error("Error in protectRoute middleware", error);
//       res.status(500).json({ message: "Internal Server Error" });
//     }
//   },
// ];


import { requireAuth } from "@clerk/express";
import { clerkClient } from "@clerk/clerk-sdk-node";
import User from "../models/User.js";

export const protectRoute = [
  requireAuth(),
  async (req, res, next) => {
    try {
      const clerkId = req.auth().userId;

      if (!clerkId)
        return res.status(401).json({ message: "Unauthorized - invalid token" });

      // First try finding by clerkId
      let user = await User.findOne({ clerkId });

      if (!user) {
        const clerkUser = await clerkClient.users.getUser(clerkId);

        const email = clerkUser.emailAddresses[0].emailAddress;

        // Check if email already exists
        user = await User.findOne({ email });

        if (!user) {
          user = await User.create({
            clerkId,
            name: `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`,
            email,
            imageUrl: clerkUser.imageUrl,
          });
        } else {
          // If email exists but clerkId missing, update it
          user.clerkId = clerkId;
          await user.save();
        }
      }

      req.user = user;
      next();
    } catch (error) {
      console.error("Error in protectRoute middleware", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  },
];
