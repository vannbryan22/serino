import { Router, Request, Response } from "express";
import {
  body,
  header,
  param,
  validationResult,
  query,
} from "express-validator";
import { TreasureService } from "./treasure.service";

const router = Router();

const findValidationRules = [
  query("latitude")
    .exists()
    .withMessage("Latitude is required")
    .isFloat({ min: -90, max: 90 })
    .withMessage("Latitude must be between -90 and 90"),
  query("longitude")
    .exists()
    .withMessage("Longitude is required")
    .isFloat({ min: -180, max: 180 })
    .withMessage("Longitude must be between -180 and 180"),
  query("distance")
    .exists()
    .withMessage("Distance is required")
    .isInt({ min: 1, max: 10 })
    .withMessage("Distance must be an integer between 1 and 10")
    .custom((value) => {
      const dist = parseInt(value);
      if (dist !== 1 && dist !== 10) {
        throw new Error("Distance must be either 1 or 10 km");
      }
      return true;
    }),
  query("prizeValue")
    .optional()
    .isInt({ min: 10, max: 30 })
    .withMessage("Prize value must be a whole number between $10 and $30")
    .toInt(),
];

router.get(
  "/find",
  findValidationRules,
  async (req: Request, res: Response) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { latitude, longitude, distance, prizeValue } = req.query;

      const service = new TreasureService();
      const results = await service.findNearby(
        +latitude,
        +longitude,
        +distance,
        +prizeValue,
      );

      return res.json({
        count: results.length,
        treasures: results,
      });
    } catch (err) {
      console.error("Server error:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
  },
);

const collectValidationRules = [
  header("userId").isString().withMessage("Missing userId header").notEmpty(),
  param("id")
    .isInt({
      min: 1,
    })
    .withMessage("Treasure ID is required")
    .toInt(),
  body("userLat")
    .isFloat({ min: -90, max: 90 })
    .withMessage("Latitude must be between -90 and 90"),
  body("userLng")
    .isFloat({ min: -180, max: 180 })
    .withMessage("Longitude must be between -180 and 180"),
];

const userBalances: { [userId: string]: number } = {};

router.post(
  "/:id/collect",
  collectValidationRules,
  async (req: Request, res: Response) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params; // treasureId
    const userId = req.header("userId");
    const { userLat, userLng } = req.body;

    try {
      const treasureService = new TreasureService();
      const treasure = await treasureService.findOne({
        where: { id: +id },
      });

      // calculate distance and convert to meters
      const distanceInKm = treasureService.calculateDistanceInKm(
        userLat,
        userLng,
        treasure?.latitude,
        treasure?.longitude,
      );
      const distanceInMeters = distanceInKm * 1000;

      // Check if within allowed range (e.g., 50 meters)
      const MAX_COLLECTION_DISTANCE_METERS = 50;
      if (distanceInMeters > MAX_COLLECTION_DISTANCE_METERS) {
        return res.status(400).json({
          error: "Too far away!",
          message: `You must be within ${MAX_COLLECTION_DISTANCE_METERS} meters to collect this treasure.`,
          distance_in_meters: Math.round(distanceInMeters),
          treasure,
        });
      }

      const moneyValues = await treasureService.finAllMoneyValues(+id);
      if (moneyValues.length === 0) {
        return res
          .status(404)
          .json({ error: "No rewards found for this treasure" });
      }

      const randomRow =
        moneyValues[Math.floor(Math.random() * moneyValues.length)];
      const rewardAmt = parseFloat(randomRow.amt);

      if (!userBalances[userId]) {
        userBalances[userId] = 0;
      }
      userBalances[userId] += rewardAmt;

      res.json({
        success: true,
        treasureId: id,
        rewardAmt,
        userCurrentTotal: userBalances[userId],
        message: `🎉 You got $${rewardAmt}! Total collected: $${userBalances[userId]}`,
      });
    } catch (err) {
      console.error("Error during collection:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
  },
);
const balanceValidationRules = [
  header("userId").isString().withMessage("Missing userId header").notEmpty(),
];

router.get(
  "/balance",
  balanceValidationRules,
  async (req: Request, res: Response) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const userId = req.header("userId");

    const balance = userBalances[userId];

    return res.json(balance || 0);
  },
);

export default router;
